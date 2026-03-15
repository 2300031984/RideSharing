import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DriverNavbar from '../../components/DriverNavbar';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Toast from '../../components/Toast';

const API = (import.meta.env?.VITE_API_URL || 'http://localhost:8081');

const LongDistanceScheduledRides = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const token = user?.token;
  
  const [scheduledRides, setScheduledRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [filter, setFilter] = useState('upcoming'); // upcoming, today, all

  useEffect(() => {
    fetchScheduledRides();
    
    // Poll for updates every 10 seconds
    const pollInterval = setInterval(() => {
      fetchScheduledRides();
    }, 10000);
    
    return () => clearInterval(pollInterval);
  }, []);

  const fetchScheduledRides = async () => {
    setLoading(true);
    try {
      if (!user?.id || !token) {
        console.warn('No user or token found');
        setScheduledRides([]);
        setLoading(false);
        return;
      }

      // Fetch scheduled rides from backend
      const response = await fetch(`${API}/api/rides/driver/${user.id}/scheduled`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const backendRides = await response.json();
        console.log('✅ Fetched driver scheduled rides from backend:', backendRides);
        console.log('Number of rides received:', backendRides.length);
        
        // Transform backend data
        const transformedRides = backendRides.map(ride => {
          console.log('Processing ride:', ride.id, 'Distance:', ride.distance, 'ScheduledAt:', ride.scheduledAt);
          return {
            id: ride.id,
            backendId: ride.id,
            pickup: ride.pickupAddress || 'Unknown',
            dropoff: ride.dropoffAddress || 'Unknown',
            scheduledDate: ride.scheduledAt ? ride.scheduledAt.split('T')[0] : '',
            scheduledTime: ride.scheduledAt ? ride.scheduledAt.split('T')[1].substring(0, 5) : '',
            fare: ride.fare || 0,
            distance: ride.distance ? `${ride.distance}` : '0',
            duration: ride.duration || '0',
            vehicleType: ride.vehicleType || 'CAR',
            riderName: ride.riderName || 'Passenger',
            riderId: ride.riderId,
            status: ride.status?.toLowerCase() || 'scheduled',
            createdAt: ride.requestedAt || ride.createdAt
          };
        });

        // CHANGED: Show ALL scheduled rides, not just long distance (removed 25km filter)
        const now = new Date();
        const futureScheduledRides = transformedRides.filter(ride => {
          const scheduledDateTime = new Date(`${ride.scheduledDate}T${ride.scheduledTime}`);
          const isFuture = scheduledDateTime > now;
          const isActive = ride.status !== 'cancelled' && ride.status !== 'completed';
          console.log(`Ride ${ride.id}: Future=${isFuture}, Active=${isActive}, Status=${ride.status}`);
          return isFuture && isActive;
        });
        
        console.log('✅ Filtered scheduled rides:', futureScheduledRides.length);
        setScheduledRides(futureScheduledRides);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch scheduled rides from backend');
        console.error('Status:', response.status, response.statusText);
        console.error('Error:', errorText);
        console.log('Falling back to localStorage...');
        
        // Fallback to localStorage
        const allScheduledRides = JSON.parse(localStorage.getItem('scheduledRides') || '[]');
        console.log('localStorage scheduledRides:', allScheduledRides.length, 'rides');
        
        const vt = (user?.vehicleType || '').toLowerCase();
        const vehicleFiltered = vt ? allScheduledRides.filter(r => (r?.vehicleType || '').toLowerCase() === vt) : allScheduledRides;
        
        const now = new Date();
        // CHANGED: Removed 25km filter
        const futureScheduledRides = vehicleFiltered.filter(ride => {
          const scheduledDateTime = new Date(`${ride.scheduledDate}T${ride.scheduledTime}`);
          return scheduledDateTime > now && ride.status !== 'cancelled' && ride.status !== 'completed';
        });
        
        console.log('✅ Using', futureScheduledRides.length, 'rides from localStorage');
        setScheduledRides(futureScheduledRides);
      }
    } catch (error) {
      console.error('❌ Error fetching scheduled rides:', error);
      console.log('Falling back to localStorage...');
      // Fallback to localStorage
      try {
        const allScheduledRides = JSON.parse(localStorage.getItem('scheduledRides') || '[]');
        console.log('localStorage scheduledRides:', allScheduledRides.length, 'rides');
        
        const vt = (user?.vehicleType || '').toLowerCase();
        const vehicleFiltered = vt ? allScheduledRides.filter(r => (r?.vehicleType || '').toLowerCase() === vt) : allScheduledRides;
        
        const now = new Date();
        // CHANGED: Removed 25km filter
        const futureScheduledRides = vehicleFiltered.filter(ride => {
          const scheduledDateTime = new Date(`${ride.scheduledDate}T${ride.scheduledTime}`);
          return scheduledDateTime > now && ride.status !== 'cancelled' && ride.status !== 'completed';
        });
        
        console.log('✅ Using', futureScheduledRides.length, 'rides from localStorage');
        setScheduledRides(futureScheduledRides);
      } catch (localError) {
        console.error('❌ localStorage error:', localError);
        setScheduledRides([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const getTimeUntilRide = (scheduledDate, scheduledTime) => {
    const now = new Date();
    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const diffMs = scheduledDateTime - now;
    
    if (diffMs <= 0) return 'Overdue';
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusColor = (ride) => {
    const now = new Date();
    const scheduledDateTime = new Date(`${ride.scheduledDate}T${ride.scheduledTime}`);
    const diffMs = scheduledDateTime - now;
    
    if (diffMs <= 0) return '#dc2626'; // Red for overdue
    if (diffMs <= 2 * 60 * 60 * 1000) return '#f59e0b'; // Orange for within 2 hours
    return '#059669'; // Green for future
  };

  const handleContactPassenger = (ride) => {
    setToast({ message: `Contacting passenger for ride #${ride.id}`, type: 'info' });
  };

  const handleAcceptRide = async (ride) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user?.id || !user?.token) {
        setToast({ message: 'Please log in to accept rides', type: 'error' });
        return;
      }

      const API = import.meta.env?.VITE_API_URL || 'http://localhost:8081';
      const response = await fetch(`${API}/api/rides/${ride.id}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ driverId: user.id })
      });

      if (response.ok) {
        setToast({ message: `Accepted scheduled ride #${ride.id}. Starting tracking!`, type: 'success' });
        
        // Store the accepted ride ID
        try { 
          localStorage.setItem('lastAcceptedRideId', String(ride.id)); 
        } catch {}
        
        // Navigate to active ride tracking
        setTimeout(() => {
          navigate('/driver/active-ride');
        }, 1000);
      } else {
        const error = await response.json();
        setToast({ message: error.message || 'Failed to accept ride', type: 'error' });
      }
    } catch (error) {
      console.error('Accept ride error:', error);
      setToast({ message: 'Network error. Please try again.', type: 'error' });
    }
  };

  const filteredRides = scheduledRides.filter(ride => {
    const now = new Date();
    const scheduledDateTime = new Date(`${ride.scheduledDate}T${ride.scheduledTime}`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scheduledDate = new Date(ride.scheduledDate);
    scheduledDate.setHours(0, 0, 0, 0);
    
    switch (filter) {
      case 'today':
        return scheduledDate.getTime() === today.getTime();
      case 'upcoming':
        return scheduledDateTime > now;
      case 'all':
      default:
        return true;
    }
  });

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <DriverNavbar />
      
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, color: '#1f2937' }}>
            Scheduled Rides 📅
          </h1>
          <p style={{ fontSize: 16, color: '#6b7280' }}>
            View and manage all your scheduled rides
          </p>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'today', label: 'Today' },
            { key: 'all', label: 'All' }
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 24 }}>📅</div>
              <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>Total Scheduled</div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#2563eb' }}>
              {scheduledRides.length}
            </div>
          </div>
          
          <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 24 }}>✅</div>
              <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>Accepted</div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>
              {scheduledRides.filter(ride => ride.status === 'accepted' || ride.status === 'ACCEPTED').length}
            </div>
          </div>
          
          <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 24 }}>⏰</div>
              <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>Today's Rides</div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>
              {scheduledRides.filter(ride => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const scheduledDate = new Date(ride.scheduledDate);
                scheduledDate.setHours(0, 0, 0, 0);
                return scheduledDate.getTime() === today.getTime();
              }).length}
            </div>
          </div>
          
          <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 24 }}>💰</div>
              <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>Total Earnings</div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#059669' }}>
              ₹{scheduledRides.reduce((sum, ride) => sum + (parseFloat(ride.fare) || 0), 0)}
            </div>
          </div>
        </div>

        {/* Rides List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 18, color: '#6b7280' }}>Loading scheduled rides...</div>
          </div>
        ) : filteredRides.length === 0 ? (
          <Card>
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#374151' }}>
                No {filter === 'all' ? '' : filter} scheduled rides
              </h3>
              <p style={{ color: '#6b7280' }}>
                {filter === 'upcoming' 
                  ? 'No upcoming long-distance rides scheduled'
                  : filter === 'today'
                  ? 'No rides scheduled for today'
                  : 'No long-distance rides found'
                }
              </p>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredRides.map((ride) => (
              <Card key={ride.id} style={{ border: `2px solid ${getStatusColor(ride)}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontSize: 32 }}>🚗</div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1f2937' }}>
                        Scheduled Ride #{ride.id}
                      </h3>
                      
                      {/* Status Badge */}
                      {ride.status === 'accepted' || ride.status === 'ACCEPTED' ? (
                        <Badge variant="green">✅ ACCEPTED</Badge>
                      ) : (
                        <Badge variant="blue">📅 SCHEDULED</Badge>
                      )}
                      
                      {/* Time until ride badge */}
                      <Badge 
                        variant={getStatusColor(ride) === '#dc2626' ? 'red' : 
                                getStatusColor(ride) === '#f59e0b' ? 'yellow' : 'green'}
                      >
                        {getTimeUntilRide(ride.scheduledDate, ride.scheduledTime)}
                      </Badge>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Scheduled Time</div>
                        <div style={{ fontWeight: 500 }}>
                          {ride.scheduledDate} at {ride.scheduledTime}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Fare</div>
                        <div style={{ fontWeight: 600, fontSize: 16, color: '#059669' }}>
                          ₹{ride.fare}
                        </div>
                      </div>
                    </div>
                    
                    {/* Show rider info for accepted rides */}
                    {(ride.status === 'accepted' || ride.status === 'ACCEPTED') && ride.riderName && (
                      <div style={{
                        padding: 12,
                        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                        borderRadius: 8,
                        marginBottom: 12,
                        border: '2px solid #3b82f6'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ fontSize: 20 }}>👤</div>
                          <div>
                            <div style={{ fontSize: 12, color: '#1e40af', fontWeight: 600 }}>Rider</div>
                            <div style={{ fontWeight: 600, color: '#1e3a8a' }}>{ride.riderName}</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <div style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%' }}></div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{ride.pickup}</div>
                      </div>
                      <div style={{ width: 2, height: 16, background: '#d1d5db', marginLeft: 3 }}></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, background: '#ef4444', borderRadius: '50%' }}></div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{ride.dropoff}</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Distance</div>
                        <div style={{ fontWeight: 500 }}>{ride.distance}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Ride Type</div>
                        <div style={{ fontWeight: 500 }}>{ride.rideType || 'Standard'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Duration</div>
                        <div style={{ fontWeight: 500 }}>{ride.duration || '—'}</div>
                      </div>
                    </div>
                    
                    {ride.specialRequests && (
                      <div style={{ 
                        marginTop: 12, 
                        padding: 8, 
                        background: '#fffbeb', 
                        border: '1px solid #f59e0b', 
                        borderRadius: 6,
                        fontSize: 12,
                        color: '#92400e',
                        fontStyle: 'italic'
                      }}>
                        <strong>Special Requests:</strong> {ride.specialRequests}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 120 }}>
                    {/* Status/Track button - Always visible */}
                    <button
                      onClick={() => {
                        // Always navigate to active ride tracking
                        // Store the ride ID so the tracking page can load it
                        localStorage.setItem('lastAcceptedRideId', String(ride.id));
                        navigate('/driver/active-ride');
                      }}
                      style={{
                        padding: '10px 16px',
                        background: (ride.status === 'accepted' || ride.status === 'ACCEPTED')
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: 14,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      {(ride.status === 'accepted' || ride.status === 'ACCEPTED') 
                        ? '🚗 Track Ride' 
                        : '👁️ View Status'}
                    </button>
                    
                    {/* Show different buttons based on status */}
                    {ride.status === 'accepted' || ride.status === 'ACCEPTED' ? (
                      <>
                        {/* Accepted ride buttons */}
                        <button
                          onClick={() => navigate('/driver/active-ride')}
                          style={{
                            padding: '10px 16px',
                            background: '#059669',
                            color: 'white',
                            border: 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: 14
                          }}
                        >
                          ▶️ Start Ride
                        </button>
                        <button
                          onClick={() => handleContactPassenger(ride)}
                          style={{
                            padding: '10px 16px',
                            background: '#0ea5e9',
                            color: 'white',
                            border: 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: 14
                          }}
                        >
                          📞 Call Rider
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Scheduled ride buttons */}
                        <button
                          onClick={() => handleAcceptRide(ride)}
                          style={{
                            padding: '10px 16px',
                            background: '#059669',
                            color: 'white',
                            border: 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: 14
                          }}
                        >
                          ✅ Accept
                        </button>
                        <button
                          onClick={() => handleContactPassenger(ride)}
                          style={{
                            padding: '10px 16px',
                            background: '#0ea5e9',
                            color: 'white',
                            border: 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: 14
                          }}
                        >
                          📞 Contact
                        </button>
                      </>
                    )}
                    
                    {/* Details button - always visible */}
                    <button
                      onClick={() => navigate(`/ride/${ride.id}`)}
                      style={{
                        padding: '10px 16px',
                        background: 'none',
                        color: '#2563eb',
                        border: '1px solid #2563eb',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: 14
                      }}
                    >
                      👁️ Details
                    </button>
                  </div>
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

export default LongDistanceScheduledRides;
