import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, Phone, Calendar, MapPin, Camera, ArrowRight, 
  CheckCircle2, AlertCircle, LogOut, ChevronRight, BookOpen
} from 'lucide-react';
import { useAuth } from '../../shared/AuthContext';
import { USER_API, API_BASE } from '../../config';

const CompleteProfile = () => {
  const { user, authFetch, login, logout } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    user_name: '',
    user_number: '',
    user_dob: '',
    user_gender: '',
    user_city: '',
    user_state: ''
  });
  const [profilePic, setProfilePic] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const fetchCurrentProfile = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const response = await authFetch(`${USER_API}/profile`, {
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const profile = await response.json();
          setFormData({
            user_name: profile.user_name || '',
            user_number: profile.user_number || '',
            user_dob: profile.user_dob || '',
            user_gender: profile.user_gender || '',
            user_city: profile.user_city || '',
            user_state: profile.user_state || ''
          });
          if (profile.user_pic) setPreviewUrl(profile.user_pic);
        } else {
          if (response.status === 401) {
            logout();
            navigate('/login');
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setFetchingProfile(false);
      }
    };

    fetchCurrentProfile();
  }, [authFetch, user, navigate, logout]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Image size should be less than 2MB");
        return;
      }
      setProfilePic(file);
      setPreviewUrl(URL.createObjectURL(file));
      if (error) setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const requiredFields = ['user_name', 'user_number', 'user_dob', 'user_gender', 'user_city', 'user_state'];
    const missingFields = requiredFields.filter(field => !formData[field]);

    if (missingFields.length > 0) {
      setError("Please fill all required fields");
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      if (profilePic) {
        data.append('user_pic', profilePic);
      }

      const response = await authFetch(`${USER_API}/update_profile`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json'
        },
        body: data
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        const updatedUser = { ...user, name: formData.user_name, pic: result.user_pic || previewUrl };
        login(updatedUser);
        
        setTimeout(() => {
          navigate(`/${user.role}`);
        }, 1500);
      } else {
        setError(result.message || result.detail?.[0]?.msg || "Failed to update profile");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate(`/${user.role}`);
  };

  if (fetchingProfile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const filledCount = ['user_name', 'user_number', 'user_dob', 'user_gender', 'user_city', 'user_state']
    .filter(k => formData[k]).length;
  const progress = Math.round((filledCount / 6) * 100);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col relative overflow-hidden" style={{ color: 'var(--color-text)' }}>
      
      {/* Subtle background decoration */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-100/30 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] bg-orange-100/20 rounded-full blur-[100px]" />
      </div>

      {/* Top Bar */}
      <header className="w-full border-b border-[var(--color-border)] bg-[var(--color-surface)]/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-emerald-700 font-bold text-lg">
            <BookOpen className="w-5 h-5" />
            <span>Gyanteerth</span>
          </Link>
          <button 
            onClick={logout}
            className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-red-500 transition-colors text-sm font-semibold"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-start justify-center px-4 py-12 sm:py-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl"
        >
          {success ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-100 flex flex-col items-center justify-center text-center py-20"
            >
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-5">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Profile Updated!</h3>
              <p className="text-slate-500 text-sm">Redirecting to your dashboard...</p>
            </motion.div>
          ) : (
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
              
              {/* Emerald accent strip */}
              <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-orange-400" />

              <div className="p-8 sm:p-10">
                {/* Header with progress */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                  <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Complete your profile</h1>
                    <p className="text-slate-500 mt-1 text-sm">Fill in the details to get started.</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-500">{progress}%</span>
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 flex items-center gap-3 text-sm font-medium"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Profile Picture */}
                  <div className="flex items-center gap-5 mb-8 p-5 bg-slate-50/70 rounded-2xl border border-slate-100">
                    <div className="relative group shrink-0">
                      <div className="w-20 h-20 rounded-2xl border-2 border-slate-200 overflow-hidden bg-white shadow-sm">
                        {previewUrl ? (
                          <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <User className="w-10 h-10" />
                          </div>
                        )}
                      </div>
                      <label 
                        htmlFor="pic-upload"
                        className="absolute -bottom-1.5 -right-1.5 w-8 h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center cursor-pointer shadow-lg shadow-emerald-600/30 transition-all hover:scale-110"
                      >
                        <Camera className="w-4 h-4" />
                      </label>
                      <input id="pic-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">Profile photo</p>
                      <p className="text-xs text-slate-400 mt-0.5">JPG or PNG. Max 2MB.</p>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Full Name */}
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Full Name</label>
                      <div className="relative group">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          name="user_name" type="text" placeholder="John Doe"
                          value={formData.user_name} onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 focus:bg-white outline-none transition-all text-sm font-medium text-slate-800 placeholder-slate-400"
                          required
                        />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Phone Number</label>
                      <div className="relative group">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          name="user_number" type="tel" placeholder="+91 00000 00000"
                          value={formData.user_number} onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 focus:bg-white outline-none transition-all text-sm font-medium text-slate-800 placeholder-slate-400"
                          required
                        />
                      </div>
                    </div>

                    {/* DOB */}
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Date of Birth</label>
                      <div className="relative group">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          name="user_dob" type="date"
                          value={formData.user_dob} onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 focus:bg-white outline-none transition-all text-sm font-medium text-slate-800"
                          required
                        />
                      </div>
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Gender</label>
                      <select 
                        name="user_gender"
                        value={formData.user_gender} onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 focus:bg-white outline-none transition-all text-sm font-medium text-slate-800 appearance-none"
                        required
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* City */}
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">City</label>
                      <div className="relative group">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          name="user_city" type="text" placeholder="e.g. Mumbai"
                          value={formData.user_city} onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 focus:bg-white outline-none transition-all text-sm font-medium text-slate-800 placeholder-slate-400"
                          required
                        />
                      </div>
                    </div>

                    {/* State */}
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">State</label>
                      <div className="relative group">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          name="user_state" type="text" placeholder="e.g. Maharashtra"
                          value={formData.user_state} onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 focus:bg-white outline-none transition-all text-sm font-medium text-slate-800 placeholder-slate-400"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-10 pt-8 border-t border-slate-100">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
                    >
                      {loading ? "Saving..." : (
                        <>Save & Continue <ArrowRight className="w-4 h-4" /></>
                      )}
                    </motion.button>
                    <button
                      type="button"
                      onClick={handleSkip}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-semibold text-sm rounded-xl transition-all"
                    >
                      Skip for now <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default CompleteProfile;
