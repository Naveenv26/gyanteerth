import React, { useState, useEffect } from 'react';
import { 
  Layout, Zap, Clock, Users, BookOpen, Layers, 
  TrendingUp, ArrowUpRight, Plus, Activity,
  ChevronRight, ArrowRight, Shield, Database,
  Calendar, Award
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ADMIN_API } from '../../config';
import { useAuth } from '../../shared/AuthContext';

const StatCard = ({ title, value, icon, color, trend, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="premium-glow-card" 
    style={{ flex: 1, minWidth: '240px' }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
      <div style={{ 
        width: '3.5rem', height: '3.5rem', borderRadius: '1.25rem', 
        backgroundColor: `${color}15`, color: color, 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${color}30`
      }}>
        {icon}
      </div>
      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10b981', fontSize: '0.75rem', fontWeight: 800 }}>
          <TrendingUp size={14} /> <span>+{trend}%</span>
        </div>
      )}
    </div>
    
    <div>
      <div style={{ 
        fontSize: '0.7rem', fontWeight: 950, textTransform: 'uppercase', 
        letterSpacing: '0.12em', color: 'var(--color-text-muted)', marginBottom: '0.5rem' 
      }}>{title}</div>
      <div style={{ fontSize: '2.25rem', fontWeight: 950, letterSpacing: '-0.04em' }}>{value}</div>
    </div>
    
    {/* Tech Detail Overlay */}
    <div style={{ 
      position: 'absolute', bottom: '1rem', right: '1.25rem', 
      fontSize: '0.55rem', opacity: 0.2, fontWeight: 950, fontFamily: 'monospace' 
    }}>
      SYS_NODE_{title.substring(0, 3).toUpperCase()}
    </div>
  </motion.div>
);

const QuickAction = ({ label, icon, onClick, sublabel }) => (
  <button 
    onClick={onClick}
    style={{ 
      display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', 
      padding: '1.25rem', background: 'var(--color-surface)', 
      border: '1px solid var(--color-border)', borderRadius: '1.25rem', 
      cursor: 'pointer', textAlign: 'left', transition: 'all 0.3s' 
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = 'var(--color-primary)';
      e.currentTarget.style.transform = 'translateX(8px)';
      e.currentTarget.style.backgroundColor = 'var(--color-surface-muted)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = 'var(--color-border)';
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.backgroundColor = 'var(--color-surface)';
    }}
  >
    <div style={{ color: 'var(--color-primary)', background: 'var(--color-primary-bg)', padding: '0.75rem', borderRadius: '1rem' }}>
      {icon}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{label}</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{sublabel}</div>
    </div>
    <ArrowUpRight size={18} style={{ opacity: 0.3 }} />
  </button>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [stats, setStats] = useState({
    courses: 0,
    students: 0,
    trainers: 0,
    assessments: 0
  });

  useEffect(() => {
    // We could fetch actual counts here. 
    // For now, let's just use some nice presentation data until we have a counts endpoint.
    const fetchStats = async () => {
      try {
        const res = await fetch(`${ADMIN_API}/get-active-courses`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(s => ({ ...s, courses: data.courses?.length || 0 }));
        }
      } catch (err) {
        console.error("Failed to load metrics");
      }
    };
    fetchStats();
  }, [accessToken]);

  return (
    <div style={{ padding: 'var(--page-padding)', maxWidth: '1600px', margin: '0 auto' }} className="animate-fade-in">
      
      {/* HEADER COMMAND SECTION */}
      <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '2rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
            <Activity size={16} />
            <span style={{ fontSize: '0.7rem', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Real-time Operations</span>
          </div>
          <h1>System Overview</h1>
          <p style={{ margin: 0, maxWidth: '500px' }}>
            Manage core telemetry data, course structures, and ecosystem participants from the central node.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ 
            background: 'var(--color-surface)', border: '1px solid var(--color-border)', 
            padding: '0.75rem 1.25rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' 
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
            <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>LIVE INSTANCE</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>V2.4.0_STABLE</div>
          </div>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        <StatCard title="Total Courses" value={stats.courses} icon={<BookOpen size={24} />} color="#10b981" trend="12" delay={0.1} />
        <StatCard title="Active Learners" value="1,284" icon={<Users size={24} />} color="#3b82f6" trend="8" delay={0.2} />
        <StatCard title="Total Trainers" value="42" icon={<Database size={24} />} color="#f59e0b" trend="4" delay={0.3} />
        <StatCard title="Assessments" value="184" icon={<Award size={24} />} color="#8b5cf6" trend="15" delay={0.4} />
      </div>

      {/* MAIN LAYOUT SPLIT */}
      <div className="grid" style={{ gridTemplateColumns: '1fr 340px', gap: '3rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: ARCADE CONTAINER */}
        <div className="arcade-container" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ margin: 0 }}>Active Evolution Node</h3>
            <button 
              onClick={() => navigate('/admin/courses')}
              className="btn" 
              style={{ padding: '0.5rem 1rem', background: 'var(--color-surface)', fontSize: '0.8rem', border: '1px solid var(--color-border)' }}
            >
              Expansion Protocol <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { title: 'Advanced Full Stack Web Mastery', status: 'live', users: 342, progress: 84 },
              { title: 'Python for Deep Neural Networks', status: 'live', users: 156, progress: 92 },
              { title: 'UI/UX Design Architecture', status: 'draft', users: 0, progress: 0 },
              { title: 'Strategic Product Management', status: 'live', users: 89, progress: 76 }
            ].map((course, i) => (
              <div 
                key={i} 
                style={{ 
                  background: 'var(--color-surface)', padding: '1.25rem', 
                  borderRadius: '1.5rem', border: '1px solid var(--color-border)',
                  display: 'flex', alignItems: 'center', gap: '1.5rem',
                  position: 'relative', overflow: 'hidden'
                }}
              >
                <div style={{ 
                  width: '4rem', height: '4rem', borderRadius: '1rem', 
                  backgroundColor: 'var(--color-surface-muted)', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)'
                }}>
                  <Layers size={20} />
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                    <span className="tech-badge" style={{ 
                      backgroundColor: course.status === 'live' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: course.status === 'live' ? '#10b981' : '#f59e0b',
                    }}>
                      {course.status}
                    </span>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>{course.title}</h4>
                  </div>
                  <div style={{ display: 'flex', gap: '1.25rem' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{course.users} Active Users</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Deployment Stability: {course.progress}%</div>
                  </div>
                </div>

                <div style={{ width: '4px', height: '2rem', background: course.status === 'live' ? '#10b981' : '#f59e0b', borderRadius: '2px' }} />
              </div>
            ))}
          </div>

          {/* Decorative Corner Grid */}
          <div style={{ 
            position: 'absolute', bottom: 10, right: 10, 
            width: '60px', height: '60px',
            backgroundImage: 'radial-gradient(var(--color-border-strong) 1px, transparent 1px)',
            backgroundSize: '8px 8px', opacity: 0.5
          }} />
        </div>

        {/* RIGHT COLUMN: ACTIONS & UTILITIES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="premium-glow-card" style={{ padding: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={16} /> Command Center
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <QuickAction 
                label="Launch New Course" 
                sublabel="Course Construction Protocol"
                icon={<Plus size={18} />} 
                onClick={() => navigate('/admin/courses')} 
              />
              <QuickAction 
                label="Onboard Trainer" 
                sublabel="Human Resource Integration"
                icon={<Users size={18} />} 
                onClick={() => navigate('/admin/users')} 
              />
              <QuickAction 
                label="Sync Assessments" 
                sublabel="Curriculum Validation"
                icon={<Activity size={18} />} 
                onClick={() => navigate('/admin/assessments')} 
              />
            </div>
          </div>

          <div style={{ 
            padding: '1.5rem', background: 'var(--color-surface)', borderRadius: '1.5rem', 
            border: '1px solid var(--color-border)', position: 'relative'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', opacity: 0.5 }}>SYSTEM LOGS</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { time: '14:21', msg: 'Security Check: Passed', color: '#10b981' },
                { time: '12:04', msg: 'Course Node #23 Syncing', color: '#3b82f6' },
                { time: '10:45', msg: 'DB Backup Complete', color: '#8b5cf6' }
              ].map((log, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.65rem', fontFamily: 'monospace' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>[{log.time}]</span>
                  <span style={{ color: log.color, fontWeight: 800 }}>{log.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      <style>{`
        h1 { margin-bottom: 0.5rem; letter-spacing: -0.05em; font-weight: 950; }
        .grid { display: grid; }
        @media (max-width: 1000px) {
          .grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
