import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/AuthContext';
import { Video, Calendar, Clock, PlusCircle, Activity, ShieldCheck, PlayCircle, Archive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ADMIN_API, TRAINER_API } from '../../config';

const LiveSessions = () => {
  const { user, smartFetch } = useAuth();
  const navigate = useNavigate();
  
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ── Skeleton Loader ── */
  const TableSkeleton = () => (
    <div style={{ background: 'white', borderRadius: '1.5rem', overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ display: 'flex', padding: '1.5rem 2rem', borderBottom: i === 3 ? 'none' : '1px solid #f1f5f9', gap: '2rem' }}>
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ height: '20px', width: '60%', background: '#f1f5f9', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }} />
            <div style={{ height: '14px', width: '30%', background: '#f1f5f9', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ height: '32px', width: '100px', background: '#f1f5f9', borderRadius: '1rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ height: '36px', width: '120px', background: '#f1f5f9', borderRadius: '0.85rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
          </div>
        </div>
      ))}
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );

  const fetchSessions = useCallback(async () => {
    const identifier = user?.user_id || user?.id || user?.email;
    if (!identifier) return;

    try {
      // 1. Get trainer's course IDs (SWR enabled)
      const data = await smartFetch(`${TRAINER_API}/trainer_course_ids`, {
         cacheKey: `trainer_course_ids_${identifier}`
      });
      const ids = data?.course_ids || [];

      if (ids.length === 0) { setLoading(false); return; }

      // 2. Fetch full-details for each course (SWR enabled with shared keys)
      const results = await Promise.all(
        ids.map(id => smartFetch(`${ADMIN_API}/course/${id}/full-details`, { cacheKey: `details_${id}` }))
      );

      const allSessions = [];
      results.forEach((courseData, i) => {
        if (!courseData) return;
        const c = courseData.course || courseData;
        const courseTitle = c.course_title || c.title || `Course ${ids[i]}`;

        (c.modules || []).forEach(m => {
          (m.content?.live_sessions || m.live_sessions || []).forEach(ls => {
            allSessions.push({
              live_id: ls.live_id || ls.Live_ID,
              course_id: ids[i],
              course_title: courseTitle,
              title: ls.title || ls.Title || 'Live Session',
              meeting_url: ls.meeting_url || ls.Meeting_URL,
              start_time: ls.start_time || ls.Start_time,
              end_time: ls.end_time || ls.End_time,
              status: ls.status || ls.Status || 'scheduled',
              provider: ls.provider || ls.Provider
            });
          });
        });
      });

      setSessions(allSessions);
    } catch (err) {
      console.error('Live session sync failure', err);
    } finally {
      setLoading(false);
    }
  }, [user, smartFetch]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // 3. Memoized Grouping and Sorting (Prevents heavy CPU usage on re-renders)
  const { liveSessions, upcomingSessions, passedSessions } = useMemo(() => {
    const now = new Date();
    const groups = { liveSessions: [], upcomingSessions: [], passedSessions: [] };
    
    (sessions || []).forEach(s => {
      const isLive = s.status === 'live';
      const isUpcoming = !isLive && new Date(s.start_time) > now;
      
      if (isLive) groups.liveSessions.push(s);
      else if (isUpcoming) groups.upcomingSessions.push(s);
      else groups.passedSessions.push(s);
    });

    groups.upcomingSessions.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    groups.passedSessions.sort((a, b) => new Date(b.start_time) - new Date(a.start_time)); // Newest passed first

    return groups;
  }, [sessions]);

  const SessionCard = ({ session, isLive, isPassed, idx }) => (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: idx * 0.05 }}
      style={{ 
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem', 
        padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', 
        backgroundColor: isLive ? 'rgba(16, 185, 129, 0.03)' : 'white', 
        transition: 'background 0.3s' 
      }}
    >
      <div style={{ flex: '2 1 250px' }}>
        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', marginBottom: '0.35rem' }}>{session.title || 'Live Session'}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
           <ShieldCheck size={14} color="#4f46e5" /> {session.course_title || `Course ${session.course_id}`}
        </div>
      </div>
      
      <div style={{ flex: '1 1 150px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b', fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.35rem' }}>
          <Calendar size={14} style={{ color: '#4f46e5' }} /> {new Date(session.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
          <Clock size={14} /> {new Date(session.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </div>
      </div>

      <div style={{ flex: '1 1 120px' }}>
        <span style={{ 
          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
          padding: '0.3rem 0.8rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
          backgroundColor: isLive ? '#ecfdf5' : (isPassed ? '#f1f5f9' : '#fff7ed'),
          color: isLive ? '#10b981' : (isPassed ? '#64748b' : '#f59e0b'),
          border: `1px solid ${isLive ? 'rgba(16,185,129,0.2)' : (isPassed ? 'rgba(100,116,139,0.2)' : 'rgba(245,158,11,0.2)')}`
        }}>
          {isLive && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s infinite' }} />}
          {isLive ? 'Live Now' : (isPassed ? 'Completed' : 'Upcoming')}
        </span>
      </div>

      <div style={{ flex: '1 1 150px', textAlign: 'right' }}>
        <a href={session.meeting_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <button style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.6rem 1.25rem', borderRadius: '0.85rem', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
            background: isLive ? '#10b981' : (isPassed ? 'white' : '#4f46e5'),
            color: isPassed ? '#4f46e5' : 'white',
            border: isPassed ? '1px solid #4f46e5' : 'none',
            boxShadow: isLive ? '0 4px 12px rgba(16,185,129,0.2)' : (!isPassed ? '0 4px 12px rgba(79,70,229,0.2)' : 'none')
          }}
          onMouseEnter={e => { if(isPassed) { e.currentTarget.style.background = '#4f46e5'; e.currentTarget.style.color = 'white'; } else { e.currentTarget.style.transform = 'translateY(-2px)'; } }}
          onMouseLeave={e => { if(isPassed) { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#4f46e5'; } else { e.currentTarget.style.transform = 'none'; } }}
          >
            {isLive ? <><Video size={16} /> Start Session</> : (isPassed ? <><Archive size={16} /> View Record</> : <><PlayCircle size={16} /> Join Lobby</>)}
          </button>
        </a>
      </div>
    </motion.div>
  );

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
            Transmission Schedule
          </h1>
          <p style={{ margin: 0, maxWidth: '500px', fontSize: '1.05rem', color: '#64748b', fontWeight: 500 }}>
            Schedule and synchronize your interactive virtual classes with actual student nodes.
          </p>
        </div>
        <button onClick={() => navigate('/trainer/courses')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#4f46e5', color: 'white', padding: '0.85rem 1.5rem', borderRadius: '1rem', border: 'none', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79,70,229,0.25)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
          <PlusCircle size={18} /> Schedule Session
        </button>
      </div>

      {loading && sessions.length === 0 ? (
        <TableSkeleton />
      ) : sessions.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '6rem 2rem', textAlign: 'center', background: 'white', borderRadius: '2rem', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
           <Video size={56} color="#cbd5e1" style={{ margin: '0 auto 1.25rem auto' }} />
           <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>No live sessions scheduled</h3>
           <p style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: 500, marginTop: '0.5rem' }}>Your calendar is currently clear.</p>
           <button onClick={() => navigate('/trainer/courses')} style={{ marginTop: '1.5rem', background: '#f8fafc', color: '#4f46e5', border: '1px solid #e2e8f0', padding: '0.75rem 1.5rem', borderRadius: '0.85rem', fontWeight: 800, cursor: 'pointer' }}>Create First Session</button>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          
          {/* LIVE NOW SECTION */}
          {liveSessions.length > 0 && (
            <div>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 900, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={16} /> Active Transmissions
              </h3>
              <div style={{ background: 'white', borderRadius: '1.5rem', overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                {liveSessions.map((s, i) => <SessionCard key={s.live_id} session={s} isLive={true} isPassed={false} idx={i} />)}
              </div>
            </div>
          )}

          {/* UPCOMING SECTION */}
          {upcomingSessions.length > 0 && (
            <div>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 900, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={16} /> Scheduled Streams ({upcomingSessions.length})
              </h3>
              <div style={{ background: 'white', borderRadius: '1.5rem', overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                {upcomingSessions.map((s, i) => <SessionCard key={s.live_id} session={s} isLive={false} isPassed={false} idx={i} />)}
              </div>
            </div>
          )}

          {/* HISTORY SECTION */}
          {passedSessions.length > 0 && (
            <div>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Archive size={16} /> Transmission History
              </h3>
              <div style={{ background: 'white', borderRadius: '1.5rem', overflow: 'hidden', border: '1px solid #e2e8f0', opacity: 0.85 }}>
                {passedSessions.map((s, i) => <SessionCard key={s.live_id} session={s} isLive={false} isPassed={true} idx={i} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveSessions;