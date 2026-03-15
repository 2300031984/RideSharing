import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import '../../Styles/Home.css';
import { useAuth } from '../../context/AuthContext';

function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();


  return (
    <div className="home-modern-bg">
      <Navbar showSupport={false} showProfile={false} showNotifications={false} showWallet={false} showReviews={false} showLogout={false} />
      
      {/* Hero Section */}
      <main className="new-hero">
        <div className="new-hero-content">
          <h1 className="new-title">Move Freely, Move Smart</h1>
          <p className="new-tagline">Your city, your ride. Seamless journeys start here.</p>
          <div className="new-cta-group">
            <button className="new-login" onClick={() => navigate('/login')}>
              Login
            </button>
            <button className="new-signup" onClick={() => navigate('/signup')}>
              Sign Up
            </button>
          </div>
        </div>
      </main>


      <Footer />
    </div>
  );
}

export default Home;