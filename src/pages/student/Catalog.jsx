import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, Star, Clock, BookOpen, Loader2,
  PlayCircle, Users, Award, X, CheckCircle, ChevronRight,
  Zap, Video, Layers
} from 'lucide-react';
import { useEnrollment } from '../../shared/EnrollmentContext';
import { ADMIN_API, STUDENT_API } from '../../config';

/* ── Enrollment Confirmation Modal ── */
function EnrollModal({ course, onConfirm, onCancel }) {
  const isLive = course?.type?.toLowerCase() === 'live';

  const formatPrice = () => {
    if (!course) return 'Free';
    if (course.price?.discount !== undefined && course.price?.discount !== null) return `₹${course.price.discount}`;
    if (course.price?.original) return `₹${course.price.original}`;
    return 'Free';
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem'
    }}>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(15,23,42,0.7)',
          backdropFilter: 'blur(6px)',
          animation: 'fadeIn 0.2s ease'
        }}
      />

      {/* Modal Card */}
      <div style={{
        position: 'relative', zIndex: 1,
        background: 'var(--color-surface)', borderRadius: '1.5rem',
        padding: '0', width: '100%', maxWidth: '480px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
        animation: 'slideUp 0.25s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
        border: '1px solid var(--color-border)'
      }}>
        {/* Header Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%)',
          padding: '2rem 1.75rem 1.75rem',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.4,
            backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(139,92,246,0.5) 0%, transparent 50%)'
          }} />
          <button
            onClick={onCancel}
            style={{
              position: 'absolute', top: '1rem', right: '1rem',
              background: 'rgba(255,255,255,0.1)', border: 'none',
              borderRadius: '50%', width: '32px', height: '32px',
              cursor: 'pointer', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            background: isLive ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
            color: isLive ? '#fca5a5' : '#6ee7b7',
            padding: '0.25rem 0.75rem', borderRadius: '2rem',
            fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', marginBottom: '0.75rem'
          }}>
            {isLive ? '🔴 Live Course' : '🎬 Recorded Course'}
          </div>

          <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.3, marginBottom: '0.5rem', position: 'relative' }}>
            {course.course_title || course.title}
          </h2>

          {course.category_name && (
            <div style={{ color: '#a5b4fc', fontSize: '0.82rem', fontWeight: 600, position: 'relative' }}>
              {course.category_name}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '1.75rem' }}>
          {/* Course highlights */}
          <div style={{
            background: 'var(--color-bg)', borderRadius: '1rem', padding: '1.25rem',
            marginBottom: '1.5rem', border: '1px solid var(--color-border)'
          }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
              What you'll get
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { icon: <Layers size={14} color="#6366f1" />, text: 'Access to all modules & lessons' },
                { icon: <Video size={14} color="#6366f1" />, text: isLive ? 'Live session links + recordings' : 'Video lessons at your pace' },
                { icon: <Award size={14} color="#6366f1" />, text: 'Assessments & certificate' },
                { icon: <Zap size={14} color="#6366f1" />, text: 'Lifetime access' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.875rem', color: 'var(--color-text)' }}>
                  {item.icon}
                  {item.text}
                </div>
              ))}
            </div>
          </div>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', padding: '0 0.25rem' }}>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-text)' }}>{formatPrice()}</div>
              {course.price?.original && course.price?.discount && course.price.discount < course.price.original && (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textDecoration: 'line-through' }}>₹{course.price.original}</div>
              )}
            </div>
            {course.level && (
              <div style={{ background: '#f1f5f9', padding: '0.35rem 0.85rem', borderRadius: '2rem', fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                {course.level}
              </div>
            )}
          </div>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={onConfirm}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white', border: 'none', borderRadius: '0.875rem',
                padding: '1rem', fontWeight: 800, fontSize: '1rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                boxShadow: '0 8px 24px rgba(99,102,241,0.45)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(99,102,241,0.55)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.45)'; }}
            >
              <CheckCircle size={20} /> Yes, Enroll Me!
            </button>
            <button
              onClick={onCancel}
              style={{
                width: '100%', background: 'white', color: '#64748b',
                border: '1px solid #e2e8f0', borderRadius: '0.875rem',
                padding: '0.875rem', fontWeight: 600, fontSize: '0.9rem',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { transform: translateY(24px); opacity:0; } to { transform: none; opacity:1; } }
      `}</style>
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
    <div style={{
      position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
      background: 'var(--color-surface)', borderRadius: '1rem', padding: '1rem 1.5rem',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      border: '1px solid var(--color-border)',
      display: 'flex', alignItems: 'center', gap: '0.875rem',
      animation: 'slideInRight 0.35s cubic-bezier(0.4,0,0.2,1)',
      maxWidth: '360px'
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #10b981, #059669)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <CheckCircle size={22} color="white" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, color: '#065f46', fontSize: '0.9rem' }}>Enrolled Successfully! 🎉</div>
        <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.15rem' }}>
          {courseName} added to your learning path
        </div>
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '0.25rem' }}>
        <X size={16} />
      </button>
      <style>{`@keyframes slideInRight { from { transform: translateX(120%); opacity:0; } to { transform: none; opacity:1; } }`}</style>
    </div>
  );
}


/* ── Main Catalog Component ── */
const Catalog = () => {
  const navigate = useNavigate();
  const { enroll, isEnrolled } = useEnrollment();

  const [activeCategory, setActiveCategory] = useState('All');
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [enrollingCourse, setEnrollingCourse] = useState(null);
  const [toast, setToast] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseRes, catRes] = await Promise.all([
          fetch(`${ADMIN_API}/get-active-courses`),
          fetch(`${ADMIN_API}/get-categories`)
        ]);

        if (courseRes.ok) {
          const data = await courseRes.json();
          setCourses(data.courses || []);
        }

        if (catRes.ok) {
          const data = await catRes.json();
          const names = (data.categories || []).map(c => c.Category_Name);
          setCategories(['All', ...names]);
        }
      } catch (err) {
        console.error("Failed to sync catalog", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredCourses = courses.filter(c => {
    const matchesCategory = activeCategory === 'All' || c.category_name === activeCategory;
    const matchesSearch = (c.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleEnrollClick = (e, course) => {
    e.stopPropagation();
    if (isEnrolled(course.id)) {
      // Already enrolled → go directly to player
      navigate(`/student/course/${course.id}`);
      return;
    }
    setEnrollingCourse(course);
  };

  const handleConfirmEnroll = () => {
    if (!enrollingCourse) return;
    enroll(enrollingCourse);
    const name = enrollingCourse.title;
    const id = enrollingCourse.id;
    setEnrollingCourse(null);
    setToast(name);
    // Navigate to course player after short delay
    setTimeout(() => navigate(`/student/course/${id}`), 1000);
  };

  const handleCancelEnroll = () => {
    setEnrollingCourse(null);
  };

  const getTypeColor = (type) => {
    if (!type) return { bg: '#f8f7ff', text: '#6366f1' };
    const t = type.toLowerCase();
    if (t === 'live') return { bg: '#fef2f2', text: '#ef4444' };
    return { bg: '#f0fdf4', text: '#10b981' };
  };

  const formatPrice = (course) => {
    if (!course?.price) return 'Free';
    if (course.price?.discount !== undefined && course.price?.discount !== null) return `₹${course.price.discount}`;
    if (course.price?.original) return `₹${course.price.original}`;
    return 'Free';
  };

  return (
    <div className="animate-fade-in">
      {/* Enrollment Modal */}
      {enrollingCourse && (
        <EnrollModal
          course={enrollingCourse}
          onConfirm={handleConfirmEnroll}
          onCancel={handleCancelEnroll}
        />
      )}

      {/* Success Toast */}
      {toast && (
        <SuccessToast courseName={toast} onClose={() => setToast(null)} />
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Browse Courses</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Discover new skills and enroll in our premium catalog.
          </p>
        </div>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.75rem', marginBottom: 0 }}
            placeholder="Search for courses..."
            className="input-field"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ padding: '8rem 0', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem' }}>
          <Loader2 size={40} className="animate-spin" color="var(--color-primary)" />
          <p style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Loading courses...</p>
        </div>
      )}

      {/* Category Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', border: '1px solid var(--color-border)' }}>
          <Filter size={16} /> Filters
        </button>
        <div style={{ width: '1px', backgroundColor: 'var(--color-border)', margin: '0 0.5rem' }} />
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: '2rem', fontWeight: 500,
              fontSize: '0.875rem', cursor: 'pointer', border: 'none',
              backgroundColor: activeCategory === cat ? 'var(--color-primary)' : '#f1f5f9',
              color: activeCategory === cat ? 'white' : 'var(--color-text)',
              transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Course Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', opacity: loading ? 0.5 : 1 }}>
        {filteredCourses.map(course => {
          const typeStyle = getTypeColor(course.type);
          const enrolled = isEnrolled(course.id);
          const isHovered = hoveredId === course.id;

          return (
            <div
              key={course.id}
              className="card"
              onMouseEnter={() => setHoveredId(course.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => handleEnrollClick(null, course)}
              style={{
                display: 'flex', flexDirection: 'column', padding: '0',
                overflow: 'hidden', cursor: 'pointer',
                transition: 'transform 0.25s, box-shadow 0.25s',
                transform: isHovered ? 'translateY(-4px)' : 'none',
                boxShadow: isHovered ? '0 16px 40px rgba(0,0,0,0.12)' : undefined
              }}
            >
              {/* Thumbnail */}
              <div style={{ height: '160px', backgroundColor: 'var(--color-border)', position: 'relative', overflow: 'hidden' }}>
                <img
                  src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'}
                  alt={course.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s', transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
                  onError={e => { e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'; }}
                />
                {/* Overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 60%)' }} />

                {/* Type badge */}
                <div style={{
                  position: 'absolute', top: '10px', left: '10px',
                  backgroundColor: typeStyle.bg, color: typeStyle.text,
                  padding: '0.25rem 0.75rem', borderRadius: '1rem',
                  fontSize: '0.72rem', fontWeight: 700, backdropFilter: 'blur(4px)',
                  border: `1px solid ${typeStyle.text}30`
                }}>
                  {course.type === 'live' ? '🔴 Live' : '🎬 Recorded'}
                </div>

                {/* Enrolled badge */}
                {enrolled && (
                  <div style={{
                    position: 'absolute', top: '10px', right: '10px',
                    background: 'rgba(16,185,129,0.95)', color: 'white',
                    padding: '0.2rem 0.65rem', borderRadius: '1rem',
                    fontSize: '0.7rem', fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: '0.3rem'
                  }}>
                    <CheckCircle size={11} /> Enrolled
                  </div>
                )}

                {/* Category badge */}
                {!enrolled && course.category_name && (
                  <div style={{
                    position: 'absolute', top: '10px', right: '10px',
                    backgroundColor: 'rgba(255,255,255,0.95)', padding: '0.25rem 0.75rem',
                    borderRadius: '1rem', fontSize: '0.72rem', fontWeight: 600,
                    color: 'var(--color-primary-dark)'
                  }}>
                    {course.category_name}
                  </div>
                )}
              </div>

              {/* Content */}
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                {/* Rating */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#f59e0b', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                  <Star size={14} fill="currentColor" /> 4.5
                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 400, fontSize: '0.8rem' }}>(0 reviews)</span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem', lineHeight: 1.4 }}>{course.title}</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                  {course.type}
                </p>

                <div style={{ marginTop: 'auto' }}>
                  {/* Meta */}
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
                    {course.duration && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={14} /> {course.duration}
                      </div>
                    )}
                    {course.level && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <BookOpen size={14} /> {course.level}
                      </div>
                    )}
                  </div>

                  {/* Price + Action */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                        {formatPrice(course)}
                      </span>
                      {course.price?.original && course.price?.discount && course.price.discount < course.price.original && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textDecoration: 'line-through' }}>
                          ₹{course.price.original}
                        </div>
                      )}
                    </div>

                    <button
                      className={enrolled ? "btn" : "btn btn-primary"}
                      onClick={(e) => { e.stopPropagation(); handleEnrollClick(e, course); }}
                      style={{
                        padding: '0.5rem 1.1rem', fontSize: '0.875rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: '0.35rem',
                        ...(enrolled
                          ? { background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', border: 'none', borderRadius: '0.5rem' }
                          : {})
                      }}
                    >
                      {enrolled ? (
                        <><PlayCircle size={15} /> Continue</>
                      ) : (
                        <>Enroll Now <ChevronRight size={14} /></>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && filteredCourses.length === 0 && (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <BookOpen size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
          <p>No courses matching your criteria were found.</p>
        </div>
      )}
    </div>
  );
};

export default Catalog;
