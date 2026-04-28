import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { USER_API, ADMIN_API } from '../config';

const EnrollmentContext = createContext(null);

/* ── Helpers ── */
const norm = (id) => (id === undefined || id === null || String(id) === 'NaN' || String(id) === 'undefined') ? null : String(id);

export const EnrollmentProvider = ({ children }) => {
  const { user, authFetch, smartFetch, clearCache } = useAuth(); // Inherit secure global fetcher

  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [completedLessons, setCompletedLessons] = useState({});
  const [assessmentStats, setAssessmentStats] = useState({}); 
  const [lessonCounts, setLessonCounts] = useState({});


  /* ── Initialization & Background Sync ── */
  useEffect(() => {
    let isMounted = true;

    const syncEnrollments = async () => {
      if (!user?.user_id) return;

      // 🚀 Use global smartFetch for base enrollment list too (SWR enabled)
      const baseData = await smartFetch(`${USER_API}/enrolled_courses`, { 
        cacheKey: `enrollments_${user.user_id}` 
      });

      if (!Array.isArray(baseData)) return;

      // Normalize base data immediately so UI can paint something instantly
      const normalizedBase = baseData.map(c => {
        const cid = norm(c.id || c.course_id || c.Course_id || c.Course_ID || c.courseId || c.CourseId || c.ID);
        const title = c.course_title || c.Course_Title || c.title || c.Title || c.courseTitle || 'Untitled Course';
        const type = (c.course_type || c.course_Type || c.Course_Type || c.type || c.Type || 'recorded').toLowerCase();
        return {
          ...c, id: cid, course_id: cid, title, course_title: title, type,
          progress: c.progress_percentage !== undefined ? c.progress_percentage : (c.progress || c.Progress || 0)
        };
      });

      if (isMounted) setEnrolledCourses(normalizedBase);

      // Background Enrichment (Details + Progress) using Smart Fetch
      // This maps over data but ONLY hits the network if cache is missing
      const enrichedData = await Promise.all(normalizedBase.map(async (c) => {
        if (!c.id) return c;
        
        // Parallel fetch details & progress (safely cached/deduped/obfuscated)
        const [details, progressData] = await Promise.all([
          smartFetch(`${ADMIN_API}/course/${c.id}/full-details`, { cacheKey: `details_${c.id}` }),
          smartFetch(`${USER_API}/course/${c.id}/progress`, { cacheKey: `progress_${c.id}` })
        ]);

        const d = details?.course || details?.data || details || {};
        const p = progressData || {};

        return {
          ...c,
          title: d.course_title || d.Course_Title || d.title || d.Title || c.title,
          thumbnail: d.thumbnail || d.Thumbnail || d.course_thumbnail || c.thumbnail,
          type: (d.course_type || d.type || c.type).toLowerCase(),
          level: d.level || d.course_level || c.level,
          category_name: d.category_name || d.Category || c.category_name,
          progress: p.progress_percentage !== undefined ? p.progress_percentage : (p.progress || c.progress),
          total_modules: p.total_modules || c.total_modules,
          completed_modules: p.completed_modules || c.completed_modules
        };
      }));

      if (isMounted) setEnrolledCourses(enrichedData);
    };

    syncEnrollments();
    return () => { isMounted = false; };
  }, [user?.user_id, smartFetch]);


  /* ── Local State Calculations ── */
  const getCourseProgress = useCallback((courseId) => {
    const sid = norm(courseId);
    if (!sid) return 0;
    
    const c = enrolledCourses.find(course => norm(course.id || course.course_id) === sid);
    const backendProgress = c?.progress || 0;

    const total = lessonCounts[sid];
    const done = (completedLessons[sid] || []).length;

    if (!total) return backendProgress;
    
    const localProgress = Math.round((done / total) * 100);
    return Math.max(localProgress, backendProgress);
  }, [enrolledCourses, completedLessons, lessonCounts]);

  const isEnrolled = useCallback((courseId) => {
    const cid = norm(courseId);
    return cid ? enrolledCourses.some(c => norm(c.id || c.course_id) === cid) : false;
  }, [enrolledCourses]);

  const isLessonComplete = useCallback((courseId, lessonId) => {
    const cid = norm(courseId);
    return cid ? (completedLessons[cid] || []).includes(lessonId) : false;
  }, [completedLessons]);

  const getCompletedCount = useCallback((courseId) => {
    const cid = norm(courseId);
    return cid ? (completedLessons[cid] || []).length : 0;
  }, [completedLessons]);


  /* ── Local Mutators ── */
  const markLessonComplete = useCallback((courseId, lessonId, totalLessons) => {
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
  }, []);

  const registerLessonCount = useCallback((courseId, total) => {
    const sId = norm(courseId);
    if (!sId || !total) return;
    setLessonCounts(prev => (prev[sId] === total ? prev : { ...prev, [sId]: total }));
  }, []);


  /* ── Backend Actions ── */
  const enroll = async (course) => {
    const cid = norm(course.id || course.course_id);
    if (!cid) return;

    setEnrolledCourses(prev => {
      if (prev.some(c => norm(c.id || c.course_id) === cid)) return prev;
      return [...prev, { ...course, id: cid, enrolledAt: new Date().toISOString(), progress: 0 }];
    });

    if (user?.user_id) {
      try {
        await authFetch(`${USER_API}/enroll_course`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.user_id, course_id: cid })
        });
        clearCache(`enrollments_${user.user_id}`); // Bust base cache
      } catch (err) { console.error("Enrollment failed:", err); }
    }
  };

  const fetchCourseProgress = useCallback(async (courseId, force = false) => {
    const cid = norm(courseId);
    if (!cid) return;
    
    // Use smartFetch, optionally forcing network bypass of cache
    const data = await smartFetch(`${USER_API}/course/${cid}/progress`, {
      cacheKey: `progress_${cid}`,
      forceRefresh: force
    });
    
    if (data) {
      setEnrolledCourses(prev => prev.map(c => 
        norm(c.id || c.course_id) === cid 
        ? { 
            ...c, 
            progress: data.progress_percentage !== undefined ? data.progress_percentage : (data.progress || 0),
            total_modules: data.total_modules || c.total_modules,
            completed_modules: data.completed_modules || c.completed_modules
          } 
        : c
      ));

      if (data.assessments && Array.isArray(data.assessments)) {
        const stats = {};
        data.assessments.forEach(asm => {
          stats[norm(asm.assessment_id)] = {
            attempts_used: asm.attempts_used || 0,
            best_score: asm.best_score || 0,
            passed: asm.passed || false
          };
        });
        setAssessmentStats(prev => ({ ...prev, ...stats }));
      }
    }
    return data;
  }, [smartFetch]);

 // Helper to trigger API actions and bust cache
  const triggerProgressUpdate = async (endpoint, payload, courseId) => {
    try {
      const response = await authFetch(`${USER_API}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response?.json();
      
      // Cache Busting: Force progress to re-fetch from server
      clearCache(`progress_${courseId}`);
      await fetchCourseProgress(courseId, true); 
      
      return data;
    } catch (err) {
      console.error(`Failed ${endpoint}:`, err);
      throw err;
    }
  };

  const markLiveAttendance = (courseId, liveClassId, moduleId, attendedLive, watchedRecording) => {
    return triggerProgressUpdate('mark-live-attendance', {
      live_class_id: String(liveClassId), module_id: String(moduleId),
      attended_live: !!attendedLive, watched_recording: !!watchedRecording
    }, courseId);
  };

  const markVideoProgress = (courseId, moduleId, videoId) => {
    return triggerProgressUpdate('mark-video-progress', {
      course_id: String(courseId), module_id: String(moduleId), video_id: String(videoId)
    }, courseId);
  };

  const submitAssessment = (courseId, moduleId, assessmentId, answers) => {
    return triggerProgressUpdate('submit-assessment', {
      course_id: String(courseId), module_id: String(moduleId),
      assessment_id: String(assessmentId), answers: answers
    }, courseId);
  };

  return (
    <EnrollmentContext.Provider value={{
      enrolledCourses,
      enroll, isEnrolled,
      registerLessonCount, getCourseProgress,
      markLessonComplete, isLessonComplete, getCompletedCount,
      markLiveAttendance, markVideoProgress, submitAssessment, fetchCourseProgress,
      completedLessons, assessmentStats
    }}>
      {children}
    </EnrollmentContext.Provider>
  );
};

export const useEnrollment = () => useContext(EnrollmentContext);