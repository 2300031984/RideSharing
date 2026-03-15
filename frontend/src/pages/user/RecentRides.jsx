import React from 'react';
import UserNavbar from '../../components/UserNavbar';
import { getRecentRidesLocal } from '../../services/RideService';

const RecentRides = () => {
  const rides = getRecentRidesLocal();
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
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Recent Rides</h1>
        <p style={{ color: '#6b7280', marginBottom: 16 }}>A list of your latest trips</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rides && rides.length > 0 ? (
            rides.map(r => (
              <div key={r.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', alignItems: 'center', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{new Date(r.date).toLocaleString()}</div>
                  <div style={{ color: '#6b7280', fontSize: 14 }}>{r.pickup} → {r.dropoff}</div>
                </div>
                <div style={{ fontWeight: 700, color: '#059669' }}>₹{r.fare}</div>
                <div style={{ textAlign: 'right', color: '#6b7280' }}>{r.status}</div>
              </div>
            ))
          ) : (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, color: '#6b7280' }}>No rides to show.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentRides;
