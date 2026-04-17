import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, Lock, BookOpen, ArrowRight, X, KeyRound, RefreshCw, AlertCircle, Check, XCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../shared/AuthContext';
import GoogleLogin from '../../components/auth/GoogleLogin';
import { AUTH_API, USER_API, API_BASE } from '../../config';
import Logo from '../../components/Logo';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const Signup = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const [step, setStep] = useState(1);
  const [tempUserId, setTempUserId] = useState(null);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const passwordRequirements = [
    { regex: /[A-Z]/, text: "One uppercase letter" },
    { regex: /[a-z]/, text: "One lowercase letter" },
    { regex: /[0-9]/, text: "One number" },
    { regex: /[^A-Za-z0-9]/, text: "One special character" },
    { regex: /.{8,}/, text: "Minimum 8 characters" }
  ];

  const getPasswordStrength = () => {
    return passwordRequirements.map(req => ({
      met: req.regex.test(formData.password),
      text: req.text
    }));
  };
  const isPasswordValid = getPasswordStrength().every(req => req.met);

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length <= 10) {
      setFormData(prev => ({ ...prev, phone: value }));
      if (error) setError(null);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError('Please ensure your password meets all requirements');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth_checkpoint/signup_credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await response.json();

      if (response.ok && data.exists === false) {
        setTempUserId(data.user_id);
        setStep(2);
      } else {
        setError(data.message || data.detail?.[0]?.msg || 'Email may already exist or invalid request');
      }
    } catch (err) {
      setError('Failed to connect to the server');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      if (!tempUserId) {
        throw new Error('Verification session data missing. Please try signing up again.');
      }

      const response = await fetch(`${API_BASE}/auth_checkpoint/verify_otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ otp: otpString, user_id: tempUserId })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Use the ID from verification response if provided, otherwise stick with current
        const finalUserId = data.user_id || tempUserId;
        
        try {
          const pwResponse = await fetch(`${API_BASE}/auth_checkpoint/set_password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ 
              password: formData.password, 
              user_id: finalUserId 
            })
          });

          let pwData;
          try {
            pwData = await pwResponse.json();
          } catch (e) {
            // If it's 500, it might not be JSON
            throw new Error(`Server Error (500) during password setup. Please contact support.`);
          }

          if (pwResponse.ok && pwData.success) {
            alert('Registration and password set successfully! Please login.');
            navigate('/login');
          } else {
            setError(pwData.message || pwData.detail?.[0]?.msg || 'Failed to set password');
          }
        } catch (pwErr) {
          setError(pwErr.message || 'Failed to connect to the server for setting password');
          console.error('Set Password Error:', pwErr);
        }
      } else {
        setError(data.message || data.detail?.[0]?.msg || 'Invalid verification code');
      }
    } catch (err) {
      setError(err.message || 'Failed to verify OTP');
      console.error('Verification/Signup Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkProfileStatus = async (token) => {
    try {
      const response = await fetch(`${USER_API}/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const profile = await response.json();
        const isComplete = profile.user_name && profile.user_number && profile.user_dob && profile.user_gender;
        return !!isComplete;
      }
    } catch (err) {
      console.error("Profile check failed:", err);
    }
    return false;
  };

  const handleAuthSuccess = async (data) => {
    const signupRole = (data.role || 'student') === 'user' ? 'student' : (data.role || 'student');
    const isStudent = signupRole === 'student' || signupRole === 'user';
    
    login(
      { 
        user_id: data.user_id,
        email: data.email, 
        role: signupRole 
      },
      { access_token: data.access_token, refresh_token: data.refresh_token }
    );
    
    if (isStudent) {
      const isComplete = await checkProfileStatus(data.access_token);
      if (!isComplete) {
        navigate('/complete-profile');
        return;
      }
    }
    
    navigate(`/${signupRole}`);
  };

  const handleResendOTP = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth_checkpoint/signup_credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Failed to resend OTP');
      } else {
        // Successfully resent
        alert('OTP resent to your email');
        setTempUserId(data.user_id);
      }
    } catch (err) {
      setError('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next input
    if (element.value !== '' && element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '' && e.target.previousSibling) {
        e.target.previousSibling.focus();
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  return (
    <div className="min-h-screen w-full flex bg-[var(--color-bg)] overflow-hidden">
      {/* Left Branding Panel (Hidden on Mobile) */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex flex-col w-5/12 bg-gradient-to-br from-emerald-600 via-emerald-800 to-emerald-950 text-white p-12 relative"
      >
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1471&q=80')] mix-blend-overlay opacity-30 bg-cover bg-center grayscale contrast-125" />
        <div className="relative z-10 mb-auto">
          <Logo scale={0.8} isDark={true} />
        </div>
        <div className="relative z-10">
          <motion.h1
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-4xl xl:text-5xl font-extrabold leading-tight mb-6"
          >
            Unlock your <br /> learning potential
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-emerald-100 text-lg max-w-md"
          >
            Join thousands of students and highly qualified trainers building the future of education together.
          </motion.p>
        </div>
        <div className="relative z-10 mt-12 flex -space-x-4">
          <img className="w-12 h-12 rounded-full border-4 border-[var(--navy-900)]" src="https://i.pravatar.cc/100?img=1" alt="Student" />
          <img className="w-12 h-12 rounded-full border-4 border-[var(--navy-900)]" src="https://i.pravatar.cc/100?img=2" alt="Student" />
          <img className="w-12 h-12 rounded-full border-4 border-[var(--navy-900)]" src="https://i.pravatar.cc/100?img=3" alt="Student" />
          <div className="w-12 h-12 rounded-full border-4 border-[var(--navy-900)] bg-[var(--color-primary)] flex items-center justify-center text-sm font-bold shadow-lg text-white">+2k</div>
        </div>
      </motion.div>

      {/* Right Form Panel */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-24 xl:px-32 py-12 relative z-10 bg-[var(--color-bg)]">

        {/* Mobile Logo */}
        <div className="lg:hidden flex justify-center mb-8">
          <Logo scale={0.7} />
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-xl mx-auto bg-[var(--color-surface)] p-8 sm:p-12 rounded-[2.5rem] shadow-2xl border border-[var(--color-border)]"
        >
          <motion.div variants={itemVariants} className="text-center lg:text-left mb-8">
            <h2 className="text-3xl font-extrabold text-[var(--color-text)] tracking-tight">Create Account</h2>
            <p className="text-[var(--color-text-muted)] mt-2 font-medium">Join Gyanteerth and start learning today</p>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700"
            >
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              {/* Email */}
              <motion.div variants={itemVariants} className="relative group">
                <label className="text-sm font-semibold text-[var(--color-text)] mb-1 flex">Email Address</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-[var(--color-text-light)] group-focus-within:text-[var(--color-primary)] transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email" name="email" required placeholder="you@example.com"
                    value={formData.email} onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] placeholder-[var(--color-text-light)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all"
                  />
                </div>
              </motion.div>

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.div variants={itemVariants} className="relative group">
                  <label className="text-sm font-semibold text-[var(--color-text)] mb-1 flex">Password</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 text-[var(--color-text-light)] group-focus-within:text-[var(--color-primary)] transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'} name="password" required placeholder="••••••••"
                      value={formData.password} onChange={handleChange}
                      className="w-full pl-10 pr-10 py-3 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] placeholder-[var(--color-text-light)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-[var(--color-text-light)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </motion.div>
                <motion.div variants={itemVariants} className="relative group">
                  <label className="text-sm font-semibold text-[var(--color-text)] mb-1 flex">Confirm Password</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 text-[var(--color-text-light)] group-focus-within:text-[var(--color-primary)] transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'} name="confirmPassword" required placeholder="••••••••"
                      value={formData.confirmPassword} onChange={handleChange}
                      className="w-full pl-10 pr-10 py-3 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] placeholder-[var(--color-text-light)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-[var(--color-text-light)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </motion.div>
              </div>

              {/* Password Constraints UI */}
              {formData.password && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-xs sm:text-sm space-y-1.5 p-3 sm:p-4 bg-[var(--color-primary-bg)] rounded-xl border border-[var(--color-primary)]/10 overflow-hidden shadow-sm"
                >
                  <p className="font-semibold text-[var(--color-primary)] mb-2">Password requirements:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {getPasswordStrength().map((req, i) => (
                      <div key={i} className={`flex items-center gap-2 transition-colors duration-300 ${req.met ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-light)]'}`}>
                        {req.met ? <Check className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        <span className={req.met ? 'font-medium' : ''}>{req.text}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              <motion.div variants={itemVariants} className="pt-2 space-y-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-[0_4px_14px_0_rgba(5,150,105,0.39)] hover:shadow-[0_6px_20px_rgba(5,150,105,0.23)] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {loading ? 'Sending Code...' : (
                    <>Sign Up <ArrowRight className="w-5 h-5" /></>
                  )}
                </button>

                <div className="relative flex items-center justify-center py-2 px-4">
                  <div className="flex-grow border-t border-slate-300"></div>
                  <span className="flex-shrink mx-4 text-slate-500 text-xs font-bold uppercase tracking-wider">Or</span>
                  <div className="flex-grow border-t border-slate-300"></div>
                </div>

                <GoogleLogin 
                  onLoginSuccess={(data) => {
                    if (data.access_token) {
                      handleAuthSuccess(data);
                    }
                  }}
                  onLoginError={setError}
                />
              </motion.div>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-100 relative"
            >
              <button
                onClick={() => setStep(1)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                  <KeyRound className="w-8 h-8 text-emerald-600" />
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Verify your email</h3>
              <p className="text-slate-500 text-center text-sm mb-8 px-4">
                We've sent a 6-digit confirmation code to <br />
                <span className="font-semibold text-slate-800">{formData.email}</span>
              </p>

              <form onSubmit={handleVerifyOTP}>
                <div className="flex justify-between gap-2 mb-8">
                  {otp.map((data, index) => (
                    <input
                      key={index}
                      type="text"
                      name="otp"
                      maxLength="1"
                      value={data}
                      onChange={(e) => handleOtpChange(e.target, index)}
                      onFocus={(e) => e.target.select()}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                    />
                  ))}
                </div>

                <div className="flex flex-col gap-4">
                  <button
                    type="submit"
                    disabled={loading || otp.some(v => v === '')}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-[0_4px_14px_0_rgba(5,150,105,0.39)] hover:shadow-[0_6px_20px_rgba(5,150,105,0.23)] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none"
                  >
                    {loading ? 'Verifying...' : 'Verify Code'}
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" /> Resend Code
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="mt-8 text-center bg-[var(--color-surface-muted)] py-4 rounded-xl border border-[var(--color-border)]">
            <p className="text-[var(--color-text-muted)] text-sm font-medium">
              Already have an account?{' '}
              <Link to="/login" className="font-extrabold text-[var(--color-primary)] hover:underline underline-offset-4 transition-colors">
                Log in instead
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
