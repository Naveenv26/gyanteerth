import { useAuth } from '../../shared/AuthContext';
import { useEnrollment } from '../../shared/EnrollmentContext';
import { BookOpen, Award, Clock, PlayCircle, ChevronRight, Zap, Video, Calendar, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { enrolledCourses, getCourseProgress } = useEnrollment();

  const enrolledWithProgress = enrolledCourses.map(c => ({
    ...c,
    currentProgress: getCourseProgress(c.id || c.course_id)
  }));

  const totalCompleted = enrolledWithProgress.filter(c => c.currentProgress === 100).length;
  const inProgress = enrolledWithProgress.filter(c => c.currentProgress > 0 && c.currentProgress < 100).length;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      
      {/* ── Welcome Hero ── */}
      <div style={{ 
        background: 'linear-gradient(135deg, #065f46 0%, #059669 100%)', 
        borderRadius: '2.5rem', 
        padding: '3.5rem 3rem',
        marginBottom: '3rem',
        position: 'relative',
        overflow: 'hidden',
        color: 'white',
        boxShadow: '0 25px 50px -12px rgba(6, 95, 70, 0.25)'
      }}>
        {/* Decorative elements */}
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
        
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.15)', padding: '0.4rem 1rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <Zap size={14} fill="#fbbf24" color="#fbbf24" /> Success Focused
            </div>
            <h1 style={{ fontSize: '3.25rem', fontWeight: 900, marginBottom: '0.75rem', letterSpacing: '-0.03em', color: 'white' }}>
              Welcome back, <span style={{ color: '#fbbf24' }}>{user?.firstName || user?.name || 'Learner'}</span>! 👋
            </h1>
            <p style={{ fontSize: '1.2rem', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500, maxWidth: '550px', lineHeight: 1.6 }}>
              You're making great progress. Continue your learning journey and unlock new professional opportunities.
            </p>
            
            <div style={{ display: 'flex', gap: '1.25rem', marginTop: '2.5rem' }}>
              <button 
                onClick={() => navigate('/student/courses')} 
                style={{ 
                  background: '#f97316', color: 'white', border: 'none', padding: '1.1rem 2.5rem', borderRadius: '1.25rem', 
                  fontWeight: 900, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', 
                  boxShadow: '0 12px 30px rgba(249, 115, 22, 0.35)', transition: 'all 0.2s' 
                }}
              >
                 Resume Learning <ArrowRight size={20} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
             <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', borderRadius: '1.5rem', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.15)', textAlign: 'center', minWidth: '140px' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fbbf24' }}>{totalCompleted}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed</div>
             </div>
             <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', borderRadius: '1.5rem', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.15)', textAlign: 'center', minWidth: '140px' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900 }}>{inProgress}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>In Progress</div>
             </div>
          </div>
        </div>
      </div>

      {/* ── Main Dashboard Content ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '2.5rem', flexWrap: 'wrap' }}>
        
        {/* Left Column: Learning Continuity */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
               <PlayCircle size={26} color="#f97316" /> Pick up where you left off
            </h2>
            <Link to="/student/courses" style={{ fontSize: '0.9rem', color: '#059669', fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              View All <ChevronRight size={16} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {enrolledWithProgress.length === 0 ? (
              <div style={{ padding: '4rem 2rem', background: 'white', borderRadius: '2rem', border: '2px dashed #e2e8f0', textAlign: 'center' }}>
                <BookOpen size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>No active enrollments</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.5rem' }}>Explore our catalog to start your learning journey.</p>
                <button onClick={() => navigate('/student/browse')} style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', border: 'none', background: '#059669', color: 'white', fontWeight: 800, cursor: 'pointer' }}>Browse Courses</button>
              </div>
            ) : (
              enrolledWithProgress.slice(0, 3).map(course => (
                <div 
                  key={course.course_id || course.id} 
                  onClick={() => navigate(`/student/course/${course.id || course.course_id}`)}
                  style={{ 
                    padding: '1.5rem', background: 'white', borderRadius: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem',
                    cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', border: '1px solid #f1f5f9',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#10b98122'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.06)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.02)'; }}
                >
                  <div style={{ width: '100px', height: '65px', borderRadius: '1rem', background: '#0f172a', overflow: 'hidden', flexShrink: 0 }}>
                      <img src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{course.title || 'Course Module'}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.75rem' }}>
                      <div style={{ flex: 1, background: '#f1f5f9', height: '6px', borderRadius: '10px', overflow: 'hidden' }}>
                         <motion.div initial={{ width: 0 }} animate={{ width: `${course.currentProgress || 0}%` }} transition={{ duration: 1 }} style={{ width: `${course.currentProgress || 0}%`, background: 'linear-gradient(90deg, #10b981, #34d399)', height: '100%', borderRadius: '10px' }} />
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#10b981' }}>{course.currentProgress || 0}%</span>
                    </div>
                  </div>
                  <div style={{ width: '48px', height: '48px', background: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #f1f5f9', color: '#f97316' }}>
                     <ArrowRight size={20} />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Right Column: Community & Support */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Live Classes Card */}
          <div style={{ background: '#0f172a', borderRadius: '2.5rem', padding: '2.5rem', color: 'white', position: 'relative', overflow: 'hidden' }}>
             <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
             
             <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                   <div style={{ padding: '0.6rem', background: 'rgba(255,255,255,0.1)', borderRadius: '0.75rem' }}><Video size={20} color="#f97316" /></div>
                   <h3 style={{ fontSize: '1.25rem', fontWeight: 900 }}>Live Learning</h3>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>No live sessions scheduled for today. Check your curriculum for upcoming events.</p>
                <button style={{ width: '100%', background: 'white', color: '#0f172a', border: 'none', padding: '1rem', borderRadius: '1.25rem', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }}>View Schedule</button>
             </div>
          </div>

          {/* Quick Stats Card */}
          <div style={{ background: '#f8fafc', borderRadius: '2.5rem', padding: '2.5rem', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
             <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e293b' }}>Learning Activity</h3>
             
             <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '44px', height: '44px', background: 'white', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #f1f5f9' }}><Clock size={20} color="#6366f1" /></div>
                <div>
                   <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>Learning Hours</div>
                   <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>0.0 hrs</div>
                </div>
             </div>

             <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '44px', height: '44px', background: 'white', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #f1f5f9' }}><Award size={20} color="#f59e0b" /></div>
                <div>
                   <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>Certificates</div>
                   <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>{totalCompleted} Earned</div>
                </div>
             </div>
          </div>

        </section>

      </div>
    </div>
  );
};

export default Dashboard;
