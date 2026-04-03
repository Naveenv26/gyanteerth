import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Plus, Edit, Trash2, CheckCircle2, AlertCircle, 
  BookOpen, Users, Layers, ArrowRight, Loader2, Award, ChevronRight,
  Monitor, Play, FileText, Settings, Layout, Archive, Globe, Clock,
  ArrowLeft, Palette, ShieldCheck, Zap, Save
} from 'lucide-react';
import { useAuth } from '../../shared/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ADMIN_API } from '../../config';
import { CreateCourseModal, EditCourseModal } from '../../components/admin/CourseModals';

const AdminCourses = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlCategoryId = searchParams.get('categoryId');
  
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('draft'); 
  const [activeCategory, setActiveCategory] = useState(urlCategoryId || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const headers = useCallback(() => ({
    'Authorization': `Bearer ${accessToken}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }), [accessToken]);

  const fetchAllData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const catRes = await fetch(`${ADMIN_API}/get-categories`, { headers: headers() });
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.categories || []);
      }

      const statusRes = await fetch(`${ADMIN_API}/courses/ids-by-status`, { headers: headers() });
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        const { active = [], draft = [], inactive = [] } = statusData.courses || {};
        const allMeta = [
          ...active.map(id => ({ id, status: 'active' })),
          ...draft.map(id => ({ id, status: 'draft' })),
          ...inactive.map(id => ({ id, status: 'inactive' }))
        ];

        const detailResults = [];
        for (const meta of allMeta) {
           try {
              const res = await fetch(`${ADMIN_API}/course/${meta.id}/full-details`, { headers: headers() });
              if (res.ok) {
                 const data = await res.json();
                 const c = data.course || data;
                 detailResults.push({
                   ...c,
                   course_id: meta.id,
                   status: meta.status,
                   course_title: c.course_title || c.title || 'Untitled Course',
                   course_description: c.course_description || c.description || 'No description available',
                   thumbnail: c.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'
                 });
               }
           } catch (e) {}
        }
        setCourses(detailResults);
      }
    } catch (err) { showToast('Sync failed', 'error'); }
    finally { setLoading(false); }
  }, [headers, accessToken]);

  const fetchTrainers = useCallback(async () => {
    try {
      const res = await fetch(`${ADMIN_API}/all_trainer`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        const active = data.active_trainer_email || [];
        const inactive = data.inactive_trainer_email || [];
        const process = (list) => list.map(t => {
           const id = Object.keys(t)[0];
           return { id, email: t[id] };
        });
        setTrainers([...process(active), ...process(inactive)]);
      }
    } catch (err) { console.error('Faculty fetch failed'); }
  }, [headers]);

  useEffect(() => { fetchAllData(); fetchTrainers(); }, [fetchAllData, fetchTrainers]);

  const handlePublish = async (courseId) => {
    if (!window.confirm('Mobilize live?')) return;
    setIsPublishing(true);
    try {
      const res = await fetch(`${ADMIN_API}/activate/${courseId}`, { method: 'PUT', headers: headers() });
      if (res.ok) { showToast('Strategic Deployment Successful'); fetchAllData(); setActiveTab('active'); }
      else { const d = await res.json(); showToast(d.detail || d.message || 'Denied', 'error'); }
    } catch (err) { showToast('Sync failed', 'error'); }
    finally { setIsPublishing(false); }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Purge asset?')) return;
    try {
      const res = await fetch(`${ADMIN_API}/delete-course/${courseId}`, { method: 'DELETE', headers: headers() });
      if (res.ok) { showToast('Asset Purged'); fetchAllData(); }
      else showToast('Restricted', 'error');
    } catch (err) { showToast('Sync failed', 'error'); }
  };

  const filteredCourses = courses.filter(c => {
    const matchesStatus = c.status === activeTab;
    const matchesCategory = activeCategory === 'all' || c.category_id === activeCategory;
    const matchesSearch = c.course_title?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const getCount = (status) => courses.filter(c => c.status === status && (activeCategory === 'all' || c.category_id === activeCategory)).length;
  const currentCategoryName = categories.find(bc => bc.Category_ID === activeCategory)?.Category_Name || 'Global Catalog';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-surface-muted)', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text)', paddingBottom: '10rem' }}>
      
      {/* REFINED HEADER */}
      <div style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '1.5rem 2.5rem' }}>
         <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
            <button onClick={() => navigate('/admin/categories')} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--color-text-light)', border: 'none', background: 'none', fontWeight: 800, cursor: 'pointer', marginBottom: '1.5rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em' }} >
               <ArrowLeft size={16} /> Back to Categories
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#f97316', marginBottom: '0.4rem' }}>
                     <BookOpen size={18} /><span style={{ fontSize: '0.65rem', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Course Repository</span>
                  </div>
                  <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 950, letterSpacing: '-0.04em', color: 'var(--color-text)' }}>{currentCategoryName}</h1>
               </div>
               
               <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input type="text" placeholder="Filter architecture..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '280px', padding: '0.65rem 1rem 0.65rem 2.5rem', backgroundColor: 'var(--color-surface-muted)', border: '1px solid var(--color-border)', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: 650, outline: 'none' }} />
                  </div>
                  <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', padding: '0.65rem 1.75rem', borderRadius: '1.15rem', fontWeight: 950, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: 'var(--shadow-md)' }}
                  >
                    <Plus size={16} /> New Artifact
                  </button>
               </div>
            </div>
         </div>
      </div>

      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '2rem 2.5rem' }}>
         <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem' }}>
            <div style={{ display: 'flex', padding: '0.4rem', backgroundColor: 'var(--color-surface-muted)', borderRadius: '1.75rem', border: '1px solid var(--color-border)', gap: '0.4rem' }}>
               <SmallTab active={activeTab === 'draft'} label="Development" count={getCount('draft')} onClick={() => setActiveTab('draft')} icon={<Clock size={12}/>} activeColor="#f97316" />
               <SmallTab active={activeTab === 'active'} label="Live Operation" count={getCount('active')} onClick={() => setActiveTab('active')} icon={<Zap size={12}/>} activeColor="#10b981" />
               <SmallTab active={activeTab === 'inactive'} label="Archives" count={getCount('inactive')} onClick={() => setActiveTab('inactive')} icon={<Archive size={12}/>} activeColor="#64748b" />
            </div>
         </div>

         <div className="arcade-container">
            <div style={{ position: 'absolute', inset: 0, opacity: 0.03, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle at 2px 2px, var(--color-text) 1px, transparent 0)', backgroundSize: '32px 32px' }} />


         {loading ? (
            <div style={{ textAlign: 'center', padding: '10rem 0' }}>
               <Loader2 size={40} className="animate-spin" color="#10b981" />
               <p style={{ marginTop: '2rem', fontWeight: 950, color: '#ced4da' }}>SYNCING...</p>
            </div>
         ) : filteredCourses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '8rem 2rem', backgroundColor: 'var(--color-surface-muted)', borderRadius: '3rem', border: '1px dashed #e2e8f0' }}>
               <Palette size={60} color="#e2e8f0" style={{ marginBottom: '2rem' }} />
               <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--color-text)' }}>Workspace Empty</h2>
            </div>
         ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '2rem' }}>
               {filteredCourses.map(course => (
                 <PremiumCourseCardSmall 
                   key={course.course_id} 
                   course={course} 
                   onEdit={() => setSelectedCourse(course)}
                   onDelete={() => handleDelete(course.course_id)}
                   onManage={() => navigate(`/manage/course/${course.course_id}`)}
                   onPublish={() => handlePublish(course.course_id)}
                   isPublishing={isPublishing}
                 />
               ))}
            </div>
         )}
         </div>
      </div>

      {isCreateModalOpen && <CreateCourseModal onClose={() => setIsCreateModalOpen(false)} trainers={trainers} categories={categories} showToast={showToast} refresh={fetchAllData} initialCategoryId={activeCategory !== 'all' ? activeCategory : ''} />}
      {selectedCourse && <EditCourseModal course={selectedCourse} onClose={() => setSelectedCourse(null)} trainers={trainers} categories={categories} showToast={showToast} refresh={fetchAllData} />}
      
      {toast && (
        <div style={{ position: 'fixed', bottom: '4rem', left: '50%', transform: 'translateX(-50%)', zIndex: 3500, padding: '1rem 2.5rem', borderRadius: '4rem', backgroundColor: '#111827', color: 'white', fontWeight: '900', boxShadow: '0 30px 60px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '1rem', animation: 'slideUp 0.5s' }}>
          {toast.type === 'success' ? <CheckCircle2 size={18} color="#10b981" /> : <AlertCircle size={18} color="#ef4444" />}
          {toast.message}
        </div>
      )}

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 40px); } to { opacity: 1; transform: translate(-50%, 0); } }
        .arcade-container {
          position: relative;
        }
        .arcade-container::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 3.5rem;
          box-shadow: inset 0 0 40px rgba(0,0,0,0.03);
          pointer-events: none;
        }
        .dark .arcade-container {
          background-color: rgba(255,255,255,0.01) !important;
          box-shadow: inset 0 10px 30px rgba(0,0,0,0.5) !important;
          border-color: rgba(255,255,255,0.05) !important;
        }
        .premium-glow-card:hover {
          transform: translateY(-8px) scale(1.02);
          border-color: var(--color-primary) !important;
          box-shadow: 0 15px 45px rgba(2, 6, 23, 0.15); /* Light mode navy */
          background-image: linear-gradient(135deg, transparent 95%, rgba(0,0,0,0.02) 100%), radial-gradient(circle at 2px 2px, rgba(0,0,0,0.01) 1px, transparent 0);
          background-size: 100% 100%, 30px 30px;
        }
        .dark .premium-glow-card:hover {
          box-shadow: 0 0 50px rgba(255, 255, 255, 0.15); /* Dark mode white glow */
          background-image: linear-gradient(135deg, transparent 95%, rgba(255,255,255,0.05) 100%), radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0);
        }
      `}</style>
    </div>
  );
};

const SmallTab = ({ active, label, count, onClick, icon, activeColor }) => (
  <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1.5rem', borderRadius: '1.25rem', border: 'none', cursor: 'pointer', backgroundColor: active ? 'var(--color-surface)' : 'transparent', color: active ? 'var(--color-text)' : 'var(--color-text-muted)', fontWeight: 950, fontSize: '0.8rem', transition: 'all 0.3s', boxShadow: active ? 'var(--shadow-sm)' : 'none' }}>
     <div style={{ color: active ? activeColor : 'var(--color-text-muted)' }}>{icon}</div>
     {label}
     {count > 0 && <span style={{ backgroundColor: active ? `${activeColor}20` : 'var(--color-surface-muted)', color: active ? activeColor : 'var(--color-text-muted)', padding: '0.1rem 0.5rem', borderRadius: '0.6rem' }}>{count}</span>}
  </button>
);

const PremiumCourseCardSmall = ({ course, onEdit, onDelete, onManage, onPublish, isPublishing }) => {
  const isDraft = course.status === 'draft';
  const isLive = course.status === 'active';

  return (
    <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: '2rem', overflow: 'hidden', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', transition: 'all 0.4s', position: 'relative' }} className="premium-glow-card">
       <div style={{ height: '220px', position: 'relative', overflow: 'hidden' }}>
          <img src={course.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)' }} />
          
          <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', display: 'flex', gap: '0.65rem', zIndex: 10 }}>
             <button onClick={(e) => { e.stopPropagation(); onEdit(); }} style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', backgroundColor: 'rgba(255,255,255,0.95)', border: 'none', color: '#111827', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Settings size={16}/></button>
             <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', backgroundColor: 'rgba(255,255,255,0.95)', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={16}/></button>
          </div>

          <div style={{ position: 'absolute', bottom: '1.25rem', left: '1.25rem' }}>
             {isDraft ? (
                <button onClick={onPublish} disabled={isPublishing} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '0.55rem 1.25rem', borderRadius: '1rem', fontWeight: 950, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                   <ShieldCheck size={14} /> GO LIVE
                </button>
             ) : (
                <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: 'white', padding: '0.55rem 1.25rem', borderRadius: '1rem', fontWeight: 950, fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                   {isLive ? 'ACTIVE' : 'ARCHIVED'}
                </div>
             )}
          </div>
       </div>

       <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
             <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 950, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>{course.course_title}</h3>
             <p style={{ margin: '0.4rem 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.4, height: '2.5rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{course.course_description}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', padding: '1.25rem', backgroundColor: 'var(--color-surface-muted)', borderRadius: '1.25rem', border: '1px solid var(--color-border)' }}>
             <MinStat icon={<Users size={14} color="#3b82f6"/>} value={course.students_count || 0} />
             <MinStat icon={<Layers size={14} color="#f97316"/>} value={`${course.modules?.length || 0} Layers`} />
          </div>

          <button onClick={onManage} style={{ width: '100%', padding: '0.85rem', borderRadius: '1.25rem', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', fontSize: '0.9rem', fontWeight: 950, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem', marginTop: 'auto', boxShadow: 'var(--shadow-sm)' }}>
             Studio Architect <ArrowRight size={16} />
          </button>
       </div>

       <style>{` .course-card-p:hover { transform: translateY(-6px); box-shadow: 0 40px 80px rgba(0,0,0,0.06); border-color: #10b98120; } `}</style>
    </div>
  );
};

const MinStat = ({ icon, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
     <div style={{ width: '2rem', height: '2rem', borderRadius: '0.65rem', backgroundColor: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)' }}>{icon}</div>
     <span style={{ fontSize: '0.9rem', fontWeight: 950, color: 'var(--color-text)' }}>{value}</span>
  </div>
);

export default AdminCourses;
