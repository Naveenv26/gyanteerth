import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { useAuth } from './AuthContext';
import { USER_API } from '../config';

const EnrollmentContext = createContext(null);



/* ── ID Normalization Helper ── */
// UUIDs are strings, we should NEVER cast them to Number.
const norm = (id) => (id === undefined || id === null || String(id) === 'NaN' || String(id) === 'undefined') ? null : String(id);

export const EnrollmentProvider = ({ children }) => {
  const { user, accessToken } = useAuth();

  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [completedLessons, setCompletedLessons] = useState({});
  const [lessonCounts, setLessonCounts] = useState({});

  /* ── Auto-sync progress ── */
  useEffect(() => {
    setEnrolledCourses(prev => {
      let changed = false;
      const next = prev.map(c => {
        const sid = norm(c.id || c.course_id);
        if (!sid) return c;
        const total = lessonCounts[sid];
        if (!total) return c;
        const done = (completedLessons[sid] || []).length;
        const pct = Math.round((done / total) * 100);
        if (c.progress === pct) return c;
        changed = true;
        return { ...c, progress: pct };
      });
      return changed ? next : prev;
    });
  }, [completedLessons, lessonCounts]);

  /* ── Persistence completely removed ── */

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
          // Assuming data is an array of course objects
          if (Array.isArray(data)) {
            setEnrolledCourses(prev => {
              // Merge: keep local ones if they aren't in backend yet, plus all from backend
              const backendIds = new Set(data.map(c => norm(c.id || c.course_id)));
              const uniqueLocal = prev.filter(c => !backendIds.has(norm(c.id || c.course_id)));
              return [...data, ...uniqueLocal];
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
    const total = lessonCounts[sid];
    const done = (completedLessons[sid] || []).length;

    if (!total) {
      const c = enrolledCourses.find(c => norm(c.id || c.course_id) === sid);
      return c?.progress || 0;
    }
    return Math.round((done / total) * 100);
  }, [enrolledCourses, completedLessons, lessonCounts]);

  /* ── API Actions ── */
  const enroll = async (course) => {
    const cid = norm(course.id || course.course_id);
    if (!cid) return;

    // 1. Optimistic/Local Update
    setEnrolledCourses(prev => {
      if (prev.some(c => norm(c.id || c.course_id) === cid)) return prev;
      return [...prev, { ...course, id: cid, enrolledAt: new Date().toISOString(), progress: 0 }];
    });

    // 2. Backend Persistence
    if (user?.user_id && accessToken) {
      try {
        console.log(`[BACKEND] Enrolling user ${user.user_id} in course ${cid}`);
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
      console.log(`[CONTEXT] Toggle completion for ${sId}: Lesson=${lessonId}, Completed=${!exists}`);
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

  return (
    <EnrollmentContext.Provider value={{
      enrolledCourses,
      enroll, isEnrolled,
      registerLessonCount, getCourseProgress,
      markLessonComplete, isLessonComplete, getCompletedCount,
      completedLessons,
    }}>
      {children}
    </EnrollmentContext.Provider>
  );
};

export const useEnrollment = () => useContext(EnrollmentContext);
