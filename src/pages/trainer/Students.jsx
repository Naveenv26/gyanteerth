import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../shared/AuthContext';
import { Search, Mail, BookOpen, TrendingUp, Filter, Users, Loader2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ADMIN_API, TRAINER_API } from '../../config';

const TrainerStudents = () => {
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
  const [progressFilter, setProgressFilter] = useState('All'); // All, Completed, InProgress, NotStarted

  const fetchStudents = useCallback(async () => {
    const identifier = user?.user_id || user?.id || user?.email;
    if (!identifier) return;
    
    setLoading(true);

    try {
      // 1. Fetch Assigned Course IDs securely (SWR enabled)
      const data = await smartFetch(`${TRAINER_API}/trainer_course_ids`, {
         cacheKey: `trainer_course_ids_${identifier}`
      });
      const ids = data?.course_ids || [];
      
      // 3. Concurrent Data Fetching (Fixes N+1 Loop)
      const fetchPromises = ids.map(async (id) => {
        const [cData, pData] = await Promise.all([
          smartFetch(`${ADMIN_API}/course/${id}/full-details`, { cacheKey: `details_${id}` }),
          smartFetch(`${TRAINER_API}/course/${id}/students-progress`, { cacheKey: `st_prog_${id}` })
        ]);

        let courseTitle = (cData?.course?.course_title || cData?.course?.title || `Course ID: ${id}`);

        let courseStudents = [];
        if (pData) {
          courseStudents = (pData.data || []).map((st, index) => ({
            id: `${id}-${st.user_id || index}`,
            course_id: id,
            course_title: courseTitle,
            email: st.email || st.user_id,
            name: st.user_name || 'Anonymous Student',
            progress: st.progress_percentage || 0,
            completed_modules: st.completed_modules,
            total_modules: st.total_modules
          }));
        }
        
        return { courseId: id, courseTitle, students: courseStudents };
      });

      const results = await Promise.all(fetchPromises);
      
      // 4. Flatten and Extract Data (No deduplication, as per user request to see 'both')
      const allEnrollments = results.flatMap(r => r.students);
      const coursesList = results
        .filter(r => r.students.length > 0)
        .map(r => ({ id: r.courseId, title: r.courseTitle }));

      const finalStudents = allEnrollments.sort((a, b) => b.progress - a.progress);
      
      setStudents(finalStudents);
      setAvailableCourses(coursesList);
    } catch (err) {
      console.error("Sync failure", err);
    } finally {
      setLoading(false);
    }
  }, [user, smartFetch]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // 5. Memoized Smart Filtering
  const filteredStudents = useMemo(() => {
    return students.filter(st => {
      // Search Filter
      const q = searchQuery.toLowerCase();
      const matchesSearch = (st.name || '').toLowerCase().includes(q) || (st.email || '').toLowerCase().includes(q);
      
      // Course Filter
      const matchesCourse = courseFilter === 'All' || st.course_id === courseFilter;
      
      // Progress Filter
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
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Student Roster</h1>
          <p style={{ margin: 0, maxWidth: '500px', fontSize: '1.05rem', color: '#64748b', fontWeight: 500 }}>
             Manage and track the progress of all students enrolled in your knowledge nodes.
          </p>
        </div>
        
        {/* FILTERS */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
             <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
             <input 
               type="text" 
               placeholder="Search students..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               style={{ width: '260px', padding: '0.85rem 1rem 0.85rem 3rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '1.25rem', fontSize: '0.95rem', fontWeight: 600, outline: 'none', color: '#0f172a', transition: 'border-color 0.2s', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }} 
               onFocus={e => e.target.style.borderColor = '#4f46e5'}
               onBlur={e => e.target.style.borderColor = '#e2e8f0'}
             />
          </div>

          <div style={{ position: 'relative' }}>
            <select 
              value={courseFilter} 
              onChange={(e) => setCourseFilter(e.target.value)}
              style={{ appearance: 'none', padding: '0.85rem 2.5rem 0.85rem 1.25rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '1.25rem', fontSize: '0.9rem', fontWeight: 700, color: '#475569', outline: 'none', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}
            >
              <option value="All">All Courses</option>
              {availableCourses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          </div>

          <div style={{ position: 'relative' }}>
            <select 
              value={progressFilter} 
              onChange={(e) => setProgressFilter(e.target.value)}
              style={{ appearance: 'none', padding: '0.85rem 2.5rem 0.85rem 1.25rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '1.25rem', fontSize: '0.9rem', fontWeight: 700, color: '#475569', outline: 'none', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}
            >
              <option value="All">All Progress</option>
              <option value="Completed">Completed (100%)</option>
              <option value="InProgress">In Progress (1-99%)</option>
              <option value="NotStarted">Not Started (0%)</option>
            </select>
            <Filter size={14} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          </div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '1.5rem', overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
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
                     <Users size={56} color="#cbd5e1" style={{ margin: '0 auto 1.5rem auto' }} />
                     <p style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b' }}>No students found.</p>
                     <p style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500, marginTop: '0.5rem' }}>Try adjusting your search or filter criteria.</p>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filteredStudents.map((st, i) => (
                    <motion.tr 
                      key={st.id} 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: Math.min(i * 0.05, 0.5) }}
                      style={{ borderBottom: i === filteredStudents.length - 1 ? 'none' : '1px solid #f1f5f9', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    >
                      <td style={{ padding: '1.5rem 2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ 
                            width: '3rem', height: '3rem', borderRadius: '1rem', 
                            backgroundColor: '#eef2ff', color: '#4f46e5',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.1rem'
                          }}>
                            {(st.name || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>{st.name || st.username}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginTop: '0.2rem' }}>
                              <Mail size={12} /> {st.email.length > 25 ? st.email.slice(0,25) + '...' : st.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1.5rem 2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b', fontSize: '0.9rem', fontWeight: 700 }}>
                          <BookOpen size={16} color="#10b981" /> {st.course_title}
                        </div>
                      </td>
                      <td style={{ padding: '1.5rem 2rem' }}>
                        <div style={{ width: '100%', maxWidth: '200px' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.6rem' }}>
                             <span style={{ color: '#64748b' }}>Status</span>
                             <span style={{ color: st.progress === 100 ? '#10b981' : '#4f46e5' }}>{st.progress || 0}%</span>
                           </div>
                           <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '1rem', overflow: 'hidden' }}>
                             <motion.div initial={{ width: 0 }} animate={{ width: `${st.progress || 0}%` }} transition={{ duration: 1 }} style={{ width: `${st.progress || 0}%`, height: '100%', backgroundColor: st.progress === 100 ? '#10b981' : '#4f46e5', borderRadius: '1rem' }} />
                           </div>
                        </div>
                      </td>
                      <td style={{ padding: '1.5rem 2rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                           <button onClick={() => window.location.href = `mailto:${st.email}`} style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.85rem', background: 'white', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', transition: 'all 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.color = '#4f46e5'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}>
                              <Mail size={16} />
                           </button>
                           <button style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.85rem', background: 'white', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', transition: 'all 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.color = '#10b981'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}>
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

export default TrainerStudents;