import {
  BookOpen, PlayCircle, Clock, Award, Compass,
  CheckCircle, Layers, Video, Monitor, BarChart2,
  Zap, Star, X, Loader2, MessageSquare
} from 'lucide-react';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useEnrollment } from '../../shared/EnrollmentContext';
import { useAuth } from '../../shared/AuthContext';
import { USER_API } from '../../config';
import { motion, AnimatePresence } from 'framer-motion';



const StudentCourses = () => {
  const [activeTab, setActiveTab]       = useState('ongoing');
  const navigate                        = useNavigate();
  const { enrolledCourses, getCourseProgress } = useEnrollment();
  const { authFetch }                   = useAuth();


  // ── Feedback state ────────────────────────────────────────────────────────
  const [feedbackCourse,    setFeedbackCourse]    = useState(null);
  const [feedbackForm,      setFeedbackForm]      = useState({ Course_rating: '5', Instructor_rating: '5', Review: '' });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess,   setFeedbackSuccess]   = useState(false);

  // Reset form whenever a new course is selected for feedback
  useEffect(() => {
    if (feedbackCourse) {
      setFeedbackForm({ Course_rating: '5', Instructor_rating: '5', Review: '' });
      setFeedbackSuccess(false);
    }
  }, [feedbackCourse]);

  // ── Missing handler (was referenced but never defined) ────────────────────
  const handleSubmitFeedback = useCallback(async (e) => {
    e.preventDefault();
    if (!feedbackCourse) return;

    const courseId = feedbackCourse.id || feedbackCourse.course_id;

    setSubmittingFeedback(true);
    try {
      // Securely fetch without exposing the token
      const res = await authFetch(`${USER_API}/courses/${courseId}/feedback/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackForm),
      });

      if (!res.ok) throw new Error('Feedback submission failed');

      setFeedbackSuccess(true);
      setTimeout(() => setFeedbackCourse(null), 2500);
    } catch (err) {
      console.error('Feedback error:', err);
      // TODO: surface a toast/error UI here
    } finally {
      setSubmittingFeedback(false);
    }
  }, [feedbackCourse, feedbackForm, authFetch]);

  // ── Derived course lists (uses calculated progress) ───────────────────────
  const { ongoingCourses, completedCourses, inProgressCount, completedCount } = useMemo(() => {
    const ongoing   = [];
    const completed = [];
    let inProgress  = 0;
    let done        = 0;

    enrolledCourses.forEach(course => {
      const backendProg = course.progress || 0;
      const prog = Math.max(backendProg, getCourseProgress(course.id || course.course_id));
      
      if (prog === 100) {
        completed.push({ ...course, progress: prog });
        done++;
      } else {
        ongoing.push({ ...course, progress: prog });
        if (prog > 0) inProgress++;
      }
    });

    return { ongoingCourses: ongoing, completedCourses: completed, inProgressCount: inProgress, completedCount: done };
  }, [enrolledCourses, getCourseProgress]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'ongoing',   label: 'In Progress', count: ongoingCourses.length },
    { id: 'completed', label: 'Completed',   count: completedCourses.length },
  ];

  const getTypeStyle = useCallback((type) => {
    const t      = (type || '').toLowerCase();
    const isLive = t === 'live' || t === 'live_course' || t === 'live session';
    return {
      bg:    isLive ? 'rgba(239, 68, 68, 0.1)'  : 'rgba(16, 185, 129, 0.1)',
      color: isLive ? '#ef4444'                  : '#10b981',
      label: isLive ? 'Live Session'             : 'Recorded',
    };
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #065f46 0%, #059669 100%)',
        borderRadius: '2rem', padding: '3rem 2.5rem', marginBottom: '3rem',
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(16, 185, 129, 0.15)'
      }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(249, 115, 22, 0.2) 0%, transparent 70%)', borderRadius: '50%' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>
            My Learning <span style={{ color: '#fbbf24', marginLeft: '0.5rem' }}>Journey</span>
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '1.1rem', fontWeight: 500, maxWidth: '600px', lineHeight: 1.5 }}>
            {enrolledCourses.length > 0
              ? `Empower your future. You have ${enrolledCourses.length} active course${enrolledCourses.length === 1 ? '' : 's'} in your portfolio.`
              : 'Kickstart your professional growth by browsing our world-class courses.'}
          </p>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button
              onClick={() => navigate('/student/browse')}
              style={{
                background: '#f97316', color: 'white', border: 'none',
                padding: '0.85rem 2rem', borderRadius: '1rem', fontWeight: 800, fontSize: '0.95rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem',
                boxShadow: '0 8px 25px rgba(249, 115, 22, 0.4)', transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <Compass size={19} /> Explore Catalog
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs + summary ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>

          <div style={{ display: 'flex', background: 'rgba(226, 232, 240, 0.4)', padding: '0.4rem', borderRadius: '1.25rem', border: '1px solid #e2e8f0' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.6rem 1.75rem', borderRadius: '0.9rem', border: 'none',
                  background: activeTab === tab.id ? 'white' : 'transparent',
                  color: activeTab === tab.id ? '#0f172a' : '#64748b',
                  fontWeight: activeTab === tab.id ? 800 : 600, fontSize: '0.9rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem',
                  boxShadow: activeTab === tab.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
                <span style={{
                  background: activeTab === tab.id ? '#10b981' : '#cbd5e1',
                  color: 'white', fontSize: '0.7rem', padding: '0.1rem 0.5rem',
                  borderRadius: '1rem', fontWeight: 900
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '4px' }} />
              <span>{completedCount} Completed</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: '10px', height: '10px', background: '#6366f1', borderRadius: '4px' }} />
              <span>{inProgressCount} Ongoing</span>
            </div>
          </div>
        </div>

        {/* ── Courses Grid ──────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {activeTab === 'ongoing' ? (
            <motion.div
              key="ongoing"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}
            >
              {ongoingCourses.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '6rem 2rem', background: '#f8fafc', borderRadius: '2rem', border: '2px dashed #e2e8f0' }}>
                  <Zap size={48} color="#cbd5e1" style={{ marginBottom: '1.5rem' }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>Ignite Your Curiosity</h3>
                  <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>You haven't started any courses yet. Our top instructors are waiting for you!</p>
                </div>
              ) : (
                ongoingCourses.map(course => {
                  const cid      = course.id || course.course_id;
                  const progress = course.progress || 0;
                  const status   = getTypeStyle(course.type);

                  return (
                    <motion.div
                      key={cid} layout whileHover={{ y: -8 }}
                      style={{
                        background: 'white', borderRadius: '1.75rem', overflow: 'hidden',
                        border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                        display: 'flex', flexDirection: 'column', cursor: 'pointer'
                      }}
                      onClick={() => navigate(`/student/course/${cid}`)}
                    >
                      <div style={{ height: '160px', position: 'relative' }}>
                        <img
                          src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'}
                          alt={course.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"   // ← lazy-load thumbnails
                        />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 70%)' }} />

                        <div style={{ position: 'absolute', top: '12px', left: '12px', background: status.bg, color: status.color, padding: '0.3rem 0.8rem', borderRadius: '0.75rem', fontSize: '0.65rem', fontWeight: 900, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                          {status.label}
                        </div>

                        {progress > 0 && (
                          <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(15, 23, 42, 0.8)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.68rem', fontWeight: 800 }}>
                            {progress}% Complete
                          </div>
                        )}
                      </div>

                      <div style={{ padding: '1.25rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#10b981', background: '#dcfce7', padding: '0.1rem 0.5rem', borderRadius: '1rem' }}>
                            {course.level || 'Beginner'}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem', lineHeight: 1.3, height: '2.6em', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {course.title || course.course_title}
                        </h3>

                        <div style={{ marginTop: 'auto' }}>
                          <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden', marginBottom: '1.25rem' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              style={{ height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: '10px' }}
                            />
                          </div>

                          <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button style={{
                              flex: 1, background: '#f97316', color: 'white', border: 'none',
                              padding: '0.75rem', borderRadius: '1rem', fontWeight: 800, fontSize: '0.85rem',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              gap: '0.5rem', boxShadow: '0 4px 15px rgba(249, 115, 22, 0.2)'
                            }}>
                              <PlayCircle size={18} /> {progress === 0 ? 'Start' : 'Resume'}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setFeedbackCourse(course); }}
                              style={{ width: '44px', height: '44px', background: 'white', border: '1.5px solid #f1f5f9', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}
                            >
                              <Star size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          ) : (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}
            >
              {completedCourses.map(course => (
                <div key={course.id || course.course_id} style={{ background: 'white', borderRadius: '2rem', padding: '1.5rem', border: '1px solid #f1f5f9', display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                  <div style={{ width: '64px', height: '64px', background: '#ecfdf5', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Award size={32} color="#10b981" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{course.title}</h4>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>Graduate · {course.level || 'Program'}</p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <button onClick={() => navigate(`/student/course/${course.id || course.course_id}`)} style={{ background: 'transparent', border: 'none', color: '#10b981', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}>Review Content</button>
                      <span style={{ color: '#e2e8f0' }}>|</span>
                      <button style={{ background: 'transparent', border: 'none', color: '#f97316', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}>Certificate</button>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Feedback Modal ────────────────────────────────────────────────── */}
      {createPortal(
        <AnimatePresence>
          {feedbackCourse && (
            <div
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
              onClick={() => setFeedbackCourse(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                style={{ position: 'relative', width: 'min(95vw, 440px)', backgroundColor: 'white', borderRadius: '1.5rem', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.3)', border: '1px solid #f1f5f9' }}
                onClick={e => e.stopPropagation()}
              >
                {/* Stepped Journey Background */}
                <div style={{ position: 'absolute', inset: 0, opacity: 0.85, pointerEvents: 'none', zIndex: 0, background: `linear-gradient(135deg, 
                  rgba(249,115,22,0.18) 0%, rgba(249,115,22,0.18) 15%,
                  rgba(249,115,22,0.10) 15%, rgba(249,115,22,0.10) 30%,
                  rgba(249,115,22,0.04) 30%, rgba(249,115,22,0.04) 45%,
                  transparent 45%, transparent 55%,
                  rgba(16,185,129,0.04) 55%, rgba(16,185,129,0.04) 70%,
                  rgba(16,185,129,0.10) 70%, rgba(16,185,129,0.10) 85%,
                  rgba(16,185,129,0.18) 85%, rgba(16,185,129,0.18) 100%)` }} />
                
                {/* Dashing Light Beam across the steps */}
                <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'linear-gradient(115deg, transparent 48.5%, rgba(255,255,255,0.7) 49.5%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 50.5%, transparent 51.5%)', pointerEvents: 'none', zIndex: 0 }} />
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                  {feedbackSuccess ? (
                    <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                      <div style={{ width: '80px', height: '80px', background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '2px solid #10b981' }}>
                        <CheckCircle size={40} color="#10b981" />
                      </div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#064e3b' }}>Feedback Received!</h2>
                      <p style={{ color: '#047857', marginTop: '0.4rem', fontWeight: 600, fontSize: '0.9rem' }}>Thank you for helping us evolve.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitFeedback} style={{ padding: '2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                        <div>
                          <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#1e293b', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            <Star size={20} color="#f97316" /> Course Evaluation
                          </h2>
                          <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.3rem', marginLeft: '1.75rem' }}>Goal Achieved! You reached the top.</div>
                        </div>
                        <button type="button" onClick={() => setFeedbackCourse(null)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f8fafc', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }} onMouseEnter={e=>e.currentTarget.style.background='#f1f5f9'} onMouseLeave={e=>e.currentTarget.style.background='#f8fafc'}>
                          <X size={18} color="#64748b" />
                        </button>
                      </div>

                      <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Overall Rating</label>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          {[1, 2, 3, 4, 5].map(num => (
                            <button key={num} type="button" onClick={() => setFeedbackForm(prev => ({ ...prev, Course_rating: String(num) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', transition: 'transform 0.1s' }} onMouseEnter={e=>e.currentTarget.style.transform='scale(1.1)'} onMouseLeave={e=>e.currentTarget.style.transform='none'}>
                              <Star size={32} fill={num <= parseInt(feedbackForm.Course_rating) ? '#f97316' : '#f1f5f9'} color={num <= parseInt(feedbackForm.Course_rating) ? '#f97316' : '#cbd5e1'} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div style={{ marginBottom: '1.75rem' }}>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Your Review</label>
                        <textarea
                          required rows="3"
                          placeholder="Tell us what you liked most..."
                          value={feedbackForm.Review}
                          onChange={e => setFeedbackForm(prev => ({ ...prev, Review: e.target.value }))}
                          style={{ width: '100%', padding: '1rem', borderRadius: '1rem', border: '1px solid #e2e8f0', background: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', resize: 'none', outline: 'none', transition: 'border 0.2s', fontFamily: 'inherit' }}
                          onFocus={e=>e.currentTarget.style.borderColor='#10b981'}
                          onBlur={e=>e.currentTarget.style.borderColor='#e2e8f0'}
                        />
                      </div>

                      <button type="submit" disabled={submittingFeedback} style={{ width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', padding: '1rem', borderRadius: '1rem', fontWeight: 800, fontSize: '0.95rem', cursor: submittingFeedback ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.25)', opacity: submittingFeedback ? 0.7 : 1, transition: 'transform 0.2s' }} onMouseEnter={e=>!submittingFeedback&&(e.currentTarget.style.transform='translateY(-2px)')} onMouseLeave={e=>!submittingFeedback&&(e.currentTarget.style.transform='none')}>
                        {submittingFeedback ? <Loader2 size={18} className="animate-spin" /> : <Award size={18} />}
                        {submittingFeedback ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </form>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default StudentCourses;