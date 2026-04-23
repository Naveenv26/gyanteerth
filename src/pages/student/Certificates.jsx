import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Award, ShieldCheck, Zap, Info, Download, Trash2, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../shared/AuthContext';
import { useEnrollment } from '../../shared/EnrollmentContext';
import CertificateGenerator from '../../components/CertificateGenerator';

const Certificates = () => {
  const { user } = useAuth();
  const { enrolledCourses, getCourseProgress } = useEnrollment();
  const [selectedCert, setSelectedCert] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadFn, setDownloadFn] = useState(null);

  const handleDownloadReady = React.useCallback((fn) => {
    setDownloadFn(() => fn);
  }, []);

  // 🎓 Identify completed courses (100% progress)
  const earnedCertificates = useMemo(() => {
    const raw = enrolledCourses || [];
    return raw
      .filter(c => getCourseProgress(c.id || c.course_id) === 100)
      .map(c => ({
        id: `GT-${(c.id || c.course_id).toString().slice(-4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        courseId: c.id || c.course_id,
        courseTitle: c.title || c.course_title || 'Professional Certification',
        earnedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        thumbnail: c.thumbnail || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400',
        category: c.category_name || 'Technical'
      }));
  }, [enrolledCourses, getCourseProgress]);

  const filteredCerts = earnedCertificates.filter(c => 
    c.courseTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      
      {/* ── Page Header ── */}
      <div style={{ marginBottom: '3.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.4rem 1rem', borderRadius: '1rem', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <Zap size={12} fill="#10b981" /> Academic Achievements
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 950, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: '0.5rem', lineHeight: 1 }}>
            Verified <span style={{ color: '#059669' }}>Certificates</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 500, maxWidth: '500px', lineHeight: 1.5 }}>
            Documents of excellence. You've mastered these domains through dedication and consistency.
          </p>
        </div>

        {/* Search Bar */}
        {earnedCertificates.length > 0 && (
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search achievements..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '1rem 1rem 1rem 3.25rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '1.25rem', fontSize: '0.95rem', fontWeight: 600, outline: 'none', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }} 
            />
          </div>
        )}
      </div>

      {earnedCertificates.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ padding: '8rem 2rem', background: 'white', borderRadius: '3.5rem', border: '2px dashed #e2e8f0', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.02)' }}
        >
          <div style={{ width: '100px', height: '100px', background: '#f8fafc', borderRadius: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', border: '1px solid #f1f5f9' }}>
            <Award size={48} color="#cbd5e1" strokeWidth={1.5} />
          </div>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1e293b', marginBottom: '1rem' }}>No Certificates Earned Yet</h3>
          <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
            Finish a course to 100% completion to unlock your professional certification and verify your skills to recruiters.
          </p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ padding: '1.1rem 3rem', borderRadius: '1.25rem', background: '#059669', color: 'white', fontWeight: 900, fontSize: '1rem', border: 'none', cursor: 'pointer', boxShadow: '0 15px 30px rgba(5, 150, 105, 0.25)' }}
          >
            Explore Courses
          </motion.button>
        </motion.div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
          {filteredCerts.map((cert, idx) => (
            <motion.div 
              key={cert.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -10 }}
              style={{ 
                background: 'white', 
                borderRadius: '2.5rem', 
                overflow: 'hidden', 
                border: '1px solid #f1f5f9',
                boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
              }}
            >
              {/* Badge Overlay */}
              <div style={{ position: 'absolute', top: '2rem', right: '2rem', zIndex: 10, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', width: '50px', height: '50px', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #f1f5f9', boxShadow: '0 8px 20px rgba(0,0,0,0.05)' }}>
                <ShieldCheck size={24} color="#059669" />
              </div>
              
              {/* Visual Preview Section - Compacted */}
              <div style={{ height: '140px', position: 'relative', overflow: 'hidden' }}>
                <img src={cert.thumbnail} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Course View" />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)' }} />
                <div style={{ position: 'absolute', bottom: '1.25rem', left: '1.5rem', right: '1.5rem' }}>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.3rem' }}>{cert.category} Certification</div>
                  <h2 style={{ color: 'white', margin: 0, fontSize: '1.1rem', fontWeight: 900, lineHeight: 1.2 }}>{cert.courseTitle}</h2>
                </div>
              </div>

              {/* Data & Action Section - Compacted */}
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderBottom: '1px solid #f8fafc', paddingBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Issued Date</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>{cert.earnedDate}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', textAlign: 'right' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>ID</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', fontFamily: 'monospace' }}>{cert.id.split('-').pop()}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <motion.button 
                    whileHover={{ scale: 1.02, backgroundColor: '#000' }}
                    onClick={() => setSelectedCert(cert)}
                    style={{ 
                      flex: 1, background: '#0f172a', color: 'white', border: 'none', 
                      padding: '0.9rem', borderRadius: '1.25rem', fontWeight: 900, 
                      fontSize: '0.85rem', cursor: 'pointer', display: 'flex', 
                      alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                      boxShadow: '0 8px 15px rgba(15, 23, 42, 0.15)' 
                    }}
                  >
                    View & Download <Download size={16} />
                  </motion.button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.8rem', background: '#f0fdf4', borderRadius: '0.85rem' }}>
                   <Award size={14} color="#059669" />
                   <span style={{ fontSize: '0.7rem', color: '#065f46', fontWeight: 700 }}>Verified Asset</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Dynamic PDF Generation Modal ── */}
      {createPortal(
        <AnimatePresence>
          {selectedCert && (
            <div style={{ 
              position: 'fixed', 
              inset: 0, 
              backgroundColor: 'rgba(15, 23, 42, 0.4)', 
              backdropFilter: 'blur(10px)', // Added global blur on portal
              WebkitBackdropFilter: 'blur(10px)',
              zIndex: 999999, // Ensure it's on top of sidebar and everything
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: '2rem' 
            }}>
              {/* Top-right controls: Download + Close */}
              <div style={{ 
                position: 'absolute', top: '1.5rem', right: '1.5rem', 
                display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 100000 
              }}>
                <button 
                  onClick={() => downloadFn && downloadFn()}
                  style={{ 
                    padding: '0.7rem 1.5rem', borderRadius: '0.75rem',
                    background: '#059669', color: 'white', border: 'none', 
                    cursor: 'pointer', fontWeight: 900, fontSize: '0.85rem',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    boxShadow: '0 10px 30px rgba(5, 150, 105, 0.4)',
                    transition: 'all 0.2s', opacity: downloadFn ? 1 : 0.5
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  <Download size={16} /> Download PDF
                </button>
                <button 
                  onClick={() => { setSelectedCert(null); setDownloadFn(null); }}
                  style={{ 
                    width: '46px', height: '46px', borderRadius: '50%', 
                    background: 'white', border: 'none', cursor: 'pointer', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontWeight: 900, fontSize: '1.5rem', boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                    color: '#1a1a1a', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  ×
                </button>
              </div>
              <motion.div 
                key="certificate-modal"
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 40 }}
                style={{ 
                  position: 'relative', 
                  maxHeight: '90vh', 
                  backgroundColor: 'transparent',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  overflowY: 'auto'
                }}
                className="no-scrollbar"
              >
                
                <CertificateGenerator 
                  courseId={selectedCert.courseId}
                  onDownload={handleDownloadReady}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

    </div>
  );
};

export default Certificates;

