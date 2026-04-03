import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/AuthContext';
import { useTheme } from '../shared/ThemeContext';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { LayoutDashboard, Book, Users, Video, FileText, MessageSquare, LogOut, Menu, X, Compass, UserCog, ChevronUp, Folder, Search, Bell } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SidebarLink = ({ to, icon, label, currentPath }) => {
  const isRoot = ['/admin', '/trainer', '/student'].includes(to);
  const isActive = isRoot 
    ? currentPath === to || currentPath === `${to}/`
    : currentPath === to || currentPath.startsWith(`${to}/`);
    
  return (
    <Link
      to={to}
      className={`sidebar-link ${isActive ? 'active' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        padding: '0.65rem 1rem',
        borderRadius: 'var(--radius-md)',
        marginBottom: '0.15rem',
        textDecoration: 'none',
        color: isActive ? 'var(--color-sidebar-text-active)' : 'var(--color-sidebar-text)',
        fontWeight: isActive ? 900 : 700,
        fontSize: '0.85rem',
        backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: isActive ? '0 8px 16px rgba(16, 185, 129, 0.25)' : 'none'
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'var(--color-surface-muted)';
          e.currentTarget.style.paddingLeft = '1.25rem';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.paddingLeft = '1rem';
        }
      }}
    >
      <div style={{ flexShrink: 0, transition: 'transform 0.3s ease', display: 'flex' }}>
        {icon && React.cloneElement(icon, { size: 18 })}
      </div>
      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>{label}</span>
    </Link>
  );
};

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  // Close profile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Role-based navigation items
  const getNavItems = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { index: 0, to: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
          { index: 1, to: '/admin/categories', icon: <Folder size={20} />, label: 'Categories' },
          { index: 2, to: '/admin/users', icon: <Users size={20} />, label: 'Trainers' },
          { index: 3, to: '/admin/assessments', icon: <FileText size={20} />, label: 'Assessments' },
        ];
      case 'trainer':
        return [
          { to: '/trainer', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
          { to: '/trainer/courses', icon: <Book size={20} />, label: 'My Courses' },
          { to: '/trainer/live', icon: <Video size={20} />, label: 'Live Sessions' },
          { to: '/trainer/students', icon: <Users size={20} />, label: 'Students' },
        ];
      case 'student':
      default:
        return [
          { to: '/student', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
          { to: '/student/browse', icon: <Compass size={20} />, label: 'Browse Courses' },
          { to: '/student/courses', icon: <Book size={20} />, label: 'My Learning' },
          { to: '/student/certificates', icon: <FileText size={20} />, label: 'Certificates' },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', overflow: 'hidden' }}>
      
      {/* Sidebar - Coursera inspired high contrast */}
      <aside 
        style={{ 
          width: '260px', 
          backgroundColor: 'var(--color-navy-sidebar)', 
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 100,
          position: 'relative',
        }}
        className={`sidebar ${mobileMenuOpen ? 'mobile-open' : 'mobile-closed'}`}
      >
        <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
          <Logo scale={0.7} showTagline={false} isDark={useTheme().isDark} />
        </div>
        
        <div style={{ padding: '1.5rem 1.25rem', flex: 1, overflowY: 'auto' }}>
          <div style={{ marginBottom: '1.25rem', fontSize: '0.7rem', fontWeight: 900, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.15rem' }}>
            {user?.role} Portal
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {navItems.map((item) => (
              <SidebarLink
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                currentPath={location.pathname}
              />
            ))}
          </nav>
        </div>

        {/* Profile Section with Dropdown */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative' }} ref={profileMenuRef}>
          
          <AnimatePresence>
            {profileMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '1rem',
                  right: '1rem',
                  marginBottom: '0.75rem',
                  backgroundColor: 'var(--color-surface)',
                  borderRadius: '1.25rem',
                  boxShadow: 'var(--shadow-xl)',
                  overflow: 'hidden',
                  zIndex: 150,
                  border: '1px solid var(--color-border)'
                }}
              >
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    const isStudent = user?.role === 'student' || user?.role === 'user';
                    if (isStudent) {
                      navigate('/complete-profile');
                    } else {
                      // Non-students stay on their dashboard or go to a generic settings page if exists
                      // For now, just stay/refresh dashboard to avoid 403
                      navigate(`/${user?.role}`);
                    }
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    color: 'var(--color-text)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-muted)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <UserCog size={18} style={{ color: 'var(--color-primary)' }} />
                  <span>Update Profile</span>
                </button>
                <div style={{ height: '1px', backgroundColor: 'var(--color-border)' }} />
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    logout();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    color: '#ef4444',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <LogOut size={18} />
                  <span>Logout Account</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Clickable Profile Area */}
          <button 
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            style={{ 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              padding: '0.75rem',
              background: profileMenuOpen ? 'rgba(255,255,255,0.08)' : 'transparent', 
              border: '1px solid transparent',
              borderColor: profileMenuOpen ? 'rgba(255,255,255,0.1)' : 'transparent',
              cursor: 'pointer', 
              borderRadius: '1.25rem', 
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              textAlign: 'left'
            }}
          >
            <div style={{ backgroundColor: 'var(--color-primary)', color: 'white', minWidth: '2.5rem', height: '2.5rem', borderRadius: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '950', fontSize: '1rem', border: '2px solid var(--color-border)' }}>
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.name || 'User'}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.email}</div>
            </div>
            <ChevronUp 
              size={16} 
              style={{ 
                color: 'var(--color-text-light)', 
                flexShrink: 0,
                transition: 'transform 0.4s ease',
                transform: profileMenuOpen ? 'rotate(0deg)' : 'rotate(180deg)'
              }} 
            />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', position: 'relative', backgroundColor: 'var(--color-bg)' }}>
        
        {/* Top Header - Desktop Only */}
        <header style={{ 
          height: '70px', 
          backgroundColor: 'var(--color-surface)', 
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
          zIndex: 40
        }} className="hidden md:flex">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
            <div style={{ position: 'relative', maxWidth: '400px', width: '100%' }}>
               <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
               <input 
                type="text" 
                placeholder="Search resources, courses..." 
                style={{ 
                  width: '100%', 
                  padding: '0.75rem 1rem 0.75rem 2.75rem', 
                  borderRadius: 'var(--radius-md)', 
                  border: '1px solid var(--color-border)', 
                  backgroundColor: 'var(--color-surface-muted)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--color-text)'
                }}
               />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <ThemeToggle />
          </div>
        </header>

        {/* Mobile Header */}
        <header className="mobile-header" style={{ display: 'none', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', zIndex: 50 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
             <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border)', color: 'var(--color-text)', cursor: 'pointer', display: 'flex', padding: '0.5rem', borderRadius: '0.75rem' }}>
               <Menu size={22} />
             </button>
             <span style={{ fontWeight: 950, fontSize: '1rem', color: 'var(--color-text)', letterSpacing: '-0.02em' }}>Gyanteerth</span>
           </div>
           <ThemeToggle />
        </header>

        {/* Page Content with Motion Orchestration */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: 'var(--page-padding)' }}>
          <div className="max-container" style={{ maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
      
      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)', zIndex: 90 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardLayout;
