import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';
import Toast from '../../components/Toast';

const RideRequestWaiting = () => {
  const navigate = useNavigate();
  const { rideRequestId } = useParams();
  const [status, setStatus] = useState('requested');
  const [driver, setDriver] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get current user
    const currentUser = JSON.parse(localStorage.getItem('user'));
    setUser(currentUser);

    if (!rideRequestId) {
      setToast({ message: 'Ride request ID not found', type: 'error' });
      navigate('/user/dashboard');
      return;
    }

    // Load initial status
    loadInitialStatus();
  }, [rideRequestId, navigate]);

  const loadInitialStatus = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const API = import.meta.env?.VITE_API_URL || 'http://localhost:8081';
      const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};
      
      console.log('🚀 Loading initial status for ride:', rideRequestId);
      
      const res = await fetch(`${API}/api/rides/${rideRequestId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        const ride = data?.ride;
        
        console.log('✅ Initial ride data:', ride);
        
        if (ride) {
          const currentStatus = (ride.status || '').toLowerCase();
          console.log('📊 Initial status:', currentStatus);
          setStatus(currentStatus);
          
          // If ride is already accepted or started, redirect immediately
          if ((currentStatus === 'accepted' || currentStatus === 'started') && ride.driverId) {
            console.log('🚀 Ride already accepted/started, redirecting immediately...');
            navigate(`/ride/live/${rideRequestId}`);
            return;
          }
          
          // If ride has a driver, fetch driver details
          if (ride.driverId && ride.status === 'ACCEPTED') {
            await loadDriverDetails(ride.driverId);
          }
        }
      } else {
        console.error('❌ Failed to load initial status:', res.status);
      }
    } catch (error) {
      console.error('❌ Error loading initial status:', error);
    }
  };

  const loadDriverDetails = async (driverId) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const API = import.meta.env?.VITE_API_URL || 'http://localhost:8081';
      const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};
      
      console.log('👨‍✈️ Loading driver details for ID:', driverId);
      
      const driverRes = await fetch(`${API}/api/profile/${driverId}?role=Driver`, { headers });
      if (driverRes.ok) {
        const driverData = await driverRes.json();
        console.log('✅ Driver data loaded:', driverData);
        
        setDriver({
          name: driverData.name || driverData.username || 'Driver',
          rating: driverData.rating || 4.5,
          vehicleNo: driverData.vehicleNumber || 'N/A',
          phone: driverData.phoneNumber || driverData.phone || 'N/A',
          vehicleType: driverData.vehicleType || 'car'
        });
      } else {
        console.warn('⚠️ Failed to fetch driver profile');
      }
    } catch (error) {
      console.error('❌ Error fetching driver details:', error);
    }
  };

  // Polling for real-time status updates
  useEffect(() => {
    if (status === 'cancelled' || status === 'completed') return;

    const pollInterval = setInterval(async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const API = import.meta.env?.VITE_API_URL || 'http://localhost:8081';
        const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};
        
        console.log('📡 Polling for updates...');
        
        const res = await fetch(`${API}/api/rides/${rideRequestId}`, { headers });
        if (res.ok) {
          const data = await res.json();
          const ride = data?.ride;
          
          if (ride) {
            const newStatus = (ride.status || '').toLowerCase();
            console.log('📊 Polling - Current status:', newStatus, 'Previous:', status);
            
            setStatus(newStatus);
            
            // If ride is accepted and has driver, redirect immediately
            if (newStatus === 'accepted' && ride.driverId) {
              console.log('🎉 DRIVER ACCEPTED! Redirecting immediately...');
              setToast({ message: 'Driver found! Redirecting to tracking...', type: 'success' });
              
              // Redirect immediately
              setTimeout(() => {
                navigate(`/ride/live/${rideRequestId}`);
              }, 1000);
              
              return;
            }
            
            // If ride is started, redirect immediately
            if (newStatus === 'started') {
              console.log('🚗 Ride started! Redirecting immediately...');
              navigate(`/ride/live/${rideRequestId}`);
              return;
            }
            
            // If ride is cancelled
            if (newStatus === 'cancelled') {
              console.log('❌ Ride cancelled');
              setToast({ message: 'Ride request was cancelled', type: 'error' });
              return;
            }
            
            // If ride has a driver but status is still requested, load driver details
            if (ride.driverId && !driver) {
              await loadDriverDetails(ride.driverId);
            }
          }
        } else {
          console.error('❌ Polling failed:', res.status);
        }
      } catch (error) {
        console.error('❌ Polling error:', error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [rideRequestId, status, driver, navigate]);

  const handleCancelRequest = async () => {
    const reason = prompt('Cancellation reason?');
    if (!reason) return;
    
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const userId = user?.id;
      
      if (!userId) {
        setToast({ message: 'User not found', type: 'error' });
        return;
      }

      const API = import.meta.env?.VITE_API_URL || 'http://localhost:8081';
      const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};
      
      const res = await fetch(`${API}/api/rides/${rideRequestId}/cancel?userId=${encodeURIComponent(userId)}`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (res.ok) {
        setStatus('cancelled');
        setToast({ message: 'Ride cancelled successfully', type: 'success' });
        setTimeout(() => navigate('/user/dashboard'), 2000);
      } else {
        setStatus('cancelled');
        setToast({ message: 'Ride cancelled locally', type: 'warning' });
        setTimeout(() => navigate('/user/dashboard'), 2000);
      }
    } catch (error) {
      console.error('❌ Cancel error:', error);
      setStatus('cancelled');
      setToast({ message: 'Ride cancelled locally', type: 'warning' });
      setTimeout(() => navigate('/user/dashboard'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToBooking = () => {
    if (status === 'accepted') {
      navigate(`/booking/${rideRequestId}`);
    }
  };

  const getStatusMessage = () => {
    switch (status.toLowerCase()) {
      case 'requested':
        return 'Searching for drivers...';
      case 'accepted':
        return 'Driver found! Ready to proceed.';
      case 'started':
        return 'Ride in progress';
      case 'completed':
        return 'Ride completed';
      case 'cancelled':
        return 'Ride request cancelled';
      default:
        return 'Processing...';
    }
  };

  const getStatusColor = () => {
    switch (status.toLowerCase()) {
      case 'requested':
        return '#f59e0b';
      case 'accepted':
        return '#22c55e';
      case 'started':
        return '#3b82f6';
      case 'completed':
        return '#22c55e';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="bg-secondary" style={{ minHeight: '100vh' }}>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          .pulse {
            animation: pulse 2s infinite;
          }
        `}
      </style>
      <UserNavbar 
        showTripHistory={false}
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
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'var(--space-2xl)' }}>
        <div style={{ marginBottom: 'var(--space-2xl)' }}>
          <h1 className="text-primary" style={{ marginBottom: 'var(--space-sm)' }}>
            Ride Request Status
          </h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
          {/* Left Column - Ride Details */}
          <div className="card">
            <h3 className="text-primary" style={{ marginBottom: 'var(--space-lg)' }}>Ride Details</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div>
                <label className="text-secondary" style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)', display: 'block', marginBottom: 'var(--space-xs)' }}>Pickup Location</label>
                <div className="text-primary" style={{ fontSize: 'var(--font-size-base)' }}>Pickup Address</div>
              </div>
              
              <div>
                <label className="text-secondary" style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)', display: 'block', marginBottom: 'var(--space-xs)' }}>Drop Location</label>
                <div className="text-primary" style={{ fontSize: 'var(--font-size-base)' }}>Dropoff Address</div>
              </div>
              
              <div>
                <label className="text-secondary" style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)', display: 'block' }}>Vehicle Type</label>
                <div className="text-primary" style={{ fontSize: 'var(--font-size-base)', textTransform: 'uppercase' }}>CAR</div>
              </div>
              
              <div>
                <label className="text-secondary" style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)', display: 'block' }}>Estimated Fare</label>
                <div className="text-success-600" style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)' }}>₹174</div>
              </div>
            </div>

            <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', background: 'var(--primary-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-500)' }}>
              <div className="text-primary" style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-xs)' }}>Status</div>
              <div style={{ color: getStatusColor(), fontWeight: 'var(--font-weight-medium)' }}>{getStatusMessage()}</div>
            </div>
          </div>

          {/* Right Column - Driver Info or Waiting */}
          <div className="card">
            {status === 'accepted' && driver ? (
              <>
                <h3 className="text-primary" style={{ marginBottom: 'var(--space-lg)' }}>Driver Details</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                  <div>
                    <label className="text-secondary" style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)', display: 'block' }}>Driver Name</label>
                    <div className="text-primary" style={{ fontSize: 'var(--font-size-base)' }}>{driver.name}</div>
                  </div>
                  
                  <div>
                    <label className="text-secondary" style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)', display: 'block' }}>Rating</label>
                    <div className="text-primary" style={{ fontSize: 'var(--font-size-base)' }}>⭐ {driver.rating}</div>
                  </div>
                  
                  <div>
                    <label className="text-secondary" style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)', display: 'block' }}>Vehicle Number</label>
                    <div className="text-primary" style={{ fontSize: 'var(--font-size-base)' }}>{driver.vehicleNo}</div>
                  </div>
                  
                  <div>
                    <label className="text-secondary" style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)', display: 'block' }}>Phone</label>
                    <div className="text-primary" style={{ fontSize: 'var(--font-size-base)' }}>{driver.phone}</div>
                  </div>

                  {/* Real-time status indicator */}
                  <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-sm)', background: 'var(--success-50)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--success-200)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                      <div style={{ width: 6, height: 6, background: '#10b981', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
                      <div className="text-success-600" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                        Driver is on the way
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-primary" style={{ marginBottom: 'var(--space-lg)' }}>Searching for Drivers</h3>
                
                <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
                  <div style={{ fontSize: 'var(--font-size-4xl)', marginBottom: 'var(--space-lg)' }}>🔍</div>
                  <div className="text-secondary" style={{ marginBottom: 'var(--space-md)' }}>
                    We're looking for available drivers in your area...
                  </div>
                  <div className="text-tertiary" style={{ fontSize: 'var(--font-size-sm)' }}>
                    This usually takes 1-3 minutes
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-2xl)', justifyContent: 'center' }}>
          {(status.toLowerCase() === 'requested' || status.toLowerCase() === 'accepted') && (
            <button 
              onClick={handleCancelRequest}
              disabled={loading}
              className="btn-outline"
              style={{ 
                color: 'var(--danger-600)',
                borderColor: 'var(--danger-600)'
              }}
            >
              {loading ? 'Cancelling...' : 'Cancel Request'}
            </button>
          )}
          
          {status.toLowerCase() === 'accepted' && (
            <button 
              onClick={handleProceedToBooking}
              className="btn-success"
              style={{ minWidth: '200px' }}
            >
              Proceed to Booking
            </button>
          )}

          {/* Manual redirect button for testing */}
          {status.toLowerCase() === 'accepted' && (
            <button 
              onClick={() => {
                console.log('🔧 Manual redirect triggered');
                navigate(`/ride/live/${rideRequestId}`);
              }}
              style={{
                padding: '12px 24px',
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14
              }}
            >
              🔧 Manual Redirect (Debug)
            </button>
          )}

          {status.toLowerCase() === 'cancelled' && (
            <button 
              onClick={() => navigate('/user')}
              className="btn-primary"
              style={{ minWidth: '200px' }}
            >
              Back to Dashboard
            </button>
          )}
        </div>
      </div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </div>
  );
};

export default RideRequestWaiting;
