import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../../components/ui/Badge';
import Toast from '../../components/Toast';
import { getRecentRidesLocal, getUserRidesPaged, rateRideApi } from '../../services/RideService';
import '../../Styles/TripHistory.css';

const TripHistory = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'completed', 'cancelled', 'in_progress'
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const pageSize = 2;

  useEffect(() => {
    fetchTrips();
  }, [filter, page]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(0);
  }, [filter]);

  const fetchTrips = async () => {
    try {
      setLoading(true);

      const userId = user?.id;
      // Pass the filter logic to the backend/service
      const statusParam = filter === 'all' ? undefined : filter;

      const res = await getUserRidesPaged({
        userId,
        status: statusParam,
        page,
        size: pageSize
      });

      if (res?.data?.content) {
        setTrips(res.data.content);
        setTotalPages(res.data.totalPages || 0);
        setTotalElements(res.data.totalElements || 0);
      } else {
        // Fallback to local
        loadLocalFallback();
      }

    } catch (error) {
      console.error('Error fetching trips:', error);
      setToast({ message: 'Failed to load specific history. Showing local data.', type: 'warning' });
      loadLocalFallback();
    } finally {
      setLoading(false);
    }
  };

  const loadLocalFallback = () => {
    const recent = getRecentRidesLocal();
    // In fallback mode, we have to do client-side filtering and pagination manually
    let filtered = recent;
    if (filter !== 'all') {
      filtered = recent.filter(r => (r.status || 'requested') === filter);
    }

    // Manual Pagination
    const start = page * pageSize;
    const end = start + pageSize;
    const paged = filtered.slice(start, end);

    const mapped = paged.map(transformTripData);
    setTrips(mapped);
    setTotalPages(Math.ceil(filtered.length / pageSize));
    setTotalElements(filtered.length);
  };

  const transformTripData = (r) => {
    const d = new Date(r.date || Date.now());
    return {
      id: r.id,
      date: d.toISOString().slice(0, 10),
      time: d.toTimeString().slice(0, 5),
      pickup: r.pickup || 'Unknown Location',
      dropoff: r.dropoff || 'Unknown Location',
      driver: r.driver || '—',
      vehicle: r.vehicle || '—',
      fare: r.fare || 0,
      status: r.status || 'requested',
      rating: r.rating || null,
      distance: r.distance || '—',
      duration: r.duration || '—'
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      case 'in_progress':
      case 'accepted':
      case 'arrived':
      case 'started':
        return 'blue';
      default: return 'gray';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'in_progress': return 'In Progress';
      case 'accepted': return 'Driver Accepted';
      case 'arrived': return 'Driver Arrived';
      case 'started': return 'Trip Started';
      default: return status;
    }
  };

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
      state: { tripId, prefill: true }
    });
  };

  if (loading && page === 0 && trips.length === 0) {
    return (
      <div className="trip-history-container" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <p>Loading trip history...</p>
      </div>
    );
  }

  return (
    <div className="trip-history-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="trip-history-title">Your Trips</h1>
        <button className="book-ride-btn" onClick={() => navigate('/user/dashboard')}>
          + Book Ride
        </button>
      </div>

      {/* Filters */}
      <div className="trip-filters-card">
        <div className="trip-filters-wrapper">
          <div className="filter-group">
            <label className="filter-label">Filter by Status</label>
            <select
              className="filter-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Trips</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="in_progress">Active / In Progress</option>
            </select>
          </div>

          <div className="trip-count">
            Showing {trips.length} of {totalElements} trips
          </div>
        </div>
      </div>

      {/* Trip Grid */}
      {trips.length === 0 ? (
        <div className="empty-history">
          <span className="empty-icon">🚖</span>
          <h3 className="empty-title">No trips found</h3>
          <p className="empty-text">
            {filter === 'all'
              ? "You haven't taken any trips yet."
              : `No ${filter} trips found in your history.`}
          </p>
          <button className="book-ride-btn" onClick={() => navigate('/user/dashboard')}>
            Book a Ride Now
          </button>
        </div>
      ) : (
        <div className="trips-grid">
          {trips.map(trip => (
            <div key={trip.id} className="trip-card">

              {/* Header */}
              <div className="trip-header">
                <div className="trip-header-left">
                  <div className="trip-icon-bg">🚗</div>
                  <div>
                    <div className="trip-date-time">
                      {trip.date} • {trip.time}
                    </div>
                    <div className="trip-id">ID: {trip.id}</div>
                  </div>
                </div>
                <Badge variant={getStatusColor(trip.status)}>
                  {getStatusText(trip.status)}
                </Badge>
              </div>

              {/* Route */}
              <div className="trip-route">
                <div className="route-line"></div>
                <div className="route-point">
                  <div className="route-dot dot-pickup"></div>
                  <div className="route-address" title={trip.pickup}>{trip.pickup}</div>
                </div>
                <div className="route-point">
                  <div className="route-dot dot-dropoff"></div>
                  <div className="route-address" title={trip.dropoff}>{trip.dropoff}</div>
                </div>
              </div>

              {/* Stats */}
              <div className="trip-stats">
                <div className="stat-item">
                  <span className="stat-label">Fare</span>
                  <span className="stat-value fare">₹{trip.fare}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Distance</span>
                  <span className="stat-value">{trip.distance}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Time</span>
                  <span className="stat-value">{trip.duration}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Driver</span>
                  <span className="stat-value">{trip.driver}</span>
                </div>
              </div>

              {/* Rating */}
              {trip.status === 'completed' && (
                <div className="trip-rating">
                  {trip.rating ? (
                    <div className="rating-display">
                      You rated: {trip.rating} ⭐
                    </div>
                  ) : (
                    <>
                      <span className="rating-prompt">Rate trip:</span>
                      <div>
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            className="star-btn"
                            onClick={() => handleRateTrip(trip.id, star)}
                            style={{ color: '#d1d5db' }}
                          >
                            ⭐
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="trip-actions">
                {trip.status === 'completed' && (
                  <button className="action-btn btn-repeat" onClick={() => handleRepeatTrip(trip)}>
                    ↺ Repeat
                  </button>
                )}

                <button className="action-btn btn-report" onClick={() => handleReportTrip(trip.id)}>
                  ⚠ Report
                </button>

                <button className="action-btn btn-details" onClick={() => navigate(`/ride/${trip.id}`)}>
                  Details
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-controls">
          <button
            className="page-btn"
            disabled={page === 0}
            onClick={() => setPage(p => Math.max(0, p - 1))}
          >
            Previous
          </button>
          <span className="page-info">
            Page {page + 1} of {totalPages}
          </span>
          <button
            className="page-btn"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'info' })}
      />
    </div>
  );
};

export default TripHistory;
