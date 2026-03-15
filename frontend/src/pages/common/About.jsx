import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import '../../Styles/Help.css';

const About = () => (
  <div className="help-page">
    <Navbar showSupport={false} showEmergency={false} showProfile={false} showNotifications={false} showWallet={false} showReviews={false} />

    <section className="help-hero">
      <div className="help-hero-inner">
        <h1 className="help-title">About TakeMe</h1>
        <p className="help-subtitle">Built to make urban travel safer, greener, and smarter since 2023.</p>
      </div>
    </section>

    <section className="help-sections">
      <div className="help-sections-inner">
        <div className="faq-card">
          <h2>Our mission & values</h2>
          <div className="faq-list">
            <details open>
              <summary>Safety first</summary>
              <div>Drivers are background-checked and vehicles are regularly inspected for your peace of mind.</div>
            </details>
            <details>
              <summary>Always available</summary>
              <div>24/7 support and a reliable network so you can ride whenever you need.</div>
            </details>
            <details>
              <summary>Eco-conscious</summary>
              <div>We encourage carpooling and greener ride options to reduce our footprint.</div>
            </details>
          </div>
        </div>

        <aside className="quick-card">
          <h2>Learn more</h2>
          <div className="quick-actions">
            <Link to="/help">Help Center</Link>
            <Link to="/contact">Contact us</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
          </div>
        </aside>
      </div>
    </section>

    <Footer />
  </div>
);

export default About;
