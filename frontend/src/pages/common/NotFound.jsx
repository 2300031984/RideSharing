import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
  <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)' }}>
    <h1 style={{ fontSize: 80, color: '#d63031', fontWeight: 900, marginBottom: 0 }}>404</h1>
    <h2 style={{ color: '#636e72', fontWeight: 700, fontSize: 32, marginBottom: 18 }}>Page Not Found</h2>
    <p style={{ color: '#636e72', fontSize: 18, marginBottom: 32 }}>Sorry, the page you are looking for does not exist.</p>
    <Link to="/" style={{ color: '#0984e3', textDecoration: 'underline', fontSize: 18, fontWeight: 600 }}>Go to Home</Link>
  </div>
);

export default NotFound; 