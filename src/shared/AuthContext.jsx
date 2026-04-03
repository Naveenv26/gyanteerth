import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Roles: 'guest', 'student', 'trainer', 'admin'
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
    };

    const storedUser = getCookie('lms_user');
    const storedAccessToken = getCookie('access_token');

    const initializeAuth = async () => {
      if (storedUser) {
        try {
          setUser(JSON.parse(decodeURIComponent(storedUser)));
          if (storedAccessToken) {
            setAccessToken(storedAccessToken);
          }
        } catch (e) {
          console.error("Failed to parse session");
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (userData, tokens) => {
    setUser(userData);
    if (tokens?.access_token) {
      setAccessToken(tokens.access_token);
      const expires = new Date();
      expires.setTime(expires.getTime() + (7 * 24 * 60 * 60 * 1000));
      document.cookie = `access_token=${tokens.access_token}; path=/; expires=${expires.toUTCString()}; SameSite=Strict`;
    }
    
    // Save metadata in secure cookie
    const expires = new Date();
    expires.setTime(expires.getTime() + (7 * 24 * 60 * 60 * 1000));
    const cookieData = { ...userData };
    document.cookie = `lms_user=${encodeURIComponent(JSON.stringify(cookieData))}; path=/; expires=${expires.toUTCString()}; SameSite=Strict`;
    
    // Refresh token stays in cookie (Secure, SameSite=Strict)
    if (tokens?.refresh_token) {
      document.cookie = `refresh_token=${tokens.refresh_token}; path=/; expires=${expires.toUTCString()}; SameSite=Strict`;
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    document.cookie = "lms_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, setAccessToken, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
