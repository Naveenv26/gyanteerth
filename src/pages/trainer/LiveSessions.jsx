import { Video, Calendar, Clock, Users, PlusCircle } from 'lucide-react';

const LiveSessions = () => {
  const sessions = [
    {
      id: 1,
      title: 'Q&A: React Context API',
      course: 'Advanced React Patterns',
      date: 'Oct 14, 2023',
      time: '10:00 AM - 11:30 AM',
      attendees: 42,
      status: 'upcoming',
      link: 'https://meet.google.com/abc-defg-hij'
    },
    {
      id: 2,
      title: 'Promises & Async/Await Live Coding',
      course: 'JavaScript Fundamentals',
      date: 'Oct 14, 2023',
      time: '02:00 PM - 03:30 PM',
      attendees: 28,
      status: 'upcoming',
      link: 'https://meet.google.com/xyz-uvwx-aaa'
    },
    {
      id: 3,
      title: 'Intro to Virtual DOM',
      course: 'Advanced React Patterns',
      date: 'Oct 12, 2023',
      time: '11:00 AM - 12:00 PM',
      attendees: 56,
      status: 'completed',
      link: '#'
    }
  ];

  return (
    <div className="animate-fade-in" style={{ backgroundColor: 'var(--color-surface-muted)', minHeight: '100vh', padding: 'var(--page-padding)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem' }}>Live Sessions</h1>
          <p>Schedule and manage your interactive virtual classes.</p>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem' }} onClick={() => alert('Schedule Session Module opening...')}>
          <PlusCircle size={18} /> Schedule Session
        </button>
      </div>

      <div className="arcade-inner" style={{ 
        padding: '0', 
        overflow: 'hidden',
        backgroundColor: 'var(--color-surface)',
        borderRadius: '2.5rem',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
            <tr style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Session Topic</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Schedule</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Students</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session, i) => (
              <tr key={session.id} style={{ borderBottom: i === sessions.length - 1 ? 'none' : '1px solid var(--color-border)', fontSize: '0.95rem' }}>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.25rem' }}>{session.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{session.course}</div>
                </td>
                <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <Calendar size={14} /> {session.date}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                    <Clock size={14} /> {session.time}
                  </div>
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)' }}>
                    <Users size={16} /> {session.attendees} Registered
                  </div>
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: 'var(--radius-full)', 
                    fontSize: '0.75rem', 
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    backgroundColor: session.status === 'upcoming' ? '#f0fdf4' : '#f1f5f9',
                    color: session.status === 'upcoming' ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
                    border: `1px solid ${session.status === 'upcoming' ? 'var(--color-primary-light)' : 'var(--color-border)'}`
                  }}>
                    {session.status}
                  </span>
                </td>
                <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                  {session.status === 'upcoming' ? (
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Edit</button>
                      <a href={session.link} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                         <Video size={16} /> Start
                      </a>
                    </div>
                  ) : (
                    <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>View Recording</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LiveSessions;
