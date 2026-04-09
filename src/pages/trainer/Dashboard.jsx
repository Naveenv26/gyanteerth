import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/AuthContext';
import { Book, Users, Video, Clock, Loader2, Activity, ArrowRight, Grid, Calendar, Shield, BookOpen, FastForward, Award, CalendarDays, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ADMIN_API, TRAINER_API } from '../../config';

// Reusable compact StatCard inspired by Student Portal
const StatCard = ({ title, value, icon, color, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
    className="premium-card" 
    style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '1.25rem', 
      padding: '1.5rem',
      flex: 1,
      minWidth: '240px'
    }}
  >
    <div style={{ 
      width: '3.5rem', height: '3.5rem', borderRadius: '1rem', 
      backgroundColor: `${color}10`, color: color, 
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `1px solid ${color}20`
    }}>
      {React.cloneElement(icon, { size: 24 })}
    </div>
    <div>
      <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{title}</div>
    </div>
  </motion.div>
);

const TrainerDashboard = () => {
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [liveSessions, setLiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrainerData = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const headers = { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' };
    try {
      const courseRes = await fetch(`${TRAINER_API}/trainer_course_ids`, { headers });
      if (courseRes.ok) {
        const data = await courseRes.json();
        const ids = data?.course_ids || [];
        const fullCourses = [];
        let allStudents = [];
        for (const id of ids) {
          let c = {};
          let courseDataLoaded = false;
          
          try {
            const res = await fetch(`${ADMIN_API}/course/${id}/full-details`, { headers });
            if (res.ok) {
              const detailData = await res.json();
              c = detailData.course || detailData;
              courseDataLoaded = true;
            }
          } catch (e) {}
          
          let studentCount = 0;
          let avgProgress = 0;
          try {
            const pRes = await fetch(`${TRAINER_API}/course/${id}/students-progress`, { headers });
            if (pRes.ok) {
              const pData = await pRes.json();
              const studentsList = pData.data || [];
              studentCount = studentsList.length;
              if (studentCount > 0) {
                const totalProgress = studentsList.reduce((sum, s) => sum + (s.progress_percentage || 0), 0);
                avgProgress = Math.round(totalProgress / studentCount);
              }
              
              // Add mapped students to combined list
              const mappedStudents = studentsList.map(st => ({
                 name: st.user_name,
                 email: st.email || st.user_id, // Fix email mapping
                 progress: st.progress_percentage || 0
              }));
              allStudents = [...allStudents, ...mappedStudents];
            }
          } catch(e) {}

          const newCourse = {
            ...c,
            course_id: id,
            course_title: c.course_title || c.title || `Course ID: ${id.split('-')[1] || id}`,
            course_description: c.course_description || c.description || 'No description available for this course.',
            is_active: c.is_active || courseDataLoaded,
            avgProgress: avgProgress,
            studentCount: studentCount,
            status: (c.is_active || courseDataLoaded) ? 'live' : 'draft',
            progress: avgProgress
          };
          fullCourses.push(newCourse);
        }
        setCourses(fullCourses);
        // sort by most recently active or high progress mapping (optional)
        setStudents(allStudents.sort((a,b) => b.progress - a.progress));
      }
      
      // Fetch upcoming live sessions - best-effort, silently skip if it fails
      const identifier = user?.user_id || user?.id;
      if (identifier) {
        try {
          const liveRes = await fetch(`${ADMIN_API}/instructor/${identifier}/live-sessions`, { headers });
          if (liveRes.ok) {
            const liveData = await liveRes.json();
            const allLive = liveData.live_sessions || [];
            const upcoming = allLive.filter(s => new Date(s.start_time) > new Date() || s.status === 'live');
            setLiveSessions(upcoming.sort((a,b) => new Date(a.start_time) - new Date(b.start_time)));
          }
        } catch (err) { /* Live sessions optional — skip silently */ }
      }

    } catch (err) {
      console.error("Critical architecture sync failure", err);
    } finally {
      setLoading(false);
    }
  }, [user?.user_id, accessToken]);

  useEffect(() => { fetchTrainerData(); }, [fetchTrainerData]);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* HEADER SECTION */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '0.5rem' }}>Welcome back, Professor {user?.name?.split(' ')[0] || 'Trainer'}! 👋</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>
          Here's an overview of your active knowledge nodes and student interactions.
        </p>
      </div>

      {/* METRICS GRID */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard title="Assigned Courses" value={courses.length} icon={<BookOpen size={24} />} color="var(--color-primary)" delay={0.1} />
        <StatCard title="Total Students" value={students.length} icon={<Users size={24} />} color="#3b82f6" delay={0.2} />
        <StatCard title="Upcoming Lives" value={liveSessions.length} icon={<Video size={24} />} color="#10b981" delay={0.3} />
        <StatCard title="Overall Impact" value="84%" icon={<Award size={24} />} color="#f59e0b" delay={0.4} />
      </div>

      {/* QUICK QUICK ACTIONS SECTION */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
          <button onClick={() => navigate('/trainer/courses')} className="btn btn-primary" style={{ flex: 1, minWidth: '200px', display: 'flex', justifyContent: 'center', backgroundColor: 'var(--navy-900)', color: 'white', padding: '1rem' }}>
            <Book size={18} /> Course Repository
          </button>
          <button onClick={() => navigate('/trainer/students')} className="btn" style={{ flex: 1, minWidth: '200px', display: 'flex', justifyContent: 'center', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '1rem' }}>
             <Users size={18} /> Student Roster
          </button>
          <button onClick={() => navigate('/trainer/live-sessions')} className="btn" style={{ flex: 1, minWidth: '200px', display: 'flex', justifyContent: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1rem' }}>
             <CalendarDays size={18} /> Scheduling Node
          </button>
      </div>

      {loading ? (
        <div style={{ padding: '6rem 0', textAlign: 'center', opacity: 0.5 }}>
           <Loader2 className="animate-spin" style={{ margin: '0 auto 1rem auto' }} size={32} color="var(--color-primary)" />
           <p style={{ fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.1em' }}>SYNCING YOUR DASHBOARD...</p>
        </div>
      ) : (
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: ASSIGNED COURSES */}
        <div className="premium-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Active Modules</h3>
            <button onClick={() => navigate('/trainer/courses')} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>View All</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {courses.length === 0 && <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>No modules currently assigned to your node.</p>}
            {courses.slice(0, 4).map(course => (
              <div 
                key={course.course_id} 
                style={{ 
                  padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid var(--color-border)',
                  display: 'flex', flexDirection: 'column', gap: '0.75rem',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--color-text)' }}>{course.course_title}</h4>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-primary)' }}>{course.progress || 0}% Status</span>
                </div>
                <div style={{ width: '100%', backgroundColor: 'var(--color-bg)', height: '0.65rem', borderRadius: '1rem', overflow: 'hidden' }}>
                    <div style={{ width: `${course.progress || 0}%`, backgroundColor: 'var(--color-primary)', height: '100%', borderRadius: '1rem' }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{course.status === 'live' ? '🟢 Published' : '🟡 Review'}</span>
                    <button 
                        onClick={() => navigate(`/trainer/course/${course.course_id}`)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                        Review Content <ArrowRight size={14} />
                    </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE SESSIONS & STUDENTS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* UPCOMING LIVE SESSIONS */}
            <div className="premium-card" style={{ padding: '2rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     <Video size={18} style={{ color: '#ef4444' }} />
                     <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Upcoming Lives</h3>
                   </div>
                   <button onClick={() => navigate('/trainer/live-sessions')} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>Schedule</button>
                </div>
                
                {liveSessions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'var(--color-surface-muted)', borderRadius: '1rem' }}>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>You have no upcoming live sessions scheduled.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                     {liveSessions.slice(0, 3).map(session => (
                       <div key={session.live_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pading: '1rem', background: 'var(--color-surface-muted)', borderRadius: '1rem', border: '1px solid var(--color-border)', padding: '1rem' }}>
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.2rem' }}>{session.title || 'Live Broadcast'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                              {session.status === 'live' ? '🟢 HAPPENING NOW' : new Date(session.start_time).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <a href={session.meeting_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: session.status === 'live' ? '#ef4444' : 'var(--color-primary)', color: 'white' }}>
                            <ExternalLink size={14} />
                          </a>
                       </div>
                     ))}
                  </div>
                )}
            </div>

            {/* RECENT STUDENTS */}
            <div className="premium-card" style={{ padding: '2rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Users size={18} style={{ color: '#3b82f6' }} />
                      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Student Roster preview</h3>
                   </div>
                   <button onClick={() => navigate('/trainer/students')} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>Full Roster</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {students.length === 0 && <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', fontSize: '0.9rem' }}>Waiting for student enrollment sync...</p>}
                  {students.slice(0, 4).map(student => (
                    <div 
                      key={student.email} 
                      style={{ 
                        display: 'flex', gap: '1rem', alignItems: 'center',
                        paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)'
                      }}
                    >
                      <div style={{ 
                        width: '40px', height: '40px', borderRadius: '12px', 
                        backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1rem', fontWeight: 900
                      }}>
                        {(student.name || 'S').charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{student.name || student.username}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Progress: {student.progress || 0}%</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                         <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Email</div>
                         <div style={{ fontSize: '0.7rem', fontWeight: 800 }}>{student.email.length > 15 ? student.email.slice(0, 15) + '...' : student.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div style={{ marginTop: '2.5rem', padding: '1.5rem', background: 'var(--color-surface-muted)', borderRadius: '1.5rem', border: '1px solid var(--color-border)' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.6, fontWeight: 500 }}>
                        <Shield size={14} style={{ marginRight: '0.5rem', verticalAlign: 'middle', color: 'var(--color-primary)' }} />
                        You are viewing the trainer console. All course delivery is directly synchronized with the LMS architecture.
                    </p>
                </div>
            </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default TrainerDashboard;
