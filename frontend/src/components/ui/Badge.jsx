import React from 'react';

const VARIANTS = {
  gray: { bg: '#f3f4f6', color: '#111827', border: '#e5e7eb' },
  green: { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' },
  red: { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
  blue: { bg: '#eff6ff', color: '#1e3a8a', border: '#bfdbfe' },
  yellow: { bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
};

const Badge = ({ children, variant = 'gray' }) => {
  const v = VARIANTS[variant] || VARIANTS.gray;
  return (
    <span style={{ background: v.bg, color: v.color, border: `1px solid ${v.border}`, padding: '2px 8px', borderRadius: 9999, fontSize: 12, fontWeight: 700 }}>
      {children}
    </span>
  );
};

export default Badge;

