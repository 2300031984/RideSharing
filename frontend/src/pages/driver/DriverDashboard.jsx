import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DriverNavbar from '../../components/DriverNavbar';
import Card from '../../components/ui/Card';
import Stat from '../../components/ui/Stat';
import Badge from '../../components/ui/Badge';
import Toast from '../../components/Toast';
import { updateRecentStatusLocal, getRecentByIdLocal, completeRideApi } from '../../services/RideService';
import { updateDriverStatus } from '../../services/DriverService';

const API = (import.meta.env?.VITE_API_URL || 'http://localhost:8081');

const DriverDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const token = user?.token;
  
  const [driver, setDriver] = useState({
    name: user.username || 'Driver',
    email: user.email || '',
    phone: '+91 9876543210',
    licenseNumber: 'DL1234567890123',
    vehicleNumber: 'KA-01-AB-1234',
    vehicleModel: 'Maruti Swift',
    vehicleYear: '2022',
    rating: 0,
    totalRides: 0,
    totalEarnings: 0
  });

  const driverVehicleType = (user?.vehicleType || 'car');
  
  const [status, setStatus] = useState('OFFLINE');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [activeRide, setActiveRide] = useState(null);
  const [otpInput, setOtpInput] = useState('');

  const quickActions = useMemo(() => ([
    {
      id: 1,
      title: status === 'ONLINE' ? 'Go Offline' : 'Go Online',
      icon: status === 'ONLINE' ? '🔴' : '🟢',
      color: status === 'ONLINE' ? '#dc2626' : '#059669',
      description: status === 'ONLINE' ? 'Stop accepting rides' : 'Start accepting rides',
      action: () => handleStatusToggle()
    },
    {
      id: 2,
      title: 'Present Rides',
      icon: '🚗',
      color: '#2563eb',
      description: 'Current ride requests',
      action: () => navigate('/driver/present-rides')
    },
    {
      id: 3,
      title: 'Scheduled Rides',
      icon: '📅',
      color: '#7c3aed',
      description: 'Long distance rides',
      action: () => navigate('/driver/scheduled-rides')
    },
    {
      id: 4,
      title: 'Update Location',
      icon: '📍',
      color: '#7c3aed',
      description: 'Share your location',
      action: () => navigate('/driver/location')
    },
    {
      id: 5,
      title: 'View Earnings',
      icon: '💰',
      color: '#f59e0b',
      description: 'Check your income',
      action: () => navigate('/driver/earnings')
    }
  ]), [status]);

  useEffect(() => {
    fetchDriverData();
    fetchActiveRide();
    // initialize status from navbar toggle
    try {
      const online = localStorage.getItem('driver_online') === 'true';
      setStatus(online ? 'ONLINE' : 'OFFLINE');
    } catch {}
    const onStorage = (e) => {
      if (e.key === 'driver_online') {
        const val = e.newValue === 'true';
        setStatus(val ? 'ONLINE' : 'OFFLINE');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const fetchDriverData = async () => {
    try {
      if (!user.id) {
        console.warn('User ID not available');
        setLoading(false);
        return;
      }
      const res = await fetch(`${API}/api/profile/${user.id}?role=Driver`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        const backendStatus = data.status || 'OFFLINE';
        
        setDriver(prev => ({
          ...prev,
          name: data.name || user.username || 'Driver',
          email: data.email || user.email || '',
          licenseNumber: data.licenseNumber || 'DL1234567890123',
          status: backendStatus
        }));
        
        // Sync status state with backend data
        // Map backend enum (AVAILABLE, OFFLINE) to UI state (ONLINE, OFFLINE)
        const uiStatus = backendStatus === 'AVAILABLE' ? 'ONLINE' : 'OFFLINE';
        setStatus(uiStatus);
        localStorage.setItem('driver_online', String(uiStatus === 'ONLINE'));
      } else {
        console.warn('Failed to fetch driver data:', res.status);
      }
    } catch (error) {
      console.error('Error fetching driver data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveRide = async () => {
    try {
      // Default: no active ride unless provided by backend later
      setActiveRide(null);
    } catch (error) {
      console.error('Error fetching active ride:', error);
    }
  };


  const handleStatusToggle = async () => {
    const newStatus = status === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    console.log('Toggling status from', status, 'to', newStatus);
    
    try {
      if (!user.id) {
        console.error('User ID not available');
        setToast({ message: 'User ID not available. Please log in again.', type: 'error' });
        return;
      }
      
      console.log('Calling updateDriverStatus with userId:', user.id, 'status:', newStatus);
      const response = await updateDriverStatus(user.id, newStatus);
      console.log('updateDriverStatus response:', response);
      
      setStatus(newStatus);
      setToast({ message: `You are now ${newStatus.toLowerCase()}`, type: 'success' });
      try { localStorage.setItem('driver_online', String(newStatus === 'ONLINE')); } catch {}
    } catch (error) {
      console.error('Error updating status:', error);
      setToast({ message: (error?.message || error?.error || 'Failed to update status. Please try again.'), type: 'error' });
    }
  };

  const handleRideAction = (rideId, action) => {
    setToast({ 
      message: `${action} ride #${rideId}`, 
      type: 'success' 
    });
    
    if (action === 'Complete') {
      try { completeRideApi(rideId); } catch {}
      try { updateRecentStatusLocal(rideId, 'completed'); } catch {}
      setActiveRide(null);
    }
  };



  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <DriverNavbar />
      
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
        {/* Welcome Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, color: '#1f2937' }}>
              Welcome, {driver.name}! 👋
            </h1>
            <p style={{ fontSize: 16, color: '#6b7280' }}>
              {status === 'ONLINE' ? 'You\'re online and ready to accept rides' : 'Go online to start accepting rides'}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: status === 'ONLINE' ? '#059669' : '#dc2626'
              }}></div>
              <span style={{ fontWeight: 600, color: status === 'ONLINE' ? '#059669' : '#dc2626' }}>
                {status}
              </span>
            </div>
            <div style={{ fontSize: 14, color: '#6b7280' }}>
              Vehicle: {driver.vehicleNumber}
            </div>
          </div>
        </div>

        {/* Active Ride Section */}
        {activeRide && (
          <Card title="Current Ride" style={{ marginBottom: 24, border: '2px solid #059669' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ fontSize: 24 }}>🚗</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>
                      Ride #{activeRide.id}
                    </div>
                    <Badge variant="blue">{activeRide.status}</Badge>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Passenger</div>
                    <div style={{ fontWeight: 600 }}>{activeRide.passenger}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{activeRide.phone}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Fare</div>
                    <div style={{ fontWeight: 600, fontSize: 18, color: '#059669' }}>₹{activeRide.fare}</div>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%' }}></div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{activeRide.pickup}</div>
                  </div>
                  <div style={{ width: 2, height: 16, background: '#d1d5db', marginLeft: 3 }}></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, background: '#ef4444', borderRadius: '50%' }}></div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{activeRide.dropoff}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Distance</div>
                    <div style={{ fontWeight: 500 }}>{activeRide.distance}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>ETA</div>
                    <div style={{ fontWeight: 500 }}>{activeRide.estimatedTime}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Passenger Rating</div>
                    <div style={{ fontWeight: 500 }}>⭐ {activeRide.passengerRating}</div>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activeRide.status === 'ACCEPTED' && (
                  <>
                    <button
                      onClick={() => handleRideAction(activeRide.id, 'Arrived')}
                      style={{
                        padding: '12px 24px',
                        background: '#f59e0b',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      Mark Arrived
                    </button>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        value={otpInput}
                        onChange={(e)=>setOtpInput(e.target.value)}
                        placeholder="Enter OTP"
                        style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, width: 140 }}
                      />
                      <button
                        onClick={() => {
                          const recent = getRecentByIdLocal(activeRide.id);
                          if (!otpInput) { setToast({ message: 'OTP required to start ride', type: 'error' }); return; }
                          if (recent && String(recent.otp) === String(otpInput.trim())) {
                            updateRecentStatusLocal(activeRide.id, 'in_progress');
                            setActiveRide({ ...activeRide, status: 'IN_PROGRESS' });
                            setToast({ message: 'OTP verified. Ride started.', type: 'success' });
                            setOtpInput('');
                          } else {
                            setToast({ message: 'Invalid OTP', type: 'error' });
                          }
                        }}
                        disabled={!(otpInput && otpInput.trim().length === 6 && /^\d{6}$/.test(otpInput.trim()))}
                        style={{
                          padding: '12px 16px',
                          background: (otpInput && otpInput.trim().length === 6 && /^\d{6}$/.test(otpInput.trim())) ? '#2563eb' : '#93c5fd',
                          color: 'white',
                          border: 'none',
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        Start Ride
                      </button>
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Enter 6-digit OTP to enable Start.</div>
                  </>
                )}
                {activeRide.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => handleRideAction(activeRide.id, 'Complete')}
                    style={{
                      padding: '12px 24px',
                      background: '#059669',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Complete Ride
                  </button>
                )}
                <button
                  onClick={() => window.open(`tel:${activeRide.phone}`, '_self')}
                  style={{
                    padding: '12px 24px',
                    background: 'none',
                    color: '#2563eb',
                    border: '1px solid #2563eb',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  📞 Call Passenger
                </button>
              </div>
            </div>
          </Card>
        )}


        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* Quick Actions */}
          <Card title="Quick Actions" style={{ marginBottom: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {quickActions.map(action => (
                <button
                  key={action.id}
                  onClick={action.action}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: 20,
                    background: '#f8fafc',
                    border: '2px solid #e5e7eb',
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = action.color;
                    e.currentTarget.style.background = '#f0f9ff';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.background = '#f8fafc';
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{action.icon}</div>
                  <div style={{ fontWeight: 600, marginBottom: 4, color: '#1f2937' }}>{action.title}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{action.description}</div>
                </button>
              ))}
            </div>
          </Card>

          {/* Driver Info */}
          <Card title="Driver Profile" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>👨‍💼</div>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>{driver.name}</div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, color: '#6b7280' }}>License:</span>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>{driver.licenseNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, color: '#6b7280' }}>Vehicle:</span>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>{driver.vehicleModel}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, color: '#6b7280' }}>Vehicle Type:</span>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>{driverVehicleType}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, color: '#6b7280' }}>Year:</span>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>{driver.vehicleYear}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, color: '#6b7280' }}>Total Rides:</span>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>{driver.totalRides}</span>
                </div>
              </div>
              
              <button
                onClick={() => navigate('/profile')}
                style={{
                  width: '100%',
                  padding: 10,
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Edit Profile
              </button>
            </div>
          </Card>
        </div>

        {/* Bottom Recent Requests removed; preview exists in Quick Actions */}
      </div>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </div>
  );
};

export default DriverDashboard;