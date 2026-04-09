import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/AuthContext';
import { Book, Loader2, Search, Filter, MoreVertical, LayoutGrid, List as ListIcon, ShieldCheck, BookOpen, PlayCircle, Layers, Users, BarChart2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { ADMIN_API, TRAINER_API } from '../../config';

const TrainerCourses = () => {
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchTrainerCourses = async () => {
      if (!accessToken) return;
      
      const headers = { 
        'Authorization': `Bearer ${accessToken}`, 
        'Accept': 'application/json' 
      };

      try {
        const response = await fetch(`${TRAINER_API}/trainer_course_ids`, { headers });
        if (response.ok) {
          const data = await response.json();
          const ids = data.course_ids || [];
          
          setCourses([]);
          setLoading(false);

          for (const id of ids) {
            try {
              const res = await fetch(`${ADMIN_API}/course/${id}/full-details`, { headers });
              if (res.ok) {
                const detailData = await res.json();
                const c = detailData.course || detailData;
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
                  }
                } catch(e) {
                  console.error("Progress fetch issue", e);
                }

                const newCourse = {
                  ...c,
                  course_id: id,
                  course_title: c.course_title || c.title || 'Untitled Course',
                  course_description: c.course_description || c.description || 'No description available for this course.',
                  is_active: c.is_active || false,
                  avgProgress: avgProgress,
                  studentCount: studentCount
                };
                setCourses(prev => {
                  if (prev.some(pc => pc.course_id === id)) return prev;
                  return [...prev, newCourse];
                });
              }
            } catch (e) {
              console.error(`Failed to fetch details for node ${id}`, e);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch trainer repository", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrainerCourses();
  }, [accessToken, user?.user_id]);

  const filteredCourses = courses.filter(course => 
    course.course_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.course_description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeColor = (type) => {
    if (!type) return { bg: '#f8f7ff', text: '#6366f1', label: 'Recorded' };
    const t = type.toLowerCase();
    if (t === 'live' || t === 'live_course' || t === 'live session') return { bg: '#fef2f2', text: '#ef4444', label: 'Live' };
    return { bg: '#f0fdf4', text: '#10b981', label: 'Recorded' };
  };

  return (
    <div className="animate-fade-in" style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', paddingBottom: '6rem' }}>
      
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--color-text)', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
            Course Repository
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', fontWeight: 500 }}>
            Management interface for your assigned knowledge nodes and student delivery metrics.
          </p>
        </div>
        
        <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input 
            type="text" 
            placeholder="Search nodes..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            style={{ width: '300px', padding: '0.75rem 1rem 0.75rem 2.75rem', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '1rem', fontSize: '0.9rem', fontWeight: 600, outline: 'none', color: 'var(--color-text)' }} 
            />
        </div>
      </div>


      {loading ? (
        <div style={{ padding: '8rem 0', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1.25rem' }}>
           <Loader2 size={40} className="animate-spin" color="var(--color-primary)" />
           <p style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-text-muted)', letterSpacing: '0.1em' }}>SYNCHRONIZING CURRICULUM...</p>
        </div>
      ) : (
        <div>
          {filteredCourses.length === 0 ? (
            <div style={{ padding: '6rem', textAlign: 'center', background: 'var(--color-surface)', borderRadius: '2rem', border: '1px solid var(--color-border)' }}>
              <BookOpen size={48} style={{ margin: '0 auto 1.25rem', opacity: 0.1 }} />
              <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', fontWeight: 600 }}>No active courses found in your assigned repository.</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
              gap: '2rem'
            }}>
              {filteredCourses.map((course) => {
                const typeStyle = getTypeColor(course.course_type || course.type);
                return (
                  <motion.div 
                    key={course.course_id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ translateY: -8 }}
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      borderRadius: '1.5rem', 
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{ height: '180px', position: 'relative', overflow: 'hidden' }}>
                      <img 
                        src={course.thumbnail || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80`} 
                        alt={course.course_title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)' }} />
                      
                      <div style={{
                        position: 'absolute', top: '12px', left: '12px',
                        background: typeStyle.bg, color: typeStyle.text,
                        padding: '0.35rem 0.85rem', borderRadius: '2rem',
                        fontSize: '0.75rem', fontWeight: 800, backdropFilter: 'blur(8px)',
                        border: `1px solid ${typeStyle.text}20`
                      }}>
                        {typeStyle.label}
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1.3 }}>
                        {course.course_title}
                      </h3>
                      
                      <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Users size={14} color="var(--color-primary)" /> {course.studentCount} Students
                        </span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <BarChart2 size={14} color="#10b981" /> {course.level || 'Intermediate'}
                        </span>
                      </div>

                      <div style={{ marginTop: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                          <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Avg. Engagement</span>
                          <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>{course.avgProgress}%</span>
                        </div>
                        <div style={{ width: '100%', background: 'var(--color-bg)', height: '8px', borderRadius: '99px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                          <div style={{
                            width: `${course.avgProgress}%`,
                            background: 'linear-gradient(90deg, var(--color-primary), #3b82f6)',
                            height: '100%', borderRadius: '99px'
                          }} />
                        </div>

                        <button 
                          onClick={() => navigate(`/trainer/course/${course.course_id}`)}
                          className="btn btn-primary" 
                          style={{ width: '100%', padding: '0.85rem', borderRadius: '1rem', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        >
                          <PlayCircle size={20} /> View Course Content
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrainerCourses;
