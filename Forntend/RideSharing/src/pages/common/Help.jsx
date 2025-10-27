import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import '../../Styles/Help.css';

const Help = () => {
  const [query, setQuery] = useState('');

  const faqs = useMemo(
    () => [
      {
        q: 'How do I book a ride?',
        a: 'Sign up or log in, enter your destination, pick your ride, and confirm.'
      },
      {
        q: 'How do I become a driver?',
        a: 'Create an account, choose the Driver role, complete KYC and vehicle verification.'
      },
      {
        q: 'Is my payment information secure?',
        a: 'Yes. We use industry-standard encryption and never store raw card details.'
      },
      {
        q: 'Where can I see my trip history?',
        a: 'Go to your dashboard and open Trip History for a detailed list.'
      }
    ],
    []
  );

  const filteredFaqs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return faqs;
    return faqs.filter(item =>
      item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
    );
  }, [faqs, query]);

  const onSubmit = (e) => {
    e.preventDefault();
    // No-op for now; filtering happens live as you type.
  };

  return (
    <div className="help-page">
      <Navbar showSupport={false} showEmergency={false} showProfile={false} showNotifications={false} showWallet={false} showReviews={false} />

      <section className="help-hero">
        <div className="help-hero-inner">
          <h1 className="help-title">Help Center</h1>
          <p className="help-subtitle">Find quick answers, browse common topics, or reach our team. We’re here 24/7.</p>
          <form className="help-search" onSubmit={onSubmit} role="search">
            <span className="icon" aria-hidden>🔎</span>
            <input
              type="search"
              placeholder="Search help topics, e.g. payments, booking, driver onboarding"
              aria-label="Search help"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>
        </div>
      </section>

      <section className="help-sections">
        <div className="help-sections-inner">
          <div className="faq-card">
            <h2>Popular FAQs</h2>
            <div className="faq-list">
              {filteredFaqs.map((item) => (
                <details key={item.q} open={query.length > 0}>
                  <summary>{item.q}</summary>
                  <div>{item.a}</div>
                </details>
              ))}
              {filteredFaqs.length === 0 && (
                <div style={{ padding: '10px 4px', color: '#e5ecf5' }}>
                  No results for "{query}". Try a different keyword.
                </div>
              )}
            </div>
          </div>

          <aside className="quick-card">
            <h2>Quick actions</h2>
            <div className="quick-actions">
              <Link to="/contact">Contact support</Link>
              <Link to="/privacy">Privacy policy</Link>
              <Link to="/terms">Terms of service</Link>
              <Link to="/about">About us</Link>
            </div>
          </aside>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Help;