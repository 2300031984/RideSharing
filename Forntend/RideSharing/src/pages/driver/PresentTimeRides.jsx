import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DriverNavbar from '../../components/DriverNavbar';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Toast from '../../components/Toast';
import { getPendingRidesLocal, removePendingRideLocal, updateRecentStatusLocal, getRecentByIdLocal, acceptRideApi, getRideRequestsByStatusFromDatabase } from '../../services/RideService';

const API = (import.meta.env?.VITE_API_URL || 'http://localhost:8081');

const PresentTimeRides = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const token = user?.token;
  
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [filter, setFilter] = useState('all'); // all, nearby, high_fare
  const [status, setStatus] = useState('OFFLINE');

  const driverVehicleType = (user?.vehicleType || 'car');

  useEffect(() => {
    // Initialize status from navbar toggle
    try {
      const online = localStorage.getItem('driver_online') === 'true';
      setStatus(online ? 'ONLINE' : 'OFFLINE');
    } catch {}
    
    fetchRecentRequests();
    
    const onStorage = (e) => {
      if (e.key === 'driver_online') {
        const val = e.newValue === 'true';
        setStatus(val ? 'ONLINE' : 'OFFLINE');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Poll backend REQUESTED rides when ONLINE, fallback to local pending
  useEffect(() => {
    const tick = () => {
      if (status === 'ONLINE') {
        getRideRequestsByStatusFromDatabase('REQUESTED')
          .then((res) => {
            const rides = Array.isArray(res?.rides) ? res.rides : (Array.isArray(res) ? res : []);
            if (rides.length > 0) {
              const mapped = rides.map(r => ({
                id: r.id,
                pickup: r.pickupLocation,
                dropoff: r.dropoffLocation,
                fare: r.fare || 0,
                distance: r.distance ? `${r.distance} km` : '—',
                vehicleType: r.vehicleType || 'car'
              }));
              const filtered = mapped.filter(r => !r.vehicleType || r.vehicleType === driverVehicleType);
              setRecentRequests(filtered);
              return;
            }
            const all = getPendingRidesLocal();
            const filtered = Array.isArray(all) ? all.filter(r => !r.vehicleType || r.vehicleType === driverVehicleType) : [];
            setRecentRequests(filtered);
          })
          .catch(() => {
            const all = getPendingRidesLocal();
            const filtered = Array.isArray(all) ? all.filter(r => !r.vehicleType || r.vehicleType === driverVehicleType) : [];
            setRecentRequests(filtered);
          });
      }
    };
    tick();
    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
  }, [status]);

  const fetchRecentRequests = async () => {
    setLoading(true);
    try {
      const res = await getRideRequestsByStatusFromDatabase('REQUESTED');
      const rides = Array.isArray(res?.rides) ? res.rides : (Array.isArray(res) ? res : []);
      if (rides.length > 0) {
        const mapped = rides.map(r => ({
          id: r.id,
          pickup: r.pickupLocation,
          dropoff: r.dropoffLocation,
          fare: r.fare || 0,
          distance: r.distance ? `${r.distance} km` : '—',
          vehicleType: r.vehicleType || 'car'
        }));
        const filtered = mapped.filter(r => !r.vehicleType || r.vehicleType === driverVehicleType);
        setRecentRequests(filtered);
        return;
      }
      const all = getPendingRidesLocal();
      const filtered = Array.isArray(all) ? all.filter(r => !r.vehicleType || r.vehicleType === driverVehicleType) : [];
      setRecentRequests(filtered);
    } catch (error) {
      const all = getPendingRidesLocal();
      const filtered = Array.isArray(all) ? all.filter(r => !r.vehicleType || r.vehicleType === driverVehicleType) : [];
      setRecentRequests(filtered);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptPending = async (req) => {
    try {
      await acceptRideApi(req.id);
      updateRecentStatusLocal(req.id, 'accepted');
      removePendingRideLocal(req.id);
      setRecentRequests(getPendingRidesLocal());
      setToast({ message: `Accepted ride #${req.id} - Starting tracking!`, type: 'success' });
      
      // Immediately start tracking the accepted ride
      // In a real implementation, this would start location tracking
      console.log(`Starting real-time tracking for ride #${req.id}`);
      try { localStorage.setItem('lastAcceptedRideId', String(req.id)); } catch {}
      
      // Navigate to active ride tracking page
      navigate('/driver/active-ride');
    } catch (e) {
      const errorMessage = e?.response?.data?.message || e?.response?.data || e.message || 'Failed to accept ride';
      setToast({ message: errorMessage, type: 'error' });
      // Remove the ride from pending list if it's no longer available
      removePendingRideLocal(req.id);
      setRecentRequests(getPendingRidesLocal());
    }
  };

  const handleDeclinePending = (req) => {
    removePendingRideLocal(req.id);
    setRecentRequests(getPendingRidesLocal());
    setToast({ message: `Declined ride #${req.id}`, type: 'info' });
  };

  const getFareColor = (fare) => {
    const amount = parseFloat(fare) || 0;
    if (amount >= 500) return '#059669'; // Green for high fare
    if (amount >= 200) return '#f59e0b'; // Orange for medium fare
    return '#6b7280'; // Gray for low fare
  };

  const getDistanceColor = (distance) => {
    const dist = parseFloat(distance) || 0;
    if (dist <= 5) return '#059669'; // Green for short distance
    if (dist <= 15) return '#f59e0b'; // Orange for medium distance
    return '#dc2626'; // Red for long distance
  };

  const filteredRequests = recentRequests.filter(request => {
    const fare = parseFloat(request.fare) || 0;
    const distance = parseFloat(request.distance) || 0;
    
    switch (filter) {
      case 'nearby':
        return distance <= 10; // Within 10 km
      case 'high_fare':
        return fare >= 300; // 300+ rupees
      case 'all':
      default:
        return true;
    }
  });

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <DriverNavbar />
      
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'nearby', label: 'Nearby (≤10km)' },
            { key: 'high_fare', label: 'High Fare (₹300+)' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                padding: '8px 16px',
                background: filter === tab.key ? '#2563eb' : '#f3f4f6',
                color: filter === tab.key ? 'white' : '#374151',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

         {/* Stats */}
         <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', padding: '12px 16px', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
             <div style={{ fontSize: 20 }}>📋</div>
             <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Total Requests</div>
             <div style={{ fontSize: 18, fontWeight: 700, color: '#2563eb', marginLeft: 4 }}>
               {recentRequests.length}
             </div>
           </div>
           
           <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', padding: '12px 16px', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
             <div style={{ fontSize: 20 }}>📍</div>
             <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Nearby</div>
             <div style={{ fontSize: 18, fontWeight: 700, color: '#059669', marginLeft: 4 }}>
               {recentRequests.filter(r => parseFloat(r.distance) <= 10).length}
             </div>
           </div>
           
           <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', padding: '12px 16px', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
             <div style={{ fontSize: 20 }}>💰</div>
             <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>High Fare</div>
             <div style={{ fontSize: 18, fontWeight: 700, color: '#f59e0b', marginLeft: 4 }}>
               {recentRequests.filter(r => parseFloat(r.fare) >= 300).length}
             </div>
           </div>
           
           <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', padding: '12px 16px', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
             <div style={{ fontSize: 20 }}>⏰</div>
             <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Avg Wait</div>
             <div style={{ fontSize: 18, fontWeight: 700, color: '#7c3aed', marginLeft: 4 }}>
               {recentRequests.length > 0 ? '2m' : '—'}
             </div>
           </div>
         </div>

        {/* Requests List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 18, color: '#6b7280' }}>Loading ride requests...</div>
          </div>
        ) : status !== 'ONLINE' ? (
          <Card>
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔴</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#374151' }}>
                You're Offline
              </h3>
              <p style={{ color: '#6b7280', marginBottom: 16 }}>
                Go online to start receiving ride requests
              </p>
              <button
                onClick={() => navigate('/driver/dashboard')}
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
                Go to Dashboard
              </button>
            </div>
          </Card>
        ) : filteredRequests.length === 0 ? (
          <Card>
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🚗</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#374151' }}>
                No {filter === 'all' ? '' : filter} ride requests
              </h3>
              <p style={{ color: '#6b7280' }}>
                {filter === 'nearby' 
                  ? 'No nearby ride requests available'
                  : filter === 'high_fare'
                  ? 'No high-fare ride requests available'
                  : 'No ride requests available at the moment'
                }
              </p>
            </div>
          </Card>
         ) : (
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
             {filteredRequests.map((request) => (
               <Card key={request.id} style={{ border: '1px solid #e5e7eb', padding: 12 }}>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                   {/* Header */}
                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                       <div style={{ fontSize: 16 }}>🚗</div>
                       <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>
                         #{request.id}
                       </h3>
                     </div>
                     <Badge variant="blue" style={{ fontSize: 10, padding: '2px 6px' }}>Pending</Badge>
                   </div>
                   
                   {/* Fare and Distance */}
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                     <div>
                       <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 1 }}>Fare</div>
                       <div style={{ fontWeight: 600, fontSize: 16, color: getFareColor(request.fare) }}>
                         ₹{request.fare}
                       </div>
                     </div>
                     <div>
                       <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 1 }}>Distance</div>
                       <div style={{ fontWeight: 600, fontSize: 14, color: getDistanceColor(request.distance) }}>
                         {request.distance}
                       </div>
                     </div>
                   </div>
                   
                   {/* Pickup and Dropoff */}
                   <div style={{ marginBottom: 8 }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                       <div style={{ width: 4, height: 4, background: '#10b981', borderRadius: '50%' }}></div>
                       <div style={{ fontSize: 11, fontWeight: 500, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{request.pickup}</div>
                     </div>
                     <div style={{ width: 1, height: 8, background: '#d1d5db', marginLeft: 1 }}></div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                       <div style={{ width: 4, height: 4, background: '#ef4444', borderRadius: '50%' }}></div>
                       <div style={{ fontSize: 11, fontWeight: 500, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{request.dropoff}</div>
                     </div>
                   </div>
                   
                   {/* Details */}
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 10, marginBottom: 8 }}>
                     <div>
                       <div style={{ color: '#6b7280', marginBottom: 1 }}>Vehicle</div>
                       <div style={{ fontWeight: 500, fontSize: 11 }}>{request.vehicleType || 'Any'}</div>
                     </div>
                     <div>
                       <div style={{ color: '#6b7280', marginBottom: 1 }}>ETA</div>
                       <div style={{ fontWeight: 500, fontSize: 11 }}>5-10 min</div>
                     </div>
                   </div>
                   
                   {/* Action Buttons */}
                   <div style={{ display: 'flex', gap: 6 }}>
                     <button
                       onClick={() => handleAcceptPending(request)}
                       style={{
                         flex: 1,
                         padding: '8px 10px',
                         background: '#059669',
                         color: 'white',
                         border: 'none',
                         borderRadius: 4,
                         cursor: 'pointer',
                         fontWeight: 600,
                         fontSize: 11
                       }}
                     >
                       ✅ Accept
                     </button>
                     <button
                       onClick={() => handleDeclinePending(request)}
                       style={{
                         flex: 1,
                         padding: '8px 10px',
                         background: 'none',
                         color: '#dc2626',
                         border: '1px solid #dc2626',
                         borderRadius: 4,
                         cursor: 'pointer',
                         fontWeight: 600,
                         fontSize: 11
                       }}
                     >
                       ❌ Decline
                     </button>
                   </div>
                   
                   {/* Details Button */}
                   <button
                     onClick={() => navigate(`/ride/${request.id}`)}
                     style={{
                       width: '100%',
                       padding: '6px 10px',
                       background: 'none',
                       color: '#2563eb',
                       border: '1px solid #2563eb',
                       borderRadius: 4,
                       cursor: 'pointer',
                       fontWeight: 500,
                       fontSize: 10
                     }}
                   >
                     👁️ Details
                   </button>
                 </div>
               </Card>
             ))}
           </div>
         )}
      </div>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </div>
  );
};

export default PresentTimeRides;
