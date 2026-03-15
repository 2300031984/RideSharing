import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DriverNavbar from '../../components/DriverNavbar';
import Card from '../../components/ui/Card';
import Toast from '../../components/Toast';
import { getRideTracking, updateDriverLocation, getRideETA } from '../../services/RideService';
import WebSocketService from '../../services/WebSocketService';

const ActiveRideTracking = () => {
  const navigate = useNavigate();
  const [activeRide, setActiveRide] = useState(null);
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [eta, setEta] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [isTracking, setIsTracking] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [riderPhone, setRiderPhone] = useState(null);

  useEffect(() => {
    // Get current user
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user?.id) {
      navigate('/driver/login');
      return;
    }

    // Load last accepted ride id or query backend for active rides
    const lastId = localStorage.getItem('lastAcceptedRideId');
    const API = (import.meta.env?.VITE_API_URL || 'http://localhost:8081');
    const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};
    const load = async () => {
      try {
        if (lastId) {
          const res = await fetch(`${API}/api/rides/${lastId}`, { headers });
          if (res.ok) {
            const data = await res.json();
            const r = data?.ride;
            if (r) {
              // Get rider details to show phone
              const riderRes = await fetch(`${API}/api/profile/${r.riderId}?role=User`, { headers });
              let riderData = null;
              if (riderRes.ok) {
                riderData = await riderRes.json();
              }
              
              setActiveRide({
                id: r.id,
                riderId: r.riderId,
                passengerName: r.riderName || 'Passenger',
                pickupAddress: r.pickupAddress,
                dropoffAddress: r.dropoffAddress,
                status: r.status,
                fare: r.fare || 0,
                otp: r.otp,
                distance: r.distance,
                duration: r.duration
              });
              
              if (riderData) {
                setRiderPhone(riderData.phoneNumber || riderData.phone || null);
              }
              return;
            }
          }
        }
        // Fallback: fetch active rides for this driver
        const res2 = await fetch(`${API}/api/rides/driver/${user.id}`, { headers });
        if (res2.ok) {
          const data2 = await res2.json();
          const rlist = data2?.rides || [];
          const r = rlist.find(x => x.status === 'ACCEPTED' || x.status === 'STARTED') || rlist[0];
          if (r) {
            setActiveRide({
              id: r.id,
              riderId: r.riderId,
              passengerName: r.riderName || 'Passenger',
              pickupAddress: r.pickupAddress,
              dropoffAddress: r.dropoffAddress,
              status: r.status,
              fare: r.fare || 0,
              otp: r.otp,
              distance: r.distance,
              duration: r.duration
            });
          }
        }
      } catch (e) {
        console.error('Failed to load active ride:', e);
      } finally {
        loadTrackingInfo();
      }
    };
    load();
  }, [navigate]);

  const loadTrackingInfo = async () => {
    if (!activeRide?.id) return;

    try {
      const tracking = await getRideTracking(activeRide.id);
      if (tracking?.success) {
        setTrackingInfo(tracking.tracking);
      }
      
      const etaData = await getRideETA(activeRide.id);
      if (etaData?.success) {
        setEta(etaData.eta);
      }
    } catch (error) {
      console.error('Failed to load tracking info:', error);
    }
  };

  const startLocationTracking = () => {
    setIsTracking(true);
    setToast({ message: 'Location tracking started!', type: 'success' });
    
    // Ensure STOMP is connected before tracking
    WebSocketService.connect();

    if ("geolocation" in navigator) {
      window.locationTrackingInterval = navigator.geolocation.watchPosition(
        async (position) => {
          if (!activeRide?.id) return;
          
          const payload = {
            driverId: JSON.parse(localStorage.getItem('user'))?.id,
            rideId: activeRide.id,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            heading: position.coords.heading || 0,
            timestamp: position.timestamp
          };
          
          // Publish real-time STOMP payload 
          if (WebSocketService.client && WebSocketService.client.connected) {
            WebSocketService.client.publish({
               destination: `/app/driver/location/${activeRide.id}`,
               body: JSON.stringify(payload)
            });
            console.log('📍 Published location:', payload);
          }

          // Backwards compatibility for HTTP tracking history if needed natively
          try {
             await updateDriverLocation(activeRide.id, {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                address: 'GPS Accuracy: ' + position.coords.accuracy + 'm'
             });
          } catch(e) {}
        },
        (error) => {
          console.error("GPS Error:", error);
          setToast({ message: 'Failed to access GPS. ' + error.message, type: 'error' });
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 27000 }
      );
    } else {
      setToast({ message: 'Geolocation is not supported by your browser', type: 'error' });
    }
  };

  const stopLocationTracking = () => {
    setIsTracking(false);
    if (window.locationTrackingInterval) {
      if (navigator.geolocation && navigator.geolocation.clearWatch) {
         navigator.geolocation.clearWatch(window.locationTrackingInterval);
      } else {
         clearInterval(window.locationTrackingInterval);
      }
      window.locationTrackingInterval = null;
    }
    setToast({ message: 'Location tracking stopped!', type: 'info' });
  };

  const handleMarkArrived = async () => {
    try {
      // Call the backend API to mark as arrived
      const response = await fetch(`${import.meta.env?.VITE_API_URL || 'http://localhost:8081'}/api/rides/${activeRide.id}/arrived`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('user')).token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setToast({ message: 'Marked as arrived!', type: 'success' });
        // Update local status
        setActiveRide(prev => ({ ...prev, status: 'DRIVER_ARRIVED' }));
      } else {
        setToast({ message: 'Failed to mark as arrived', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Network error', type: 'error' });
    }
  };

  const handleStartRide = async () => {
    if (!otpInput || otpInput.trim().length !== 6) {
      setToast({ message: 'Please enter a valid 6-digit OTP', type: 'error' });
      return;
    }
    
    try {
      const response = await fetch(`${import.meta.env?.VITE_API_URL || 'http://localhost:8081'}/api/rides/${activeRide.id}/verify-otp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('user')).token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ otp: otpInput.trim() })
      });

      if (response.ok) {
        setToast({ message: 'OTP verified! Ride started successfully.', type: 'success' });
        setActiveRide(prev => ({ ...prev, status: 'STARTED' }));
        setOtpInput('');
        // Start location tracking
        startLocationTracking();
      } else {
        const error = await response.json();
        setToast({ message: error.message || 'Invalid OTP. Please try again.', type: 'error' });
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setToast({ message: 'Network error. Please try again.', type: 'error' });
    }
  };

  const handleCompleteRide = async () => {
    try {
      const response = await fetch(`${import.meta.env?.VITE_API_URL || 'http://localhost:8081'}/api/rides/${activeRide.id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('user')).token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setToast({ message: 'Ride completed!', type: 'success' });
        setActiveRide(prev => ({ ...prev, status: 'COMPLETED' }));
        setTimeout(() => navigate('/driver/dashboard'), 2000);
      } else {
        setToast({ message: 'Failed to complete ride', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Network error', type: 'error' });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.locationTrackingInterval) {
        if (navigator.geolocation && navigator.geolocation.clearWatch) {
           navigator.geolocation.clearWatch(window.locationTrackingInterval);
        } else {
           clearInterval(window.locationTrackingInterval);
        }
      }
    };
  }, []);

  if (!activeRide) {
    return (
      <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
        <DriverNavbar />
        <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
          <Card>
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🚗</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#374151' }}>
                No Active Ride
              </h3>
              <p style={{ color: '#6b7280', marginBottom: 16 }}>
                You don't have any active rides at the moment
              </p>
              <button
                onClick={() => navigate('/driver/rides')}
                style={{
                  padding: '12px 24px',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                View Available Rides
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <DriverNavbar />
      
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>
            Active Ride Tracking
          </h1>
          <p style={{ color: '#6b7280' }}>Ride #{activeRide.id} - {activeRide.passengerName}</p>
        </div>

        {/* Ride Details */}
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Pickup</div>
              <div style={{ fontWeight: 600, color: '#1f2937' }}>{activeRide.pickupAddress}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Dropoff</div>
              <div style={{ fontWeight: 600, color: '#1f2937' }}>{activeRide.dropoffAddress}</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Status</div>
              <div style={{ 
                fontWeight: 600, 
                color: activeRide.status === 'ACCEPTED' ? '#f59e0b' : 
                      activeRide.status === 'DRIVER_ARRIVED' ? '#10b981' :
                      activeRide.status === 'IN_PROGRESS' ? '#3b82f6' : '#6b7280'
              }}>
                {activeRide.status.replace('_', ' ')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Fare</div>
              <div style={{ fontWeight: 600, color: '#1f2937' }}>₹{activeRide.fare}</div>
            </div>
          </div>
        </Card>

        {/* Mini Map */}
        {trackingInfo?.latitude && trackingInfo?.longitude && (
          <Card style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#1f2937' }}>Map</h3>
            <iframe
              title="driver-map"
              width="100%"
              height="220"
              style={{ border: 0, borderRadius: 8 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${trackingInfo.longitude-0.01}%2C${trackingInfo.latitude-0.01}%2C${trackingInfo.longitude+0.01}%2C${trackingInfo.latitude+0.01}&layer=mapnik&marker=${trackingInfo.latitude}%2C${trackingInfo.longitude}`}
            ></iframe>
          </Card>
        )}

        {/* Tracking Controls */}
        <Card style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#1f2937' }}>
            Location Tracking
          </h3>
          
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <button
              onClick={isTracking ? stopLocationTracking : startLocationTracking}
              style={{
                padding: '8px 16px',
                background: isTracking ? '#dc2626' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14
              }}
            >
              {isTracking ? '🛑 Stop Tracking' : '📍 Start Tracking'}
            </button>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              padding: '8px 12px',
              background: isTracking ? '#10b981' : '#f3f4f6',
              color: isTracking ? 'white' : '#6b7280',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500
            }}>
              <div style={{ 
                width: 8, 
                height: 8, 
                background: isTracking ? 'white' : '#6b7280', 
                borderRadius: '50%',
                animation: isTracking ? 'pulse 2s infinite' : 'none'
              }}></div>
              {isTracking ? 'Tracking Active' : 'Tracking Inactive'}
            </div>
          </div>

          {eta && (
            <div style={{ 
              padding: 12, 
              background: '#f0f9ff', 
              borderRadius: 6, 
              border: '1px solid #0ea5e9',
              marginBottom: 16
            }}>
              <div style={{ fontSize: 12, color: '#0369a1', marginBottom: 4 }}>ETA to Passenger</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#0c4a6e' }}>
                {eta.minutes} minutes
              </div>
              <div style={{ fontSize: 12, color: '#0369a1' }}>{eta.message}</div>
            </div>
          )}
        </Card>

        {/* Ride Actions */}
        <Card>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#1f2937' }}>
            Ride Actions
          </h3>
          
          {/* Call Rider Button */}
          {riderPhone && (
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={() => window.open(`tel:${riderPhone}`, '_self')}
                style={{
                  width: '100%',
                  padding: '12px 20px',
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
                📞 Call Rider ({riderPhone})
              </button>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flexDirection: 'column' }}>
            {activeRide.status === 'ACCEPTED' && (
              <>
                <button
                  onClick={handleMarkArrived}
                  style={{
                    padding: '12px 20px',
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 14
                  }}
                >
                  🚗 Mark Arrived at Pickup
                </button>
                
                {/* OTP Input Section */}
                <div style={{ 
                  background: '#f0f9ff', 
                  border: '1px solid #0ea5e9',
                  borderRadius: 8, 
                  padding: 16,
                  marginTop: 8
                }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#0c4a6e' }}>
                    📱 Enter OTP from Rider
                  </div>
                  <div style={{ fontSize: 12, color: '#0369a1', marginBottom: 12 }}>
                    Ask the rider for the 6-digit OTP to start the ride
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      value={otpInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                        setOtpInput(val);
                      }}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: 6,
                        fontSize: 16,
                        fontWeight: 600,
                        textAlign: 'center',
                        letterSpacing: '0.2em'
                      }}
                    />
                    <button
                      onClick={handleStartRide}
                      disabled={otpInput.length !== 6}
                      style={{
                        padding: '10px 20px',
                        background: otpInput.length === 6 ? '#3b82f6' : '#cbd5e1',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: otpInput.length === 6 ? 'pointer' : 'not-allowed',
                        fontWeight: 600,
                        fontSize: 14
                      }}
                    >
                      ▶️ Start Ride
                    </button>
                  </div>
                </div>
              </>
            )}
            
            {activeRide.status === 'STARTED' && (
              <button
                onClick={handleCompleteRide}
                style={{
                  padding: '12px 20px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14
                }}
              >
                ✅ Complete Ride
              </button>
            )}
          </div>
        </Card>
      </div>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </div>
  );
};

export default ActiveRideTracking;
