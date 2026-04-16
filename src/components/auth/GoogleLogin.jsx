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

  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;

    const renderButton = () => {
      if (!window.google || !googleButtonRef.current || initializedRef.current) return;

      googleButtonRef.current.innerHTML = '';

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
      });

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard',
        size: 'large',
        theme: isDark ? 'filled_black' : 'outline',
        width: 380,
      });
      
      initializedRef.current = true;
    };

    if (window.google) {
      renderButton();
    } else {
      const checkInterval = setInterval(() => {
        if (window.google) {
          renderButton();
          clearInterval(checkInterval);
        }
      }, 500);
      return () => clearInterval(checkInterval);
    }

    return () => {
      // Don't cancel here if it causes re-renders to flash
      // window.google?.accounts.id.cancel();
    };
  }, [handleCredentialResponse, isDark]);

  return <div ref={googleButtonRef} className="flex justify-center min-h-[44px]" />;
};

export default GoogleLogin;
