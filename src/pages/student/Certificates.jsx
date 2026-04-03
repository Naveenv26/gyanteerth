import { Award, Download, Share2 } from 'lucide-react';
import Logo from '../../components/Logo';

const Certificates = () => {
  const certificates = [
    {
      id: 'CERT-2023-8941',
      course: 'JavaScript Fundamentals',
      date: 'Nov 15, 2023',
      grade: '92%',
      instructor: 'Arul Jayaraj'
    }
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>My Certificates</h1>
        <p>View, verify, and download your earned credentials.</p>
      </div>

      {certificates.length === 0 ? (
        <div className="card text-center" style={{ padding: '4rem 2rem' }}>
          <Award size={64} color="var(--color-border)" style={{ margin: '0 auto 1.5rem' }} />
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No Certificates Yet</h3>
          <p>Complete a course to earn your first verifiable certificate.</p>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2rem' }}>
          {certificates.map(cert => (
            <div key={cert.id} className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
              
              {/* Certificate Preview Mockup */}
              <div style={{ 
                padding: '2rem', 
                backgroundColor: '#fff', 
                borderBottom: '1px solid var(--color-border)', 
                backgroundImage: 'radial-gradient(circle at center, #f0fdf4 0%, #ffffff 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '1rem'
              }}>
                <Logo scale={0.8} />
                <div>
                  <h4 style={{ margin: '1rem 0 0.5rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem' }}>Certificate of Completion</h4>
                  <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary-dark)', margin: 0 }}>{cert.course}</h2>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>Awarded to <strong>Test Student</strong></p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Completed on {cert.date} • Grade: {cert.grade}</p>
                </div>
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem', width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                   <span>ID: {cert.id}</span>
                   <span>Verify at gyanteerth.com/verify</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ padding: '1.5rem', display: 'flex', gap: '1rem' }}>
                <button className="btn btn-primary" style={{ flex: 1, padding: '0.625rem' }}>
                  <Download size={18} /> Download PDF
                </button>
                <button className="btn btn-secondary" style={{ padding: '0.625rem' }} title="Share on LinkedIn">
                  <Share2 size={18} />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Certificates;
