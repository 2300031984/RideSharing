import React from 'react';
import UserNavbar from '../../components/UserNavbar';

const Offers = () => {
  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <UserNavbar
        showWallet={false}
        showPayment={false}
        showReviews={false}
        showEmergency={false}
        showSettings={false}
        showNotifications={false}
        showContact={false}
        showHelp={false}
        showAbout={false}
      />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Offers</h1>
        <p style={{ color: '#6b7280', marginBottom: 16 }}>Active promotions and discount codes</p>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
          <div style={{ color: '#6b7280' }}>No offers available.</div>
        </div>
      </div>
    </div>
  );
};

export default Offers;
