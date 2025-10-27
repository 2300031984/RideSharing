import { useNavigate } from 'react-router-dom';
import '../Styles/Home.css';

function Navbar({ showSupport = true, showProfile = true, showNotifications = true, showWallet = true, showEmergency = true, showReviews = true, showLogout = true }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user && user.role && user.role.toLowerCase() === 'admin';

  const links = [
    { label: 'Home', path: '/' },
    { label: 'Help', path: '/help' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
    showEmergency && { label: 'Emergency', path: '/emergency' },
    showProfile && { label: 'Profile', path: '/profile' },
    showNotifications && { label: 'Notifications', path: '/notifications' },
    showWallet && { label: 'Wallet', path: '/wallet' },
    showReviews && { label: 'Reviews', path: '/reviews' },
    showSupport && { label: 'Support', path: '/support' },
  ].filter(Boolean);

  return (
    <header className="navbar new-navbar" style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', borderBottom: '1px solid #e0eafc', padding: '0.5rem 0' }}>
      <div className="navbar-title" onClick={() => navigate('/')} style={{ fontWeight: 800, fontSize: 26, color: '#0984e3', letterSpacing: 1, cursor: 'pointer', marginLeft: 24, textShadow: '0 1px 4px rgba(255,255,255,0.7)' }}>
        TakeMe
      </div>
      <nav className="navbar-links" style={{ display: 'flex', gap: 18, marginRight: 24 }}>
        {links.map(link => (
          <button
            key={link.path}
            className="navbar-link"
            onClick={() => navigate(link.path)}
            style={{
              background: 'none',
              border: 'none',
              color: '#222',
              fontWeight: 600,
              fontSize: 16,
              padding: '0.5rem 0.8rem',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'background 0.2s, color 0.2s',
              textShadow: '0 1px 4px rgba(255,255,255,0.7)',
            }}
            onMouseOver={e => (e.currentTarget.style.background = '#e0eafc')}
            onMouseOut={e => (e.currentTarget.style.background = 'none')}
            onFocus={e => (e.currentTarget.style.background = '#e0eafc')}
            onBlur={e => (e.currentTarget.style.background = 'none')}
          >
            {link.label}
          </button>
        ))}
        {isAdmin && (
          <button
            className="navbar-link"
            onClick={() => navigate('/admin/dashboard')}
            style={{
              background: 'none',
              border: 'none',
              color: '#d63031',
              fontWeight: 700,
              fontSize: 16,
              padding: '0.5rem 0.8rem',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'background 0.2s, color 0.2s',
              textShadow: '0 1px 4px rgba(255,255,255,0.7)',
            }}
            onMouseOver={e => (e.currentTarget.style.background = '#ffeaea')}
            onMouseOut={e => (e.currentTarget.style.background = 'none')}
            onFocus={e => (e.currentTarget.style.background = '#ffeaea')}
            onBlur={e => (e.currentTarget.style.background = 'none')}
          >
            Admin
          </button>
        )}
        {user && showLogout && (
          <button 
            className="navbar-link logout-link" 
            onClick={() => { localStorage.removeItem('user'); navigate('/'); }} 
            style={{ color: '#d63031', border: '1.5px solid #d63031', background: 'none', borderRadius: 6, fontWeight: 700, padding: '0.5rem 1rem', marginLeft: 8 }}
          >
            Logout
          </button>
        )}
      </nav>
    </header>
  );
}

export default Navbar;