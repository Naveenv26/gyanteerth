import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PlayCircle, ChevronRight, ChevronLeft, Award,
  Layers, Video, Monitor, Loader2, AlertCircle, ArrowLeft,
  ChevronDown, BookOpen, ExternalLink, CheckCircle, Menu, Check
} from 'lucide-react';
import { useEnrollment } from '../../shared/EnrollmentContext';
import { ADMIN_API } from '../../config';

/* ── helpers ─────────────────────────────────── */
function buildLessons(modules, isLive) {
  const lessons = [];
  (modules || []).forEach(mod => {
    if (!isLive) {
      (mod.content?.videos || []).forEach((v, vi) => {
        lessons.push({ id: v.video_id, moduleId: mod.module_id, moduleTitle: mod.title, title: v.description || `Video ${vi + 1}`, type: 'video', url: v.video_url });
      });
    } else {
      (mod.content?.live_sessions || []).forEach((ls, li) => {
        lessons.push({ id: ls.live_id, moduleId: mod.module_id, moduleTitle: mod.title, title: `Live Session ${li + 1}${ls.provider ? ' — ' + ls.provider : ''}`, type: 'live', url: ls.meeting_url, start_time: ls.start_time, end_time: ls.end_time, status: ls.status, recordings: ls.recordings || [] });
      });
    }
    (mod.content?.assessments || []).forEach(a => {
      lessons.push({ id: a.assessment_id, moduleId: mod.module_id, moduleTitle: mod.title, title: a.title, type: 'assessment', totalMark: a.total_mark, passingMark: a.passing_mark, duration: a.duration, questions: a.questions || [] });
    });
  });
  return lessons;
}

function getEmbedUrl(url) {
  if (!url) return null;
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return m ? `https://www.youtube.com/embed/${m[1]}?autoplay=1&rel=0&modestbranding=1` : null;
  }
  if (url.includes('vimeo.com')) {
    const m = url.match(/vimeo\.com\/(\d+)/);
    return m ? `https://player.vimeo.com/video/${m[1]}?autoplay=1` : null;
  }
  if (url.includes('drive.google.com')) {
    const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return m ? `https://drive.google.com/file/d/${m[1]}/preview` : null;
  }
  return null;
}

/* ── Video Player ─────────────────────────────── */
function VideoPlayer({ url, title }) {
  const embedUrl = getEmbedUrl(url);
  return (
    <div style={{ width: '100%', background: '#000', borderRadius: '12px', overflow: 'hidden', aspectRatio: '16/9', position: 'relative' }}>
      {embedUrl ? (
        <iframe src={embedUrl} title={title} frameBorder="0" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" style={{ width: '100%', height: '100%' }} />
      ) : url ? (
        <video src={url} controls autoPlay style={{ width: '100%', height: '100%' }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem', background: '#0f172a' }}>
          <Video size={56} color="#6366f1" style={{ opacity: 0.4 }} />
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>No video URL for this lesson</p>
        </div>
      )}
    </div>
  );
}

/* ── Live Panel ───────────────────────────────── */
function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState(targetDate ? targetDate - new Date() : 0);

  useEffect(() => {
    if (!targetDate) return;
    const interval = setInterval(() => {
      setTimeLeft(targetDate - new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

function LivePanel({ lesson, onJoin }) {
  const target = lesson.start_time ? new Date(lesson.start_time) : null;
  const end    = lesson.end_time   ? new Date(lesson.end_time)   : null;
  const timeLeft = useCountdown(target);
  const now = new Date();
  
  const isOngoing  = target && end && now >= target && now <= end;
  const isUpcoming = target && now < target;
  
  // 30 minute restriction
  const canJoin = target && (now >= (new Date(target.getTime() - 30 * 60 * 1000)));
  
  const accent = isOngoing ? '#ef4444' : isUpcoming ? '#f59e0b' : '#6366f1';

  const formatCountdown = (ms) => {
    if (ms <= 0) return null;
    const totalSecs = Math.floor(ms / 1000);
    const d = Math.floor(totalSecs / 86400);
    const h = Math.floor((totalSecs % 86400) / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0 || d > 0) parts.push(`${h}h`);
    if (m > 0 || h > 0 || d > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
  };

  const countdownStr = isUpcoming ? formatCountdown(timeLeft) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', borderRadius: '20px', padding: '3.5rem 2rem', textAlign: 'center', border: `1px solid ${accent}25`, position: 'relative', overflow: 'hidden' }}>
        {isOngoing && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '200%', height: '200%', background: `radial-gradient(circle, ${accent}10 0%, transparent 70%)`, animation: 'pulse 3s ease-in-out infinite' }} />}
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ width: '88px', height: '88px', borderRadius: '50%', margin: '0 auto 1.5rem', background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${accent}40`, boxShadow: isOngoing ? `0 0 20px ${accent}30` : 'none' }}>
            <Monitor size={40} color={accent} />
          </div>

          <span style={{ display: 'inline-block', background: `${accent}20`, color: accent, padding: '0.4rem 1.2rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1.25rem', border: `1px solid ${accent}40` }}>
            {isOngoing ? '● Live Now' : isUpcoming ? '⏰ Upcoming' : '✓ Completed'}
          </span>

          <h2 style={{ color: 'white', fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>{lesson.title}</h2>
          
          {target && <p style={{ color: '#94a3b8', marginBottom: '2rem', fontSize: '1rem', fontWeight: 500 }}>{new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeStyle: 'short' }).format(target)}</p>}

          {countdownStr && (
            <div style={{ background: 'rgba(255,255,255,0.05)', display: 'inline-flex', flexDirection: 'column', padding: '1rem 2.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '2.5rem' }}>
              <span style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>Starts In</span>
              <span style={{ color: '#f59e0b', fontSize: '1.5rem', fontWeight: 800, fontFamily: 'monospace' }}>{countdownStr}</span>
            </div>
          )}

          {lesson.url && (isOngoing || isUpcoming) && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              {canJoin ? (
                <a href={lesson.url} target="_blank" rel="noopener noreferrer" onClick={onJoin} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, color: 'white', padding: '1rem 2.5rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 800, fontSize: '1rem', boxShadow: `0 8px 25px ${accent}40` }}>
                  <ExternalLink size={20} /> {isOngoing ? 'Join Session Now' : 'Enter Waiting Room'}
                </a>
              ) : (
                <div style={{ padding: '1.5rem', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <AlertCircle size={20} color="#64748b" />
                  <p style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>Link available 30 minutes before start.</p>
                </div>
              )}
            </div>
          )}
        </div>
        <style>{`@keyframes pulse { 0% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); } 50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.1); } 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); } }`}</style>
      </div>

      {lesson.recordings?.length > 0 && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #f1f5f9' }}>
          <h3 style={{ fontWeight: 800, marginBottom: '1rem', fontSize: '0.95rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Video size={16} color="#10b981" /> Session Recordings</h3>
          {lesson.recordings.map((rec, i) => (
            <a key={rec.rec_video_id} href={rec.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '8px', background: '#f0fdf4', border: '1px solid rgba(16,185,129,0.2)', textDecoration: 'none', marginBottom: '0.5rem' }}>
              <PlayCircle size={18} color="#10b981" />
              <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>Recording {i + 1}{rec.duration ? ` · ${rec.duration}` : ''}</span>
              <ExternalLink size={13} color="#10b981" style={{ marginLeft: 'auto' }} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Assessment Panel ─────────────────────────── */
function AssessmentPanel({ lesson, onComplete }) {
  const [selected, setSelected]   = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore]         = useState(0);

  const handleSubmit = () => {
    let total = 0;
    (lesson.questions || []).forEach(q => {
      const ans     = selected[q.question_id];
      const correct = q.options?.find(o => o.is_correct);
      if (ans && correct && ans === correct.option_id) total += (q.mark || 1);
    });
    setScore(total);
    setSubmitted(true);
    const passed = total >= (lesson.passingMark || 0);
    if (passed) onComplete?.();
  };

  const passed = score >= (lesson.passingMark || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e1b4b)', borderRadius: '14px', padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(16,185,129,0.35)', flexShrink: 0 }}><Award size={24} color="#10b981" /></div>
        <div>
          <h2 style={{ color: 'white', fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.35rem' }}>{lesson.title}</h2>
          <div style={{ display: 'flex', gap: '1.25rem', color: '#64748b', fontSize: '0.8rem' }}>
            <span>{lesson.questions?.length || 0} Questions</span>
            <span>Total: {lesson.totalMark} marks</span>
            <span>Pass: {lesson.passingMark} marks</span>
            {lesson.duration && <span>{lesson.duration} min</span>}
          </div>
        </div>
      </div>
      {submitted && (
        <div style={{ background: passed ? '#f0fdf4' : '#fef2f2', border: `2px solid ${passed ? '#10b981' : '#ef4444'}`, borderRadius: '14px', padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{passed ? '🎉' : '📚'}</div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: passed ? '#065f46' : '#991b1b', marginBottom: '0.25rem' }}>{passed ? 'You Passed!' : 'Keep Practicing!'}</h3>
          <p style={{ color: passed ? '#047857' : '#b91c1c', marginBottom: '1.25rem' }}>Score: <strong>{score} / {lesson.totalMark}</strong></p>
          {!passed && <button onClick={() => { setSubmitted(false); setSelected({}); setScore(0); }} style={{ background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', padding: '0.65rem 1.5rem', fontWeight: 700, cursor: 'pointer' }}>Retake Assessment</button>}
        </div>
      )}
      {!submitted && (lesson.questions || []).map((q, qi) => (
        <div key={q.question_id} style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.1rem' }}>
            <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{qi + 1}</span>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>{q.question_text}</p>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{q.mark} mark · {q.type}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(q.options || []).map(opt => {
              const isSel = selected[q.question_id] === opt.option_id;
              return (
                <button key={opt.option_id} onClick={() => setSelected(p => ({ ...p, [q.question_id]: opt.option_id }))} style={{ textAlign: 'left', padding: '0.8rem 1rem', borderRadius: '8px', cursor: 'pointer', border: `2px solid ${isSel ? '#6366f1' : '#f1f5f9'}`, background: isSel ? 'rgba(99,102,241,0.06)' : 'white', color: isSel ? '#4338ca' : '#374151', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${isSel ? '#6366f1' : '#d1d5db'}`, background: isSel ? '#6366f1' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isSel && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'white' }} />}
                  </div>
                  {opt.text}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {!submitted && lesson.questions?.length > 0 && <button onClick={handleSubmit} style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', borderRadius: '10px', padding: '1rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><Award size={18} /> Submit Assessment</button>}
    </div>
  );
}

/* ══════════ MARK COMPLETE BUTTON ══════════ */
function MarkCompleteButton({ isDone, onMark }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onMark} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 1.6rem', borderRadius: '12px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s', background: isDone ? (hovered ? '#fee2e2' : 'linear-gradient(135deg, #10b981, #059669)') : 'white', color: isDone ? (hovered ? '#ef4444' : 'white') : '#10b981', border: isDone ? (hovered ? '2px solid #ef4444' : '2px solid transparent') : '2px solid #10b981', transform: hovered ? 'translateY(-1px)' : 'none' }}>
      {isDone ? (hovered ? <><AlertCircle size={18} /> Undo Complete</> : <><CheckCircle size={18} /> Completed</>) : (<><Check size={18} /> Mark as Complete</>)}
    </button>
  );
}

/* ══════════════════════════════════════════════════
   MAIN COURSE PLAYER
══════════════════════════════════════════════════ */
const CoursePlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { markLessonComplete, isLessonComplete, getCompletedCount, enrolledCourses, registerLessonCount } = useEnrollment();

  const [course, setCourse]               = useState(null);
  const [lessons, setLessons]             = useState([]);
  const [currentIdx, setCurrentIdx]       = useState(0);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const [expandedModules, setExpandedModules] = useState({});
  const [justCompleted, setJustCompleted] = useState(false);

  // DEBUG LOG
  useEffect(() => {
    console.log('CoursePlayer: Active Course ID from URL:', id);
    const enrolledItem = enrolledCourses.find(c => String(c.id || c.course_id) === String(id));
    console.log('CoursePlayer: Enrollment status:', enrolledItem ? 'ENROLLED' : 'NOT ENROLLED', enrolledItem);
  }, [id, enrolledCourses]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res  = await fetch(`${ADMIN_API}/course/${id}/full-details`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.status && data.course) {
          const c = data.course;
          setCourse(c);
          const isLive = c.type?.toLowerCase() === 'live';
          const built  = buildLessons(c.modules, isLive);
          setLessons(built);
          // Register total so progress % computes correctly on My Learning page
          registerLessonCount(id, built.length);
          const exp = {};
          (c.modules || []).forEach(m => { exp[m.module_id] = true; });
          setExpandedModules(exp);
        } else throw new Error('Course not found');
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, [id]);

  // Reset just-completed animation when lesson changes
  useEffect(() => { setJustCompleted(false); }, [currentIdx]);

  const currentLesson = lessons[currentIdx];
  const courseId      = id;
  const totalLessons  = lessons.length;

  /* Completed count + progress % */
  const completedCount = getCompletedCount(courseId);
  const progressPct    = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  /* Check if current lesson is done */
  const currentDone = currentLesson
    ? isLessonComplete(courseId, currentLesson.id)
    : false;

  /* Mark current lesson complete */
  const handleMarkComplete = useCallback(() => {
    if (!currentLesson) return;
    const sId = courseId;
    const lessonId = currentLesson.id;
    const isCurrentlyDone = isLessonComplete(sId, lessonId);
    
    console.log(`[PLAYER] handleMarkComplete toggle: courseId=${sId}, lessonId=${lessonId}, currentStatus=${isCurrentlyDone}`);
    markLessonComplete(sId, lessonId, totalLessons);
    
    // Only show "just completed" animation if we are MARKING as done
    if (!isCurrentlyDone) {
      setJustCompleted(true);
    } else {
      setJustCompleted(false);
    }
  }, [currentLesson, courseId, totalLessons, markLessonComplete, isLessonComplete]);

  const go = idx => setCurrentIdx(Math.max(0, Math.min(lessons.length - 1, idx)));
  const toggleModule = mid => setExpandedModules(p => ({ ...p, [mid]: !p[mid] }));

  const lessonsByModule = {};
  lessons.forEach((l, idx) => {
    if (!lessonsByModule[l.moduleId]) lessonsByModule[l.moduleId] = [];
    lessonsByModule[l.moduleId].push({ ...l, globalIdx: idx });
  });

  const lessonTypeColor = t => t === 'live' ? '#ef4444' : t === 'assessment' ? '#10b981' : '#6366f1';
  const lessonTypeIcon  = t => {
    if (t === 'live')       return <Monitor size={13} />;
    if (t === 'assessment') return <Award size={13} />;
    return <Video size={13} />;
  };

  /* ── Loading ── */
  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', background: 'var(--color-bg)' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'spin 1s linear infinite', boxShadow: '0 0 32px rgba(99,102,241,0.5)' }}>
        <Loader2 size={30} color="white" />
      </div>
      <p style={{ color: '#64748b', fontWeight: 600 }}>Loading course content...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ── Error ── */
  if (error || !course) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', background: '#0f172a', textAlign: 'center', padding: '2rem' }}>
      <AlertCircle size={52} color="#ef4444" />
      <h2 style={{ color: 'white', fontSize: '1.4rem', fontWeight: 800 }}>Course Unavailable</h2>
      <p style={{ color: '#64748b' }}>This course could not be loaded.</p>
      <button onClick={() => navigate('/student/courses')} style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', borderRadius: '10px', padding: '0.75rem 2rem', fontWeight: 700, cursor: 'pointer' }}>
        ← My Learning
      </button>
    </div>
  );

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)', overflow: 'hidden', color: 'var(--color-text)' }}>

      {/* ═══════════ TOP NAVIGATION ═══════════ */}
      <header style={{ height: '60px', flexShrink: 0, background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', zIndex: 50, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>

        {/* Back */}
        <button
          onClick={() => navigate('/student/courses')}
          style={{ height: '100%', padding: '0 1.25rem', background: 'none', border: 'none', borderRight: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.15s', whiteSpace: 'nowrap', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'none'; }}
        >
          <ArrowLeft size={15} /> My Learning
        </button>

        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(o => !o)}
          style={{ height: '100%', padding: '0 1rem', background: 'none', border: 'none', borderRight: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', color: sidebarOpen ? '#a5b4fc' : '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.15s', flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <Menu size={15} /> Chapters
        </button>

        {/* Breadcrumb */}
        <div style={{ flex: 1, padding: '0 1.25rem', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
            <span style={{ color: '#64748b', fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{course.title}</span>
            {currentLesson && (
              <>
                <ChevronRight size={12} color="#334155" style={{ flexShrink: 0 }} />
                <span style={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentLesson.title}</span>
              </>
            )}
          </div>
        </div>

        {/* Progress pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 1.5rem', flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.68rem', color: '#475569', fontWeight: 600 }}>PROGRESS</div>
            <div style={{ fontSize: '0.78rem', color: progressPct === 100 ? '#10b981' : '#a5b4fc', fontWeight: 800 }}>
              {completedCount}/{totalLessons} · {progressPct}%
            </div>
          </div>
          <div style={{ width: '80px', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: progressPct === 100 ? 'linear-gradient(90deg,#10b981,#059669)' : 'linear-gradient(90deg,#6366f1,#8b5cf6)', width: `${progressPct}%`, borderRadius: '99px', transition: 'width 0.5s ease' }} />
          </div>
        </div>

        {/* Prev / Next */}
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', borderLeft: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <button onClick={() => go(currentIdx - 1)} disabled={currentIdx === 0} style={{ height: '100%', padding: '0 1rem', background: 'none', border: 'none', borderRight: '1px solid rgba(255,255,255,0.07)', cursor: currentIdx === 0 ? 'not-allowed' : 'pointer', color: currentIdx === 0 ? '#2d3748' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.15s' }}
            onMouseEnter={e => { if (currentIdx > 0) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <ChevronLeft size={15} /> Prev
          </button>
          <button onClick={() => go(currentIdx + 1)} disabled={currentIdx >= lessons.length - 1} style={{ height: '100%', padding: '0 1.25rem', background: (currentIdx < lessons.length - 1) ? 'rgba(99,102,241,0.15)' : 'none', border: 'none', cursor: currentIdx >= lessons.length - 1 ? 'not-allowed' : 'pointer', color: currentIdx >= lessons.length - 1 ? '#2d3748' : '#a5b4fc', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700, transition: 'all 0.15s' }}
            onMouseEnter={e => { if (currentIdx < lessons.length - 1) e.currentTarget.style.background = 'rgba(99,102,241,0.25)'; }}
            onMouseLeave={e => { if (currentIdx < lessons.length - 1) e.currentTarget.style.background = 'rgba(99,102,241,0.15)'; }}>
            Next <ChevronRight size={15} />
          </button>
        </div>
      </header>

      {/* ═══════════ BODY ═══════════ */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Sidebar ── */}
        <aside style={{ width: sidebarOpen ? '320px' : '0', minWidth: sidebarOpen ? '320px' : '0', background: 'var(--color-surface)', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)', borderRight: '1px solid var(--color-border)', zIndex: 40 }}>

          {/* Sidebar header */}
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
            <h3 style={{ color: 'var(--color-text)', fontWeight: 800, fontSize: '0.875rem', margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers size={14} color="var(--color-primary)" /> Course Content
            </h3>
            {/* Sidebar progress bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
              <span>{completedCount} of {totalLessons} completed</span>
              <span style={{ color: progressPct === 100 ? '#10b981' : 'var(--color-primary)', fontWeight: 700 }}>{progressPct}%</span>
            </div>
            <div style={{ height: '4px', background: 'var(--color-border)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: progressPct === 100 ? 'linear-gradient(90deg,#10b981,#059669)' : 'linear-gradient(90deg,#6366f1,#8b5cf6)', width: `${progressPct}%`, borderRadius: '99px', transition: 'width 0.5s ease' }} />
            </div>
          </div>

          {/* Module list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0.625rem' }}>
            {(course.modules || []).map((mod, mi) => {
              const modLessons = lessonsByModule[mod.module_id] || [];
              const isExp      = expandedModules[mod.module_id];
              const doneCount  = modLessons.filter(l => isLessonComplete(courseId, l.id)).length;
              return (
                <div key={mod.module_id} style={{ marginBottom: '0.35rem' }}>
                  <button onClick={() => toggleModule(mod.module_id)} style={{ width: '100%', textAlign: 'left', padding: '0.9rem 1rem', background: isExp ? 'var(--color-primary)08' : 'transparent', border: 'none', borderRadius: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.2s', marginBottom: '0.4rem' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: isExp ? 'var(--color-primary)' : 'var(--color-surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isExp ? 'white' : 'var(--color-text-muted)', fontSize: '0.7rem', fontWeight: 900, flexShrink: 0, border: '1px solid var(--color-border)' }}>{mi + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.85rem', color: isExp ? 'var(--color-text)' : 'var(--color-text-muted)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.title}</div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text-light)' }}>
                        {doneCount}/{modLessons.length} completed
                      </div>
                    </div>
                    {/* Module completion ring */}
                    {doneCount === modLessons.length && modLessons.length > 0 && (
                      <CheckCircle size={14} color="#10b981" style={{ flexShrink: 0 }} />
                    )}
                    <ChevronDown size={14} color="var(--color-text-light)" style={{ transform: isExp ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)', flexShrink: 0 }} />
                  </button>

                  {isExp && modLessons.map(lesson => {
                    const isActive = lesson.globalIdx === currentIdx;
                    const isDone   = isLessonComplete(courseId, lesson.id);
                    const tc       = lessonTypeColor(lesson.type);
                    return (
                      <button key={lesson.id} onClick={() => setCurrentIdx(lesson.globalIdx)}
                        style={{ width: '100%', textAlign: 'left', padding: '0.6rem 0.75rem 0.6rem 2.5rem', background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent', border: 'none', borderRadius: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem', borderLeft: isActive ? `3px solid ${tc}` : '3px solid transparent', transition: 'all 0.12s', paddingLeft: isActive ? 'calc(2.5rem - 3px)' : '2.5rem' }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
                        {/* Done check or type icon */}
                        {isDone ? (
                          <CheckCircle size={13} color="#10b981" style={{ flexShrink: 0 }} />
                        ) : (
                          <span style={{ color: isActive ? tc : '#475569', flexShrink: 0 }}>{lessonTypeIcon(lesson.type)}</span>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: isActive ? 700 : 400, fontSize: '0.78rem', color: isDone ? '#10b981' : isActive ? '#e2e8f0' : '#64748b', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', textDecoration: isDone && !isActive ? 'none' : 'none' }}>{lesson.title}</div>
                          <div style={{ fontSize: '0.67rem', color: isDone ? '#10b981' : '#334155', textTransform: 'capitalize', marginTop: '0.1rem' }}>
                            {isDone ? '✓ Done' : lesson.type === 'assessment' ? 'Assessment' : lesson.type === 'live' ? 'Live' : 'Video'}
                          </div>
                        </div>
                        {isActive && !isDone && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: tc, flexShrink: 0, boxShadow: `0 0 6px ${tc}` }} />}
                      </button>
                    );
                  })}
                </div>
              );
            })}

            {lessons.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <BookOpen size={32} color="#334155" style={{ marginBottom: '0.75rem' }} />
                <p style={{ color: '#475569', fontSize: '0.82rem' }}>No lessons available yet.</p>
              </div>
            )}
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--color-bg)' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ maxWidth: '900px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {lessons.length === 0 && (
                <div style={{ background: 'white', borderRadius: '16px', padding: '5rem 2rem', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                  <BookOpen size={52} color="#94a3b8" style={{ opacity: 0.4, marginBottom: '1rem' }} />
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>No content available yet</h2>
                  <p style={{ color: '#94a3b8' }}>This course has no lessons. Check back soon!</p>
                </div>
              )}

              {currentLesson && (
                <>
                  {/* Lesson header row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.22rem 0.75rem', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', background: currentLesson.type === 'video' ? 'rgba(99,102,241,0.1)' : currentLesson.type === 'live' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: lessonTypeColor(currentLesson.type) }}>
                          {lessonTypeIcon(currentLesson.type)}
                          {currentLesson.type === 'live' ? 'Live Session' : currentLesson.type === 'assessment' ? 'Assessment' : 'Video Lesson'}
                        </span>
                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>· {currentLesson.moduleTitle}</span>
                        {currentDone && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.65rem', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                            <CheckCircle size={11} /> Completed
                          </span>
                        )}
                      </div>
                      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.25, margin: 0 }}>{currentLesson.title}</h1>
                    </div>

                    {/* Mark as complete button — shown for video & live */}
                    {currentLesson.type !== 'assessment' && (
                      <MarkCompleteButton isDone={currentDone} onMark={handleMarkComplete} />
                    )}
                  </div>

                  {/* Lesson content */}
                  {currentLesson.type === 'video' && <VideoPlayer url={currentLesson.url} title={currentLesson.title} />}
                  {currentLesson.type === 'live'  && (
                    <LivePanel 
                      lesson={currentLesson} 
                      courseId={courseId}
                      onJoin={() => markLessonComplete(courseId, currentLesson.id, totalLessons)}
                    />
                  )}
                  {currentLesson.type === 'assessment' && (
                    <AssessmentPanel
                      lesson={currentLesson}
                      courseId={courseId}
                      onComplete={() => markLessonComplete(courseId, currentLesson.id, totalLessons)}
                    />
                  )}

                  {/* ── Bottom nav + advance ── */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', borderRadius: '14px', padding: '1rem 1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <button onClick={() => go(currentIdx - 1)} disabled={currentIdx === 0}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '9px', cursor: currentIdx === 0 ? 'not-allowed' : 'pointer', color: currentIdx === 0 ? '#cbd5e1' : '#475569', fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.15s' }}
                      onMouseEnter={e => { if (currentIdx > 0) { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#6366f1'; } }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = currentIdx === 0 ? '#cbd5e1' : '#475569'; }}>
                      <ChevronLeft size={16} /> Previous
                    </button>

                    <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                      Lesson <strong style={{ color: '#6366f1' }}>{currentIdx + 1}</strong> / {lessons.length}
                    </span>

                    {currentIdx < lessons.length - 1 ? (
                      <button
                        onClick={() => go(currentIdx + 1)}
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.4rem', border: 'none', borderRadius: '10px', 
                          cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', 
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', 
                          boxShadow: '0 4px 12px rgba(99,102,241,0.25)', transition: 'all 0.2s' 
                        }}>
                        Next Lesson <ChevronRight size={17} />
                      </button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', borderRadius: '9px', fontWeight: 700, fontSize: '0.875rem', background: progressPct === 100 ? 'linear-gradient(135deg,#10b981,#059669)' : '#f1f5f9', color: progressPct === 100 ? 'white' : '#94a3b8' }}>
                        {progressPct === 100 ? <><CheckCircle size={16} /> Course Complete! 🎉</> : 'Last Lesson'}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
};

export default CoursePlayer;
