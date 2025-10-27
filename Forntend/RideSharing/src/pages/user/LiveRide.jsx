import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';
import Toast from '../../components/Toast';

const LiveRide = () => {
  const { rideRequestId } = useParams();
  const navigate = useNavigate();
  
  const [rideDetails, setRideDetails] = useState(null);
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Load ride details
  useEffect(() => {
    const loadRideDetails = async () => {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem('user'));
        const API = import.meta.env?.VITE_API_URL || 'http://localhost:8081';
        const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};
        
        console.log('🚀 Loading ride details for ID:', rideRequestId);
        
        const res = await fetch(`${API}/api/rides/${rideRequestId}`, { headers });
        if (res.ok) {
          const data = await res.json();
          const ride = data?.ride;
          
          console.log('✅ Ride details loaded:', ride);
          
          if (ride) {
            setRideDetails(ride);
            
            // If ride has a driver, fetch driver details
            if (ride.driverId) {
              console.log('👨‍✈️ Fetching driver details for ID:', ride.driverId);
              try {
                const driverRes = await fetch(`${API}/api/profile/${ride.driverId}?role=Driver`, { headers });
                if (driverRes.ok) {
                  const driverData = await driverRes.json();
                  console.log('✅ Driver data received:', driverData);
                  
                  setDriver({
                    id: driverData.id || ride.driverId,
                    name: driverData.name || driverData.username || ride.driverName || 'Driver',
                    rating: driverData.rating || 4.5,
                    vehicleNo: driverData.vehicleNumber || ride.vehicleNumber || 'N/A',
                    vehicleModel: driverData.vehicleModel || 'N/A',
                    vehicleType: driverData.vehicleType || ride.vehicleType || 'Car',
                    phone: driverData.phoneNumber || driverData.phone || null,
                    email: driverData.email || null
                  });
                } else {
                  console.warn('⚠️ Failed to fetch driver profile, using ride data');
                  setDriver({
                    id: ride.driverId,
                    name: ride.driverName || 'Driver',
                    rating: 4.5,
                    vehicleNo: ride.vehicleNumber || 'N/A',
                    vehicleModel: 'N/A',
                    vehicleType: ride.vehicleType || 'Car',
                    phone: null,
                    email: null
                  });
                }
              } catch (driverError) {
                console.error('❌ Error fetching driver details:', driverError);
                setDriver({
                  id: ride.driverId,
                  name: ride.driverName || 'Driver',
                  rating: 4.5,
                  vehicleNo: ride.vehicleNumber || 'N/A',
                  vehicleModel: 'N/A',
                  vehicleType: ride.vehicleType || 'Car',
                  phone: null,
                  email: null
                });
              }
            } else {
              console.log('⏳ No driver assigned yet');
              setDriver(null);
            }
            
            // Show payment modal if ride is completed
            if (ride.status === 'COMPLETED') {
              setShowPayment(true);
            }
          }
        } else {
          console.error('❌ Failed to load ride details:', res.status);
          setToast({ message: 'Failed to load ride details', type: 'error' });
        }
      } catch (error) {
        console.error('❌ Error loading ride details:', error);
        setToast({ message: 'Failed to load ride details', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    
    if (rideRequestId) {
      loadRideDetails();
      
      // Poll for updates every 3 seconds
      const interval = setInterval(loadRideDetails, 3000);
      return () => clearInterval(interval);
    }
  }, [rideRequestId]);

  const handlePayment = async () => {
    try {
      setToast({ message: `Payment of ₹${rideDetails.fare} completed via ${paymentMethod}`, type: 'success' });
      
      // Wait a moment then navigate
      setTimeout(() => {
        navigate('/user/ride-history');
      }, 2000);
    } catch (error) {
      setToast({ message: 'Payment failed', type: 'error' });
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'REQUESTED': '#f59e0b',
      'ACCEPTED': '#3b82f6',
      'STARTED': '#10b981',
      'COMPLETED': '#059669',
      'CANCELLED': '#ef4444'
    };
    return statusColors[status] || '#6b7280';
  };
  
  const getStatusText = (status) => {
    const statusTexts = {
      'REQUESTED': 'Looking for driver...',
      'ACCEPTED': 'Driver assigned! Arriving soon',
      'STARTED': 'Ride in progress',
      'COMPLETED': 'Ride completed',
      'CANCELLED': 'Ride cancelled'
    };
    return statusTexts[status] || status;
  };
  
  if (loading) {
    return (
      <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
        <UserNavbar />
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 18, color: '#6b7280' }}>Loading ride details...</div>
        </div>
      </div>
    );
  }
  
  if (!rideDetails) {
    return (
      <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
        <UserNavbar />
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 18, color: '#ef4444' }}>Ride not found</div>
          <button 
            onClick={() => navigate('/user/dashboard')}
            style={{ marginTop: 20, padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <UserNavbar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
        {/* Status Banner */}
        <div style={{ 
          background: getStatusColor(rideDetails.status), 
          color: 'white', 
          padding: 16, 
          borderRadius: 12, 
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Live Ride Tracking</h1>
            <p style={{ fontSize: 14, opacity: 0.9 }}>{getStatusText(rideDetails.status)}</p>
          </div>
        </div>
        
        {/* Show OTP if ride is accepted and not started */}
        {rideDetails.status === 'ACCEPTED' && rideDetails.otp && (
          <div style={{ 
            background: '#fef3c7', 
            border: '2px solid #f59e0b',
            borderRadius: 12, 
            padding: 20, 
            marginBottom: 20,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#92400e', marginBottom: 8 }}>
              📱 Share this OTP with Driver
            </div>
            <div style={{ 
              fontSize: 48, 
              fontWeight: 700, 
              color: '#92400e',
              letterSpacing: '0.3em',
              fontFamily: 'monospace'
            }}>
              {rideDetails.otp}
            </div>
            <div style={{ fontSize: 14, color: '#92400e', marginTop: 8 }}>
              Driver will need this OTP to start the ride
            </div>
          </div>
        )}
        
        {/* Driver Found Banner - Shows when driver is assigned */}
        {driver && rideDetails.status === 'ACCEPTED' && (
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: '2px solid #059669',
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
            color: 'white',
            animation: 'slideIn 0.5s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ 
                width: 60, 
                height: 60, 
                borderRadius: '50%', 
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32
              }}>
                ✅
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                  Driver Found!
                </div>
                <div style={{ fontSize: 14, opacity: 0.95 }}>
                  {driver.name} is on the way • {driver.vehicleType} • {driver.vehicleNo}
                </div>
              </div>
              {driver.phone && (
                <button
                  onClick={() => window.open(`tel:${driver.phone}`, '_self')}
                  style={{
                    padding: '10px 20px',
                    background: 'white',
                    color: '#10b981',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: 14
                  }}
                >
                  📞 Call Now
                </button>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          {/* Map Placeholder */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', color: '#6b7280' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>Live Map</div>
              <div style={{ fontSize: 14 }}>Real-time tracking will be shown here</div>
            </div>
          </div>
          
          {/* Details Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Driver Info */}
            {driver ? (
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, color: '#1f2937' }}>Driver Details</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: '50%', 
                    background: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    color: 'white',
                    fontWeight: 700
                  }}>
                    {driver.name ? driver.name.charAt(0).toUpperCase() : '👨‍✈️'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 16, color: '#1f2937' }}>{driver.name}</div>
                    <div style={{ fontSize: 14, color: '#6b7280' }}>⭐ {driver.rating.toFixed(1)}</div>
                  </div>
                </div>
                
                <div style={{ background: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 6 }}>
                    <span style={{ marginRight: 8 }}>🚗</span>
                    Vehicle Number
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 16, color: '#1f2937' }}>{driver.vehicleNo}</div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  <div style={{ background: '#f9fafb', borderRadius: 8, padding: 10 }}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Model</div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1f2937' }}>{driver.vehicleModel}</div>
                  </div>
                  <div style={{ background: '#f9fafb', borderRadius: 8, padding: 10 }}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Type</div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1f2937' }}>{driver.vehicleType}</div>
                  </div>
                </div>
                
                {driver.phone ? (
                  <button
                    onClick={() => window.open(`tel:${driver.phone}`, '_self')}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    📞 Call {driver.name.split(' ')[0]}
                  </button>
                ) : (
                  <div style={{ 
                    padding: '12px', 
                    background: '#f3f4f6', 
                    borderRadius: 8, 
                    textAlign: 'center',
                    fontSize: 14,
                    color: '#6b7280'
                  }}>
                    Phone number not available
                  </div>
                )}
              </div>
            ) : rideDetails.status !== 'REQUESTED' ? (
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, color: '#1f2937' }}>Driver Details</div>
                <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
                  <div>Loading driver information...</div>
                </div>
              </div>
            ) : null}
            
            {/* Ride Info */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, color: '#1f2937' }}>Ride Details</div>
              <div style={{ fontSize: 14, marginBottom: 8 }}>
                <div style={{ color: '#6b7280', marginBottom: 4 }}>From</div>
                <div style={{ fontWeight: 500 }}>{rideDetails.pickupAddress}</div>
              </div>
              <div style={{ fontSize: 14, marginBottom: 8 }}>
                <div style={{ color: '#6b7280', marginBottom: 4 }}>To</div>
                <div style={{ fontWeight: 500 }}>{rideDetails.dropoffAddress}</div>
              </div>
              {rideDetails.fare && (
                <div style={{ fontSize: 14, marginTop: 12, padding: 12, background: '#f0fdf4', borderRadius: 8 }}>
                  <div style={{ color: '#059669', marginBottom: 4 }}>Fare</div>
                  <div style={{ fontWeight: 700, fontSize: 20, color: '#059669' }}>₹{rideDetails.fare}</div>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button 
                onClick={() => setToast({ message: 'SOS sent. Emergency contacts notified.', type: 'success' })}
                style={{ padding: '12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
              >
                🆘 Emergency SOS
              </button>
              <button 
                onClick={() => setToast({ message: 'Issue reported. Support will reach out.', type: 'success' })}
                style={{ padding: '12px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
              >
                ⚠️ Report Issue
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Payment Modal */}
      {showPayment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 32,
            maxWidth: 400,
            width: '90%'
          }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#1f2937' }}>
              ✅ Ride Completed!
            </h2>
            <p style={{ color: '#6b7280', marginBottom: 24 }}>Please complete your payment</p>
            
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>Total Fare</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#059669' }}>₹{rideDetails.fare}</div>
            </div>
            
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#1f2937' }}>Payment Method</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setPaymentMethod('cash')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: paymentMethod === 'cash' ? '#10b981' : '#f3f4f6',
                    color: paymentMethod === 'cash' ? 'white' : '#1f2937',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  💵 Cash
                </button>
                <button
                  onClick={() => setPaymentMethod('online')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: paymentMethod === 'online' ? '#10b981' : '#f3f4f6',
                    color: paymentMethod === 'online' ? 'white' : '#1f2937',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  💳 Online
                </button>
              </div>
            </div>
            
            <button
              onClick={handlePayment}
              style={{
                width: '100%',
                padding: '14px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer'
              }}
            >
              Complete Payment
            </button>
          </div>
        </div>
      )}
      
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </div>
  );
};

export default LiveRide;
