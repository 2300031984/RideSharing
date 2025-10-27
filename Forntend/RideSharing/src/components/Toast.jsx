import React, { useEffect } from 'react';

const Toast = ({ message, type = 'info', onClose, duration = 2500 }) => {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => onClose && onClose(), duration);
    return () => clearTimeout(t);
  }, [message, duration, onClose]);

  if (!message) return null;

  const bg = type === 'error' ? '#fde8e8' : type === 'success' ? '#e6ffed' : '#e6f4ff';
  const border = type === 'error' ? '#f8b4b4' : type === 'success' ? '#abefc6' : '#b3e0ff';
  const color = '#111';

  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999 }}>
      <div style={{ background: bg, border: `1px solid ${border}`, color, padding: '10px 14px', borderRadius: 8, minWidth: 220, boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }}>
        {message}
      </div>
    </div>
  );
};

export default Toast;
