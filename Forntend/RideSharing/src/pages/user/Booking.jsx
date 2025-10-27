import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';
import { updateRecentStatusLocal } from '../../services/RideService';
import { getRecentByIdLocal } from '../../services/RideService';
import { cancelRideApi } from '../../services/RideService';
import { connectRideSocket } from '../../services/RideService';
import Toast from '../../components/Toast';

const Booking = () => {
  const navigate = useNavigate();
  const { rideRequestId } = useParams();

  const [status, setStatus] = useState('requested'); // requested -> accepted -> arriving
  const [payment, setPayment] = useState('cash');
  const recent = getRecentByIdLocal(rideRequestId);
  const otp = recent?.otp;
  const [toast, setToast] = useState({ message: '', type: 'info' });

  // Mock ride details; swap with API fetch later
  const ride = useMemo(() => ({
    id: rideRequestId,
    pickup: 'Pickup address',
    drop: 'Drop address',
    vehicleType: 'car',
    fare: 220,
    etaMin: 12,
    driver: { name: '', rating: 4.8, vehicleNo: '', phone: '', gender: '' },
  }), [rideRequestId]);

  useEffect(() => {
    // Simulate driver acceptance and approaching
    const t1 = setTimeout(() => setStatus('accepted'), 1500);
    const t2 = setTimeout(() => setStatus('arriving'), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Poll driver location and details
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`${import.meta.env?.VITE_API_URL || 'http://localhost:8081'}/api/rides/${rideRequestId}/tracking`);
        const data = await res.json();
        if (data?.tracking) {
          // here you can update a small map or status; for now just toast once
        }
      } catch {}
    };
    const id = setInterval(poll, 3000);
    poll();
    return () => clearInterval(id);
  }, [rideRequestId]);

  // WebSocket ride status updates
  useEffect(() => {
    const ws = connectRideSocket(rideRequestId, (msg) => {
      if (!msg) return;
      if (msg.type === 'status' && typeof msg.status === 'string') {
        setStatus(msg.status);
        setToast({ message: `Ride status: ${msg.status}`, type: 'info' });
      }
    });
    return () => { try { ws && ws.close(); } catch {} };
  }, [rideRequestId]);

  // Poll ride details (driver info)
  useEffect(() => {
    const tick = async () => {
      try {
        const res = await fetch(`${import.meta.env?.VITE_API_URL || 'http://localhost:8081'}/api/rides/${rideRequestId}`);
        if (res.ok) {
          const data = await res.json();
          const drv = data?.driver;
          if (drv) {
            ride.driver.name = drv.name || ride.driver.name;
            ride.driver.phone = drv.phone || ride.driver.phone;
            ride.driver.gender = drv.gender || ride.driver.gender;
            ride.driver.vehicleNo = drv.vehicleNumber || ride.driver.vehicleNo;
          }
        }
      } catch {}
    };
    const id = setInterval(tick, 3000);
    tick();
    return () => clearInterval(id);
  }, [rideRequestId]);

  const onCancel = async () => {
    const reason = prompt('Cancellation reason?');
    if (!reason) return;
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const userId = user?.id;
      
      if (!userId) {
        alert('User not found. Please login again.');
        return;
      }

      const { cancelRideApi } = await import('../../services/RideService');
      const result = await cancelRideApi(rideRequestId, userId, reason);
      
      if (result.success) {
        alert('Ride cancelled successfully');
      } else {
        alert('Ride cancelled locally (API unavailable)');
      }
      
      navigate('/user');
    } catch (error) {
      console.error('Cancel error:', error);
      updateRecentStatusLocal(rideRequestId, 'cancelled');
      alert('Ride cancelled locally. Please check your trip history.');
      navigate('/user');
    }
  };

  const onProceed = () => {
    updateRecentStatusLocal(rideRequestId, 'accepted');
    // Continue to live tracking mock
    navigate(`/ride/live/${rideRequestId}`);
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <UserNavbar showWallet={false} showPayment={false} showReviews={false} showEmergency={false} showSettings={false} showNotifications={false} showContact={false} showHelp={false} showAbout={false} />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Booking Confirmation</h1>
        <div style={{ color: '#6b7280', marginBottom: 16 }}>Status: <strong>{status}</strong></div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
            <div style={{ marginBottom: 8 }}>From: <strong>{ride.pickup}</strong></div>
            <div style={{ marginBottom: 8 }}>To: <strong>{ride.drop}</strong></div>
            <div style={{ marginBottom: 8 }}>Vehicle: <strong>{ride.vehicleType.toUpperCase()}</strong></div>
            <div style={{ marginBottom: 8 }}>Fare: <strong style={{ color: '#059669' }}>₹{ride.fare}</strong></div>
            <div>ETA: <strong>{ride.etaMin} min</strong></div>

            {otp && (
              <div style={{ marginTop: 16, padding: 12, background: '#fff7ed', border: '1px dashed #fb923c', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 4, color: '#c2410c' }}>Your OTP</div>
                    <div style={{ fontSize: 24, letterSpacing: 4, fontFamily: 'monospace', color: '#ea580c' }}>{otp}</div>
                  </div>
                  <button
                    onClick={() => { try { navigator.clipboard.writeText(String(otp)); setToast({ message: 'OTP copied', type: 'success' }); } catch {} }}
                    style={{ padding: '8px 12px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                  >
                    Copy
                  </button>
                </div>
                <div style={{ fontSize: 12, color: '#9a3412', marginTop: 4 }}>Share this OTP only with your driver to start the ride.</div>
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <label style={{ fontWeight: 600 }}>Payment</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                {['cash','upi','wallet','card'].map(m => (
                  <button key={m} onClick={()=>setPayment(m)} style={{ padding: '8px 12px', borderRadius: 8, border: payment===m ? '2px solid #2563eb' : '1px solid #e5e7eb', background: payment===m ? '#f0f9ff' : '#fff', cursor: 'pointer' }}>{m.toUpperCase()}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={onCancel} style={{ padding: '10px 14px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700 }}>Cancel Ride</button>
              <button onClick={onProceed} style={{ padding: '10px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700 }}>Track Driver</button>
            </div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 700 }}>Driver</div>
            <div style={{ marginBottom: 4 }}>Name: {ride.driver.name || 'TBD'}</div>
            <div style={{ marginBottom: 4 }}>Phone: {ride.driver.phone || 'TBD'}</div>
            <div style={{ marginBottom: 4 }}>Gender: {ride.driver.gender || 'TBD'}</div>
            <div>Vehicle: {ride.driver.vehicleNo || 'TBD'}</div>
          </div>
        </div>
      </div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </div>
  );
};

export default Booking;
