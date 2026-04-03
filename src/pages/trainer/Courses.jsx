import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/AuthContext';
import { Book, Loader2, Search, Filter, MoreVertical, LayoutGrid, List as ListIcon, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { ADMIN_API } from '../../config';

const TrainerCourses = () => {
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'

  useEffect(() => {
    const fetchTrainerCourses = async () => {
      if (!accessToken) return;
      
      const headers = { 
        'Authorization': `Bearer ${accessToken}`, 
        'Accept': 'application/json' 
      };

      try {
        const response = await fetch(`${ADMIN_API}/trainer_course_ids`, { headers });
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
                const newCourse = {
                  ...c,
                  course_id: id,
                  course_title: c.course_title || c.title || 'Untitled Course',
                  course_description: c.course_description || c.description || 'No description available for this course.',
                  is_active: c.is_active || false
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
  }, [accessToken]);

  const filteredCourses = courses.filter(course => 
    course.course_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.course_description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', paddingBottom: '10rem' }}>
      
      {/* COMPACT MODERNISED HEADER */}
      <div style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '1.5rem 0' }}>
         <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 var(--page-padding)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--color-primary)', marginBottom: '0.4rem' }}>
                  <Book size={18} /><span style={{ fontSize: '0.65rem', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Trainer Portal</span>
               </div>
               <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 950, letterSpacing: '-0.03em' }}>My Course Repository</h1>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
                  <input 
                    type="text" 
                    placeholder="Search courses..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    style={{ width: 'clamp(200px, 20vw, 300px)', padding: '0.9rem 1.5rem 0.9rem 3.5rem', backgroundColor: 'var(--color-surface-muted)', border: '1px solid var(--color-border)', borderRadius: '1.25rem', fontSize: '1rem', fontWeight: 650, outline: 'none', color: 'var(--color-text)' }} 
                  />
                </div>
                
                <div style={{ display: 'flex', backgroundColor: 'var(--color-surface-muted)', padding: '0.35rem', borderRadius: '1.25rem', border: '1px solid var(--color-border)' }}>
                  <button onClick={() => setViewMode('grid')} style={{ padding: '0.6rem 0.85rem', borderRadius: '0.9rem', border: 'none', background: viewMode === 'grid' ? 'var(--color-surface)' : 'transparent', color: viewMode === 'grid' ? 'var(--color-primary)' : 'var(--color-text-light)', cursor: 'pointer', transition: 'all 0.3s' }}><LayoutGrid size={20}/></button>
                  <button onClick={() => setViewMode('list')} style={{ padding: '0.6rem 0.85rem', borderRadius: '0.9rem', border: 'none', background: viewMode === 'list' ? 'var(--color-surface)' : 'transparent', color: viewMode === 'list' ? 'var(--color-primary)' : 'var(--color-text-light)', cursor: 'pointer', transition: 'all 0.3s' }}><ListIcon size={20}/></button>
                </div>
            </div>
         </div>
      </div>


      {loading ? (
        <div style={{ padding: '10rem 0', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1.5rem' }}>
           <Loader2 size={40} className="animate-spin" color="var(--color-primary)" />
           <p style={{ fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>Loading your courses...</p>
        </div>
      ) : (
        <div className="arcade-container" style={{ 
          backgroundColor: 'var(--color-surface-muted)', 
          padding: '2.5rem', 
          borderRadius: '3.5rem', 
          boxShadow: 'inset 0 10px 40px rgba(0,0,0,0.1)',
          border: '1px solid var(--color-border)',
          minHeight: '600px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle Technical Pattern Overlay for Inset */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.03, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle at 2px 2px, var(--color-text) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          {filteredCourses.length === 0 ? (
            <div style={{ padding: '6rem', textAlign: 'center' }}>
              <Book size={64} style={{ margin: '0 auto 1.5rem', opacity: 0.1 }} />
              <p style={{ color: 'var(--color-text-muted)', fontSize: '1.25rem', fontWeight: 600 }}>No matching courses found in your repository.</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid' : ''} style={{ 
              display: viewMode === 'grid' ? 'grid' : 'flex', 
              flexDirection: viewMode === 'list' ? 'column' : 'unset',
              gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(380px, 1fr))' : 'unset', 
              gap: '1.5rem' 
            }}>
              {filteredCourses.map((course) => (
                <div 
                  key={course.course_id} 
                  className="course-glow-card" 
                  style={{ 
                    padding: viewMode === 'grid' ? '2.5rem' : '2rem', 
                    display: 'flex', 
                    flexDirection: viewMode === 'grid' ? 'column' : 'row',
                    justifyContent: 'space-between', 
                    alignItems: viewMode === 'grid' ? 'flex-start' : 'center', 
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', 
                    borderRadius: '2.5rem', 
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    gap: viewMode === 'grid' ? '2rem' : '0'
                  }}
                >
                  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flex: 1, width: '100%' }}>
                    <div style={{ 
                      width: '80px', 
                      height: '80px', 
                      backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                      color: '#10b981', 
                      borderRadius: '1.5rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      flexShrink: 0
                    }}>
                      <Book size={36} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ margin: '0 0 0.6rem 0', fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-text)', letterSpacing: '-0.03em' }}>
                        {course.course_title}
                      </h3>
                      <p style={{ margin: '0 0 1.25rem 0', color: 'var(--color-text-muted)', fontSize: '1rem', lineHeight: 1.6, maxWidth: '650px', display: '-webkit-box', WebkitLineClamp: viewMode === 'grid' ? 3 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {course.course_description}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        <span style={{ color: '#10b981' }}>● Assigned Course</span>
                        <span style={{ color: 'var(--color-text-muted)' }}>• Type: {course.course_type || 'LMS Course'}</span>
                        <span style={{ color: 'var(--color-text-muted)' }}>• ID: {course.course_id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    alignItems: 'center', 
                    marginLeft: viewMode === 'list' ? '2rem' : '0',
                    marginTop: viewMode === 'grid' ? '1rem' : '0',
                    width: viewMode === 'grid' ? '100%' : 'auto',
                    justifyContent: viewMode === 'grid' ? 'flex-end' : 'unset'
                  }}>
                    <button 
                      onClick={() => navigate(`/manage/course/${course.course_id}`)}
                      className="btn btn-primary" 
                      style={{ padding: '0.9rem 2.5rem', borderRadius: '1.25rem', fontWeight: 950, fontSize: '0.95rem', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.2)' }}
                    >
                      Edit Curriculum
                    </button>
                    <button style={{ color: 'var(--color-text-muted)', padding: '0.8rem', border: 'none', background: 'var(--color-surface-muted)', borderRadius: '1.15rem', cursor: 'pointer' }}>
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <style>{`
        .course-glow-card:hover {
          transform: translateY(-8px) scale(1.01);
          border-color: var(--color-primary) !important;
          box-shadow: 0 15px 45px rgba(2, 6, 23, 0.15); /* Light mode navy */
          background-image: linear-gradient(135deg, transparent 95%, rgba(0,0,0,0.02) 100%), radial-gradient(circle at 2px 2px, rgba(0,0,0,0.01) 1px, transparent 0);
          background-size: 100% 100%, 30px 30px;
        }
        .dark .course-glow-card:hover {
          box-shadow: 0 0 50px rgba(255, 255, 255, 0.15); /* Dark mode white glow */
          background-image: linear-gradient(135deg, transparent 95%, rgba(255,255,255,0.05) 100%), radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0);
        }
        .arcade-container {
          position: relative;
        }
        .arcade-container::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 3.5rem;
          box-shadow: inset 0 0 40px rgba(0,0,0,0.03);
          pointer-events: none;
        }
        .dark .arcade-container {
          background-color: rgba(255,255,255,0.01) !important;
          box-shadow: inset 0 10px 30px rgba(0,0,0,0.5) !important;
          border-color: rgba(255,255,255,0.05) !important;
        }
      `}</style>
    </div>
  );
};

export default TrainerCourses;
