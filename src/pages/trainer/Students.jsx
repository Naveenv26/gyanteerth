import { Search, Mail, BookOpen, TrendingUp, Filter, MessageSquare } from 'lucide-react';
import { useState } from 'react';

const TrainerStudents = () => {
  const [students] = useState([
    { id: 'ST-101', name: 'Alka Yagnik', email: 'alka@example.com', course: 'Advanced React Patterns', progress: 75, lastActive: '2 hrs ago' },
    { id: 'ST-102', name: 'Ravi Kumar', email: 'ravi@example.com', course: 'Python for Data Science', progress: 40, lastActive: '1 day ago' },
    { id: 'ST-103', name: 'Test Student', email: 'student@example.com', course: 'Advanced React Patterns', progress: 10, lastActive: 'Just now' },
    { id: 'ST-104', name: 'Sophia Lee', email: 'sophia@example.com', course: 'UI/UX Masterclass', progress: 95, lastActive: '3 days ago' },
  ]);

  return (
    <div className="animate-fade-in" style={{ backgroundColor: 'var(--color-surface-muted)', minHeight: '100vh', padding: 'var(--page-padding)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem' }}>My Enrolled Students</h1>
          <p>Monitor progress and activity for students enrolled in your courses.</p>
        </div>
      </div>

      <div className="arcade-inner" style={{ 
        padding: '0', 
        overflow: 'hidden',
        backgroundColor: 'var(--color-surface)',
        borderRadius: '2.5rem',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ padding: '1.75rem', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '1.25rem', alignItems: 'center', backgroundColor: 'var(--color-surface-muted)' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Search by student name or email..." 
              style={{ paddingLeft: '2.75rem', marginBottom: 0 }}
            />
          </div>
          <button className="btn btn-secondary" style={{ padding: '0.625rem 1rem' }}>
            <Filter size={18} /> Filter by Course
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
              <tr style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Student Profile</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Enrolled Course</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Progress Tracking</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((st, i) => (
                <tr key={st.id} style={{ borderBottom: i === students.length - 1 ? 'none' : '1px solid var(--color-border)', fontSize: '0.95rem' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', backgroundColor: 'var(--color-surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text)', fontWeight: 'bold', fontSize: '0.875rem' }}>
                        {st.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{st.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>
                          <Mail size={12} /> {st.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                      <BookOpen size={16} color="var(--color-primary-dark)" /> {st.course}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                         <span>Completion</span>
                         <span style={{ fontWeight: 600, marginLeft: 'auto' }}>{st.progress}%</span>
                       </div>
                       <div style={{ width: '100%', maxWidth: '150px', backgroundColor: 'var(--color-border)', height: '0.35rem', borderRadius: '1rem', overflow: 'hidden' }}>
                         <div style={{ width: `${st.progress}%`, backgroundColor: st.progress > 80 ? '#10b981' : 'var(--color-primary)', height: '100%' }}></div>
                       </div>
                       <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                         Last tracked: {st.lastActive}
                       </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.5rem', fontSize: '0.875rem' }} title="Send Message">
                        <MessageSquare size={16} /> Contact
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '0.5rem', color: 'var(--color-primary)' }} title="View Detailed Report">
                        <TrendingUp size={16} /> 
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TrainerStudents;
