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

      if (res.ok) {
        onLoginSuccess?.(data);
      } else {
        onLoginError?.(data.message || 'Google Sign-In failed');
      }
    } catch (err) {
      console.error(err);
      onLoginError?.('Failed to connect to the server');
    }
  }, [onLoginSuccess, onLoginError]);

  useEffect(() => {
    if (!window.google || !googleButtonRef.current) return;

    // 🧹 Clear previous button (important for re-render)
    googleButtonRef.current.innerHTML = '';

    // 🚀 Initialize Google
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    });

    // 🎯 Render button
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      type: 'standard',
      size: 'large',
      theme: isDark ? 'filled_black' : 'outline',
      text: 'continue_with',
      shape: 'rectangular',
      width: 380,
    });

    return () => {
      window.google?.accounts.id.cancel();
    };
  }, [handleCredentialResponse, isDark]);

  return (
    <div className="w-full flex justify-center">
      <div ref={googleButtonRef} />
    </div>
  );
};

export default GoogleLogin;
