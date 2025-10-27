import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer style={{ width: '100%', background: '#f7fbfd', padding: '2rem 0 1.5rem 0', textAlign: 'center', color: '#636e72', fontSize: 16, marginTop: 40, borderTop: '1.5px solid #e0eafc', letterSpacing: 0.2 }}>
    <div style={{ marginBottom: 10 }}>
      &copy; {new Date().getFullYear()} TakeMe. All rights reserved.
    </div>
    <div style={{ marginBottom: 4 }}>
      <Link to="/terms" style={{ color: '#0984e3', marginRight: 22, textDecoration: 'underline', fontWeight: 500 }}>Terms</Link>
      <Link to="/privacy" style={{ color: '#0984e3', textDecoration: 'underline', fontWeight: 500 }}>Privacy</Link>
    </div>
  </footer>
);

export default Footer; 