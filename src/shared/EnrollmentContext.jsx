import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { useAuth } from './AuthContext';
import { USER_API, ADMIN_API } from '../config';

const EnrollmentContext = createContext(null);

/* ── ID Normalization Helper ── */
const norm = (id) => (id === undefined || id === null || String(id) === 'NaN' || String(id) === 'undefined') ? null : String(id);

export const EnrollmentProvider = ({ children }) => {
  const { user, accessToken } = useAuth();

  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [completedLessons, setCompletedLessons] = useState({});
  const [lessonCounts, setLessonCounts] = useState({});

  /* ── Auto-sync progress removed in favor of Backend Sync ── */

  /* ── Backend Sync (Fetch Enrollments) ── */
  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!user?.user_id || !accessToken) return;
      try {
        const response = await fetch(`${USER_API}/enrolled_courses`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            // First pass: create deep-mapped normalized objects
            const baseData = data.map(c => {
              // Extract ID with massive fallback
              const cid = norm(c.id || c.course_id || c.Course_id || c.Course_ID || c.courseId || c.CourseId || c.ID);
              const title = c.course_title || c.Course_Title || c.title || c.Title || c.courseTitle || 'Untitled Course';
              const type = (c.course_type || c.course_Type || c.Course_Type || c.type || c.Type || 'recorded').toLowerCase();
              
              return {
                ...c,
                id: cid,
                course_id: cid,
                title: title,
                course_title: title,
                type: type,
                progress: c.progress_percentage !== undefined ? c.progress_percentage : (c.progress || c.Progress || 0)
              };
            });

            // Second pass: Enrich with real-time full details concurrently
            const enrichedData = await Promise.all(baseData.map(async (c) => {
              if (!c.id) return c;
              try {
                const detailsRes = await fetch(`${ADMIN_API}/course/${c.id}/full-details`, {
                  headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                if (detailsRes.ok) {
                  const details = await detailsRes.json();
                  const d = details.course || details.data || details;
                  
                  const title = d.course_title || d.Course_Title || d.title || d.Title || d.courseTitle || c.title;
                  const type = (d.course_type || d.course_Type || d.Course_Type || d.type || d.Type || c.type).toLowerCase();
                  
                  return {
                    ...c,
                    title: title,
                    course_title: title,
                    thumbnail: d.thumbnail || d.Thumbnail || d.course_thumbnail || d.Thumbnail_URL || c.thumbnail,
                    type: type,
                    level: d.level || d.course_level || d.Level || c.level,
                    category_name: d.category_name || d.Category_Name || d.Category || c.category_name
                  };
                }
              } catch (e) {
                console.error(`Failed to enrich course ${c.id}`, e);
              }
              return c;
            }));

            setEnrolledCourses(enrichedData);

            // Proactively fetch detailed progress for each course
            enrichedData.forEach(c => {
               fetchCourseProgress(c.id);
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch enrolled courses from backend:", err);
      }
    };
    fetchEnrollments();
  }, [user?.user_id, accessToken]);

  /* ── Get Progress (Live Calculation) ── */
  const getCourseProgress = useCallback((courseId) => {
    const sid = norm(courseId);
    if (!sid) return 0;
    
    // Find the course in the enrolled list to see what the backend says
    const c = enrolledCourses.find(course => norm(course.id || course.course_id) === sid);
    const backendProgress = c?.progress || 0;

    const total = lessonCounts[sid];
    const done = (completedLessons[sid] || []).length;

    if (!total) return backendProgress;
    
    const localProgress = Math.round((done / total) * 100);
    // Return whichever is higher to account for both local updates and backend sync
    return Math.max(localProgress, backendProgress);
  }, [enrolledCourses, completedLessons, lessonCounts]);

  /* ── API Actions ── */
  const enroll = async (course) => {
    const cid = norm(course.id || course.course_id);
    if (!cid) return;

    setEnrolledCourses(prev => {
      if (prev.some(c => norm(c.id || c.course_id) === cid)) return prev;
      return [...prev, { ...course, id: cid, enrolledAt: new Date().toISOString(), progress: 0 }];
    });

    if (user?.user_id && accessToken) {
      try {
        await fetch(`${USER_API}/enroll_course`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            user_id: user.user_id,
            course_id: cid
          })
        });
      } catch (err) {
        console.error("Backend enrollment failed:", err);
      }
    }
  };

  const isEnrolled = (courseId) => {
    const cid = norm(courseId);
    return cid ? enrolledCourses.some(c => norm(c.id || c.course_id) === cid) : false;
  };

  const markLessonComplete = (courseId, lessonId, totalLessons) => {
    const sId = norm(courseId);
    if (!sId) return;

    if (totalLessons) {
      setLessonCounts(prev => ({ ...prev, [sId]: totalLessons }));
    }

    setCompletedLessons(prev => {
      const curr = prev[sId] || [];
      const exists = curr.includes(lessonId);
      const next = exists ? curr.filter(id => id !== lessonId) : [...curr, lessonId];
      return { ...prev, [sId]: next };
    });
  };

  const registerLessonCount = (courseId, total) => {
    const sId = norm(courseId);
    if (!sId || !total) return;
    setLessonCounts(prev => {
      if (prev[sId] === total) return prev;
      return { ...prev, [sId]: total };
    });
  };

  const isLessonComplete = (courseId, lessonId) => {
    const cid = norm(courseId);
    return cid ? (completedLessons[cid] || []).includes(lessonId) : false;
  };

  const getCompletedCount = (courseId) => {
    const cid = norm(courseId);
    return cid ? (completedLessons[cid] || []).length : 0;
  };

  /* ── Backend API Actions ── */
  const fetchCourseProgress = async (courseId) => {
    if (!accessToken) return;
    try {
      const response = await fetch(`${USER_API}/course/${courseId}/progress`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
        if (response.ok) {
          const data = await response.json();
          setEnrolledCourses(prev => prev.map(c => 
            norm(c.id || c.course_id) === norm(courseId) 
            ? { 
                ...c, 
                progress: data.progress_percentage !== undefined ? data.progress_percentage : (data.progress || 0),
                total_modules: data.total_modules || c.total_modules,
                completed_modules: data.completed_modules || c.completed_modules
              } 
            : c
          ));
          return data;
        }
    } catch (err) {
      console.error("Failed to fetch course progress from backend:", err);
    }
  };

  const markLiveAttendance = async (courseId, liveClassId, moduleId, attendedLive, watchedRecording) => {
    if (!accessToken) return;
    try {
      const response = await fetch(`${USER_API}/mark-live-attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          live_class_id: String(liveClassId),
          module_id: String(moduleId),
          attended_live: !!attendedLive,
          watched_recording: !!watchedRecording
        })
      });
      const data = await response.json();
      await fetchCourseProgress(courseId);
      return data;
    } catch (err) {
      console.error("Failed to mark live attendance:", err);
    }
  };

  const markVideoProgress = async (courseId, moduleId, videoId) => {
    if (!accessToken) return;
    try {
      const response = await fetch(`${USER_API}/mark-video-progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          course_id: String(courseId),
          module_id: String(moduleId),
          video_id: String(videoId)
        })
      });
      const data = await response.json();
      await fetchCourseProgress(courseId);
      return data;
    } catch (err) {
      console.error("Failed to mark video progress:", err);
    }
  };

  const submitAssessment = async (courseId, moduleId, assessmentId, answers) => {
    if (!accessToken) return;
    try {
      const response = await fetch(`${USER_API}/submit-assessment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          course_id: String(courseId),
          module_id: String(moduleId),
          assessment_id: String(assessmentId),
          answers: answers
        })
      });
      const data = await response.json();
      await fetchCourseProgress(courseId);
      return data;
    } catch (err) {
      console.error("Failed to submit assessment:", err);
      throw err;
    }
  };

  return (
    <EnrollmentContext.Provider value={{
      enrolledCourses,
      enroll, isEnrolled,
      registerLessonCount, getCourseProgress,
      markLessonComplete, isLessonComplete, getCompletedCount,
      markLiveAttendance, markVideoProgress, submitAssessment, fetchCourseProgress,
      completedLessons,
    }}>
      {children}
    </EnrollmentContext.Provider>
  );
};

export const useEnrollment = () => useContext(EnrollmentContext);
