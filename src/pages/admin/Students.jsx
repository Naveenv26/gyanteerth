import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../shared/AuthContext';
import { Search, Mail, BookOpen, TrendingUp, Filter, Loader2, Users } from 'lucide-react';
import { ADMIN_API, TRAINER_API } from '../../config';

const AdminStudents = () => {
  const { user, accessToken } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStudents = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    
    try {
        const headers = { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' };
        
        // 1. Get Course IDs and Titles from enrollment-stats
        const statsRes = await fetch(`${ADMIN_API}/enrollment-stats`, { headers });
        let courseList = [];
        if (statsRes.ok) {
            const statsData = await statsRes.json();
            courseList = statsData.data || [];
        } else {
            // Fallback directly to ids-by-status 
            const courseRes = await fetch(`${ADMIN_API}/courses/ids-by-status`, { headers });
            if (courseRes.ok) {
                const data = await courseRes.json();
                const { active, draft, inactive } = data.courses || {};
                const ids = [...(active || []), ...(draft || []), ...(inactive || [])];
                courseList = ids.map(id => ({ course_id: id, course_title: 'Enrolled Course' }));
            }
        }
        
        let allStudents = [];
        
        for (const course of courseList) {
            const id = course.course_id || course;
            let title = course.course_title || 'Enrolled Course';
            
            // Fetch Student Progress - This endpoint lives in the Trainer Service
            let progressData = null;
            try {
                const pRes = await fetch(`${TRAINER_API}/course/${id}/students-progress`, { headers });
                if (pRes.ok) {
                    progressData = await pRes.json();
                }
            } catch(e) {
                console.error(`Error fetching progress for course ${id}:`, e);
            }

            if (progressData && progressData.data) {
                const sData = progressData.data || [];
                const mappedStudents = sData.map((st, index) => ({
                    id: `${id}-${st.user_id}-${index}`, // Unique key
                    email: st.email || st.user_id, // Use actual email if available
                    name: st.user_name || 'Anonymous Student',
                    progress: st.progress_percentage || 0,
                    course_title: title,
                    completed_modules: st.completed_modules,
                    total_modules: st.total_modules
                }));
                allStudents = [...allStudents, ...mappedStudents];
            }
        }
        
        // Remove duplicates if the same student is in multiple courses? The roster is usually per enrollment.
        setStudents(allStudents.sort((a,b) => b.progress - a.progress));
    } catch(err) {
        console.error("Failed to fetch students roster:", err);
    } finally {
        setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const filteredStudents = students.filter(st => 
    (st.name || st.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (st.course_title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto', padding: 'var(--page-padding)' }}>
      
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--color-primary)', marginBottom: '0.15rem' }}>
              <Users size={14} /><span style={{ fontSize: '0.65rem', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Platform Analytics</span>
           </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '0.5rem' }}>Global Student Roster</h1>
          <p style={{ margin: 0, maxWidth: '500px', fontSize: '1rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
             Manage and track the progress of all students currently enrolled across the platform.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
             <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
             <input 
               type="text" 
               placeholder="Search students or courses..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               style={{ width: '280px', padding: '0.75rem 1rem 0.75rem 2.85rem', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '1rem', fontSize: '0.9rem', fontWeight: 600, outline: 'none' }} 
             />
          </div>
          <button className="btn btn-secondary" style={{ padding: '0.75rem 1.25rem', borderRadius: '1rem', fontSize: '0.85rem' }}>
            <Filter size={16} /> Filter
          </button>
        </div>
      </div>

      <div className="premium-card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
            <thead style={{ backgroundColor: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
              <tr style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                <th style={{ padding: '1.5rem 2rem', fontWeight: 900 }}>Student Name</th>
                <th style={{ padding: '1.5rem 2rem', fontWeight: 900 }}>Course</th>
                <th style={{ padding: '1.5rem 2rem', fontWeight: 900 }}>Learning Progress</th>
                <th style={{ padding: '1.5rem 2rem', fontWeight: 900, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" style={{ padding: '8rem', textAlign: 'center' }}>
                     <Loader2 className="animate-spin" style={{ margin: '0 auto 1.25rem auto' }} size={32} color="var(--color-primary)" />
                     <p style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>SYNCING ENROLLMENT RECORDS...</p>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '8rem', textAlign: 'center' }}>
                     <Users size={56} style={{ margin: '0 auto 1.5rem auto', opacity: 0.1 }} />
                     <p style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-text-muted)' }}>No students found matching your criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st, i) => (
                  <tr key={st.id || i} style={{ borderBottom: i === filteredStudents.length - 1 ? 'none' : '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '1.5rem 2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ 
                          width: '2.75rem', height: '2.75rem', borderRadius: '1rem', 
                          backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950, fontSize: '1.1rem', border: '1px solid var(--color-primary)15'
                        }}>
                          {(st.name || 'S').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: 'var(--color-text)', fontSize: '1rem' }}>{st.name || st.username}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                            <Mail size={13} style={{ opacity: 0.7 }} /> {st.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem 2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text)', fontSize: '0.9rem', fontWeight: 700 }}>
                        <BookOpen size={16} style={{ color: 'var(--color-primary)', opacity: 0.7 }} /> {st.course_title || 'Enrolled Course'}
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem 2rem' }}>
                      <div style={{ width: '100%', maxWidth: '200px' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                           <span style={{ color: 'var(--color-text-muted)' }}>Overall Progress</span>
                           <span style={{ color: 'var(--color-primary)' }}>{st.progress || 0}%</span>
                         </div>
                         <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-bg)', borderRadius: '1rem', overflow: 'hidden' }}>
                           <div style={{ width: `${st.progress || 0}%`, height: '100%', backgroundColor: 'var(--color-primary)', borderRadius: '1rem' }} />
                         </div>
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem 2rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                         <button onClick={() => window.location.href = `mailto:${st.email}`} style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.85rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>
                            <Mail size={16} />
                         </button>
                         <button style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.85rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>
                            <TrendingUp size={16} />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminStudents;
