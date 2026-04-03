import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LogIn, 
  UserPlus, 
  LogOut, 
  LayoutDashboard, 
  Menu, 
  X, 
  ChevronRight, 
  Sparkles, 
  ShoppingBag, 
  Users, 
  HelpCircle,
  Mail,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../shared/AuthContext';
import { useTheme } from '../shared/ThemeContext';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';

const MainLayout = () => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <div className="flex flex-col min-h-screen w-full bg-[var(--color-bg)] font-sans text-[var(--color-text)] selection:bg-emerald-500/30">
      
      {/* Dynamic Modern Navbar */}
      <header 
        className={`sticky top-0 z-[100] w-full transition-all duration-300 ${
          isScrolled 
          ? 'bg-[var(--color-surface)]/80 backdrop-blur-xl border-b border-[var(--color-border)] py-3 shadow-xl' 
          : 'bg-[var(--color-bg)] py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo area */}
            <div className="flex-shrink-0 hover:scale-105 transition-transform">
              <Link to="/">
                <Logo scale={0.75} showTagline={false} />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-10">
              <div className="flex items-center gap-8">
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
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 pl-8 border-l border-[var(--color-border)]">
                <ThemeToggle />
                {user ? (
                  <div className="flex items-center gap-4">
                    <Link 
                      to={`/${user.role}`} 
                      className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-white border-2 border-slate-100 hover:border-emerald-500/30 hover:bg-emerald-50 px-5 py-2.5 rounded-2xl transition-all shadow-sm shadow-slate-200/50"
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
                      className="group flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 px-5 py-3 rounded-2xl transition-all animate-none"
                    >
                      <LogIn className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" /> Sign In
                    </Link>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                      <Link 
                        to="/signup" 
                        className="group flex items-center gap-2 text-sm font-black bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 px-7 py-3 rounded-2xl shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all"
                      >
                        <span className="text-white group-hover:text-orange-400 transition-colors">Start Free</span>
                        <Sparkles className="w-4 h-4 text-white group-hover:text-orange-400 group-hover:rotate-12 transition-all" />
                      </Link>
                    </motion.div>
                  </div>
                )}
              </div>
            </nav>

            {/* Mobile menu button toggle */}
            <div className="flex items-center gap-3">
               {!user && (
                 <Link to="/signup" className="md:hidden text-xs font-black text-white bg-emerald-600 px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20">Sign Up</Link>
               )}
               <ThemeToggle className="md:hidden" />
               <button 
                onClick={toggleMobileMenu}
                className="text-[var(--color-text)] hover:text-[var(--color-primary)] p-2.5 bg-[var(--color-surface-muted)] rounded-xl hover:bg-[var(--color-primary-bg)]"
               >
                 {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
               </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modern Sidebar / Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMobileMenu}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-sm bg-[var(--color-surface)] z-[201] shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-primary)] text-white">
                <Logo scale={0.6} showTagline={false} />
                <button 
                  onClick={toggleMobileMenu}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-10 px-6 space-y-10">
                {/* Main Links */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                    <div className="h-[1px] w-4 bg-slate-200" /> Essential Links
                  </h4>
                  <div className="grid gap-3">
                    {navLinks.map((link) => (
                      <Link 
                        key={link.name} 
                        to={link.path} 
                        onClick={toggleMobileMenu}
                        className="flex items-center justify-between p-4 rounded-3xl bg-slate-50 hover:bg-emerald-50 text-slate-800 font-black group transition-all"
                      >
                        {link.name}
                        <ArrowRight className="w-4 h-4 text-emerald-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Explore Links (Our Products, About, etc.) */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                    <div className="h-[1px] w-4 bg-slate-200" /> Explore Gyanteerth
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {dummyLinks.map((link) => {
                      const Icon = link.icon;
                      return (
                        <Link 
                          key={link.name} 
                          to={link.path}
                          onClick={toggleMobileMenu}
                          className="flex items-center gap-4 p-4 rounded-3xl hover:bg-orange-50 text-slate-600 hover:text-orange-700 font-bold group transition-all"
                        >
                          <div className="w-10 h-10 bg-slate-100 group-hover:bg-orange-100 text-slate-400 group-hover:text-orange-500 rounded-xl flex items-center justify-center transition-colors">
                            <Icon className="w-5 h-5" />
                          </div>
                          {link.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Account Section for Mobile */}
                {!user && (
                  <div className="pt-6">
                    <Link 
                      to="/login"
                      onClick={toggleMobileMenu}
                      className="flex items-center justify-center p-5 rounded-3xl border-2 border-emerald-600 text-emerald-700 font-black hover:bg-emerald-50 transition-all mb-4"
                    >
                      Member Login
                    </Link>
                    <Link 
                      to="/signup"
                      onClick={toggleMobileMenu}
                      className="flex items-center justify-center p-5 rounded-3xl bg-emerald-600 text-white font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20"
                    >
                      Join Platform
                    </Link>
                  </div>
                )}
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100">
                <p className="text-center text-[11px] font-bold text-slate-400 italic">"Empowering minds with knowledge"</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
