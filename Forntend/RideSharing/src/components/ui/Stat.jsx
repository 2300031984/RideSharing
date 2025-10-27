import React from 'react';

const Stat = ({ label, value, icon, trend, color = '#111827' }) => {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
      {icon && <div style={{ fontSize: 22 }}>{icon}</div>}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
        {trend && <div style={{ fontSize: 12, color: trend.startsWith('+') ? '#059669' : '#b91c1c' }}>{trend}</div>}
      </div>
    </div>
  );
};

export default Stat;

