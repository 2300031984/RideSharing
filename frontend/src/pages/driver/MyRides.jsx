import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DriverNavbar from '../../components/DriverNavbar';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Toast from '../../components/Toast';

const API = (import.meta.env?.VITE_API_URL || 'http://localhost:8081');

const DriverMyRides = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [filter, setFilter] = useState('all'); // all, active, scheduled, completed

  useEffect(() => {
    loadAllRides();
  }, []);

  const loadAllRides = async () => {
    setLoading(true);
    try {
      if (!user?.id || !user?.token) {
        setToast({ message: 'Please log in to view your rides', type: 'error' });
        setTimeout(() => navigate('/driver/login'), 2000);
        return;
      }

      // Fetch all rides assigned to this driver
      const headers = { Authorization: `Bearer ${user.token}` };
      const response = await fetch(`${API}/api/rides/driver/${user.id}`, { headers });

      if (response.ok) {
        const data = await response.json();
        const allRides = data?.rides || [];
        
        // Transform and categorize rides
        const transformedRides = allRides.map(ride => ({
          id: ride.id,
          type: ride.isScheduled ? 'scheduled' : 'regular',
          status: ride.status?.toUpperCase() || 'REQUESTED',
          pickup: ride.pickupAddress || 'Unknown',
          dropoff: ride.dropoffAddress || 'Unknown',
          fare: ride.fare || 0,
          distance: ride.distance ? `${ride.distance} km` : 'N/A',
          duration: ride.duration ? `${ride.duration} min` : 'N/A',
          createdAt: ride.createdAt || new Date().toISOString(),
          acceptedAt: ride.acceptedAt || null,
          startedAt: ride.startedAt || null,
          completedAt: ride.completedAt || null,
          scheduledDate: ride.scheduledDate || null,
          scheduledTime: ride.scheduledTime || null,
          otp: ride.otp || null,
          riderName: ride.riderName || 'Passenger',
          riderId: ride.riderId || null,
          vehicleType: ride.vehicleType || 'Car',
          rating: ride.rating || null
        }));

        setRides(transformedRides);
      } else {
        setToast({ message: 'Failed to load rides', type: 'error' });
      }
    } catch (error) {
      console.error('Error loading rides:', error);
      setToast({ message: 'Network error. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'REQUESTED': { variant: 'yellow', label: 'Pending', icon: '⏳' },
      'ACCEPTED': { variant: 'blue', label: 'Accepted', icon: '✓' },
      'STARTED': { variant: 'green', label: 'In Progress', icon: '🚗' },
      'COMPLETED': { variant: 'green', label: 'Completed', icon: '✅' },
      'CANCELLED': { variant: 'red', label: 'Cancelled', icon: '❌' }
    };
    return statusConfig[status] || { variant: 'gray', label: status, icon: '📋' };
  };

  const getRideCategory = (ride) => {
    if (ride.status === 'COMPLETED') return 'completed';
    if (ride.status === 'CANCELLED') return 'completed';
    if (ride.type === 'scheduled' && ride.status === 'ACCEPTED') return 'scheduled';
    if (ride.status === 'ACCEPTED' || ride.status === 'STARTED') return 'active';
    return 'other';
  };

  const calculateEarnings = () => {
    return rides
      .filter(r => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + (r.fare || 0), 0);
  };

  const filteredRides = rides.filter(ride => {
    const category = getRideCategory(ride);
    if (filter === 'all') return true;
    if (filter === 'active') return category === 'active';
    if (filter === 'scheduled') return category === 'scheduled' && ride.status !== 'COMPLETED' && ride.status !== 'CANCELLED';
    if (filter === 'completed') return category === 'completed';
    return true;
  });

  const sortedRides = filteredRides.sort((a, b) => {
    // Active rides first, then scheduled, then completed
    const categoryOrder = { active: 1, scheduled: 2, completed: 3 };
    const catA = getRideCategory(a);
    const catB = getRideCategory(b);
    if (catA !== catB) return categoryOrder[catA] - categoryOrder[catB];
    
    // Within category, sort by date (newest first)
    const dateA = a.acceptedAt || a.createdAt;
    const dateB = b.acceptedAt || b.createdAt;
    return new Date(dateB) - new Date(dateA);
  });

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewRide = (ride) => {
    if (ride.status === 'ACCEPTED' || ride.status === 'STARTED') {
      // Store ride ID and navigate to tracking
      localStorage.setItem('lastAcceptedRideId', String(ride.id));
      navigate('/driver/active-ride');
    } else {
      // For completed rides, could navigate to earnings or history
      navigate('/driver/earnings');
    }
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <DriverNavbar />
      
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: '#1f2937' }}>My Rides</h1>
          <p style={{ color: '#6b7280', fontSize: 16 }}>View all your active, scheduled, and completed rides</p>
        </div>

        {/* Filter Tabs */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: 'All Rides', count: rides.length },
              { 
                key: 'active', 
                label: 'Active', 
                count: rides.filter(r => getRideCategory(r) === 'active').length 
              },
              { 
                key: 'scheduled', 
                label: 'Scheduled', 
                count: rides.filter(r => getRideCategory(r) === 'scheduled').length 
              },
              { 
                key: 'completed', 
                label: 'Completed', 
                count: rides.filter(r => getRideCategory(r) === 'completed').length 
              }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
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

        {/* Stats Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <Card style={{ padding: 16, background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🚗</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{rides.filter(r => getRideCategory(r) === 'active').length}</div>
            <div style={{ fontSize: 14, opacity: 0.9 }}>Active Rides</div>
          </Card>
          
          <Card style={{ padding: 16, background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>
              {rides.filter(r => getRideCategory(r) === 'scheduled').length}
            </div>
            <div style={{ fontSize: 14, opacity: 0.9 }}>Scheduled Rides</div>
          </Card>
          
          <Card style={{ padding: 16, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{rides.filter(r => r.status === 'COMPLETED').length}</div>
            <div style={{ fontSize: 14, opacity: 0.9 }}>Completed Rides</div>
          </Card>
          
          <Card style={{ padding: 16, background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: 'white' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>💰</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>₹{calculateEarnings()}</div>
            <div style={{ fontSize: 14, opacity: 0.9 }}>Total Earnings</div>
          </Card>
        </div>

        {/* Rides List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 18, color: '#6b7280' }}>⏳ Loading your rides...</div>
          </div>
        ) : sortedRides.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🚗</div>
            <h3 style={{ marginBottom: 8, color: '#374151' }}>No rides found</h3>
            <p style={{ color: '#6b7280', marginBottom: 24 }}>
              {filter === 'all' 
                ? "You haven't accepted any rides yet." 
                : `No ${filter} rides found.`
              }
            </p>
            <button
              onClick={() => navigate('/driver/dashboard')}
              style={{
                padding: '12px 24px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Go to Dashboard
            </button>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {sortedRides.map(ride => {
              const statusInfo = getStatusBadge(ride.status);
              const category = getRideCategory(ride);
              
              return (
                <Card key={ride.id} style={{ padding: 20, border: `2px solid ${category === 'active' ? '#10b981' : '#e5e7eb'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      {/* Header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <span style={{ fontSize: 24 }}>{statusInfo.icon}</span>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        {ride.type === 'scheduled' && (
                          <Badge variant="purple">📅 Scheduled</Badge>
                        )}
                        {category === 'active' && (
                          <Badge variant="green">🔴 LIVE</Badge>
                        )}
                      </div>
                      
                      {/* Route */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <div style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%' }}></div>
                          <span style={{ fontWeight: 500, fontSize: 15 }}>{ride.pickup}</span>
                        </div>
                        <div style={{ width: 2, height: 20, background: '#d1d5db', marginLeft: 3 }}></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, background: '#ef4444', borderRadius: '50%' }}></div>
                          <span style={{ fontWeight: 500, fontSize: 15 }}>{ride.dropoff}</span>
                        </div>
                      </div>
                      
                      {/* Details */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, fontSize: 14, color: '#6b7280', marginBottom: 12 }}>
                        <div>
                          <span style={{ fontWeight: 500, color: '#374151' }}>💰 Fare:</span> ₹{ride.fare}
                        </div>
                        <div>
                          <span style={{ fontWeight: 500, color: '#374151' }}>📏 Distance:</span> {ride.distance}
                        </div>
                        <div>
                          <span style={{ fontWeight: 500, color: '#374151' }}>👤 Passenger:</span> {ride.riderName}
                        </div>
                        {ride.scheduledDate && (
                          <div>
                            <span style={{ fontWeight: 500, color: '#374151' }}>📅 Scheduled:</span> {ride.scheduledDate} {ride.scheduledTime}
                          </div>
                        )}
                        {ride.acceptedAt && (
                          <div>
                            <span style={{ fontWeight: 500, color: '#374151' }}>✓ Accepted:</span> {formatDateTime(ride.acceptedAt)}
                          </div>
                        )}
                      </div>
                      
                      {/* OTP Display for Active Rides */}
                      {ride.otp && ride.status === 'ACCEPTED' && (
                        <div style={{ 
                          background: '#fef3c7', 
                          border: '1px solid #f59e0b', 
                          borderRadius: 8, 
                          padding: 12,
                          marginBottom: 12
                        }}>
                          <div style={{ fontSize: 12, color: '#92400e', marginBottom: 4 }}>Verify this OTP from passenger</div>
                          <div style={{ fontSize: 28, fontWeight: 700, color: '#92400e', letterSpacing: '0.2em', fontFamily: 'monospace' }}>
                            {ride.otp}
                          </div>
                        </div>
                      )}
                      
                      {/* Completed Info */}
                      {ride.completedAt && (
                        <div style={{ 
                          background: '#f0fdf4', 
                          border: '1px solid #10b981', 
                          borderRadius: 8, 
                          padding: 12,
                          marginBottom: 12
                        }}>
                          <div style={{ color: '#059669', fontSize: 14 }}>
                            ✅ Completed on {formatDateTime(ride.completedAt)}
                            {ride.rating && <span> • Rated: ⭐ {ride.rating}/5</span>}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Button */}
                    <div style={{ marginLeft: 16 }}>
                      <button
                        onClick={() => handleViewRide(ride)}
                        style={{
                          padding: '10px 20px',
                          background: category === 'active' ? '#10b981' : category === 'scheduled' ? '#f59e0b' : '#6b7280',
                          color: 'white',
                          border: 'none',
                          borderRadius: 8,
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {category === 'active' ? '🚗 Continue Ride' : category === 'scheduled' ? '👀 View Details' : '📋 View Earnings'}
                      </button>
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

export default DriverMyRides;
