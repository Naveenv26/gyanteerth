import React, { useRef, useCallback, useEffect } from 'react';
import { useTheme } from '../../shared/ThemeContext';
import { API_BASE } from '../../config';

const GoogleLogin = ({ onLoginSuccess, onLoginError }) => {
  const { isDark } = useTheme();
  const googleButtonRef = useRef(null);
  const initializedRef = useRef(false);

  const handleCredentialResponse = useCallback(async (response) => {
    try {
      const res = await fetch(`${API_BASE}/auth_checkpoint/google-signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id_token: response.credential
        })
      });

      const data = await res.json();

      if (res.ok) {
        if (onLoginSuccess) {
          onLoginSuccess(data);
        }
      } else {
        if (onLoginError) {
          onLoginError(data.message || 'Google Sign-In failed');
        }
      }
    } catch (err) {
      console.error(err);
      if (onLoginError) {
        onLoginError('Failed to connect to the server');
      }
    }
  }, [onLoginSuccess, onLoginError]);

  useEffect(() => {
    // Guard against StrictMode double-mount re-initialization
    if (initializedRef.current) return;

    /* global google */
    if (window.google && googleButtonRef.current) {
      initializedRef.current = true;

      window.google.accounts.id.initialize({
        client_id: "50391096209-j049mjc9nfqv7rncaldf4i4j8hjh285p.apps.googleusercontent.com",
        callback: handleCredentialResponse,
      });

      window.google.accounts.id.renderButton(
        googleButtonRef.current,
        {
          type: "standard",
          size: "large",
          theme: isDark ? "filled_black" : "outline",
          text: "continue_with",
          shape: "rectangular",
          // ...
          width: 380 // Must be a pixel NUMBER, not a CSS string like "100%"
        }
      );
    }

    return () => {
      // Allow re-initialization if component fully unmounts and remounts
      initializedRef.current = false;
    };
  }, [handleCredentialResponse]);

  return (
    <div className="w-full flex justify-center">
      <div ref={googleButtonRef} className="flex justify-center"></div>
    </div>
  );
};

export default GoogleLogin;
