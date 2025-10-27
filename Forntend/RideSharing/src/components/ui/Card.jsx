import React from 'react';

const Card = ({ title, actions, children, style }) => {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.03)', ...style }}>
      {(title || actions) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid #eef2f7' }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
          <div>{actions}</div>
        </div>
      )}
      <div style={{ padding: 14 }}>
        {children}
      </div>
    </div>
  );
};

export default Card;

