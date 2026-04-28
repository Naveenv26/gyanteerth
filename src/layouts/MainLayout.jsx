import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate, ScrollRestoration } from 'react-router-dom';
import { 
  LogIn, 
  LogOut, 
  LayoutDashboard, 
  ChevronRight, 
  Sparkles, 
  ShoppingBag, 
  Users, 
  HelpCircle,
  Mail,
  ShieldCheck,
  X
} from 'lucide-react';
import { useAuth } from '../shared/AuthContext';
import { useTheme } from '../shared/ThemeContext';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import CertificateVerifyBox from '../components/CertificateVerifyBox';

const MainLayout = () => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Courses', path: '/courses' },
  ];

  const dummyLinks = [
    { name: 'Our Products', path: '/under-construction', icon: ShoppingBag },
    { name: 'About Us', path: '/under-construction', icon: Users },
    { name: 'Pricing', path: '/under-construction', icon: Sparkles },
    { name: 'Support', path: '/under-construction', icon: HelpCircle },
    { name: 'Contact', path: '/under-construction', icon: Mail },
  ];

  return (
    <div className="flex flex-col min-h-screen w-full bg-[var(--color-bg)] font-sans text-[var(--color-text)] selection:bg-emerald-500/30">
      <ScrollRestoration />
      
      {/* 🛡️ Verification Modal Overlay */}
      <AnimatePresence>
        {isVerifyModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsVerifyModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-[var(--color-surface)] p-8 md:p-12 rounded-[3rem] shadow-2xl border border-[var(--color-border)] overflow-hidden"
            >
              <button 
                onClick={() => setIsVerifyModalOpen(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={24} />
              </button>

              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-[var(--color-primary-bg)] text-[var(--color-primary)] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <ShieldCheck size={32} />
                </div>
                <h2 className="text-3xl font-black text-[var(--color-text)] tracking-tight mb-3">Verify Certificate</h2>
                <p className="text-[var(--color-text-muted)] font-bold">Secure verification protocol for Gyanteerth credentials.</p>
              </div>

              <CertificateVerifyBox />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Modern Navbar */}
      <header 
        className={`sticky top-0 z-[100] w-full transition-all duration-300 ${
          isScrolled 
          ? 'bg-[var(--color-surface)]/80 backdrop-blur-xl border-b border-[var(--color-border)] py-3 shadow-xl' 
          : 'bg-[var(--color-bg)] py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between relative">
            
            {/* ⬅️ Left Section: Logo + Navigation Links */}
            <div className="flex-1 flex items-center gap-12">
              <div className="flex-shrink-0 hover:scale-105 transition-transform">
                <Link to="/">
                  <Logo scale={0.75} showTagline={false} />
                </Link>
              </div>
              <nav className="hidden xl:flex items-center gap-8">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
                      className={`relative text-sm font-extrabold tracking-wide transition-all ${
                        isActive ? 'text-[var(--color-primary)] underline decoration-emerald-500/30 underline-offset-8 decoration-4' : 'text-[var(--color-text-muted)] hover:text-[var(--color-primary)]'
                      }`}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* 🎯 Center Section: Verification Button */}
            <div className="flex items-center justify-center flex-shrink-0">
              <button 
                onClick={() => setIsVerifyModalOpen(true)}
                className="flex items-center gap-2 px-8 py-3 bg-white border-2 border-emerald-500/20 text-emerald-800 text-sm font-black rounded-2xl hover:bg-emerald-50 hover:border-emerald-500/50 transition-all shadow-sm transform hover:-translate-y-0.5 active:scale-95"
              >
                <ShieldCheck size={20} className="text-emerald-600" /> 
                <span className="tracking-tight">Verify Credential</span>
              </button>
            </div>

            {/* ➡️ Right Section: Theme Toggle + User Actions */}
            <div className="flex-1 flex items-center justify-end gap-5">
              <ThemeToggle />
              <div className="flex items-center gap-4 border-l border-[var(--color-border)] pl-5">
                {user ? (
                  <div className="flex items-center gap-4">
                    <Link 
                      to={`/${user.role}`} 
                      className="hidden md:flex items-center gap-2 text-sm font-bold text-slate-700 bg-white border-2 border-slate-100 hover:border-emerald-500/30 hover:bg-emerald-50 px-5 py-2.5 rounded-2xl transition-all shadow-sm"
                    >
                      <LayoutDashboard className="w-4 h-4 text-emerald-600" /> Dashboard
                    </Link>
                    <button 
                      onClick={logout} 
                      className="flex items-center gap-2 text-sm font-bold text-white bg-slate-900 hover:bg-rose-600 px-5 py-2.5 rounded-2xl transition-all hover:-translate-y-0.5"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <Link 
                      to="/login" 
                      className="group flex items-center gap-2 text-sm font-black bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 px-7 py-3 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all"
                    >
                      <span className="text-white group-hover:text-orange-400 transition-colors">Sign In</span>
                      <LogIn className="w-4 h-4 text-white group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 bg-[var(--color-bg)] relative">
        <Outlet />
      </main>

      {/* Premium Footer with Navy Blue Theme */}
      <footer className="bg-[#0a192f] border-t border-white/5 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -mr-48 -mt-48" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 lg:gap-12">
            <div className="md:col-span-2">
              <Logo scale={0.8} showTagline={false} isDark={true} />
              <p className="mt-8 text-slate-300 leading-relaxed max-w-sm font-medium text-sm">
                Elevating the educational journey through high-impact interactive sessions and premium knowledge sharing. Accelerating human potential since inception.
              </p>
              <div className="mt-10 flex gap-4">
                {['Twitter', 'Instagram', 'LinkedIn'].map(social => (
                  <div key={social} className="w-12 h-12 bg-white/5 hover:bg-emerald-600 border border-white/10 text-slate-400 hover:text-white rounded-2xl flex items-center justify-center cursor-pointer transition-all hover:-translate-y-1">
                    <div className="w-5 h-5 bg-current rounded-sm" />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-[11px] font-black tracking-[0.3em] text-orange-400 uppercase mb-10">Ecosystem</h4>
              <ul className="space-y-5">
                {dummyLinks.slice(0, 3).map(link => (
                  <li key={link.name}>
                    <Link to={link.path} className="text-slate-400 hover:text-emerald-400 font-bold text-sm transition-colors flex items-center gap-2">
                      <ChevronRight className="w-3 h-3" /> {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[11px] font-black tracking-[0.3em] text-orange-400 uppercase mb-10">Support</h4>
              <ul className="space-y-5">
                {dummyLinks.slice(3).map(link => (
                  <li key={link.name}>
                    <Link to={link.path} className="text-slate-400 hover:text-emerald-400 font-bold text-sm transition-colors flex items-center gap-2">
                      <ChevronRight className="w-3 h-3" /> {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="mt-24 pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col gap-2">
              <p className="text-slate-500 text-[10px] font-black tracking-widest uppercase">
                &copy; {new Date().getFullYear()} GYANTEERTH PLATFORM.
              </p>
              <p className="text-slate-600 text-[9px] font-bold">ALL RIGHTS RESERVED. EMPOWERING MINDS PERSON BY PERSON.</p>
            </div>
            <div className="flex items-center gap-8 text-slate-500 text-[11px] font-black uppercase tracking-widest">
              <Link to="/under-construction" className="hover:text-orange-400 transition-colors">Privacy</Link>
              <Link to="/under-construction" className="hover:text-orange-400 transition-colors">Terms</Link>
              <Link to="/under-construction" className="hover:text-orange-400 transition-colors">Policies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
