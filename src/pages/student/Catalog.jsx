import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Star, Clock, Loader2,
  Award, X, CheckCircle,
  Zap, Video, Layers, ArrowRight
} from 'lucide-react';
import { useEnrollment } from '../../shared/EnrollmentContext';
import { useAuth } from '../../shared/AuthContext';
import { ADMIN_API } from '../../config';
import { motion, AnimatePresence } from 'framer-motion';

const CACHE_KEY = 'lms_catalog_cache_v2';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/* ── Skeleton Loader ── */
const CourseSkeleton = () => (
  <div style={{ background: 'white', borderRadius: '2.5rem', overflow: 'hidden', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', height: '420px' }}>
    <div style={{ height: '200px', background: '#e2e8f0', animation: 'pulse 1.5s infinite ease-in-out' }} />
    <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ height: '20px', width: '30%', background: '#f1f5f9', borderRadius: '1rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
      <div style={{ height: '28px', width: '90%', background: '#f1f5f9', borderRadius: '0.5rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
      <div style={{ height: '28px', width: '60%', background: '#f1f5f9', borderRadius: '0.5rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', paddingTop: '1.5rem', borderTop: '1.5px solid #f8fafc' }}>
        <div style={{ height: '30px', width: '40%', background: '#f1f5f9', borderRadius: '0.5rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
        <div style={{ height: '40px', width: '30%', background: '#f1f5f9', borderRadius: '1.25rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
      </div>
    </div>
    <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
  </div>
);

/* ── Enrollment Confirmation Modal ── */
function EnrollModal({ course, onConfirm, onCancel }) {
  const typeLower = (course?.type || course?.course_type || course?.course_Type || 'recorded').toLowerCase();
  const isLive = typeLower === 'live' || typeLower === 'live_course' || typeLower === 'live session';

  const formatPrice = () => {
    if (!course) return 'Free';
    if (course.price?.discount !== undefined && course.price?.discount !== null) return `₹${course.price.discount}`;
    if (course.price?.original) return `₹${course.price.original}`;
    return 'Free';
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      {/* Optimized Backdrop */}
      <div onClick={onCancel} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(5px)', willChange: 'transform' }} />

      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} style={{ position: 'relative', zIndex: 1, background: 'white', borderRadius: '2.5rem', width: '100%', maxWidth: '500px', boxShadow: '0 32px 80px rgba(0,0,0,0.4)', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
        <div style={{ background: 'linear-gradient(135deg, #065f46 0%, #059669 100%)', padding: '2.5rem 2rem', position: 'relative', color: 'white' }}>
          <button onClick={onCancel} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}><X size={16} /></button>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.2)', padding: '0.3rem 0.8rem', borderRadius: '2rem', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1rem' }}>{isLive ? '🔴 Live Program' : '🎬 Pro Course'}</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, lineHeight: 1.3, margin: 0 }}>{course.title}</h2>
        </div>

        <div style={{ padding: '2rem' }}>
          <div style={{ background: '#f8fafc', borderRadius: '1.5rem', padding: '1.5rem', marginBottom: '2rem', border: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 900, color: '#059669', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>Inclusions</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { icon: <Layers size={16} color="#059669" />, text: 'Full curriculum access' },
                { icon: <Video size={16} color="#059669" />, text: isLive ? 'Live interactive sessions' : 'Recorded masterclasses' },
                { icon: <Award size={16} color="#059669" />, text: 'Industry recognized certificate' },
                { icon: <Zap size={16} color="#059669" />, text: 'Lifetime platform access' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', color: '#1e293b', fontWeight: 600 }}>{item.icon} {item.text}</div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a' }}>{formatPrice()}</div>
              {course.price?.original && <div style={{ fontSize: '0.85rem', color: '#94a3b8', textDecoration: 'line-through' }}>₹{course.price.original}</div>}
            </div>
            <div style={{ padding: '0.5rem 1rem', background: '#f1f5f9', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>{course.level || 'Advanced'}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button onClick={onConfirm} style={{ width: '100%', background: '#f97316', color: 'white', border: 'none', borderRadius: '1.25rem', padding: '1.1rem', fontWeight: 900, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', boxShadow: '0 10px 25px rgba(249, 115, 22, 0.3)', transition: 'transform 0.1s' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>Confirm Enrollment <ArrowRight size={20} /></button>
            <button onClick={onCancel} style={{ width: '100%', background: 'white', color: '#64748b', border: '1.5px solid #f1f5f9', borderRadius: '1.25rem', padding: '1rem', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer' }}>I'll decide later</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Success Toast ── */
function SuccessToast({ courseName, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }} style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999, background: 'white', borderRadius: '1.5rem', padding: '1.25rem 2rem', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '1rem', maxWidth: '400px' }}>
      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle size={22} color="#10b981" /></div>
      <div>
        <div style={{ fontWeight: 900, color: '#065f46', fontSize: '1rem' }}>Success! 🎉</div>
        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>Enrolled in {courseName}</div>
      </div>
    </motion.div>
  );
}

const Catalog = () => {
  const navigate = useNavigate();
  const { enroll, isEnrolled } = useEnrollment();
  const { user, authFetch } = useAuth();

  const [activeCategory, setActiveCategory] = useState('All');
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [enrollingCourse, setEnrollingCourse] = useState(null);
  const [toast, setToast] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    const fetchCatalog = async () => {
      if (!user) return;

      // 1. Check Local Cache
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          setCategories(data.categories);
          setCourses(data.courses);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      
      try {
        const [catRes, statusRes] = await Promise.all([
          authFetch(`${ADMIN_API}/get-categories`),
          authFetch(`${ADMIN_API}/courses/ids-by-status`)
        ]);

        let finalCategories = ['All'];
        let rawCats = [];
        if (catRes.ok) {
          const catData = await catRes.json();
          rawCats = catData.categories || catData.data || catData || [];
          const names = rawCats.map(c => c.Category_Name || c.name || c.category_name || c.Title || 'Other');
          finalCategories = ['All', ...new Set(names.filter(Boolean))];
          setCategories(finalCategories);
        }

        let finalCourses = [];
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          const activeIds = statusData.courses?.active || [];
          
          const courseDetails = await Promise.all(activeIds.map(async (id) => {
            try {
              const res = await authFetch(`${ADMIN_API}/course/${id}/full-details`);
              if (res.ok) {
                const data = await res.json();
                const c = data.course || data.data || data;
                
                // Enhanced Category Mapping
                let catName = c.category_name || c.Category_Name || c.Category;
                if (!catName && (c.category_id || c.Category_ID || c.Course_Category_ID)) {
                  const cid = c.category_id || c.Category_ID || c.Course_Category_ID;
                  const match = rawCats.find(rc => (rc.Category_ID || rc.id || rc.Category_id) === cid);
                  if (match) catName = match.Category_Name || match.name || match.category_name || match.Title;
                }

                return {
                  ...c,
                  id: c.course_id || c.Course_id || c.Course_ID || id,
                  title: c.course_title || c.title || c.Course_Title || 'Untitled',
                  thumbnail: c.thumbnail || c.Thumbnail || c.course_thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
                  category_name: catName || 'Mastery',
                  type: (c.course_type || c.course_Type || c.Course_Type || c.type || 'recorded').toLowerCase(),
                  level: c.level || c.Level || 'Intermediate'
                };
              }
            } catch (e) { console.error(`Failed to fetch details for ${id}`, e); }
            return null;
          }));
          
          finalCourses = courseDetails.filter(Boolean);
          setCourses(finalCourses);
        }

        // Save to Cache
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          timestamp: Date.now(),
          data: { categories: finalCategories, courses: finalCourses }
        }));

      } catch (err) { 
        console.error("Catalog sync error", err); 
      } finally { 
        setLoading(false); 
      }
    };
    
    fetchCatalog();
  }, [user, authFetch]);

  // Memoize filtering for performance
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const normalize = (s) => (s || '').trim().toLowerCase();
      const matCat = activeCategory === 'All' || normalize(c.category_name) === normalize(activeCategory);
      const matSch = (c.title || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matCat && matSch;
    });
  }, [courses, activeCategory, searchQuery]);

  const handleEnrollClick = (e, course) => {
    e?.stopPropagation();
    if (isEnrolled(course.id)) { navigate(`/student/course/${course.id}`); return; }
    setEnrollingCourse(course);
  };

  const handleConfirmEnroll = () => {
    if (!enrollingCourse) return;
    enroll(enrollingCourse);
    const { title, id } = enrollingCourse;
    setEnrollingCourse(null);
    setToast(title);
    setTimeout(() => navigate(`/student/course/${id}`), 1000);
  };

  const getStatusStyle = (type) => {
    const t = type.toLowerCase();
    const isL = t === 'live' || t === 'live_course' || t === 'live session';
    return { bg: isL ? '#fee2e2' : '#f0fdf4', color: isL ? '#ef4444' : '#10b981', label: isL ? 'LIVE' : 'RECORDED' };
  };

  const formatPrice = (course) => {
    if (!course?.price) return 'Free';
    const disc = course.price?.discount !== undefined ? course.price.discount : course.price.discount_price;
    if (disc !== undefined && disc !== null) return `₹${disc}`;
    if (course.price?.original) return `₹${course.price.original}`;
    return 'Free';
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      <AnimatePresence>
        {enrollingCourse && <EnrollModal course={enrollingCourse} onConfirm={handleConfirmEnroll} onCancel={() => setEnrollingCourse(null)} />}
        {toast && <SuccessToast courseName={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3.5rem', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
            Elevate Your <span style={{ color: '#059669' }}>Horizon</span> 🚀
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: 500, maxWidth: '600px' }}>
            Discover industry-expert programs tailored for your professional growth.
          </p>
        </div>
        <div style={{ position: 'relative', width: '360px' }}>
          <Search size={20} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '1.1rem 1.1rem 1.1rem 3.5rem', borderRadius: '1.5rem', border: '2px solid #e2e8f0', background: 'white', fontSize: '1rem', fontWeight: 600, outline: 'none', transition: 'border-color 0.2s' }} onFocus={e => e.target.style.borderColor = '#059669'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} placeholder="Search expertise..." />
        </div>
      </div>

      {/* Categories */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '3rem', overflowX: 'auto', paddingBottom: '1rem', scrollbarWidth: 'none' }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} style={{ padding: '0.85rem 2rem', borderRadius: '1.25rem', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', backgroundColor: activeCategory === cat ? '#111827' : 'white', color: activeCategory === cat ? 'white' : '#64748b', border: activeCategory === cat ? 'none' : '2px solid #f1f5f9', transition: 'all 0.2s', whiteSpace: 'nowrap', boxShadow: activeCategory === cat ? '0 10px 20px rgba(0,0,0,0.1)' : 'none' }}>{cat}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2.5rem' }}>
          {[...Array(6)].map((_, i) => <CourseSkeleton key={i} />)}
        </div>
      ) : (
        <motion.div layout style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2.5rem' }}>
          <AnimatePresence>
            {filteredCourses.map((course, index) => {
              const st = getStatusStyle(course.type);
              const enr = isEnrolled(course.id);
              const isH = hoveredId === course.id;
              
              return (
                <motion.div 
                  key={course.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  onMouseEnter={() => setHoveredId(course.id)} 
                  onMouseLeave={() => setHoveredId(null)} 
                  onClick={() => handleEnrollClick(null, course)} 
                  style={{ background: 'white', borderRadius: '2.5rem', overflow: 'hidden', cursor: 'pointer', border: '1px solid #f1f5f9', boxShadow: isH ? '0 30px 60px rgba(0,0,0,0.1)' : '0 4px 20px rgba(0,0,0,0.02)', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', transform: isH ? 'translateY(-8px)' : 'none', display: 'flex', flexDirection: 'column' }}
                >
                  <div style={{ height: '200px', position: 'relative', overflow: 'hidden', background: '#f8fafc' }}>
                    <img src={course.thumbnail} alt={course.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: isH ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.6s' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 70%)' }} />
                    <div style={{ position: 'absolute', top: '20px', left: '20px', background: st.bg, color: st.color, padding: '0.4rem 0.8rem', borderRadius: '1rem', fontSize: '0.65rem', fontWeight: 950, letterSpacing: '0.05em', backdropFilter: 'blur(4px)' }}>{st.label}</div>
                    {enr && <div style={{ position: 'absolute', top: '20px', right: '20px', background: '#10b981', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '1rem', fontSize: '0.65rem', fontWeight: 950, display: 'flex', alignItems: 'center', gap: '0.3rem', boxShadow: '0 4px 10px rgba(16,185,129,0.3)' }}><CheckCircle size={12} /> ENROLLED</div>}
                  </div>
                  
                  <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#059669', background: '#ecfdf5', padding: '0.3rem 0.8rem', borderRadius: '0.6rem' }}>{course.category_name || 'Mastery'}</span>
                      <div style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.2rem', marginLeft: 'auto' }}><Star size={14} fill="#f59e0b" /> 4.9+</div>
                    </div>
                    
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', marginBottom: '1.5rem', lineHeight: 1.3, height: '2.6em', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{course.title}</h3>
                    
                    <div style={{ display: 'flex', gap: '1.25rem', color: '#64748b', fontSize: '0.85rem', fontWeight: 700, marginBottom: '2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={16} /> {course.duration || 'Unlimited'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Award size={16} /> {course.level || 'Intermediate'}</div>
                    </div>
                    
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', borderTop: '1.5px solid #f8fafc' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 950, color: '#0f172a' }}>{formatPrice(course)}</div>
                      <button onClick={e => handleEnrollClick(e, course)} style={{ background: enr ? '#111827' : '#f97316', color: 'white', border: 'none', padding: '0.9rem 1.75rem', borderRadius: '1.25rem', fontWeight: 950, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: enr ? '0 10px 20px rgba(17,24,39,0.2)' : '0 10px 20px rgba(249,115,22,0.3)' }}>{enr ? 'Continue' : 'Enroll'}</button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};
export default Catalog;