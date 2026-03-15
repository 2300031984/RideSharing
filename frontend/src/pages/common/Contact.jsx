import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import '../../Styles/Help.css';

const OWNER_EMAIL = 'takeme@ridesharing.com';

const getDashboardRoute = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.role === 'driver') return '/driver/dashboard';
  if (user && user.role === 'user') return '/user/dashboard';
  return '/';
};

const Contact = () => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sent, setSent] = useState(false);
  const dashboardRoute = getDashboardRoute();

  const handleMail = (e) => {
    e.preventDefault();
    const mailto = `mailto:${OWNER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    setSubject('');
    setBody('');
  };

  return (
    <div className="help-page">
      <Navbar showSupport={false} showEmergency={false} showProfile={false} showNotifications={false} showWallet={false} showReviews={false} />

      <section className="help-hero contact-hero">
        <div className="help-hero-inner">
          <h1 className="help-title">Contact</h1>
          <p className="help-subtitle">We'd love to hear from you! Reach out for questions, support, or feedback.</p>
          <div className="help-search" style={{ maxWidth: 560 }}>
            <input disabled placeholder={`Email: ${OWNER_EMAIL}`} />
            <button type="button" onClick={() => (window.location.href = `mailto:${OWNER_EMAIL}`)}>Email us</button>
          </div>
        </div>
      </section>

      <section className="help-sections">
        <div className="help-sections-inner">
          <div className="faq-card">
            <h2>Send a message</h2>
            <form onSubmit={handleMail} style={{ display: 'grid', gap: 10 }}>
              <input id="subject" type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" required />
              <textarea id="body" rows={6} value={body} onChange={e => setBody(e.target.value)} placeholder="Message" required />
              <button type="submit">Open email app</button>
              {sent && <div style={{ color: '#9ef5d1' }}>Message window opened!</div>}
            </form>
          </div>

          <aside className="quick-card">
            <h2>Quick links</h2>
            <div className="quick-actions">
              <a href={`mailto:${OWNER_EMAIL}`}>Mail support</a>
              <Link to="/help">Help Center</Link>
              <Link to="/terms">Terms</Link>
              <Link to="/privacy">Privacy</Link>
            </div>
            <div style={{ marginTop: 10 }}>
              <Link to={dashboardRoute} style={{ color: '#0f172a', background: '#1fd1f9', border: '1px solid #1fd1f9', borderRadius: 12, padding: '10px 14px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
                ← Back to {dashboardRoute === '/' ? 'Home' : dashboardRoute === '/user/dashboard' ? 'User Dashboard' : 'Driver Dashboard'}
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;