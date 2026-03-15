import React from 'react';

const Notifications = () => (
  <div style={{ maxWidth: 600, margin: '3rem auto', padding: '2rem', background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
    <h1 style={{ color: '#0984e3', fontWeight: 800, fontSize: 32, marginBottom: 18 }}>Notifications</h1>
    <p style={{ color: '#636e72', fontSize: 18, marginBottom: 24 }}>All your ride updates, promotions, and system messages will appear here.</p>
    <div style={{ color: '#636e72', fontSize: 17 }}>No notifications yet.</div>
  </div>
);

export default Notifications; 