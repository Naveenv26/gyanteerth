import React, { useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../../shared/ThemeContext';
import { API_BASE } from '../../config';

const GoogleLogin = ({ onLoginSuccess, onLoginError }) => {
  const { isDark } = useTheme();
  const googleButtonRef = useRef(null);

  const handleCredentialResponse = useCallback(async (response) => {
    try {
      const res = await fetch(`${API_BASE}/auth_checkpoint/google-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: response.credential }),
      });

      const data = await res.json();

      if (res.ok) onLoginSuccess?.(data);
      else onLoginError?.(data.message || 'Google Sign-In failed');
    } catch {
      onLoginError?.('Server error');
    }
  }, [onLoginSuccess, onLoginError]);

  useEffect(() => {
    let interval;

    const renderButton = () => {
      if (!window.google || !googleButtonRef.current) return;

      clearInterval(interval);

      googleButtonRef.current.innerHTML = '';

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard',
        size: 'large',
        theme: isDark ? 'filled_black' : 'outline',
        width: 380,
      });
    };

    renderButton();
    interval = setInterval(renderButton, 300);

    return () => {
      clearInterval(interval);
      window.google?.accounts.id.cancel();
    };
  }, [handleCredentialResponse, isDark]);

  return <div ref={googleButtonRef} className="flex justify-center" />;
};

export default GoogleLogin;
