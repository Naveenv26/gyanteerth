import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Video, FileText,
  Award, Play, Monitor, Loader2,
  Layers, Grid, Menu, Activity, FileBox, Briefcase, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../shared/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

import { ADMIN_API } from '../../config';

const TrainerCurriculum = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [activeModule, setActiveModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lessons');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const headers = useCallback(() => ({
    'Authorization': `Bearer ${accessToken}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }), [accessToken]);

  const fetchCurriculum = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_API}/course/${courseId}/full-details`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        const rawCourse = data.course || data;
        const mappedCourse = {
          ...rawCourse,
          course_id: rawCourse.course_id || rawCourse.id,
          course_title: rawCourse.course_title || rawCourse.title,
          course_type: rawCourse.type || rawCourse.course_type || rawCourse.course_Type || 'recorded'
        };
        setCourse(mappedCourse);

        // Set default tab based on course type
        if (mappedCourse.course_type === 'live') {
          setActiveTab('live');
        } else {
          setActiveTab('lessons');
        }

        const courseLevelNotes = (rawCourse.notes || []);
        const sortedModules = (rawCourse.modules || []).sort((a, b) => (a.position || a.Position || 0) - (b.position || b.Position || 0)).map(m => {
          const content = m.content || {};
          return {
            ...m,
            module_id: m.module_id || m.Module_ID,
            video: (content.videos || m.video || []).map(v => ({
              ...v,
              video_id: v.video_id || v.Video_ID,
              video_url: v.video_url || v.Video_URL || v.url,
              course_description: v.description || v.course_description || v.Course_Description || v.title
            })),
            assessments: (content.assessments || m.assessments || []).map(a => {
              const rawQuestions = a.questions || a.Questions || [];
              const sortedQuestions = [...rawQuestions].sort((qx, qy) => (qx.position || qx.Position || 0) - (qy.position || qy.Position || 0));

              return {
                ...a,
                assessment_id: a.assessment_id || a.Assessment_ID,
                questions: sortedQuestions.map(q => ({
                  ...q,
                  question_id: q.question_id || q.Question_ID,
                  question_txt: q.question_text || q.question_txt || q.Question_Txt || q.text,
                  options: (q.options || q.Options || []).map(o => ({
                    ...o,
                    option_id: o.option_id || o.Option_ID,
                    option_txt: o.text || o.option_txt || o.Option_Txt || o.option,
                    is_correct: o.is_correct !== undefined ? o.is_correct : o.Is_Correct
                  }))
                }))
              };
            }),
            live_sessions: (content.live_sessions || m.live_sessions || []).map(l => ({
              ...l,
              live_id: l.live_id || l.Live_ID,
              meeting_url: l.meeting_url || l.Meeting_URL
            })),
            notes: (content.notes || m.notes || courseLevelNotes).map(n => ({
              ...n,
              note_id: n.note_id || n.Notes_ID || n.notes_id,
              note_url: n.file_url || n.note_url || n.File_URL || n.Note_URL
            }))
          };
        });
        setModules(sortedModules);
        if (sortedModules.length > 0 && !activeModule) { setActiveModule(sortedModules[0]); }
        else if (activeModule) {
          const updatedActive = sortedModules.find(m => (m.module_id || m.Module_ID) === (activeModule.module_id || activeModule.Module_ID));
          if (updatedActive) {
            setActiveModule(updatedActive);
          }
        }
      }
    } catch (err) { console.error('fetchCurriculum failed:', err); }
    finally { setLoading(false); }
  }, [courseId, accessToken, headers, activeModule]);

  useEffect(() => {
    if (accessToken) fetchCurriculum();
  }, [courseId, accessToken]);

  const isRecorded = course?.course_type?.toLowerCase() === 'recorded';
  const isLive = course?.course_type?.toLowerCase() === 'live';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text)', display: 'flex', flexDirection: 'column' }}>

      {/* REFINED COMMAND HEADER */}
      <header style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '1.25rem var(--page-padding)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="mobile-only-btn" style={{ padding: '0.5rem', background: 'var(--color-surface-muted)', border: 'none', borderRadius: '0.75rem', cursor: 'pointer' }}><Menu size={20} /></button>
          <button onClick={() => navigate('/trainer/courses')} style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.85rem', background: 'var(--color-surface-muted)', border: '1px solid var(--color-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}><ArrowLeft size={18} /></button>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', marginBottom: '0.15rem' }}>
              <Layers size={12} /><span style={{ fontSize: '0.6rem', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Trainer Repository</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 'clamp(1rem, 4vw, 1.35rem)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{course?.course_title || 'Syncing curriculum...'}</h1>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ padding: '0.5rem 1rem', borderRadius: '1rem', background: 'var(--color-surface-muted)', border: '1px solid var(--color-border)', fontSize: '0.75rem', fontWeight: 900, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {course?.course_type || 'RECORDED'} MODE
          </div>
          <button onClick={() => navigate('/trainer/courses')} className="btn btn-ghost hide-on-mobile" style={{ padding: '0.65rem 1.5rem', borderRadius: '1rem', border: '1px solid var(--color-border-strong)', fontSize: '0.85rem' }}>Exit Viewer</button>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>

        <AnimatePresence>
          {isSidebarOpen && (
            <motion.aside
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              style={{ width: '240px', backgroundColor: 'var(--color-surface)', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 50 }}
              className="curriculum-sidebar"
            >
              <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }} className="no-scrollbar">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
                  <h3 style={{ fontSize: '0.65rem', fontWeight: 950, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}><Grid size={12} /> Chapters</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {modules.map((m) => (
                    <motion.div
                      key={m.module_id}
                      onClick={() => { setActiveModule(m); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      style={{
                        padding: '1rem', borderRadius: '1.25rem', cursor: 'pointer', transition: 'all 0.2s',
                        backgroundColor: activeModule?.module_id === m.module_id ? 'var(--color-bg)' : 'transparent',
                        border: '1px solid',
                        borderColor: activeModule?.module_id === m.module_id ? 'var(--color-primary-light)20' : 'transparent',
                        display: 'flex', alignItems: 'center', gap: '0.85rem'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 950, color: activeModule?.module_id === m.module_id ? 'var(--color-primary)' : 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</p>
                        <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.55rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                           {isRecorded ? `${m.video?.length || 0} Lessons` : ''} 
                           {isLive ? `${m.live_sessions?.length || 0} Live Sessions` : ''} 
                           • {m.assessments?.length || 0} Exams
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <main style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--color-surface)', padding: 'clamp(1rem, 5vw, 3.5rem)', position: 'relative' }}>
          {!activeModule ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontWeight: 950, fontSize: '0.9rem', letterSpacing: '0.1em', textAlign: 'center', padding: '2rem' }}>
              SELECT A CHAPTER TO VIEW CONTENT
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', padding: '0.25rem', background: 'var(--color-surface-muted)', borderRadius: '1.25rem', border: '1px solid var(--color-border)' }}>
                  {isRecorded && (
                    <SubTab active={activeTab === 'lessons'} icon={<Video size={12} />} label="Lessons" onClick={() => setActiveTab('lessons')} color="var(--color-primary)" />
                  )}
                  {isLive && (
                    <SubTab active={activeTab === 'live'} icon={<Monitor size={12} />} label="Live Sessions" onClick={() => setActiveTab('live')} color="#3b82f6" />
                  )}
                  <SubTab active={activeTab === 'notes'} icon={<FileText size={12} />} label="Resources" onClick={() => setActiveTab('notes')} color="#ef4444" />
                  <SubTab active={activeTab === 'assessments'} icon={<Award size={12} />} label="Assessments" onClick={() => setActiveTab('assessments')} color="#f97316" />
                </div>
              </div>

              <div style={{ minHeight: '60vh' }}>
                <AnimatePresence mode="wait">
                  <motion.div key={activeTab} initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -5 }} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 450px), 1fr))', gap: '1.5rem' }}>
                      {activeTab === 'lessons' && isRecorded && (activeModule.video || []).map((v, i) => (
                        <ContentViewItem key={v.video_id} index={i} icon={<Play size={14} fill="currentColor" />} title={v.course_description} sub={v.video_url} color="var(--color-primary)" />
                      ))}
                      {activeTab === 'live' && isLive && (activeModule.live_sessions || []).map((l, i) => {
                        const start = l.start_time ? new Date(l.start_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'TBD';
                        const end = l.end_time ? new Date(l.end_time).toLocaleString([], { timeStyle: 'short' }) : 'TBD';
                        return (
                          <ContentViewItem key={l.live_id} index={i} icon={<Activity size={14} />} title={l.title || `${l.provider} Session`} sub={`${start} - ${end} • ${l.meeting_url}`} color="#3b82f6" />
                        );
                      })}
                      {activeTab === 'notes' && (activeModule.notes || []).map((n, i) => (
                        <ContentViewItem key={n.note_id} index={i} icon={<FileBox size={14} />} title={n.title} sub={n.note_url} color="#ef4444" />
                      ))}
                      {activeTab === 'assessments' && (activeModule.assessments || []).map((a, i) => (
                        <div key={a.assessment_id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <ContentViewItem index={i} icon={<Briefcase size={14} />} title={a.title} sub={`${a.total_mark} Pts • ${a.duration} Mins`} color="#f97316" />
                          <div style={{ marginLeft: '4.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                             <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 950, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Questions ({a.questions?.length || 0})</p>
                             {a.questions?.map((q, idx) => (
                                <div key={q.question_id} style={{ padding: '0.75rem 1.25rem', borderRadius: '1rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)', fontSize: '0.8rem', color: 'var(--color-text)' }}>
                                   <span style={{ color: 'var(--color-primary)', fontWeight: 950, marginRight: '0.5rem' }}>{idx + 1}.</span> {q.question_txt}
                                </div>
                             ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    {((activeTab === 'lessons' && !activeModule.video?.length) || (activeTab === 'live' && !activeModule.live_sessions?.length) || (activeTab === 'notes' && !activeModule.notes?.length) || (activeTab === 'assessments' && !activeModule.assessments?.length)) && (
                       <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 800 }}>No content available in this category.</div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </main>
      </div>

      <style>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .mobile-only-btn { display: none; }
          @media (max-width: 1024px) {
            .mobile-only-btn { display: block; }
            .curriculum-sidebar { position: fixed; inset: 0; right: auto; box-shadow: 20px 0 60px rgba(0,0,0,0.1); }
            .hide-on-mobile { display: none; }
          }
       `}</style>
    </div>
  );
};

const SubTab = ({ active, icon, label, onClick, color }) => (
  <button onClick={onClick} style={{ padding: '0.55rem 1.15rem', border: 'none', borderRadius: '1.15rem', backgroundColor: active ? 'var(--color-surface)' : 'transparent', color: active ? 'var(--color-text)' : 'var(--color-text-muted)', fontWeight: 950, fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: '0.55rem', boxShadow: active ? 'var(--shadow-sm)' : 'none' }}>
    <span style={{ color: active ? color : 'inherit' }}>{icon}</span> {label}
  </button>
);

const ContentViewItem = ({ icon, title, sub, color, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
    style={{ padding: '1.25rem 1.75rem', borderRadius: '2rem', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1.25rem', boxShadow: 'var(--shadow-sm)' }}
  >
    <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '1rem', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 950, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
        <p style={{ margin: 0, fontSize: '0.6rem', color: 'var(--color-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</p>
      </div>
    </div>
  </motion.div>
);

export default TrainerCurriculum;
