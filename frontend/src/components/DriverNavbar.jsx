import { useNavigate, useLocation } from 'react-router-dom';
import React from 'react';

const NAV_HEIGHT = 64;

function DriverNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname.startsWith(path);
  const [moreOpen, setMoreOpen] = React.useState(false);

  return (
    <>
      <header className="navbar driver-navbar" style={{ position: 'fixed', top: 0, left: 0, zIndex: 100, width: '100%', height: NAV_HEIGHT, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', borderBottom: '1px solid #e0eafc', padding: '0.5rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1200, margin: '0 auto', width: '100%', padding: '0 24px' }}>
          <div className="navbar-title" onClick={() => navigate('/driver/dashboard')} style={{ fontWeight: 800, fontSize: 26, color: '#0984e3', letterSpacing: 1, cursor: 'pointer', whiteSpace: 'nowrap', marginLeft: 0, paddingLeft: 0 }}>
            TakeMe
          </div>
          <nav className="navbar-links" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="navbar-link" style={isActive('/driver/dashboard') ? { background: '#e0eafc', color: '#111' } : {}} onClick={() => navigate('/driver/dashboard')}>Dashboard</button>
            <button className="navbar-link" style={isActive('/driver/present-rides') ? { background: '#e0eafc', color: '#111' } : {}} onClick={() => navigate('/driver/present-rides')}>Present Rides</button>
            <button className="navbar-link" style={isActive('/driver/scheduled-rides') ? { background: '#e0eafc', color: '#111' } : {}} onClick={() => navigate('/driver/scheduled-rides')}>Scheduled</button>
            <div style={{ position: 'relative' }}>
              <button className="navbar-link" onClick={() => setMoreOpen(v => !v)}>More ▾</button>
              {moreOpen && (
                <div style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', padding: 8, minWidth: 180 }}>
                  <button className="navbar-link" style={{ width: '100%', textAlign: 'left' }} onClick={() => { setMoreOpen(false); navigate('/driver/requests'); }}>Requests</button>
                  <button className="navbar-link" style={{ width: '100%', textAlign: 'left' }} onClick={() => { setMoreOpen(false); navigate('/driver/earnings'); }}>Earnings</button>
                  <button className="navbar-link" style={{ width: '100%', textAlign: 'left', color: '#dc2626', fontWeight: '700' }} onClick={() => { setMoreOpen(false); navigate('/emergency'); }}>🚨 Emergency</button>
                  <button className="navbar-link" style={{ width: '100%', textAlign: 'left' }} onClick={() => { setMoreOpen(false); navigate('/profile'); }}>Profile</button>
                  <button className="navbar-link" style={{ width: '100%', textAlign: 'left' }} onClick={() => { setMoreOpen(false); navigate('/help'); }}>Help</button>
                  <button className="navbar-link" style={{ width: '100%', textAlign: 'left' }} onClick={() => { setMoreOpen(false); navigate('/about'); }}>About</button>
                  <button className="navbar-link" style={{ width: '100%', textAlign: 'left' }} onClick={() => { setMoreOpen(false); navigate('/contact'); }}>Contact</button>
                </div>
              )}
            </div>
            {/* Settings removed by request */}
            <button className="navbar-link logout-link" onClick={() => { localStorage.removeItem('user'); navigate('/'); }} style={{ color: '#d63031', border: '1.5px solid #d63031', background: 'none', borderRadius: 6, fontWeight: 700, padding: '0.5rem 1rem', marginLeft: 4 }}>Logout</button>
          </nav>
        </div>
        <style>{`
          .driver-navbar .navbar-link {
            background: none;
            border: none;
            color: #222;
            font-weight: 600;
            font-size: 15px;
            padding: 0.5rem 0.8rem;
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.2s, color 0.2s;
            white-space: nowrap;
          }
          .driver-navbar .navbar-link:hover, .driver-navbar .navbar-link:focus {
            background: #e0eafc;
          }
          .driver-navbar .logout-link:hover, .driver-navbar .logout-link:focus {
            background: #ffeaea;
          }
          @media (max-width: 1200px) {
            .driver-navbar > div {
              max-width: 98vw !important;
            }
          }
          @media (max-width: 900px) {
            .driver-navbar .navbar-links {
              flex-direction: column;
              align-items: flex-end;
              gap: 8px;
              margin-right: 10px;
              width: auto;
            }
          }
        `}</style>
      </header>
      <div style={{ height: NAV_HEIGHT }} />
    </>
  );
}

export default DriverNavbar;