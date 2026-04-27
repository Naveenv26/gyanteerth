import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../shared/AuthContext';
import { Search, Mail, BookOpen, TrendingUp, Filter, Users, Loader2, ChevronDown, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ADMIN_API, TRAINER_API } from '../../config';

const AdminStudents = () => {
  const { user, smartFetch } = useAuth();
  const [students, setStudents] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ── Skeleton Loader ── */
  const TableSkeleton = () => (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ display: 'flex', padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', gap: '2rem', alignItems: 'center' }}>
          <div style={{ flex: 1.5, display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '1rem', background: '#f1f5f9', animation: 'pulse 1.5s infinite ease-in-out' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
               <div style={{ height: '16px', width: '60%', background: '#f1f5f9', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }} />
               <div style={{ height: '12px', width: '40%', background: '#f1f5f9', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }} />
            </div>
          </div>
          <div style={{ flex: 1 }}><div style={{ height: '16px', width: '80%', background: '#f1f5f9', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }} /></div>
          <div style={{ flex: 1 }}><div style={{ height: '24px', width: '100%', background: '#f1f5f9', borderRadius: '8px', animation: 'pulse 1.5s infinite ease-in-out' }} /></div>
          <div style={{ flex: 0.5, display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '0.85rem', background: '#f1f5f9', animation: 'pulse 1.5s infinite ease-in-out' }} />
          </div>
        </div>
      ))}
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('All');
  const [progressFilter, setProgressFilter] = useState('All'); 

  const fetchStudents = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    try {
        // 1. Get Course IDs and Titles from enrollment-stats securely cached
        const statsData = await smartFetch(`${ADMIN_API}/enrollment-stats`, { cacheKey: 'admin_enrollment_stats', forceRefresh: true });
        let courseList = statsData?.data || [];
        
        if (courseList.length === 0) {
            // Fallback directly to ids-by-status 
            const courseData = await smartFetch(`${ADMIN_API}/courses/ids-by-status`, { cacheKey: 'admin_course_ids', forceRefresh: true });
            if (courseData) {
                const { active, draft, inactive } = courseData.courses || {};
                const ids = [...(active || []), ...(draft || []), ...(inactive || [])];
                courseList = ids.map(id => ({ course_id: id, course_title: 'Enrolled Course' }));
            }
        }
        
        // 2. Concurrent Fetching of Progress for all courses
        const progressPromises = courseList.map(async (course) => {
            const id = course.course_id || course;
            let title = course.course_title || 'Enrolled Course';
            
            // Try to get progress data from Trainer endpoint, applying Smart Fetch for caching
            try {
                const progressData = await smartFetch(`${TRAINER_API}/course/${id}/students-progress`, { cacheKey: `st_prog_${id}`, forceRefresh: true });
                if (progressData && progressData.data) {
                    const sData = progressData.data || [];
                    return sData.map((st, index) => ({
                        id: `${id}-${st.user_id || index}`,
                        course_id: id,
                        email: st.email || st.user_id, 
                        name: st.user_name || 'Anonymous Student',
                        progress: st.progress_percentage || 0,
                        course_title: title,
                        completed_modules: st.completed_modules,
                        total_modules: st.total_modules
                    }));
                }
            } catch(e) {
                console.error(`Error fetching progress for course ${id}:`, e);
            }
            return [];
        });

        const progressResults = await Promise.all(progressPromises);
        const allStudents = progressResults.flat();
        
        // Setup dropdown available courses with student counts
        const clist = courseList.map(c => {
           const id = c.course_id;
           const count = allStudents.filter(s => s.course_id === id).length;
           return { id, title: c.course_title, count };
        }).filter(c => c.count > 0);

        setStudents(allStudents.sort((a,b) => b.progress - a.progress));
        setAvailableCourses(clist);
    } catch(err) {
        console.error("Failed to fetch students roster:", err);
    } finally {
        setLoading(false);
    }
  }, [user, smartFetch]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const filteredStudents = useMemo(() => {
    return students.filter(st => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = (st.name || '').toLowerCase().includes(q) || (st.email || '').toLowerCase().includes(q) || (st.course_title || '').toLowerCase().includes(q);
      const matchesCourse = courseFilter === 'All' || st.course_id === courseFilter;
      
      let matchesProgress = true;
      if (progressFilter === 'Completed') matchesProgress = st.progress === 100;
      else if (progressFilter === 'InProgress') matchesProgress = st.progress > 0 && st.progress < 100;
      else if (progressFilter === 'NotStarted') matchesProgress = st.progress === 0;

      return matchesSearch && matchesCourse && matchesProgress;
    });
  }, [students, searchQuery, courseFilter, progressFilter]);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '4rem' }}>
      
      {/* ── Page Header ── */}
      {/* ── Domain Navigation (Categories) ── */}
      <div style={{ display: 'flex', gap: '0.85rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }} className="no-scrollbar">
         <button 
           onClick={() => setCourseFilter('All')}
           style={{ 
             padding: '0.5rem 1rem', borderRadius: '1rem', 
             border: courseFilter === 'All' ? '1px solid transparent' : '1px solid var(--color-border)', 
             backgroundColor: courseFilter === 'All' ? 'var(--color-primary)' : 'var(--color-surface)', 
             color: courseFilter === 'All' ? 'white' : 'var(--color-text)', 
             fontWeight: 850, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
             boxShadow: courseFilter === 'All' ? 'var(--shadow-md)' : 'none',
             display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap'
           }}
         >
           <Globe size={14} /> Global Catalog
           <span style={{ background: courseFilter === 'All' ? 'rgba(255,255,255,0.2)' : 'var(--color-surface-muted)', color: courseFilter === 'All' ? 'white' : 'var(--color-text-muted)', padding: '0.1rem 0.5rem', borderRadius: '0.5rem', fontSize: '0.7rem' }}>{students.length}</span>
         </button>
         {availableCourses.map(c => (
            <button 
              key={c.id}
              onClick={() => setCourseFilter(c.id)}
              style={{ 
                padding: '0.5rem 1rem', borderRadius: '1rem', 
                border: courseFilter === c.id ? '1px solid transparent' : '1px solid var(--color-border)', 
                backgroundColor: courseFilter === c.id ? 'var(--color-primary)' : 'var(--color-surface)', 
                color: courseFilter === c.id ? 'white' : 'var(--color-text)', 
                fontWeight: 850, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                boxShadow: courseFilter === c.id ? 'var(--shadow-md)' : 'none',
                display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap'
              }}
            >
              <BookOpen size={14} /> {c.title}
              <span style={{ background: courseFilter === c.id ? 'rgba(255,255,255,0.2)' : 'var(--color-surface-muted)', color: courseFilter === c.id ? 'white' : 'var(--color-text-muted)', padding: '0.1rem 0.5rem', borderRadius: '0.5rem', fontSize: '0.7rem' }}>{c.count}</span>
            </button>
         ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--color-primary)', marginBottom: '0.35rem' }}>
              <Users size={14} /><span style={{ fontSize: '0.65rem', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Platform Analytics</span>
           </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.02em', color: 'var(--color-text)' }}>Global Student Roster</h1>
          <p style={{ margin: 0, maxWidth: '500px', fontSize: '1.05rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
             Manage and track the progress of all students enrolled across the platform ecosystem.
          </p>
        </div>
        
        {/* SECONDARY FILTERS (Search & Progress) */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
             <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
             <input 
               type="text" 
               placeholder="Search students..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               style={{ width: '260px', padding: '0.85rem 1rem 0.85rem 3rem', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '1.25rem', fontSize: '0.9rem', fontWeight: 650, outline: 'none', color: 'var(--color-text)', transition: 'border-color 0.2s', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }} 
             />
          </div>

          <div style={{ position: 'relative' }}>
             <select 
               value={progressFilter} 
               onChange={(e) => setProgressFilter(e.target.value)}
               style={{ appearance: 'none', padding: '0.85rem 2.85rem 0.85rem 1.25rem', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '1.25rem', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text)', outline: 'none', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', minWidth: '160px' }}
             >
               <option value="All">All Progress</option>
               <option value="Completed">Completed (100%)</option>
               <option value="InProgress">In Progress (1-99%)</option>
               <option value="NotStarted">Not Started (0%)</option>
             </select>
             <Filter size={14} style={{ position: 'absolute', right: '1.15rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--color-surface)', borderRadius: '1.5rem', overflow: 'hidden', border: '1px solid var(--color-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
            <thead style={{ backgroundColor: 'var(--color-surface-muted)', borderBottom: '1px solid var(--color-border)' }}>
              <tr style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                <th style={{ padding: '1.5rem 2rem', fontWeight: 900 }}>Student Profile</th>
                <th style={{ padding: '1.5rem 2rem', fontWeight: 900 }}>Enrolled Course</th>
                <th style={{ padding: '1.5rem 2rem', fontWeight: 900 }}>Learning Progress</th>
                <th style={{ padding: '1.5rem 2rem', fontWeight: 900, textAlign: 'right' }}>Contact</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ padding: 0 }}><TableSkeleton /></td></tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '8rem', textAlign: 'center' }}>
                     <Users size={56} style={{ color: 'var(--color-text-muted)', margin: '0 auto 1.5rem auto', opacity: 0.3 }} />
                     <p style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-text)' }}>No students found matching your criteria.</p>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                   {filteredStudents.map((st, i) => (
                     <motion.tr 
                       key={st.id}
                       initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: Math.min(i * 0.05, 0.5) }}
                       style={{ borderBottom: i === filteredStudents.length - 1 ? 'none' : '1px solid var(--color-border)', transition: 'background 0.2s' }}
                     >
                       <td style={{ padding: '1.5rem 2rem' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                           <div style={{ 
                             width: '3rem', height: '3rem', borderRadius: '1rem', 
                             backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary)',
                             display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.1rem',
                             border: '1px solid rgba(16,185,129,0.1)'
                           }}>
                             {(st.name || 'S').charAt(0).toUpperCase()}
                           </div>
                           <div>
                             <div style={{ fontWeight: 800, color: 'var(--color-text)', fontSize: '1rem' }}>{st.name || st.username}</div>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, marginTop: '0.2rem' }}>
                               <Mail size={12} /> {st.email.length > 25 ? st.email.slice(0,25) + '...' : st.email}
                             </div>
                           </div>
                         </div>
                       </td>
                       <td style={{ padding: '1.5rem 2rem' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text)', fontSize: '0.9rem', fontWeight: 700 }}>
                           <BookOpen size={16} style={{ color: 'var(--color-primary)', opacity: 0.8 }} /> {st.course_title}
                         </div>
                       </td>
                       <td style={{ padding: '1.5rem 2rem' }}>
                         <div style={{ width: '100%', maxWidth: '200px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.6rem' }}>
                              <span style={{ color: 'var(--color-text-muted)' }}>Status</span>
                              <span style={{ color: st.progress === 100 ? 'var(--color-primary)' : '#4f46e5' }}>{st.progress || 0}%</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-bg)', borderRadius: '1rem', overflow: 'hidden' }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${st.progress || 0}%` }} transition={{ duration: 1 }} style={{ width: `${st.progress || 0}%`, height: '100%', backgroundColor: st.progress === 100 ? 'var(--color-primary)' : '#4f46e5', borderRadius: '1rem' }} />
                            </div>
                         </div>
                       </td>
                       <td style={{ padding: '1.5rem 2rem', textAlign: 'right' }}>
                         <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => window.location.href = `mailto:${st.email}`} style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.85rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', transition: 'all 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}>
                               <Mail size={16} />
                            </button>
                            <button style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.85rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', transition: 'all 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}>
                               <TrendingUp size={16} />
                            </button>
                         </div>
                       </td>
                     </motion.tr>
                   ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminStudents;
