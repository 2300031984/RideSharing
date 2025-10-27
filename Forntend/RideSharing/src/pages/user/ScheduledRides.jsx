import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Toast from '../../components/Toast';

const API = (import.meta.env?.VITE_API_URL || 'http://localhost:8081');

const ScheduledRides = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  
  const [scheduledRides, setScheduledRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [filter, setFilter] = useState('all'); // all, upcoming, completed, cancelled

  useEffect(() => {
    loadScheduledRides();
    
    // Poll for updates every 5 seconds to detect driver assignments
    const pollInterval = setInterval(() => {
      loadScheduledRides();
    }, 5000);
    
    return () => clearInterval(pollInterval);
  }, []);

  const loadScheduledRides = async () => {
    setLoading(true);
    try {
      // Try to fetch from backend first
      const response = await fetch(`${API}/api/rides/user/${user.id}/scheduled`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        const backendRides = await response.json();
        // Transform backend rides to match frontend format
        const transformedRides = await Promise.all(backendRides.map(async (ride) => {
          let driverInfo = null;
          
          // If driver is assigned, fetch full driver details
          if (ride.driverId && ride.status === 'ACCEPTED') {
            try {
              const driverRes = await fetch(`${API}/api/profile/${ride.driverId}?role=Driver`, {
                headers: { Authorization: `Bearer ${user.token}` }
              });
              if (driverRes.ok) {
                const driverData = await driverRes.json();
                console.log('Fetched driver for scheduled ride:', driverData);
                driverInfo = {
                  name: driverData.name || driverData.username || ride.driverName || 'Driver',
                  phone: driverData.phoneNumber || driverData.phone || 'N/A',
                  vehicle: driverData.vehicleNumber || ride.vehicleNumber || 'N/A',
                  rating: driverData.rating || 4.5
                };
              } else {
                console.warn(`Failed to fetch driver ${ride.driverId} profile`);
                // Use ride data as fallback
                driverInfo = {
                  name: ride.driverName || 'Driver',
                  phone: 'N/A',
                  vehicle: ride.vehicleNumber || 'N/A',
                  rating: 4.5
                };
              }
            } catch (driverError) {
              console.error('Error fetching driver details:', driverError);
              driverInfo = {
                name: ride.driverName || 'Driver',
                phone: 'N/A',
                vehicle: ride.vehicleNumber || 'N/A',
                rating: 4.5
              };
            }
          }
          
          return {
            id: ride.id,
            backendId: ride.id,
            pickup: ride.pickupAddress,
            dropoff: ride.dropoffAddress,
            scheduledDate: ride.scheduledAt ? ride.scheduledAt.split('T')[0] : '',
            scheduledTime: ride.scheduledAt ? ride.scheduledAt.split('T')[1].substring(0, 5) : '',
            status: ride.status?.toLowerCase() || 'scheduled',
            fare: ride.fare || 0,
            distance: '0 km', // Will be updated when backend supports it
            duration: '0 min', // Will be updated when backend supports it
            specialRequests: '', // Will be updated when backend supports it
            contactNumber: user.phone || '',
            createdAt: ride.requestedAt,
            userId: user.id,
            driver: driverInfo
          };
        }));
        setScheduledRides(transformedRides);
      } else {
        throw new Error('Backend fetch failed');
      }
    } catch (error) {
      console.warn('Failed to fetch from backend, using localStorage:', error);
      // Fallback to localStorage
      try {
        const rides = JSON.parse(localStorage.getItem('scheduledRides') || '[]');
        // Filter rides for current user
        const userRides = rides.filter(ride => ride.userId === user.id);
        setScheduledRides(userRides);
      } catch (localError) {
        console.error('Error loading scheduled rides:', localError);
        setToast({ message: 'Failed to load scheduled rides', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (ride) => {
    const now = new Date();
    const scheduledDateTime = new Date(`${ride.scheduledDate}T${ride.scheduledTime}`);
    
    if (ride.status === 'cancelled') {
      return { status: 'Cancelled', color: 'red', icon: '❌' };
    }
    
    if (ride.status === 'completed') {
      return { status: 'Completed', color: 'green', icon: '✅' };
    }
    
    if (ride.status === 'in_progress') {
      return { status: 'In Progress', color: 'blue', icon: '🚗' };
    }
    
    if (ride.status === 'accepted') {
      return { status: 'Driver Found', color: 'green', icon: '👨‍💼' };
    }
    
    if (ride.status === 'requested') {
      return { status: 'Driver Searching', color: 'yellow', icon: '🔍' };
    }
    
    if (scheduledDateTime > now) {
      return { status: 'Scheduled', color: 'blue', icon: '⏰' };
    } else {
      return { status: 'Overdue', color: 'red', icon: '⚠️' };
    }
  };

  const getDriverStatus = (ride) => {
    if (ride.driver) {
      return {
        found: true,
        name: ride.driver.name || 'Driver Assigned',
        phone: ride.driver.phone || 'N/A',
        vehicle: ride.driver.vehicle || 'N/A',
        rating: ride.driver.rating || 4.5
      };
    }
    return { found: false };
  };

  const formatDateTime = (date, time) => {
    const dateTime = new Date(`${date}T${time}`);
    return dateTime.toLocaleString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeUntilRide = (date, time) => {
    const now = new Date();
    const scheduledDateTime = new Date(`${date}T${time}`);
    const diffMs = scheduledDateTime - now;
    
    if (diffMs < 0) {
      return 'Overdue';
    }
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} left`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} left`;
    } else {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} left`;
    }
  };

  const handleCancelRide = async (rideId) => {
    if (window.confirm('Are you sure you want to cancel this scheduled ride?')) {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const userId = user?.id;
        
        if (userId) {
          // Try to cancel via API first
          const { cancelRideApi } = await import('../../services/RideService');
          const result = await cancelRideApi(rideId, userId, 'User cancelled scheduled ride');
          
          if (result.success) {
            setToast({ message: 'Scheduled ride cancelled successfully', type: 'success' });
          } else {
            setToast({ message: 'Ride cancelled locally (API unavailable)', type: 'warning' });
          }
        } else {
          setToast({ message: 'User not found. Cancelling locally.', type: 'warning' });
        }
        
        // Update local storage regardless of API result
        const updatedRides = scheduledRides.map(ride => 
          ride.id === rideId ? { ...ride, status: 'cancelled' } : ride
        );
        localStorage.setItem('scheduledRides', JSON.stringify(updatedRides));
        setScheduledRides(updatedRides);
        
      } catch (error) {
        console.error('Cancel scheduled ride error:', error);
        // Fallback: update local storage
        const updatedRides = scheduledRides.map(ride => 
          ride.id === rideId ? { ...ride, status: 'cancelled' } : ride
        );
        localStorage.setItem('scheduledRides', JSON.stringify(updatedRides));
        setScheduledRides(updatedRides);
        setToast({ message: 'Ride cancelled locally. Please check your trip history.', type: 'warning' });
      }
    }
  };

  const handleRescheduleRide = (rideId) => {
    const ride = scheduledRides.find(r => r.id === rideId);
    if (ride) {
      // Navigate to schedule ride page with pre-filled data
      navigate('/schedule-ride', { 
        state: { 
          reschedule: true, 
          rideData: ride 
        } 
      });
    }
  };

  const filteredRides = scheduledRides.filter(ride => {
    const now = new Date();
    const scheduledDateTime = new Date(`${ride.scheduledDate}T${ride.scheduledTime}`);
    
    switch (filter) {
      case 'upcoming':
        return scheduledDateTime > now && ride.status !== 'cancelled' && ride.status !== 'completed';
      case 'completed':
        return ride.status === 'completed';
      case 'cancelled':
        return ride.status === 'cancelled';
      default:
        return true;
    }
  });

  const sortedRides = filteredRides.sort((a, b) => {
    const dateA = new Date(`${a.scheduledDate}T${a.scheduledTime}`);
    const dateB = new Date(`${b.scheduledDate}T${b.scheduledTime}`);
    return dateA - dateB;
  });

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
      
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Scheduled Rides</h1>
          <p style={{ color: '#6b7280', fontSize: 16 }}>View and manage your scheduled rides</p>
        </div>

        {/* Filter Tabs */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[
              { key: 'all', label: 'All Rides', count: scheduledRides.length },
              { key: 'upcoming', label: 'Upcoming', count: scheduledRides.filter(r => {
                const now = new Date();
                const scheduledDateTime = new Date(`${r.scheduledDate}T${r.scheduledTime}`);
                return scheduledDateTime > now && r.status !== 'cancelled' && r.status !== 'completed';
              }).length },
              { key: 'completed', label: 'Completed', count: scheduledRides.filter(r => r.status === 'completed').length },
              { key: 'cancelled', label: 'Cancelled', count: scheduledRides.filter(r => r.status === 'cancelled').length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                  background: filter === tab.key ? '#2563eb' : '#fff',
                  color: filter === tab.key ? '#fff' : '#374151',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                {tab.label}
                <Badge variant={filter === tab.key ? 'white' : 'gray'}>{tab.count}</Badge>
              </button>
            ))}
          </div>
        </div>

        {/* Rides List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 18 }}>⏳ Loading scheduled rides...</div>
          </div>
        ) : sortedRides.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
            <h3 style={{ marginBottom: 8, color: '#374151' }}>No scheduled rides found</h3>
            <p style={{ color: '#6b7280', marginBottom: 24 }}>
              {filter === 'all' 
                ? "You haven't scheduled any rides yet." 
                : `No ${filter} rides found.`
              }
            </p>
            <button
              onClick={() => navigate('/schedule-ride')}
              style={{
                padding: '12px 24px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Schedule a Ride
            </button>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {sortedRides.map(ride => {
              const statusInfo = getStatusInfo(ride);
              const driverStatus = getDriverStatus(ride);
              const timeUntil = getTimeUntilRide(ride.scheduledDate, ride.scheduledTime);
              
              return (
                <Card key={ride.id} style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <span style={{ fontSize: 20 }}>{statusInfo.icon}</span>
                        <Badge variant={statusInfo.color}>{statusInfo.status}</Badge>
                      </div>
                      
                      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4, color: '#111827' }}>
                        {ride.pickup} → {ride.dropoff}
                      </h3>
                      
                      <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 14, color: '#6b7280' }}>
                        <span>📅 {formatDateTime(ride.scheduledDate, ride.scheduledTime)}</span>
                        <span>💰 ₹{ride.fare}</span>
                        <span>📏 {ride.distance}</span>
                        <span>⏱️ {ride.duration}</span>
                      </div>

                      {/* Driver Status */}
                      {driverStatus.found ? (
                        <div style={{ 
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                          border: '2px solid #059669', 
                          borderRadius: 8, 
                          padding: 16, 
                          marginBottom: 12,
                          color: 'white'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <div style={{ fontSize: 24 }}>✅</div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>Driver Found!</div>
                              <div style={{ fontSize: 13, opacity: 0.95 }}>Your ride has been confirmed</div>
                            </div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 6, padding: 12, marginTop: 8 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                              <div>
                                <div style={{ opacity: 0.9, marginBottom: 2 }}>Driver</div>
                                <div style={{ fontWeight: 600 }}>{driverStatus.name}</div>
                              </div>
                              <div>
                                <div style={{ opacity: 0.9, marginBottom: 2 }}>Vehicle</div>
                                <div style={{ fontWeight: 600 }}>{driverStatus.vehicle}</div>
                              </div>
                              <div>
                                <div style={{ opacity: 0.9, marginBottom: 2 }}>Phone</div>
                                <div style={{ fontWeight: 600 }}>{driverStatus.phone}</div>
                              </div>
                              <div>
                                <div style={{ opacity: 0.9, marginBottom: 2 }}>Rating</div>
                                <div style={{ fontWeight: 600 }}>⭐ {driverStatus.rating}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : ride.status === 'requested' || ride.status === 'scheduled' ? (
                        <div style={{ 
                          background: '#fef3c7', 
                          border: '1px solid #f59e0b', 
                          borderRadius: 6, 
                          padding: 12, 
                          marginBottom: 12 
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 16 }}>🔍</span>
                            <span style={{ fontWeight: 600, color: '#92400e' }}>
                              {ride.status === 'scheduled' ? 'Waiting for scheduled time' : 'Searching for driver...'}
                            </span>
                          </div>
                        </div>
                      ) : null}

                      {/* Special Requests */}
                      {ride.specialRequests && (
                        <div style={{ 
                          background: '#f8fafc', 
                          border: '1px solid #e5e7eb', 
                          borderRadius: 6, 
                          padding: 8, 
                          marginBottom: 12,
                          fontSize: 14,
                          color: '#6b7280'
                        }}>
                          <strong>Special Requests:</strong> {ride.specialRequests}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginLeft: 16 }}>                      
                      {/* View Status Button - Always visible for non-cancelled rides */}
                      {ride.status !== 'cancelled' && ride.status !== 'completed' && (
                        <button
                          onClick={() => {
                            // Always navigate to live ride page to show status
                            // The LiveRide component will handle showing "waiting for driver" state
                            navigate(`/ride/live/${ride.backendId || ride.id}`);
                          }}
                          style={{
                            padding: '10px 20px',
                            background: driverStatus.found 
                              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                              : '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: 6,
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            minWidth: 140
                          }}
                        >
                          {driverStatus.found ? (
                            <>
                              <span>✅</span>
                              <span>Driver Assigned</span>
                            </>
                          ) : (
                            <>
                              <span>👁️</span>
                              <span>View Status</span>
                            </>
                          )}
                        </button>
                      )}
                      
                      {ride.status === 'scheduled' && (
                        <>
                          <button
                            onClick={() => handleRescheduleRide(ride.id)}
                            style={{
                              padding: '8px 16px',
                              background: '#f59e0b',
                              color: 'white',
                              border: 'none',
                              borderRadius: 4,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            📅 Reschedule
                          </button>
                          <button
                            onClick={() => handleCancelRide(ride.id)}
                            style={{
                              padding: '8px 16px',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: 4,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            ❌ Cancel
                          </button>
                        </>
                      )}
                      
                      {(ride.status === 'accepted' || ride.status === 'started' || ride.status === 'in_progress') && (
                        <button
                          onClick={() => navigate(`/ride/live/${ride.backendId || ride.id}`)}
                          style={{
                            padding: '8px 16px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {ride.status === 'accepted' ? '📍 Track Live' : '🚗 Live Ride'}
                        </button>
                      )}
                      
                      {ride.status === 'completed' && (
                        <button
                          onClick={() => navigate('/user/ride-history')}
                          style={{
                            padding: '8px 16px',
                            background: '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          📋 Ride History
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </div>
  );
};

export default ScheduledRides;
