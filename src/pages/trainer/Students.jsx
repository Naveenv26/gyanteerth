import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../shared/AuthContext';
import { Search, Mail, BookOpen, TrendingUp, Filter, MessageSquare, Loader2, User, ShieldCheck, Activity, Users } from 'lucide-react';
import { ADMIN_API } from '../../config';

const TrainerStudents = () => {
  const { user, accessToken } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStudents = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    
    // Setting Mock data as backend student API is not finished
    setTimeout(() => {
        setStudents([
            { id: 1, name: 'Arjun Sharma', email: 'arjun@example.com', progress: 85, course_title: 'Full Stack Development' },
            { id: 2, name: 'Priya Patel', email: 'priya@example.com', progress: 42, course_title: 'Advanced Java' },
            { id: 3, name: 'Rahul Varma', email: 'rahul@example.com', progress: 100, course_title: 'Python for AI' },
            { id: 4, name: 'Sneha Rao', email: 'sneha@example.com', progress: 12, course_title: 'Full Stack Development' },
            { id: 5, name: 'Karthik S', email: 'karthik@example.com', progress: 67, course_title: 'Data Structures' },
            { id: 6, name: 'Ananya Gupta', email: 'ananya@example.com', progress: 95, course_title: 'Advanced Java' },
            { id: 7, name: 'Vikram Singh', email: 'vikram@example.com', progress: 54, course_title: 'Python for AI' }
        ]);
        setLoading(false);
    }, 800);
  }, [user?.user_id, accessToken]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const filteredStudents = students.filter(st => 
    (st.name || st.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto', padding: 'var(--page-padding)' }}>
      
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '0.5rem' }}>Student Roster</h1>
          <p style={{ margin: 0, maxWidth: '500px', fontSize: '1rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
             Manage and track the progress of all students enrolled in your knowledge nodes.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
             <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
             <input 
               type="text" 
               placeholder="Search students..." 
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
                     <p style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>SYNCING CLASSROOM DATA...</p>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '8rem', textAlign: 'center' }}>
                     <Users size={56} style={{ margin: '0 auto 1.5rem auto', opacity: 0.1 }} />
                     <p style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-text-muted)' }}>No students found in the roster.</p>
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
                          {(st.name || 'S').charAt(0)}
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

export default TrainerStudents;
