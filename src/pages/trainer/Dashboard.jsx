import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/AuthContext';
import { Book, Users, Video, Star, Clock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { ADMIN_API } from '../../config';

const StatCard = ({ title, value, icon, color }) => (
  <div className="premium-card" style={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: '1.5rem', 
    padding: '1.75rem',
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '2.5rem',
    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    boxShadow: 'var(--shadow-sm)'
  }}>
    <div style={{ backgroundColor: `${color}15`, color: color, padding: '1.25rem', borderRadius: '1.5rem', display: 'flex' }}>
      {icon}
    </div>
    <div>
      <h3 style={{ fontSize: '2.25rem', margin: 0, fontWeight: 950, color: 'var(--color-text)', letterSpacing: '-0.04em' }}>{value}</h3>
      <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</p>
    </div>
  </div>
);

const TrainerDashboard = () => {
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.user_id || !accessToken) return;
    
    const fetchTrainerData = async () => {
      const headers = { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' };
      try {
        const [courseRes, sessionRes] = await Promise.all([
          fetch(`${ADMIN_API}/trainer_course_ids`, { headers }),
          fetch(`${ADMIN_API}/instructor/${user.user_id}/live-sessions`, { headers })
        ]);

        if (courseRes.ok) {
          const data = await courseRes.json();
          const ids = data?.course_ids || [];
          
          // Clear current courses and start showing them one-by-one
          setCourses([]);
          setLoading(false); // Stop main loader once we have the ID list

          for (const id of ids) {
            try {
              const res = await fetch(`${ADMIN_API}/course/${id}/full-details`, { headers });
              if (res.ok) {
                const detailData = await res.json();
                const c = detailData.course || detailData;
                const newCourse = {
                  ...c,
                  course_id: id,
                  course_title: c.course_title || c.title || 'Untitled Course',
                  is_active: c.is_active || false,
                  draft: c.draft || false
                };
                setCourses(prev => {
                  // Avoid duplicates if effect runs twice
                  if (prev.some(pc => pc.course_id === id)) return prev;
                  return [...prev, newCourse];
                });
              }
            } catch (e) {
              console.error(`Failed to fetch details for course ${id}`, e);
            }
          }
        }
        
        if (sessionRes.ok) {
          const data = await sessionRes.json();
          setSessions(data.live_sessions || []);
        }
      } catch (err) {
        console.error("Dashboard architecture sync failure", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrainerData();
  }, [user?.user_id, accessToken]);

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Trainer Dashboard - {user?.name || 'Instructor'}</h1>
        <p>Manage your assigned courses and live sessions.</p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <StatCard title="Assigned Courses" value={courses.length} icon={<Book size={24} />} color="var(--color-primary)" />
        <StatCard title="Live Courses" value={courses.filter(c => c.is_active).length} icon={<Users size={24} />} color="#3b82f6" />
        <StatCard title="Total Sessions" value={sessions.length} icon={<Video size={24} />} color="#8b5cf6" />
        <StatCard title="Draft Courses" value={courses.filter(c => c.draft).length} icon={<Star size={24} />} color="#f59e0b" />
      </div>

      {loading ? (
        <div style={{ padding: '8rem 0', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
           <Loader2 size={30} className="animate-spin" color="var(--color-primary)" />
           <p style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Loading assigned courses...</p>
        </div>
      ) : (
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        <div className="premium-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            My Courses
            <button onClick={() => navigate('/trainer/courses')} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}>View All</button>
          </h3>

          <div className="arcade-inner" style={{ 
            backgroundColor: 'rgba(0,0,0,0.03)', 
            padding: '1.5rem', 
            borderRadius: '2rem', 
            boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.05)',
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1rem',
            border: '1px solid var(--color-border)'
          }}>
            {courses.length === 0 && <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>No courses assigned to you.</p>}
            {courses.map(course => (
              <div 
                key={course.course_id} 
                className="course-card-premium"
                style={{ 
                  padding: '1.25rem', 
                  border: '1px solid var(--color-border)', 
                  borderRadius: '1.25rem', 
                  backgroundColor: 'var(--color-surface)', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  cursor: 'default'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '1rem', fontWeight: 800, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {course.course_title}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {course.course_description || 'No description available.'}
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 950, color: course.is_active ? '#10b981' : '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {course.is_active ? '● Live' : '● Draft'}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => navigate(`/manage/course/${course.course_id}`)}
                  className="btn btn-primary" 
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '0.85rem', whiteSpace: 'nowrap', marginLeft: '1rem' }}
                >
                  Manage
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="premium-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Upcoming Live Sessions</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {sessions.length === 0 && <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>No active live nodes scheduled.</p>}
            {sessions.map(session => (
              <div key={session.live_id} style={{ display: 'flex', gap: '1rem', padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: session.status?.toLowerCase() === 'live' ? '#f0fdf4' : 'transparent' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '80px', borderRight: '1px solid var(--color-border)', paddingRight: '1rem', color: 'var(--color-text-muted)' }}>
                  <Clock size={20} style={{ marginBottom: '0.25rem' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.75rem' }}>{new Date(session.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem' }}>{session.title || 'Live Session'}</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Status: {session.status} • Node {session.course_id}</p>
                </div>
                <button className="btn btn-primary" style={{ alignSelf: 'center', padding: '0.5rem' }}>
                  {session.status?.toLowerCase() === 'live' ? <Video size={18} /> : 'Prep'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}
      <style>{`
        .course-card-premium:hover {
          transform: translateY(-8px) scale(1.01);
          border-color: var(--color-primary) !important;
          box-shadow: 0 15px 45px rgba(2, 6, 23, 0.15); /* Light mode navy */
          background-image: linear-gradient(135deg, transparent 95%, rgba(0,0,0,0.02) 100%), radial-gradient(circle at 2px 2px, rgba(0,0,0,0.01) 1px, transparent 0);
          background-size: 100% 100%, 30px 30px;
        }
        .dark .course-card-premium:hover {
          box-shadow: 0 0 50px rgba(255, 255, 255, 0.15); /* Dark mode white glow */
          background-image: linear-gradient(135deg, transparent 95%, rgba(255,255,255,0.05) 100%), radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0);
        }
        .arcade-inner {
          position: relative;
          overflow: hidden;
          background-color: var(--color-surface-muted) !important;
          box-shadow: inset 0 10px 40px rgba(0,0,0,0.1) !important;
        }
        .dark .arcade-inner {
          background-color: rgba(255,255,255,0.01) !important;
          box-shadow: inset 0 10px 30px rgba(0,0,0,0.5) !important;
          border-color: rgba(255,255,255,0.05) !important;
        }
        .arcade-inner::before {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0.03;
          pointer-events: none;
          background-image: radial-gradient(circle at 2px 2px, var(--color-text) 1px, transparent 0);
          background-size: 24px 24px;
        }
      `}</style>
    </div>
  );
};

export default TrainerDashboard;
