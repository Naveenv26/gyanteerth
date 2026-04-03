import { BookOpen, PlayCircle, Clock, Award, Compass, CheckCircle, Layers, Video, Monitor, BarChart2, Zap } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useEnrollment } from '../../shared/EnrollmentContext';

const StudentCourses = () => {
  const [activeTab, setActiveTab] = useState('ongoing');
  const navigate = useNavigate();
  const { enrolledCourses, getCourseProgress } = useEnrollment();

  // Compute live counts
  const { ongoingCourses, completedCourses, inProgressCount, completedCount } = useMemo(() => {
    const ongoing = [];
    const completed = [];
    let inProgress = 0;
    let done = 0;

    enrolledCourses.forEach(course => {
      const prog = getCourseProgress(course.id || course.course_id);
      if (prog === 100) {
        completed.push(course);
        done++;
      } else {
        ongoing.push(course);
        if (prog > 0) inProgress++;
      }
    });

    return { 
      ongoingCourses: ongoing, 
      completedCourses: completed, 
      inProgressCount: inProgress, 
      completedCount: done 
    };
  }, [enrolledCourses, getCourseProgress]);

  const tabs = [
    { id: 'ongoing', label: 'My Learning', count: ongoingCourses.length },
    { id: 'completed', label: 'Completed', count: completedCourses.length },
  ];

  const getTypeColor = (type) => {
    if (!type) return { bg: '#f8f7ff', text: '#6366f1', label: 'Recorded' };
    const t = type.toLowerCase();
    if (t === 'live') return { bg: '#fef2f2', text: '#ef4444', label: 'Live' };
    return { bg: '#f0fdf4', text: '#10b981', label: 'Recorded' };
  };

  const formatEnrolledDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
            My Learning
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>
            {enrolledCourses.length > 0 
              ? `You're enrolled in ${enrolledCourses.length} course${enrolledCourses.length === 1 ? '' : 's'}. Keep the momentum going!`
              : "Start your learning journey today by browsing our top-rated courses."}
          </p>
        </div>
        <button
          onClick={() => navigate('/student/browse')}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem', borderRadius: '1rem', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}
        >
          <Compass size={20} /> Browse Courses
        </button>
      </div>

      {/* ── Stats Summary ── */}
      {enrolledCourses.length > 0 && (
        <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
          {[
            { icon: <Layers size={20} color="#6366f1" />, label: 'Enrolled', value: enrolledCourses.length, bg: '#f5f7ff', border: 'rgba(99,102,241,0.15)' },
            { icon: <PlayCircle size={20} color="#10b981" />, label: 'In Progress', value: inProgressCount, bg: '#f0fdf4', border: 'rgba(16,185,129,0.15)' },
            { icon: <CheckCircle size={20} color="#f59e0b" />, label: 'Completed', value: completedCount, bg: '#fffbeb', border: 'rgba(245,158,11,0.15)' },
            { icon: <Award size={20} color="#8b5cf6" />, label: 'Certificates', value: 0, bg: '#faf5ff', border: 'rgba(139,92,246,0.15)' },
          ].map((stat, i) => (
            <div key={i} style={{
              background: stat.bg, border: `1px solid ${stat.border}`,
              borderRadius: '1.25rem', padding: '1.25rem 1.75rem',
              display: 'flex', alignItems: 'center', gap: '1rem',
              flex: '1 1 200px', minWidth: '180px',
              transition: 'transform 0.2s',
              cursor: 'default'
            }}>
              <div style={{ 
                width: '44px', height: '44px', borderRadius: '12px', background: 'white', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
              }}>
                {stat.icon}
              </div>
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, marginTop: '0.25rem' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--color-border)', marginBottom: '2rem' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.75rem 1.5rem', background: 'transparent', border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
              fontWeight: activeTab === tab.id ? 700 : 500,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
              transition: 'all 0.15s', fontSize: '0.95rem'
            }}
          >
            {tab.label}
            <span style={{
              background: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-border)',
              color: activeTab === tab.id ? 'white' : 'var(--color-text-muted)',
              borderRadius: '1rem', padding: '0.1rem 0.55rem', fontSize: '0.72rem', fontWeight: 700
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'ongoing' && (
        ongoingCourses.length === 0 
          ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5rem 1rem', background: 'white', borderRadius: '1.5rem', border: '1px solid var(--color-border)' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <BookOpen size={40} color="#cbd5e1" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>No courses in progress</h3>
              <p style={{ color: '#94a3b8', textAlign: 'center', maxWidth: '340px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Explore our catalog to find your next course and start learning!
              </p>
              <button
                onClick={() => navigate('/student/browse')}
                className="btn btn-primary"
                style={{ borderRadius: '0.875rem', padding: '0.75rem 1.75rem' }}
              >
                Start Browsing
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
              {ongoingCourses.map(course => {
                const cid = course.id || course.course_id;
                const typeStyle = getTypeColor(course.type);
                const progress = getCourseProgress(cid);
                
                return (
                  <div
                    key={cid}
                    className="card"
                    style={{ display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer', border: '1px solid rgba(0,0,0,0.05)' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = ''; }}
                    onClick={() => navigate(`/student/course/${cid}`)}
                  >
                    {/* Thumbnail */}
                    <div style={{ height: '180px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                      <img
                        src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80'}
                        alt={course.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
                      />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />

                      <div style={{
                        position: 'absolute', top: '12px', left: '12px',
                        background: typeStyle.bg, color: typeStyle.text,
                        padding: '0.25rem 0.75rem', borderRadius: '2rem',
                        fontSize: '0.7rem', fontWeight: 800, backdropFilter: 'blur(8px)',
                        border: `1px solid ${typeStyle.text}25`
                      }}>
                        {typeStyle.label}
                      </div>

                      <div style={{
                        position: 'absolute', top: '12px', right: '12px',
                        background: 'rgba(16,185,129,0.95)', color: 'white',
                        padding: '0.25rem 0.75rem', borderRadius: '2rem',
                        fontSize: '0.7rem', fontWeight: 800,
                        display: 'flex', alignItems: 'center', gap: '0.35rem'
                      }}>
                        <CheckCircle size={12} /> ENROLLED
                      </div>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.4, marginBottom: '0.5rem' }}>
                        {course.title}
                      </h3>

                      <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <BarChart2 size={13} color="#6366f1" /> {course.level || 'Beginner'}
                        </span>
                        {course.enrolledAt && (
                          <span style={{ color: '#94a3b8' }}>
                            • {formatEnrolledDate(course.enrolledAt)}
                          </span>
                        )}
                      </div>

                      <div style={{ marginTop: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.5rem' }}>
                          <span style={{ color: '#64748b', fontWeight: 600 }}>Progress</span>
                          <span style={{ fontWeight: 800, color: progress > 0 ? '#6366f1' : '#94a3b8' }}>
                            {progress}%
                          </span>
                        </div>
                        <div style={{ width: '100%', background: '#f1f5f9', height: '8px', borderRadius: '99px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                          <div style={{
                            width: `${progress}%`,
                            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                            height: '100%', borderRadius: '99px', transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                          }} />
                        </div>
                        <p style={{ fontSize: '0.72rem', color: progress === 0 ? '#94a3b8' : '#6366f1', fontWeight: 600 }}>
                          {progress === 0 ? 'Not started yet' : progress === 100 ? 'Course Completed!' : `${progress}% Complete`}
                        </p>
                      </div>

                      <button
                        className="btn btn-primary"
                        style={{ marginTop: '1.5rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 800, borderRadius: '0.875rem' }}
                      >
                        <PlayCircle size={18} />
                        {progress === 0 ? 'Start Learning' : 'Continue Course'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
      )}

      {/* ── Completed Tab Content ── */}
      {activeTab === 'completed' && (
        completedCourses.length === 0 
          ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5rem 1rem', background: 'white', borderRadius: '1.5rem', border: '1px solid var(--color-border)' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <Award size={40} color="#f59e0b" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>No certificates yet</h3>
              <p style={{ color: '#94a3b8', textAlign: 'center', maxWidth: '340px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Complete your courses to 100% and earn your professional certifications!
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
              {completedCourses.map(course => (
                  <div key={course.id} className="card" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', border: '2px solid #f0fdf4' }}>
                     <CheckCircle size={32} color="#10b981" />
                     <div style={{ flex: 1 }}>
                        <h4 style={{ fontWeight: 800, color: '#0f172a' }}>{course.title}</h4>
                        <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Finished successfully! 🎉</p>
                     </div>
                     <button className="btn" style={{ background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 700 }}>
                       Certificate
                     </button>
                  </div>
              ))}
            </div>
          )
      )}
    </div>
  );
};

export default StudentCourses;
