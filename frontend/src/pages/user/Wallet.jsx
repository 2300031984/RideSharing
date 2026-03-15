import React from 'react';
import UserNavbar from '../../components/UserNavbar';

const Wallet = () => {
  const user = JSON.parse(localStorage.getItem('user')) || {};
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
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Wallet</h1>
        <p style={{ color: '#6b7280', marginBottom: 16 }}>Manage your balance and payments</p>
        {/* Placeholder content; extend with API data as needed */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Current Balance</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#059669' }}>₹0.00</div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
