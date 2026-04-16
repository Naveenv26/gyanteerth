import { 
  Search, Plus, Edit, Mail, Phone, MapPin, Calendar, X, UserX, UserCheck, 
  Loader2, AlertCircle, CheckCircle2, User, Users, Layout, ArrowLeft, ArrowRight,
  ShieldCheck, Zap, Archive, Settings2, Trash2, Globe, Palette, Save, 
  Fingerprint, Briefcase, Activity, Grid, List, ChevronRight
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../shared/AuthContext';
import { ADMIN_API, getHeaders } from '../../config';

const AdminUsers = () => {
  const { authFetch, smartFetch, clearCache } = useAuth();
  const navigate = useNavigate();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [clickPos, setClickPos] = useState({ x: 0, y: 0 });
  const [toast, setToast] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const validateMobile = (num) => /^[0-9]{10}$/.test(num);
  const validatePassword = (pass) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(pass);


  const fetchTrainers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await smartFetch(`${ADMIN_API}/all_trainer`, { cacheKey: 'admin_all_trainers' });
      if (data) {
        const activeList = data.active_trainer_email || [];
        const inactiveList = data.inactive_trainer_email || [];

        const fetchDetails = async (list, status) => {
          const promises = list.map(async (item) => {
            const email = typeof item === 'string' ? item : Object.values(item)[0];
            if (!email) return null;
            try {
               const detail = await smartFetch(`${ADMIN_API}/get_trainer?trainer_email=${email}`, {
                  cacheKey: `trainer_detail_${email}`
               });
               if (detail) return { ...detail, trainer_status: status };
            } catch (e) {}
            return null;
          });
          const results = await Promise.all(promises);
          return results.filter(Boolean);
        };

        const [activeDetails, inactiveDetails] = await Promise.all([
          fetchDetails(activeList, 'active'),
          fetchDetails(inactiveList, 'inactive')
        ]);
        
        setTrainers([...activeDetails, ...inactiveDetails]);
      }
    } catch (err) {
      showToast('Registry sync interrupted', 'error');
    } finally {
      setLoading(false);
    }
  }, [smartFetch]);

  useEffect(() => {
    fetchTrainers();
  }, [fetchTrainers]);

  const handleCreate = async (formData) => {
    setActionLoading(true);
    try {
      if (formData.trainer_name.includes(' ')) {
        showToast('Name cannot contain spaces', 'error');
        setActionLoading(false); return;
      }
      const fd = new FormData();
      Object.entries(formData).forEach(([key, val]) => fd.append(key, val));
      const res = await authFetch(`${ADMIN_API}/create_trainer`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: fd
      });
      if (res.ok) { 
        showToast('Faculty operational'); 
        clearCache('admin_all_trainers');
        setTrainers(prev => [{ ...formData, trainer_status: 'active' }, ...prev]);
        setShowCreateModal(false); 
      }
      else { const d = await res.json(); showToast(d.detail || 'Creation denied', 'error'); }
    } catch (err) { showToast('Sync protocol failure', 'error'); }
    finally { setActionLoading(false); }
  };

  const handleUpdate = async (formData) => {
    setActionLoading(true);
    try {
      // Transform payload to match backend schema requirements
      const payload = {
        ...formData,
        password: formData.trainer_pass,
        trainer_number: String(formData.trainer_number)
      };

      const res = await authFetch(`${ADMIN_API}/update-trainer`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json' 
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) { 
        setTrainers(prev => prev.map(t => (t.email === formData.trainer_email || t.trainer_email === formData.trainer_email) ? { ...t, ...formData } : t));
        showToast('Profile sync success'); 
        clearCache('admin_all_trainers');
        if (formData.trainer_email) {
          clearCache(`trainer_detail_${formData.trainer_email}`);
          refreshSingleTrainer(formData.trainer_email, selectedTrainer.trainer_status);
        }
        setShowEditModal(false); 
      }
      else showToast('Update rejected', 'error');
    } catch (err) { showToast('Sync protocol failure', 'error'); }
    finally { setActionLoading(false); }
  };

  const refreshSingleTrainer = async (email, status) => {
    try {
      const detail = await smartFetch(`${ADMIN_API}/get_trainer?trainer_email=${email}`, { forceRefresh: true });
      if (detail) {
        setTrainers(prev => prev.map(t => (t.email === email || t.trainer_email === email) ? { ...detail, trainer_status: status } : t));
      }
    } catch (e) {}
  };

  const handleToggleStatus = async (email, currentStatus) => {
    if (!window.confirm(`Toggle status for ${email}?`)) return;
    setActionLoading(true);
    try {
      const targetStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const res = await authFetch(`${ADMIN_API}/inactive-trainer`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainer_email: email, status: targetStatus })
      });
      if (res.ok) { 
        setTrainers(prev => prev.map(t => (t.email === email || t.trainer_email === email) ? { ...t, trainer_status: targetStatus } : t));
        showToast(`Trainer ${targetStatus === 'active' ? 'Activated' : 'Deactivated'}`); 
        clearCache('admin_all_trainers');
        clearCache(`trainer_detail_${email}`);
        refreshSingleTrainer(email, targetStatus);
      }
      else showToast('Status change denied', 'error');
    } catch (err) { showToast('Sync protocol failure', 'error'); }
    finally { setActionLoading(false); }
  };

  const filteredTrainers = trainers.filter(t => {
    const q = searchQuery.toLowerCase();
    const name = (t.user_name || t.trainer_name || '').toLowerCase();
    const email = (t.email || t.trainer_email || '').toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-surface-muted)', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text)', paddingBottom: '10rem' }}>
      
      <div style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '1.25rem 0' }}>
         <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 var(--page-padding)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--color-primary)', marginBottom: '0.15rem' }}>
                  <Users size={14} /><span style={{ fontSize: '0.65rem', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Faculty Intelligence</span>
               </div>
               <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 950, letterSpacing: '-0.04em', color: 'var(--color-text)' }}>Trainer Registry</h1>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
               <div style={{ position: 'relative' }}>
                 <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                 <input 
                  type="text" 
                  placeholder="Scan nodes..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  style={{ width: '260px', padding: '0.65rem 1rem 0.65rem 2.5rem', backgroundColor: 'var(--color-surface-muted)', border: '1px solid var(--color-border)', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: 700, outline: 'none', color: 'var(--color-text)' }} 
                 />
               </div>

               
               <div style={{ display: 'flex', backgroundColor: 'var(--color-surface-muted)', padding: '0.35rem', borderRadius: '1.25rem', border: '1px solid var(--color-border)' }}>
                  <button onClick={() => setViewMode('grid')} style={{ padding: '0.6rem 0.85rem', borderRadius: '0.9rem', border: 'none', background: viewMode === 'grid' ? 'var(--color-surface)' : 'transparent', color: viewMode === 'grid' ? 'var(--color-primary)' : 'var(--color-text-light)', cursor: 'pointer', boxShadow: viewMode === 'grid' ? 'var(--shadow-md)' : 'none', transition: 'all 0.3s' }}><Grid size={20}/></button>
                  <button onClick={() => setViewMode('list')} style={{ padding: '0.6rem 0.85rem', borderRadius: '0.9rem', border: 'none', background: viewMode === 'list' ? 'var(--color-surface)' : 'transparent', color: viewMode === 'list' ? 'var(--color-primary)' : 'var(--color-text-light)', cursor: 'pointer', boxShadow: viewMode === 'list' ? 'var(--shadow-md)' : 'none', transition: 'all 0.3s' }}><List size={20}/></button>
               </div>

               <button 
                 onClick={() => setShowCreateModal(true)}
                 className="btn btn-primary"
                 style={{ padding: '0.75rem 1.75rem', borderRadius: '1.15rem' }}
               >
                 <Plus size={18} /> <span className="hide-on-mobile">Add Trainer</span>
               </button>
            </div>
         </div>
      </div>

      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '2.5rem var(--page-padding)' }}>
         <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '3.5rem', overflowX: 'auto', paddingBottom: '0.75rem' }} className="no-scrollbar">
            <CompactStat label="Total Trainers" value={trainers.length} icon={<Fingerprint size={16} />} />
            <CompactStat label="Active Faculty" value={trainers.filter(t => t.trainer_status === 'active').length} icon={<Zap size={16} color="var(--color-primary)" />} />
            <CompactStat label="Core Systems" value="Gyanteerth LMS" icon={<ShieldCheck size={16} color="#64748b" />} />
         </div>

         <div className="arcade-container">
            <div style={{ position: 'absolute', inset: 0, opacity: 0.03, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle at 2px 2px, var(--color-text) 1px, transparent 0)', backgroundSize: '32px 32px' }} />


         <AnimatePresence mode="wait">
           {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ textAlign: 'center', padding: '10rem 0' }}
              >
                 <Loader2 size={40} className="animate-spin" color="var(--color-primary)" />
                 <p style={{ marginTop: '2rem', fontSize: '1rem', fontWeight: 950, color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>SYNCING RECORDS...</p>
              </motion.div>
           ) : filteredTrainers.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                style={{ textAlign: 'center', padding: '8rem 2rem', backgroundColor: 'var(--color-surface)', borderRadius: '3rem', border: '1px dashed var(--color-border-strong)' }}
              >
                 <Briefcase size={60} color="var(--color-border-strong)" style={{ marginBottom: '2.5rem' }} />
                 <h2>No Records Detected</h2>
                 <p style={{ maxWidth: '400px', margin: '1.5rem auto 0' }}>The intelligence registry is currently empty. Initialize your first faculty node to begin.</p>
              </motion.div>
           ) : (
              <motion.div 
                key={viewMode}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                style={viewMode === 'grid' ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: '2rem' } : { display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                 {filteredTrainers.map((trainer, index) => (
                    viewMode === 'grid' ? (
                       <PremiumUserCard 
                          key={trainer.email} 
                          trainer={trainer} index={index}
                          onView={(e) => { setClickPos({ x: e.clientX, y: e.clientY }); setSelectedTrainer(trainer); setShowViewModal(true); }}
                          onEdit={() => { setSelectedTrainer(trainer); setShowEditModal(true); }}
                          onToggle={() => handleToggleStatus(trainer.email, trainer.trainer_status)}
                          isActionLoading={actionLoading}
                       />
                    ) : (
                       <PremiumUserListRow 
                          key={trainer.email} 
                          trainer={trainer} index={index}
                          onView={(e) => { setClickPos({ x: e.clientX, y: e.clientY }); setSelectedTrainer(trainer); setShowViewModal(true); }}
                          onEdit={() => { setSelectedTrainer(trainer); setShowEditModal(true); }}
                          onToggle={() => handleToggleStatus(trainer.email, trainer.trainer_status)}
                       />
                    )
                 ))}
              </motion.div>
           )}
         </AnimatePresence>
      </div>

      {showCreateModal && (
        <TrainerFormModal
          title="Add New Trainer"
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
          loading={actionLoading}
          isCreate
          validateMobile={validateMobile}
          validatePassword={validatePassword}
          showToast={showToast}
        />
      )}

      {showEditModal && selectedTrainer && (
        <TrainerFormModal
          title="Edit Trainer Profile"
          trainer={selectedTrainer}
          onClose={() => { setShowEditModal(false); setSelectedTrainer(null); }}
          onSubmit={handleUpdate}
          loading={actionLoading}
          validateMobile={validateMobile}
          validatePassword={validatePassword}
          showToast={showToast}
        />
      )}

      <AnimatePresence>
         {showViewModal && selectedTrainer && (
            <ViewTrainerModal
               trainer={selectedTrainer}
               origin={clickPos}
               onClose={() => { setShowViewModal(false); setSelectedTrainer(null); }}
            />
         )}
      </AnimatePresence>

      {toast && (
        <div style={{ position: 'fixed', bottom: '4rem', left: '50%', transform: 'translateX(-50%)', zIndex: 3500, padding: '1.15rem 3rem', borderRadius: '4rem', backgroundColor: '#111827', color: 'white', fontWeight: '900', boxShadow: '0 30px 60px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '1rem', animation: 'slideUp 0.5s' }}>
          {toast.type === 'success' ? <CheckCircle2 size={20} color="var(--color-primary)" /> : <AlertCircle size={20} color="#ef4444" />}
          {toast.message}
        </div>
      )}

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 40px); } to { opacity: 1; transform: translate(-50%, 0); } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @media (max-width: 640px) { .hide-on-mobile { display: none; } }
      `}</style>
      </div>
    </div>
  );
};

const CompactStat = ({ label, value, icon }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 1.25rem', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '1rem', minWidth: 'max-content' }}>
     <div style={{ width: '2rem', height: '2rem', borderRadius: '0.6rem', backgroundColor: 'var(--color-surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>{icon}</div>
     <div>
        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 950, color: 'var(--color-text)', lineHeight: 1 }}>{value}</h4>
        <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.55rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
     </div>
  </div>
);

const PremiumUserCard = ({ trainer, onView, onEdit, onToggle, isActionLoading, index }) => {
  const isInactive = trainer.trainer_status === 'inactive';
  const name = trainer.user_name || (trainer.email || '').split('@')[0] || 'Unknown';
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.04 }}
      style={{ backgroundColor: 'var(--color-surface)', borderRadius: '1.75rem', padding: '1.5rem', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '1.25rem', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative' }} 
      className="premium-glow-card"
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
             <div style={{ 
                width: '3rem', height: '3rem', borderRadius: '0.85rem', background: isInactive ? '#fee2e2' : '#dcfce7', color: isInactive ? '#ef4444' : '#10b981',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950, fontSize: '1.1rem', border: `1px solid ${isInactive ? '#fecaca' : '#bbf7d0'}`
             }}>
                {name.charAt(0).toUpperCase()}
             </div>
             <div>
                <div style={{ fontSize: '0.55rem', fontWeight: 950, color: isInactive ? '#ef4444' : '#10b981', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                   <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
                   {isInactive ? 'Inactive' : 'Active'}
                </div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900 }}>{name}</h3>
             </div>
          </div>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
             <button onClick={onEdit} style={{ width: '2rem', height: '2rem', borderRadius: '0.6rem', backgroundColor: 'var(--color-surface-muted)', border: '1px solid var(--color-border)', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Settings2 size={14}/></button>
             <button onClick={onToggle} disabled={isActionLoading} style={{ width: '2rem', height: '2rem', borderRadius: '0.6rem', backgroundColor: isInactive ? '#dcfce7' : '#fee2e2', border: `1px solid ${isInactive ? '#bbf7d0' : '#fecaca'}`, color: isInactive ? '#10b981' : '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isInactive ? <UserCheck size={16} /> : <UserX size={16} />}
             </button>
          </div>
       </div>
       <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)', gap: '1rem', padding: '1rem', backgroundColor: 'var(--color-surface-muted)', borderRadius: '1rem', border: '1px solid var(--color-border)' }}>
          <CInfo icon={<Phone size={12} />} label="Mobile" value={trainer.user_number || '—'} />
          <CInfo icon={<MapPin size={12} />} label="Location" value={trainer.user_city || '—'} />
       </div>
       <div style={{ padding: '0 0.5rem' }}>
          <button onClick={(e) => onView(e)} className="btn btn-ghost" style={{ width: '100%', padding: '0.75rem', borderRadius: '1.15rem', fontSize: '0.85rem', fontWeight: 900, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
             Details <ArrowRight size={14} />
          </button>
       </div>
    </motion.div>
  );
};

const PremiumUserListRow = ({ trainer, onView, onEdit, onToggle, index }) => {
  const isInactive = trainer.trainer_status === 'inactive';
  const name = trainer.user_name || (trainer.email || '').split('@')[0] || 'Unknown';
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.02 }}
      style={{ backgroundColor: 'var(--color-surface)', padding: '0.75rem 1.25rem', borderRadius: '1rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}
    >
       <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.7rem', background: isInactive ? '#fee2e2' : '#dcfce7', color: isInactive ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1rem', border: `1px solid ${isInactive ? '#fecaca' : '#bbf7d0'}` }}>
            {name.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</h4>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
               <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: isInactive ? '#ef4444' : '#10b981' }} />
               <span style={{ fontWeight: 800 }}>{trainer.email}</span>
            </div>
          </div>
       </div>
       <div className="hide-on-mobile" style={{ display: 'flex', gap: '1.5rem', flex: 1.5 }}>
          <LInfo icon={<Phone size={13} />} value={trainer.user_number || '—'} />
          <LInfo icon={<MapPin size={13} />} value={trainer.user_city || '—'} />
       </div>
       <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button onClick={(e) => onView(e)} style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', background: 'var(--color-surface)', fontWeight: 900, color: 'var(--color-text)', fontSize: '0.8rem', cursor: 'pointer' }}>View Details</button>
          <button onClick={onEdit} style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.75rem', background: 'var(--color-surface-muted)', border: '1px solid var(--color-border)', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Settings2 size={16}/></button>
       </div>
    </motion.div>
  );
};

const LInfo = ({ icon, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 800, color: '#64748b' }}>
     {React.cloneElement(icon, { size: 12 })} <span>{value}</span>
  </div>
);

const CInfo = ({ icon, label, value }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
     <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.55rem', fontWeight: 950, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {React.cloneElement(icon, { size: 10, color: '#64748b' })} {label}
     </div>
     <div style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
  </div>
);

const ViewTrainerModal = ({ trainer, onClose, origin }) => {
  const [liveSessions, setLiveSessions] = useState(null);
  const { authFetch } = useAuth();
  
  useEffect(() => {
    const fetchLiveSessions = async () => {
      try {
        const res = await authFetch(`${ADMIN_API}/instructor/${trainer.user_id}/live-sessions`);
        if (res.ok) {
          const data = await res.json();
          setLiveSessions(data || []);
        } else {
          setLiveSessions([]);
        }
      } catch (e) {
        setLiveSessions([]);
      }
    };
    if (trainer?.user_id) fetchLiveSessions();
  }, [trainer, authFetch]);

  const isInactive = trainer.trainer_status === 'inactive';
  const name = trainer.user_name || (trainer.email || '').split('@')[0] || 'Unknown';
  const modalContent = (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(2, 6, 23, 0.45)', backdropFilter: 'blur(16px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={onClose}>
       <motion.div 
          initial={{ opacity: 0, scale: 0.1, x: origin?.x - (window.innerWidth / 2) || 0, y: origin?.y - (window.innerHeight / 2) || 0 }}
          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, scale: 0.1, x: origin?.x - (window.innerWidth / 2) || 0, y: origin?.y - (window.innerHeight / 2) || 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          style={{ width: 'min(95vw, 450px)', maxHeight: '90vh', overflowY: 'auto', backgroundColor: 'var(--color-surface)', borderRadius: '2.5rem', boxShadow: '0 25px 70px -15px rgba(0, 0, 0, 0.4)', border: '1px solid var(--color-border)' }}
          onClick={(e) => e.stopPropagation()}
          className="no-scrollbar"
       >
          <header style={{ padding: '1rem 1.75rem', background: 'var(--color-surface-muted)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <span style={{ fontSize: '0.6rem', fontWeight: 950, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Faculty Node Trace</span>
             <button onClick={onClose} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', cursor: 'pointer', width: '2rem', height: '2rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16}/></button>
          </header>
          <div style={{ padding: '1.75rem 2.25rem', textAlign: 'center' }}>
             <motion.div 
               initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15 }}
               style={{ width: '4.5rem', height: '4.5rem', borderRadius: '1.5rem', background: isInactive ? 'linear-gradient(135deg, #fee2e2, #fecaca)' : 'linear-gradient(135deg, #dcfce7, #bbf7d0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950, fontSize: '1.75rem', color: isInactive ? '#ef4444' : '#10b981', margin: '0 auto 1rem', border: `1px solid ${isInactive ? '#fca5a5' : '#86efac'}` }}>
                {name.charAt(0).toUpperCase()}
             </motion.div>
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', color: isInactive ? '#ef4444' : '#10b981', fontSize: '0.55rem', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.25rem' }}><div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'currentColor' }} />{isInactive ? 'Access Restricted' : 'Active Member'}</div>
             <h3 style={{ fontSize: '1.35rem', fontWeight: 950, margin: 0, color: '#111827' }}>{name}</h3>
             <p style={{ color: 'var(--color-text-muted)', fontWeight: 800, marginTop: '0.2rem', marginBottom: '1.75rem', fontSize: '0.8rem' }}>{trainer.email}</p>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1.25rem', backgroundColor: 'var(--color-surface-muted)', borderRadius: '1.5rem', border: '1px solid var(--color-border)', textAlign: 'left', marginBottom: '1.5rem' }}>
                <VItem icon={<Phone size={12} />} label="Phone" value={trainer.user_number || '—'} />
                <VItem icon={<Calendar size={12} />} label="Origin" value={trainer.user_dob || '—'} />
                <VItem icon={<Activity size={12} />} label="Type" value={trainer.user_gender || 'Admin'} />
                <VItem icon={<MapPin size={12} />} label="Hub" value={trainer.user_city || 'HQ'} />
             </div>
             
             <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 900, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Zap size={14} color="var(--color-primary)" /> Live Sessions
                </h4>
                {liveSessions === null ? (
                  <div style={{ padding: '2rem', textAlign: 'center' }}><Loader2 size={24} className="animate-spin mx-auto" /></div>
                ) : liveSessions.length === 0 ? (
                  <div style={{ padding: '1rem', backgroundColor: 'var(--color-surface-muted)', borderRadius: '1rem', border: '1px dashed var(--color-border-strong)', textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 800 }}>No active sessions</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {liveSessions.map((session, i) => (
                      <div key={i} style={{ padding: '0.75rem', backgroundColor: 'var(--color-surface-muted)', borderRadius: '1rem', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>{session.title || 'Live Session'}</div>
                         <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 800 }}>{session.status || 'Scheduled'}</div>
                      </div>
                    ))}
                  </div>
                )}
             </div>

             <button onClick={onClose} className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%', padding: '0.8rem', borderRadius: '1rem', fontWeight: 950, fontSize: '0.85rem' }}>Dismiss Review</button>
          </div>
       </motion.div>
    </div>
  );
  return createPortal(modalContent, document.body);
};

const VItem = ({ icon, label, value }) => (
  <div>
     <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.55rem', fontWeight: 950, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem', letterSpacing: '0.04em' }}>
        {React.cloneElement(icon, { size: 11, color: '#64748b' })} {label}
     </div>
     <div style={{ fontWeight: 950, color: 'var(--color-text)', fontSize: '0.85rem' }}>{value}</div>
  </div>
);

const TrainerFormModal = ({ title, trainer, onClose, onSubmit, loading, isCreate, validateMobile, validatePassword, showToast }) => {
  const [form, setForm] = useState({
    user_id: trainer?.user_id || '',
    trainer_email: trainer?.email || trainer?.trainer_email || '',
    trainer_name: trainer?.user_name || trainer?.trainer_name || '',
    trainer_number: trainer?.user_number || trainer?.trainer_number || '',
    trainer_pass: '',
    trainer_dob: trainer?.user_dob || trainer?.trainer_dob || '',
    trainer_gender: trainer?.user_gender || trainer?.trainer_gender || '',
    trainer_city: trainer?.user_city || trainer?.trainer_city || '',
    trainer_state: trainer?.user_state || trainer?.trainer_state || ''
  });
  const [errors, setErrors] = useState({});
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };
  const handleAction = (e) => {
    e.preventDefault();
    const localErrors = {};
    if (!validateMobile(form.trainer_number)) localErrors.trainer_number = '10 digits required';
    if (isCreate || (form.trainer_pass && form.trainer_pass !== '')) {
       if (!validatePassword(form.trainer_pass)) localErrors.trainer_pass = 'Strong key required';
    }
    if (Object.keys(localErrors).length > 0) { setErrors(localErrors); return; }
    onSubmit(form);
  };
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 3000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '3.5rem 1rem', overflowY: 'auto' }}>
       <motion.div initial={{ opacity: 0, y: 30, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} style={{ width: 'clamp(320px, 95vw, 850px)', backgroundColor: 'var(--color-surface)', borderRadius: '3.5rem', overflow: 'hidden', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-border)' }}>
          <header style={{ padding: '2rem 3rem', background: 'var(--color-surface-muted)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
             <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontSize: '0.65rem', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.4rem' }}>
                   <Zap size={14} fill="var(--color-primary)" /> Trainer Node
                </div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 950 }}>{isCreate ? 'Add Trainer' : 'Edit Profile'}</h2>
             </div>
             <button onClick={onClose} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', cursor: 'pointer', width: '2.5rem', height: '2.5rem', borderRadius: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', marginTop: '-0.5rem' }}><X size={20}/></button>
          </header>
          <form onSubmit={handleAction} style={{ padding: '3.5rem', maxHeight: '75vh', overflowY: 'auto' }} className="no-scrollbar">
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem' }}>
                <Input label="Email Identity" name="trainer_email" type="email" value={form.trainer_email} onChange={handleChange} required disabled={!isCreate} icon={<Mail size={16} />} />
                <Input label="Display Name" name="trainer_name" value={form.trainer_name} onChange={handleChange} required placeholder="No spaces" icon={<User size={16} />} />
                <Input label="Auth Key" name="trainer_pass" type="password" value={form.trainer_pass} onChange={handleChange} required={isCreate} placeholder="••••••••" error={errors.trainer_pass} icon={<Fingerprint size={16} />} />
                <Input label="Birth Date" name="trainer_dob" type="date" value={form.trainer_dob} onChange={handleChange} required icon={<Calendar size={16} />} />
                <Input label="Contact Line" name="trainer_number" value={form.trainer_number} onChange={handleChange} required error={errors.trainer_number} icon={<Phone size={16} />} />
                <div>
                   <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', fontWeight: 950, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}><Users size={14} /> Gender Status</label>
                   <select name="trainer_gender" value={form.trainer_gender} onChange={handleChange} required style={{ width: '100%', padding: '1.15rem 1.75rem', borderRadius: '1.25rem', border: '1px solid var(--color-border-strong)', background: 'var(--color-surface-muted)', fontSize: '1rem', fontWeight: 800, color: 'var(--color-text)', outline: 'none', appearance: 'none', cursor: 'pointer' }}>
                      <option value="">Select Protocol</option><option value="male">Male</option><option value="female">Female</option>
                   </select>
                </div>
                <Input label="City Hub" name="trainer_city" value={form.trainer_city} onChange={handleChange} required icon={<Globe size={16} />} />
                <Input label="State Region" name="trainer_state" value={form.trainer_state} onChange={handleChange} required icon={<MapPin size={16} />} />
             </div>
             <div style={{ marginTop: '3.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '1.25rem', borderTop: '1px solid var(--color-border)', paddingTop: '2.5rem' }}>
                <button type="button" onClick={onClose} className="btn btn-ghost" style={{ padding: '0.85rem 2.5rem', borderRadius: '1.15rem' }}>Discard Changes</button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0.85rem 4rem', borderRadius: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                   {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                   {isCreate ? 'Initialize Faculty' : 'Commit Profile'}
                </button>
             </div>
          </form>
       </motion.div>
    </div>
  );
};

const Input = ({ label, error, icon, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
     <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.65rem', fontWeight: 950, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{icon && React.cloneElement(icon, { size: 14 })} {label}</label>
     <div style={{ position: 'relative' }}>
        <input {...props} style={{ width: '100%', padding: '1.15rem 1.75rem', borderRadius: '1.25rem', border: `1px solid ${error ? '#ef4444' : 'var(--color-border-strong)'}`, background: 'var(--color-surface-muted)', fontSize: '1rem', fontWeight: 800, color: 'var(--color-text)', outline: 'none', transition: 'all 0.2s' }} />
        {error && <div style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#ef4444', fontSize: '0.7rem', fontWeight: 950 }}>{error}</div>}
     </div>
  </div>
);

export default AdminUsers;
