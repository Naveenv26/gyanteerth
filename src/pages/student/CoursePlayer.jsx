import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PlayCircle, ChevronRight, ChevronLeft, Award,
  Layers, Video, Monitor, Loader2, AlertCircle, ArrowLeft,
  ChevronDown, BookOpen, ExternalLink, CheckCircle, Menu, Check, Star, X,
  FileText
} from 'lucide-react';
import { useEnrollment } from '../../shared/EnrollmentContext';
import { useAuth } from '../../shared/AuthContext'; // <-- ADD THIS
import { ADMIN_API, USER_API } from '../../config'; // <-- ADD USER_API

/* ── helpers ─────────────────────────────────── */
function buildLessons(modules, courseNotes) {
  const lessons = [];

  // 0. Course-Level Notes (Prepend if they exist)
  (courseNotes || []).forEach((n, ni) => {
    lessons.push({
      id: n.notes_id || n.note_id || n.Notes_ID || n.id,
      moduleId: 'global-resources',
      moduleTitle: 'General Resources',
      title: n.title || n.Title || `Resource ${ni + 1}`,
      type: 'note',
      url: n.note_url || n.file_url || n.Note_URL || n.File_URL
    });
  });

  (modules || []).forEach(mod => {
    const vc = mod.content?.videos || mod.video || [];
    const lc = mod.content?.live_sessions || mod.live_sessions || [];
    const nc = mod.content?.notes || mod.notes || [];
    const ac = mod.content?.assessments || mod.assessments || [];

    // 1. Videos (Recorded Content)
    vc.forEach((v, vi) => {
      lessons.push({ 
        id: v.video_id || v.Video_ID, 
        moduleId: mod.module_id || mod.Module_ID, 
        moduleTitle: mod.title || mod.Title, 
        title: v.description || v.course_description || v.Title || v.title || `Video ${vi + 1}`, 
        type: 'video', 
        url: v.video_url || v.Video_URL 
      });
    });

    // 2. Live Sessions
    lc.forEach((ls, li) => {
      lessons.push({ 
        id: ls.live_id || ls.Live_ID, 
        moduleId: mod.module_id || mod.Module_ID, 
        moduleTitle: mod.title || mod.Title, 
        title: ls.title || ls.Title || `Live Session ${li + 1}${ls.provider ? ' — ' + ls.provider : ''}`, 
        type: 'live', 
        url: ls.meeting_url || ls.Meeting_URL, 
        start_time: ls.start_time || ls.Start_time, 
        end_time: ls.end_time || ls.End_time, 
        status: ls.status || ls.Status, 
        recordings: ls.recordings || [] 
      });
    });

    // 3. Notes / Resources
    nc.forEach((n, ni) => {
      lessons.push({
        id: n.notes_id || n.note_id || n.Notes_ID || n.id,
        moduleId: mod.module_id || mod.Module_ID,
        moduleTitle: mod.title || mod.Title,
        title: n.title || n.Title || `Resource ${ni + 1}`,
        type: 'note',
        url: n.note_url || n.file_url || n.Note_URL || n.File_URL
      });
    });

    // 4. Assessments
    ac.forEach(a => {
      lessons.push({ 
        id: a.assessment_id || a.Assessment_ID, 
        moduleId: mod.module_id || mod.Module_ID, 
        moduleTitle: mod.title || mod.Title, 
        title: a.title || a.Title, 
        type: 'assessment', 
        totalMark: a.total_mark || a.Total_Mark, 
        passingMark: a.passing_mark || a.Passing_Mark, 
        duration: a.duration || a.Duration, 
        questions: a.questions || [] 
      });
    });
  });
  return lessons;
}

function getEmbedUrl(url) {
  if (!url) return null;
  
  // YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
    if (m) {
      const baseUrl = `https://www.youtube.com/embed/${m[1]}`;
      const params = new URLSearchParams({
        autoplay: 1,
        rel: 0,
        modestbranding: 1,
        enablejsapi: 1
      });
      return `${baseUrl}?${params.toString()}`;
    }
  }
  
  // Vimeo
  if (url.includes('vimeo.com')) {
    const m = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
    return m ? `https://player.vimeo.com/video/${m[1]}?autoplay=1` : null;
  }
  
  // Google Drive
  if (url.includes('drive.google.com')) {
    const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return m ? `https://drive.google.com/file/d/${m[1]}/preview` : null;
  }

  // Zoom Web (if they provide the web client URL, otherwise we just try the URL as is in iframe)
  if (url.includes('zoom.us/j/')) {
    // Attempting to use the web client version if it's a join link
    return url.replace('/j/', '/wc/join/');
  }

  return url; // Default to the URL itself for other providers
}

/* ── Iframe Video Player ───────────────────────── */
function VideoPlayer({ lesson }) {
  if (!lesson || !lesson.url) {
    return (
      <div style={{ width: '100%', aspectRatio: '16/9', background: '#0f172a', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <AlertCircle size={40} color="#ef4444" />
        <p style={{ color: '#f8fafc', fontWeight: 600 }}>Video URL not available</p>
      </div>
    );
  }

  // Handle YouTube watch URLs and convert to embed
  let embedUrl = lesson.url;
  if (embedUrl.includes('youtube.com/watch?v=')) {
    const videoId = new URL(embedUrl).searchParams.get('v');
    if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
  } else if (embedUrl.includes('youtu.be/')) {
    const videoId = embedUrl.split('youtu.be/')[1].split('?')[0];
    if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
  }

  return (
    <div style={{ width: '100%', background: '#000', borderRadius: '12px', overflow: 'hidden', aspectRatio: '16/9', boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}>
      <iframe 
        src={embedUrl} 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ width: '100%', height: '100%', border: 'none' }} 
        title={lesson.title || 'Video Player'}
      />
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

  const handleJoin = () => {
    onJoin(lesson.id, lesson.moduleId);
    if (lesson.url) {
      window.open(lesson.url, '_blank', 'noopener,noreferrer');
    }
  };

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
                <button 
                  onClick={handleJoin} 
                  style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: '0.75rem', 
                    background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, 
                    color: 'white', padding: '1rem 2.5rem', borderRadius: '12px', border: 'none',
                    fontWeight: 800, fontSize: '1rem', cursor: 'pointer',
                    boxShadow: `0 8px 25px ${accent}40`, transition: 'transform 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  <Monitor size={20} /> {isOngoing ? 'Join Session Now' : 'Enter Waiting Room'}
                </button>
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
            <a key={rec.rec_video_id} href={rec.url} target="_blank" rel="noopener noreferrer" onClick={() => onJoin(lesson.id, lesson.moduleId, true)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '8px', background: '#f0fdf4', border: '1px solid rgba(16,185,129,0.2)', textDecoration: 'none', marginBottom: '0.5rem' }}>
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

/* ── Note Panel ───────────────────────────────── */
function NotePanel({ lesson }) {
  // Try to detect if it's a PDF for inline preview
  const lowerUrl = (lesson.url || '').toLowerCase();
  const isPdf = lowerUrl.endsWith('.pdf') || lowerUrl.includes('.pdf?');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ padding: '3.5rem 2rem', background: 'white', borderRadius: '24px', border: '1px solid #f1f5f9', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative background */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #ef4444, #f59e0b)' }} />
        
        <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '1px solid #fee2e2' }}>
          <BookOpen size={36} color="#ef4444" />
        </div>
        
        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>{lesson.title}</h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
          This resource is available for your learning. You can view it directly or download it for offline study.
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
           <a 
            href={lesson.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.6rem', 
              background: 'linear-gradient(135deg, #0f172a, #1e293b)', 
              color: 'white', textDecoration: 'none', padding: '0.85rem 2rem', 
              borderRadius: '12px', fontSize: '0.9rem', fontWeight: 800, 
              boxShadow: '0 8px 20px rgba(15,23,42,0.2)', transition: 'transform 0.2s' 
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
           >
            <ExternalLink size={18} /> Open Resource
           </a>
        </div>
      </div>

      {isPdf && (
        <div style={{ width: '100%', height: '800px', borderRadius: '24px', overflow: 'hidden', border: '1px solid #e2e8f0', background: 'white', boxShadow: '0 20px 50px rgba(0,0,0,0.08)' }}>
           <iframe 
            src={`${lesson.url}#toolbar=0&navpanes=0`} 
            width="100%" 
            height="100%" 
            style={{ border: 'none' }} 
            title={lesson.title}
           />
        </div>
      )}
      
      {!isPdf && lesson.url && (
        <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
            Note: Preview is only available for PDF files. For other formats, please use the button above to open the resource.
          </p>
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

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // 1. Send to Backend
      const result = await onComplete(selected);
      
      // 2. Local State Sync (using backend results if provided)
      setScore(result?.score ?? 0);
      setSubmitted(true);
      
      // If we don't have a specific onComplete result from backend, we fall back to local calc
      // but usually the backend will return mark complete status.
    } catch (err) {
      console.error("Assessment submission error:", err);
    } finally {
      setSubmitting(false);
    }
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
      {!submitted && lesson.questions?.length > 0 && (
        <button 
          onClick={handleSubmit} 
          disabled={submitting}
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', borderRadius: '10px', padding: '1rem', fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Award size={18} />} 
          {submitting ? 'Submitting...' : 'Submit Assessment'}
        </button>
      )}
    </div>
  );
}

/* ══════════ MARK COMPLETE BUTTON ══════════ */
function MarkCompleteButton({ isDone, onMark }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={isDone ? undefined : onMark} onMouseEnter={() => !isDone && setHovered(true)} onMouseLeave={() => !isDone && setHovered(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 1.6rem', borderRadius: '12px', fontWeight: 800, fontSize: '0.9rem', cursor: isDone ? 'default' : 'pointer', transition: 'all 0.2s', background: isDone ? 'linear-gradient(135deg, #10b981, #059669)' : 'white', color: isDone ? 'white' : '#10b981', border: isDone ? '2px solid transparent' : '2px solid #10b981', transform: hovered && !isDone ? 'translateY(-1px)' : 'none', opacity: isDone ? 0.9 : 1 }}>
      {isDone ? (<><CheckCircle size={18} /> Completed</>) : (<><Check size={18} /> Mark as Complete</>)}
    </button>
  );
}

/* ══════════════════════════════════════════════════
   MAIN COURSE PLAYER
══════════════════════════════════════════════════ */
const CoursePlayer = ({ isTrainer = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const enrollment = useEnrollment();
  const { authFetch } = useAuth(); // <-- Inject Secure Wrapper
  
  // Safe extraction of enrollment hooks/data
  const markLessonComplete = isTrainer ? () => {} : enrollment?.markLessonComplete;
  const isLessonComplete = isTrainer ? () => false : enrollment?.isLessonComplete;
  const getCompletedCount = isTrainer ? () => 0 : enrollment?.getCompletedCount;
  const enrolledCourses = isTrainer ? [] : enrollment?.enrolledCourses;
  const registerLessonCount = isTrainer ? () => {} : enrollment?.registerLessonCount;
  
  const markLiveAttendance = isTrainer ? async () => ({}) : enrollment?.markLiveAttendance;
  const markVideoProgress = isTrainer ? async () => ({}) : enrollment?.markVideoProgress;
  const submitAssessment = isTrainer ? async () => ({}) : enrollment?.submitAssessment;
  const fetchCourseProgress = isTrainer ? async () => ({}) : enrollment?.fetchCourseProgress;

  const [course, setCourse]               = useState(null);
  const [lessons, setLessons]             = useState([]);
  const [currentIdx, setCurrentIdx]       = useState(0);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const [expandedModules, setExpandedModules] = useState({});
  const [justCompleted, setJustCompleted] = useState(false);
  
  // ── Review state ────────────────────────────────────────────────────────
  const [showReview, setShowReview] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ Course_rating: '5', Instructor_rating: '5', Review: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!id) return;
    setSubmittingReview(true);
    try {
      const res = await authFetch(`${USER_API}/courses/${id}/feedback/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackForm),
      });
      if (!res.ok) throw new Error('Feedback submission failed');
      setReviewSuccess(true);
      setTimeout(() => setShowReview(false), 2500);
    } catch (err) {
      console.error('Feedback error:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  // DEBUG LOG
  useEffect(() => {
    console.log('CoursePlayer: Active Course ID from URL:', id, 'TrainerMode:', isTrainer);
    if (!isTrainer) {
      const enrolledItem = enrolledCourses?.find(c => String(c.id || c.course_id) === String(id));
      console.log('CoursePlayer: Enrollment status:', enrolledItem ? 'ENROLLED' : 'NOT ENROLLED', enrolledItem);
    }
  }, [id, enrolledCourses, isTrainer]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // Securely fetch details
        const res = await authFetch(`${ADMIN_API}/course/${id}/full-details`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
          if (data.status && data.course) {
          const c = data.course;
          setCourse(c);
          const built  = buildLessons(c.modules, c.notes);
          setLessons(built);

          const typeLower = (c.type || c.course_type || c.course_Type || 'recorded').toLowerCase();
          const isLive = typeLower === 'live' || typeLower === 'live_course' || typeLower === 'live session';
          
          // Auto-select first ongoing or upcoming live session if live course
          if (isLive && built.length > 0) {
              const now = new Date();
              const liveIdx = built.findIndex(l => {
                  if (l.type !== 'live') return false;
                  const start = l.start_time ? new Date(l.start_time) : null;
                  const end = l.end_time ? new Date(l.end_time) : null;
                  // If live OR starting soon OR in future
                  return (start && end && now >= start && now <= end) || (start && now < start);
              });
              if (liveIdx !== -1) setCurrentIdx(liveIdx);
          }

          // Register total so progress % computes correctly on My Learning page
          if (!isTrainer) {
            registerLessonCount(id, built.length);
            // Sync progress from backend
            fetchCourseProgress(id);
          }
          const exp = {};
          (c.modules || []).forEach(m => { exp[m.module_id] = true; });
          setExpandedModules(exp);
        } else throw new Error('Course not found');
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, [id, isTrainer, authFetch]);

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
  const handleMarkComplete = useCallback(async () => {
    if (isTrainer || !currentLesson) return;
    const sId = courseId;
    const lId = currentLesson.id;
    const mid = currentLesson.moduleId;
    const isCurrentlyDone = isLessonComplete(sId, lId);
    
    // Short circuit if already done -- meaning no undo!
    if (isCurrentlyDone) return;
    
    // 1. Sync Backend
    if (currentLesson.type === 'video') {
      await markVideoProgress(sId, mid, lId);
    } else if (currentLesson.type === 'live') {
      // Attendance logic: Manual completion implies they attended/watched
      await markLiveAttendance(sId, lId, mid, true, true);
    } else if (currentLesson.type === 'assessment') {
      // Assessment completion is usually handled inside the AssessmentPanel,
      // but if they click the header button on a passed exam, we sync it.
      await fetchCourseProgress(sId);
    }
    
    // 2. Update Local UI
    markLessonComplete(sId, lId, totalLessons);
    setJustCompleted(true);
  }, [currentLesson, courseId, totalLessons, markLessonComplete, isLessonComplete, markVideoProgress, markLiveAttendance, fetchCourseProgress, isTrainer]);

  const go = idx => setCurrentIdx(Math.max(0, Math.min(lessons.length - 1, idx)));
  const toggleModule = mid => setExpandedModules(p => ({ ...p, [mid]: !p[mid] }));

  const lessonsByModule = {};
  lessons.forEach((l, idx) => {
    if (!lessonsByModule[l.moduleId]) lessonsByModule[l.moduleId] = [];
    lessonsByModule[l.moduleId].push({ ...l, globalIdx: idx });
  });

  const lessonTypeColor = t => {
    if (t === 'live')       return '#ef4444';
    if (t === 'assessment') return '#10b981';
    if (t === 'note')       return '#f59e0b'; // Amber for notes
    return '#6366f1';
  };
  const lessonTypeIcon  = t => {
    if (t === 'live')       return <Monitor size={13} />;
    if (t === 'assessment') return <Award size={13} />;
    if (t === 'note')       return <FileText size={13} />;
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
      <button onClick={() => navigate(isTrainer ? '/trainer/courses' : '/student/courses')} style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', borderRadius: '10px', padding: '0.75rem 2rem', fontWeight: 700, cursor: 'pointer' }}>
        ← {isTrainer ? 'Back to Courses' : 'My Learning'}
      </button>
    </div>
  );

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)', overflow: 'hidden', color: 'var(--color-text)' }}>

      {/* ═══════════ TOP NAVIGATION ═══════════ */}
      <header style={{ height: '60px', flexShrink: 0, background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', zIndex: 50, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>

        {/* Back */}
        <button
          onClick={() => navigate(isTrainer ? '/trainer/courses' : '/student/courses')}
          style={{ height: '100%', padding: '0 1.25rem', background: 'none', border: 'none', borderRight: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.15s', whiteSpace: 'nowrap', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'none'; }}
        >
          <ArrowLeft size={15} /> {isTrainer ? 'Exit Preview' : 'My Learning'}
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

        {/* Progress pill - HIDDEN for trainers */}
        {!isTrainer && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 1.5rem', flexShrink: 0 }}>
            {progressPct === 100 && (
              <button 
                onClick={() => { setReviewSuccess(false); setShowReview(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f97316', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 10px rgba(249,115,22,0.3)', marginRight: '0.5rem' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >
                <Star size={14} /> Rate Course
              </button>
            )}
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
        )}

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
        <aside style={{ width: sidebarOpen ? '260px' : '0', minWidth: sidebarOpen ? '260px' : '0', background: 'var(--color-surface)', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)', borderRight: '1px solid var(--color-border)', zIndex: 40 }}>

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
            {(() => {
              const displayModules = [...(course.modules || [])];
              if (lessonsByModule['global-resources']) {
                displayModules.unshift({ module_id: 'global-resources', title: 'General Resources' });
              }
              return displayModules.map((mod, mi) => {
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
                            {isDone ? '✓ Done' : lesson.type === 'assessment' ? 'Assessment' : lesson.type === 'live' ? 'Live' : lesson.type === 'note' ? 'Resource' : 'Video'}
                          </div>
                        </div>
                        {isActive && !isDone && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: tc, flexShrink: 0, boxShadow: `0 0 6px ${tc}` }} />}
                      </button>
                    );
                  })}
                </div>
              );
            });
            })()}

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
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.22rem 0.75rem', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', background: currentLesson.type === 'video' ? 'rgba(99,102,241,0.1)' : currentLesson.type === 'live' ? 'rgba(239,68,68,0.1)' : currentLesson.type === 'note' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', color: lessonTypeColor(currentLesson.type) }}>
                          {lessonTypeIcon(currentLesson.type)}
                          {currentLesson.type === 'live' ? 'Live Session' : currentLesson.type === 'assessment' ? 'Assessment' : currentLesson.type === 'note' ? 'Resource' : 'Video Lesson'}
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

                    {/* Mark as complete button — shown for video & live (ONLY FOR STUDENTS) */}
                    {currentLesson.type !== 'assessment' && !isTrainer && (
                      <MarkCompleteButton isDone={currentDone} onMark={handleMarkComplete} />
                    )}
                  </div>

                  {/* Lesson content */}
                  {currentLesson.type === 'video' && <VideoPlayer lesson={currentLesson} />}
                  {currentLesson.type === 'note' && <NotePanel lesson={currentLesson} />}
                  {currentLesson.type === 'live'  && (
                    <LivePanel 
                      lesson={currentLesson} 
                      courseId={courseId}
                      onJoin={async (liveId, mid, isRecording = false) => {
                         await markLiveAttendance(courseId, liveId, mid, !isRecording, isRecording);
                         markLessonComplete(courseId, liveId, totalLessons);
                      }}
                    />
                  )}
                  {currentLesson.type === 'assessment' && (
                    <AssessmentPanel
                      lesson={currentLesson}
                      courseId={courseId}
                      onComplete={async (answers) => {
                        const res = await submitAssessment(courseId, currentLesson.moduleId, currentLesson.id, answers);
                        if (res?.passed) {
                          markLessonComplete(courseId, currentLesson.id, totalLessons);
                        }
                        return res;
                      }}
                    />
                  )}

                  {/* ── Bottom nav + advance ── */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', borderRadius: '14px', padding: '1rem 1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <button onClick={() => go(currentIdx - 1)} disabled={currentIdx === 0}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '99px', cursor: currentIdx === 0 ? 'not-allowed' : 'pointer', color: currentIdx === 0 ? '#cbd5e1' : '#475569', fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.15s' }}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', borderRadius: '99px', fontWeight: 700, fontSize: '0.875rem', background: (!isTrainer && progressPct === 100) ? 'linear-gradient(135deg,#10b981,#059669)' : '#f1f5f9', color: (!isTrainer && progressPct === 100) ? 'white' : '#94a3b8' }}>
                        {(!isTrainer && progressPct === 100) ? <><CheckCircle size={16} /> Course Complete! 🎉</> : 'Last Lesson'}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ── Review Modal ────────────────────────────────────────────────── */}
      {/* ── Review Modal ────────────────────────────────────────────────── */}
      {showReview && createPortal(
          <div
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={() => setShowReview(false)}
          >
            <div
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
                {reviewSuccess ? (
                  <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                    <div style={{ width: '80px', height: '80px', background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '2px solid #10b981' }}>
                      <CheckCircle size={40} color="#10b981" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#064e3b' }}>Feedback Received!</h2>
                    <p style={{ color: '#047857', marginTop: '0.4rem', fontWeight: 600, fontSize: '0.9rem' }}>Thank you for helping us evolve.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview} style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                      <div>
                        <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#1e293b', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                          <Star size={20} color="#f97316" /> Course Evaluation
                        </h2>
                        <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.3rem', marginLeft: '1.75rem' }}>Goal Achieved! You reached the top.</div>
                      </div>
                      <button type="button" onClick={() => setShowReview(false)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f8fafc', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }} onMouseEnter={e=>e.currentTarget.style.background='#f1f5f9'} onMouseLeave={e=>e.currentTarget.style.background='#f8fafc'}>
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

                    <button type="submit" disabled={submittingReview} style={{ width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', padding: '1rem', borderRadius: '1rem', fontWeight: 800, fontSize: '0.95rem', cursor: submittingReview ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.25)', opacity: submittingReview ? 0.7 : 1, transition: 'transform 0.2s' }} onMouseEnter={e=>!submittingReview&&(e.currentTarget.style.transform='translateY(-2px)')} onMouseLeave={e=>!submittingReview&&(e.currentTarget.style.transform='none')}>
                      {submittingReview ? <Loader2 size={18} className="animate-spin" /> : <Award size={18} />}
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

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
