import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'user';

const AuthContext = createContext({
  user: null,
  token: null,
  role: null,
  isAuthenticated: false,
  login: (_user) => {},
  logout: () => {},
  setUser: (_u) => {},
  validateToken: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Check if token is expired
  const isTokenExpired = (token) => {
    if (!token) return true;
    
    // 🚀 DEMO MODE: Mock tokens never expire
    if (token.startsWith('mock-token-')) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  };

  // Validate token and auto-logout if expired
  const validateToken = () => {
    if (user?.token && isTokenExpired(user.token)) {
      logout();
      return false;
    }
    return true;
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const userData = JSON.parse(raw);
        // Check if token is expired on app load
        if (userData?.token && !isTokenExpired(userData.token)) {
          // Normalize user data to ensure consistent field names
          const normalizedUser = {
            ...userData,
            phone: userData.phone || userData.phoneNumber,
            age: userData.age,
            location: userData.location
          };
          setUser(normalizedUser);
        } else {
          // Clear expired token
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Set up periodic token validation
  useEffect(() => {
    if (user?.token) {
      const interval = setInterval(() => {
        if (isTokenExpired(user.token)) {
          logout();
        }
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [user?.token]);

  const value = useMemo(() => {
    const token = user?.token || null;
    const role = user?.role || null;
    const isAuthenticated = Boolean(token) && !isTokenExpired(token);

    const login = (u) => {
      // Normalize user data to ensure consistent field names
      const normalizedUser = {
        ...u,
        phone: u.phone || u.phoneNumber,
        age: u.age,
        location: u.location
      };
      setUser(normalizedUser);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedUser)); } catch {}
    };

    const logout = () => {
      setUser(null);
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      if (typeof window !== 'undefined') {
        window.location.assign('/login');
      }
    };

    return { user, token, role, isAuthenticated, login, logout, setUser, validateToken };
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
