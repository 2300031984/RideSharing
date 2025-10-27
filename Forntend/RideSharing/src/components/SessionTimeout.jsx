import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const SessionTimeout = () => {
  const { user, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!user?.token) return;

    // Check token expiration every minute
    const checkTokenExpiration = () => {
      try {
        const payload = JSON.parse(atob(user.token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        const timeUntilExpiry = payload.exp - currentTime;
        
        // Show warning when 5 minutes or less remain
        if (timeUntilExpiry <= 300 && timeUntilExpiry > 0) {
          setShowWarning(true);
          setTimeLeft(Math.floor(timeUntilExpiry / 60));
        } else if (timeUntilExpiry <= 0) {
          logout();
        }
      } catch (error) {
        logout();
      }
    };

    // Check immediately
    checkTokenExpiration();

    // Set up interval to check every minute
    const interval = setInterval(checkTokenExpiration, 60000);

    return () => clearInterval(interval);
  }, [user?.token, logout]);

  const handleExtendSession = () => {
    // For now, just hide the warning
    // In a real app, you might refresh the token here
    setShowWarning(false);
  };

  const handleLogout = () => {
    logout();
  };

  if (!showWarning) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: '#f59e0b',
      color: 'white',
      padding: '12px 20px',
      textAlign: 'center',
      zIndex: 9999,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <span style={{ fontSize: 16 }}>⚠️</span>
        <span style={{ fontWeight: 600 }}>
          Your session will expire in {timeLeft} minute{timeLeft !== 1 ? 's' : ''}. 
          Please save your work and refresh the page to extend your session.
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleExtendSession}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 4,
              padding: '4px 12px',
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            Refresh Session
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 4,
              padding: '4px 12px',
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeout;
