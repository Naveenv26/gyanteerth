import { Award, Download, Share2, ShieldCheck, ChevronRight, Zap } from 'lucide-react';
import Logo from '../../components/Logo';
import { motion } from 'framer-motion';

const Certificates = () => {
  const certificates = [
    {
      id: 'CERT-2023-8941',
      course: 'Full Stack Development Masterclass',
      date: 'Aug 12, 2023',
      grade: '98%',
      instructor: 'Arul Jayaraj',
      thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400'
    }
  ];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      
      {/* ── Page Header ── */}
      <div style={{ marginBottom: '3.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#f0fdf4', color: '#10b981', padding: '0.4rem 1rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
          <Zap size={14} fill="#10b981" /> Verified Achievement
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
          My <span style={{ color: '#059669' }}>Certificates</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: 500, maxWidth: '600px' }}>
          Your journey of excellence, documented and verifiable. Showcase your skills to the world.
        </p>
      </div>

      {certificates.length === 0 ? (
        <div style={{ padding: '6rem 2rem', background: 'white', borderRadius: '2.5rem', border: '2px dashed #e2e8f0', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', background: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Award size={40} color="#cbd5e1" />
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e293b' }}>No Certificates Yet</h3>
          <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Complete any course to earn your first verifiable credential.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '2.5rem' }}>
          {certificates.map(cert => (
            <motion.div 
              key={cert.id}
              whileHover={{ y: -8 }}
              style={{ 
                background: 'white', 
                borderRadius: '2.5rem', 
                overflow: 'hidden', 
                border: '1px solid #f1f5f9',
                boxShadow: '0 4px 25px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              
              {/* Certificate Preview Mockup */}
              <div style={{ 
                padding: '3rem 2rem', 
                backgroundColor: '#fff', 
                borderBottom: '1.5px solid #f8fafc', 
                backgroundImage: 'radial-gradient(circle at 70% 20%, #f0fdf4 0%, #ffffff 80%)',
                position: 'relative'
              }}>
                <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', opacity: 0.05 }}><Award size={120} /></div>
                
                <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}><Logo scale={0.7} /></div>
                  <div style={{ width: '60px', height: '2px', background: '#10b981', margin: '0 auto 1.5rem', borderRadius: '10px' }} />
                  
                  <h4 style={{ margin: '0 0 1rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.7rem', fontWeight: 800 }}>Certificate of Excellence</h4>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: '0 0 1.5rem', lineHeight: 1.2 }}>{cert.course}</h2>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p style={{ margin: 0, fontSize: '1rem', color: '#1e293b', fontWeight: 700 }}>This is to certify that you have successfully completed</p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>the professional program with a grade of <strong>{cert.grade}</strong></p>
                  </div>
                </div>
              </div>

              {/* Actions & Meta */}
              <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Issued Date</div>
                      <div style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 800 }}>{cert.date}</div>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>ID Number</div>
                      <div style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 800 }}>{cert.id}</div>
                   </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button style={{ flex: 1, background: '#111827', color: 'white', border: 'none', padding: '1rem', borderRadius: '1.25rem', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', boxShadow: '0 10px 20px rgba(17, 24, 39, 0.2)' }}>
                    <Download size={18} /> Download PDF
                  </button>
                  <button style={{ width: '56px', height: '56px', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#f97316', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#fff7ed'} onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}>
                    <Share2 size={20} />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '1rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid #f1f5f9' }}>
                   <ShieldCheck size={18} color="#10b981" />
                   <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Verify this achievement at <span style={{ color: '#059669', cursor: 'pointer' }}>gyanteerth.com/verify</span></span>
                </div>
              </div>

            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Certificates;
