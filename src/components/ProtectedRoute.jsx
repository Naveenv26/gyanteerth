import { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { AUTH_API } from '../config';
import { useAuth } from '../shared/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, accessToken, loading: authLoading, logout } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const performSecurityCheck = async () => {
      // If auth is still loading, wait
      if (authLoading) return;

      // If no user/token locally, redirect immediately (base case)
      if (!user || !accessToken) {
        setIsVerifying(false);
        return;
      }

      // Check server validation
      try {
        // Use the user's ACTUAL role to determine which endpoint to call,
        // not just whether 'admin' is in the allowedRoles list.
        // This fixes multi-role routes like /complete-profile that allow all roles.
        let endpoint = `${AUTH_API}/security_check/`;
        if (user?.role === 'admin') {
          endpoint = `${AUTH_API}/security_check_admin/`;
        } else if (user?.role === 'trainer') {
          endpoint = `${AUTH_API}/security_check_trainer/`;
        }

        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          setIsVerifying(false);
        } else {
          // If server says no (401 or 403), logout and redirect
          console.error("Security check failed:", response.status);
          logout();
          setError("Session expired or unauthorized access.");
          setIsVerifying(false);
        }
      } catch (err) {
        console.error("Network error during security check:", err);
        // On network error, we might decide to let them in if local state is fine,
        // or block for safety. User wants "more secure", so we block.
        setError("Network error. Please try again.");
        setIsVerifying(false);
      }
    };

    performSecurityCheck();
  }, [authLoading, user, accessToken, allowedRoles, logout]);

  if (authLoading || isVerifying) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', textAlign: 'center', padding: '2rem' }}>
        <div style={{ position: 'relative', marginBottom: '2rem' }}>
          <div style={{ width: '80px', height: '80px', border: '4px solid var(--color-primary)20', borderRadius: '50%' }} />
          <Loader2 size={80} style={{ position: 'absolute', inset: 0, color: 'var(--color-primary)', animation: 'spin 1.5s linear infinite' }} />
          <ShieldCheck size={40} style={{ position: 'absolute', inset: 0, margin: 'auto', color: 'var(--color-primary)' }} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Security Verification</h2>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: '300px', margin: '0 auto', opacity: 0.8, animation: 'pulse 2s infinite' }}>
          Validating your session credentials. Please wait...
        </p>
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
        `}</style>
      </div>
    );
  }

  // If there's no user or token after verification
  if (!user || !accessToken || error) {
    return <Navigate to="/login" replace />;
  }

  // Double check role locally
  if (allowedRoles?.length > 0 && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'trainer') return <Navigate to="/trainer" replace />;
    return <Navigate to="/student" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
