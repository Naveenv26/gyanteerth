import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { USER_API } from '../config';

const CertificateVerifyBox = () => {
  const [uuid, setUuid] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!uuid.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${USER_API}/certificate/${uuid.trim()}/verify`);
      if (response.ok) {
        const data = await response.json();
        setResult({ success: true, data });
      } else {
        const error = await response.json().catch(() => ({}));
        setResult({ success: false, message: error.message || 'The provided ID does not match any certificate in our registry.' });
      }
    } catch (err) {
      setResult({ success: false, message: 'Unable to connect to the verification server at this time.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleVerify} className="relative group">
        <input 
          type="text" 
          value={uuid}
          onChange={(e) => setUuid(e.target.value)}
          placeholder="Paste Certificate UUID (e.g. GT-ABCD-1234)"
          className="w-full pl-14 pr-36 py-5 bg-[var(--color-surface-muted)] border-2 border-[var(--color-border)] rounded-2xl text-[var(--color-text)] font-semibold placeholder-[var(--color-text-light)] focus:outline-none focus:border-[var(--color-primary)] transition-all shadow-sm"
        />
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-text-light)] group-focus-within:text-[var(--color-primary)] transition-colors">
          <Search size={22} />
        </div>
        <button 
          type="submit"
          disabled={loading || !uuid.trim()}
          className="absolute right-3 top-1/2 -translate-y-1/2 px-8 py-3 bg-[var(--color-primary)] text-white font-black rounded-xl hover:bg-[var(--color-primary-dark)] transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Verify'}
        </button>
      </form>

      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className={`p-6 rounded-[2rem] border-2 shadow-xl ${result.success ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'}`}
          >
            <div className="flex items-start gap-5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${result.success ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                {result.success ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
              </div>
              <div className="flex-1">
                <h4 className={`text-xl font-black ${result.success ? 'text-emerald-900' : 'text-red-900'}`}>
                  {result.success ? 'Certificate Authenticated' : 'Verification Failed'}
                </h4>
                <div className={`mt-1 text-sm font-bold leading-relaxed ${result.success ? 'text-emerald-700' : 'text-red-700'}`}>
                  {result.success ? (
                    <div className="space-y-1">
                      <p>This certificate was officially issued to <span className="text-emerald-900 font-black underline decoration-2 underline-offset-4">{result.data.user_name}</span>.</p>
                      <p>Course: <span className="text-emerald-900 font-extrabold">{result.data.course_name}</span></p>
                      <p className="text-[10px] uppercase tracking-widest opacity-70 mt-4">Verified by Gyanteerth Registry Protocol</p>
                    </div>
                  ) : result.message}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CertificateVerifyBox;
