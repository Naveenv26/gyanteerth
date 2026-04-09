import { useEffect, useState, useCallback, React } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/AuthContext';
import { Video, Calendar, Clock, Users, PlusCircle, Loader2, Activity, ArrowRight, ShieldCheck } from 'lucide-react';
import { ADMIN_API } from '../../config';

const LiveSessions = () => {
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const headers = { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' };
    try {
      const identifier = user?.user_id || user?.id || user?.email;
      if (!identifier) throw new Error("No valid user identifier found");
      
      const response = await fetch(`${ADMIN_API}/instructor/${identifier}/live-sessions`, { headers });
      if (response.ok) {
        const data = await response.json();
        setSessions(data.live_sessions || []);
      }
    } catch (err) {
      console.error("Live node sync failure", err);
    } finally {
      setLoading(false);
    }
  }, [user?.user_id, accessToken]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // Group and sort sessions
  const { liveSessions, upcomingSessions, passedSessions } = (sessions || []).reduce((acc, s) => {
    const isLive = s.status === 'live';
    const isUpcoming = s.status !== 'live' && new Date(s.start_time) > new Date();
    if (isLive) acc.liveSessions.push(s);
    else if (isUpcoming) acc.upcomingSessions.push(s);
    else acc.passedSessions.push(s);
    return acc;
  }, { liveSessions: [], upcomingSessions: [], passedSessions: [] });

  // Sort upcoming by start time
  upcomingSessions.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  const SessionRow = ({ session, isLive, i }) => (
    <tr key={session.live_id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.3s', backgroundColor: isLive ? 'rgba(16, 185, 129, 0.02)' : 'transparent' }}>
      <td style={{ padding: '1.5rem 2rem' }}>
        <div style={{ fontWeight: 800, color: 'var(--color-text)', fontSize: '0.95rem', marginBottom: '0.35rem' }}>{session.title || 'Instruction Node'}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
           <ShieldCheck size={12} color="var(--color-primary)" /> ID: {session.course_id}
        </div>
      </td>
      <td style={{ padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text)', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.35rem' }}>
          <Calendar size={13} style={{ color: 'var(--color-primary)' }} /> {new Date(session.start_time).toLocaleDateString()}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>
          <Clock size={13} /> {new Date(session.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </div>
      </td>
      <td style={{ padding: '1.5rem 2rem' }}>
        <span className="tech-badge" style={{ 
          backgroundColor: isLive ? 'rgba(16, 185, 129, 0.1)' : 'var(--color-surface-muted)',
          color: isLive ? '#10b981' : (new Date(session.start_time) > new Date() ? '#f59e0b' : 'var(--color-text-muted)')
        }}>{isLive ? '● Live Now' : (new Date(session.start_time) > new Date() ? '● Upcoming' : '● Completed')}</span>
      </td>
      <td style={{ padding: '1.5rem 2rem', textAlign: 'right' }}>
        <a href={session.meeting_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <button className="btn btn-primary" style={{ padding: '0.5rem 1.5rem', borderRadius: '0.85rem', fontSize: '0.8rem', background: isLive ? '#10b981' : undefined, borderColor: isLive ? '#10b981' : undefined }}>
            {isLive ? <><Video size={14} /> Start Session</> : (new Date(session.start_time) > new Date() ? 'Join Lobby' : 'View Archive')}
          </button>
        </a>
      </td>
    </tr>
  );

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1600px', margin: '0 auto', padding: 'var(--page-padding)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
            <Activity size={12} />
            <span style={{ fontSize: '0.65rem', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Transmission Schedule</span>
          </div>
          <h2 style={{ margin: 0 }}>Live Learning Streams</h2>
          <p style={{ margin: '0.25rem 0 0 0', maxWidth: '450px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Schedule and synchronize your interactive virtual classes with actual student nodes.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/trainer/courses')} style={{ padding: '0.75rem 1.75rem', borderRadius: '1.15rem' }}>
          <PlusCircle size={16} /> New Live Class
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '8rem', textAlign: 'center', opacity: 0.5 }}>
           <Loader2 className="animate-spin" style={{ margin: '0 auto 1.25rem auto' }} size={24} />
           <p style={{ fontWeight: 950, fontSize: '0.7rem', letterSpacing: '0.1em' }}>SYNCING LIVE NODES...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div style={{ padding: '8rem', textAlign: 'center', opacity: 0.5, backgroundColor: 'var(--color-surface)', borderRadius: '2rem', border: '1px solid var(--color-border)' }}>
           <Video size={48} style={{ margin: '0 auto 1.25rem auto' }} />
           <p style={{ fontWeight: 950, fontSize: '0.9rem' }}>NO LIVE SESSIONS SCHEDULED</p>
           <button onClick={() => navigate('/trainer/courses')} className="btn btn-ghost" style={{ marginTop: '1rem' }}>Create First Live Session</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          
          {/* LIVE NOW SECTION */}
          {(liveSessions.length > 0) && (
            <div>
              <h3 style={{ fontSize: '0.65rem', fontWeight: 950, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }} /> Active Transmissions
              </h3>
              <div className="arcade-container" style={{ padding: '0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <tbody style={{ backgroundColor: 'var(--color-surface)' }}>
                    {liveSessions.map((s, i) => <SessionRow key={s.live_id} session={s} isLive={true} i={i} />)}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* UPCOMING SECTION */}
          <div>
            <h3 style={{ fontSize: '0.65rem', fontWeight: 950, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={13} /> Scheduled Streams ({upcomingSessions.length})
            </h3>
            <div className="arcade-container" style={{ padding: '0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <tbody style={{ backgroundColor: 'var(--color-surface)' }}>
                  {upcomingSessions.length === 0 ? (
                    <tr><td style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 800 }}>No upcoming sessions scheduled</td></tr>
                  ) : upcomingSessions.map((s, i) => <SessionRow key={s.live_id} session={s} isLive={false} i={i} />)}
                </tbody>
              </table>
            </div>
          </div>

          {/* HISTORY / PAST SECTION */}
          {passedSessions.length > 0 && (
            <div style={{ opacity: 0.6 }}>
              <h3 style={{ fontSize: '0.65rem', fontWeight: 950, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={13} /> Transmission History
              </h3>
              <div className="arcade-container" style={{ padding: '0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <tbody style={{ backgroundColor: 'var(--color-surface)' }}>
                    {passedSessions.map((s, i) => <SessionRow key={s.live_id} session={s} isLive={false} i={i} />)}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      <style>{`
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default LiveSessions;
