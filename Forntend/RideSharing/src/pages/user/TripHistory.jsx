import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Toast from '../../components/Toast';
import { getRecentRidesLocal, getUserRidesPaged, rateRideApi } from '../../services/RideService';

const API = (import.meta.env?.VITE_API_URL || 'http://localhost:8081');

const TripHistory = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const token = user?.token;
  
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [toast, setToast] = useState({ message: '', type: 'info' });

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      // Try backend paged history first
      if (user?.id) {
        const res = await getUserRidesPaged({ userId: user.id, page: 0, size: 20 });
        if (res?.data?.content && Array.isArray(res.data.content)) {
          setTrips(res.data.content);
          return;
        }
      }
      // Fallback to local store
      const recent = getRecentRidesLocal();
      const mappedLocal = (recent || []).map(r => {
        const d = new Date(r.date || Date.now());
        const date = d.toISOString().slice(0,10);
        const time = d.toTimeString().slice(0,5);
        return {
          id: r.id,
          date,
          time,
          pickup: r.pickup,
          dropoff: r.dropoff,
          driver: '—',
          vehicle: '—',
          fare: r.fare || 0,
          status: r.status || 'requested',
          rating: r.rating || null,
          distance: r.distance || '—',
          duration: r.duration || '—'
        };
      });
      setTrips(mappedLocal);
    } catch (error) {
      console.error('Error fetching trips:', error);
      setToast({ message: 'Failed to load trip history. Using local data.', type: 'warning' });
      // Try local fallback
      const recent = getRecentRidesLocal();
      const mappedLocal = (recent || []).map(r => {
        const d = new Date(r.date || Date.now());
        const date = d.toISOString().slice(0,10);
        const time = d.toTimeString().slice(0,5);
        return {
          id: r.id,
          date,
          time,
          pickup: r.pickup,
          dropoff: r.dropoff,
          driver: '—',
          vehicle: '—',
          fare: r.fare || 0,
          status: r.status || 'requested',
          rating: r.rating || null,
          distance: r.distance || '—',
          duration: r.duration || '—'
        };
      });
      setTrips(mappedLocal);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      case 'in_progress': return 'blue';
      default: return 'gray';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'in_progress': return 'In Progress';
      default: return status;
    }
  };

  const filteredTrips = trips.filter(trip => {
    if (filter === 'all') return true;
    return trip.status === filter;
  });

  const sortedTrips = [...filteredTrips].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time);
      case 'fare':
        return b.fare - a.fare;
      case 'distance':
        return parseFloat(b.distance) - parseFloat(a.distance);
      default:
        return 0;
    }
  });

  // Show recent trips (limit to 10 for better performance)
  const recentTrips = sortedTrips.slice(0, 10);

  const handleRateTrip = async (tripId, rating) => {
    try {
      await rateRideApi(tripId, rating);
      setTrips(trips.map(trip => trip.id === tripId ? { ...trip, rating } : trip));
      setToast({ message: 'Rating submitted successfully', type: 'success' });
    } catch {
      setToast({ message: 'Failed to submit rating', type: 'error' });
    }
  };

  const handleRepeatTrip = (trip) => {
    // Navigate to booking with pre-filled data
    navigate('/user/dashboard', { 
      state: { 
        repeatTrip: {
          pickup: trip.pickup,
          dropoff: trip.dropoff
        }
      }
    });
  };

  const handleReportTrip = (tripId) => {
    navigate('/report-incident', { 
      state: { 
        tripId,
        prefill: true
      }
    });
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p>Loading trip history...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 20 }}>
      <h1 style={{ marginBottom: 24, fontSize: 28, fontWeight: 700 }}>Trip History</h1>
      
      {/* Filters and Sort */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 14 }}>
              Filter by Status
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14
              }}
            >
              <option value="all">All Trips</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="in_progress">In Progress</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 14 }}>
              Sort by
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14
              }}
            >
              <option value="date">Date</option>
              <option value="fare">Fare</option>
              <option value="distance">Distance</option>
            </select>
          </div>
          
          <div style={{ marginLeft: 'auto', fontSize: 14, color: '#6b7280' }}>
            {recentTrips.length} trips shown
          </div>
        </div>
      </Card>

      {/* Trip List */}
      {recentTrips.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚗</div>
          <h3 style={{ marginBottom: 8 }}>No trips found</h3>
          <p style={{ color: '#6b7280', marginBottom: 24 }}>
            {filter === 'all' 
              ? "You haven't taken any trips yet. Book your first ride!"
              : `No ${filter} trips found.`
            }
          </p>
          <button
            onClick={() => navigate('/user/dashboard')}
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
            Book a Ride
          </button>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 16 }}>
          {recentTrips.map(trip => (
            <Card key={trip.id} style={{ padding: 16, height: 'fit-content' }}>
              {/* Trip Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 20 }}>🚗</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {trip.date} at {trip.time}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      Trip #{trip.id}
                    </div>
                  </div>
                </div>
                <Badge variant={getStatusColor(trip.status)}>
                  {getStatusText(trip.status)}
                </Badge>
              </div>

              {/* Route */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 6, height: 6, background: '#10b981', borderRadius: '50%' }}></div>
                  <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trip.pickup}</div>
                </div>
                <div style={{ width: 2, height: 12, background: '#d1d5db', marginLeft: 2 }}></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, background: '#ef4444', borderRadius: '50%' }}></div>
                  <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trip.dropoff}</div>
                </div>
              </div>

              {/* Trip Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>Fare</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#059669' }}>₹{trip.fare}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>Distance</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{trip.distance}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>Duration</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{trip.duration}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>Driver</div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{trip.driver}</div>
                </div>
              </div>

              {/* Rating */}
              {trip.status === 'completed' && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>Rate your trip</div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => handleRateTrip(trip.id, star)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 16,
                          color: star <= (trip.rating || 0) ? '#fbbf24' : '#d1d5db'
                        }}
                      >
                        ⭐
                      </button>
                    ))}
                    {trip.rating && (
                      <span style={{ marginLeft: 6, fontSize: 12, color: '#6b7280' }}>
                        ({trip.rating}/5)
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {trip.status === 'completed' && (
                  <button
                    onClick={() => handleRepeatTrip(trip)}
                    style={{
                      padding: '4px 8px',
                      background: '#f0f9ff',
                      border: '1px solid #0ea5e9',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 10,
                      fontWeight: 500,
                      color: '#0ea5e9'
                    }}
                  >
                    Repeat
                  </button>
                )}
                
                <button
                  onClick={() => handleReportTrip(trip.id)}
                  style={{
                    padding: '4px 8px',
                    background: '#fef2f2',
                    border: '1px solid #dc2626',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 10,
                    fontWeight: 500,
                    color: '#dc2626'
                  }}
                >
                  Report
                </button>
                
                <button
                  onClick={() => navigate(`/ride/${trip.id}`)}
                  style={{
                    padding: '4px 8px',
                    background: '#f3f4f6',
                    border: '1px solid #6b7280',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 10,
                    fontWeight: 500,
                    color: '#6b7280'
                  }}
                >
                  Details
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </div>
  );
};

export default TripHistory;
