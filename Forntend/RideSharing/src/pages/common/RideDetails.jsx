import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRideById } from '../../services/RideService';
import '../../Styles/RideDetails.css';
import { PaymentModal } from '../../components/PaymentModal';

const RideDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getRideById(id);
        if (res.data && res.data.ride) {
          setRide(res.data.ride); // Fix: Access nested 'ride' object
        } else {
          setError('Ride data not found.');
        }
      } catch (e) {
        setError(e?.response?.data?.message || e.message || 'Failed to load ride');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="ride-details-container"><p>Loading details...</p></div>;
  if (error) return <div className="ride-details-container"><p style={{ color: 'red' }}>{error}</p><button onClick={() => navigate(-1)} className="back-btn">Go Back</button></div>;
  if (!ride) return null;

  return (
    <div className="ride-details-container">
      {/* Header */}
      <div className="details-header">
        <div className="details-title">
          <h1>Ride #{ride.id}</h1>
          <p>{new Date(ride.createdAt || Date.now()).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <button onClick={() => navigate(-1)} className="back-btn">
          <span>←</span> Back to History
        </button>
      </div>

      {/* Grid Layout */}
      <div className="details-grid">

        {/* Left Column: Route & Stats */}
        <div className="left-col">
          <div className="details-card">
            <div className="card-title">Route Details</div>

            {/* Map Action */}
            <div className="map-action-box">
              {ride.pickupLatitude && ride.pickupLongitude ? (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${ride.pickupLatitude},${ride.pickupLongitude}&destination=${ride.dropoffLatitude},${ride.dropoffLongitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="view-map-btn"
                >
                  🗺️ View Route on Google Maps
                </a>
              ) : (
                <div className="map-unavailable">
                  📍 Map coordinates not available
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="route-timeline">
              <div className="timeline-item">
                <div className="timeline-icon">
                  <div className="dot pickup"></div>
                  <div className="line"></div>
                </div>
                <div className="timeline-content">
                  <label>Pickup Location</label>
                  <p>{ride.pickupAddress}</p>
                </div>
              </div>

              <div className="timeline-item">
                <div className="timeline-icon">
                  <div className="dot dropoff"></div>
                </div>
                <div className="timeline-content">
                  <label>Dropoff Destination</label>
                  <p>{ride.dropoffAddress}</p>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="info-row">
              <div className="info-item">
                <div className="label">Distance</div>
                <div className="value">{ride.distance ? `${ride.distance.toFixed(1)} km` : '-'}</div>
              </div>
              <div className="info-item">
                <div className="label">Duration</div>
                <div className="value">{ride.duration ? `${ride.duration} min` : '-'}</div>
              </div>
              <div className="info-item">
                <div className="label">Fare</div>
                <div className="value price">₹{ride.fare ? ride.fare.toFixed(0) : '0'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Status & Driver */}
        <div className="right-col">

          {/* Status Card */}
          <div className="details-card">
            <div className={`status-badge status-${ride.status}`}>
              {ride.status.replace('_', ' ')}
            </div>
            
            {/* Payment UI Hook */}
            {ride.status === 'COMPLETED' && ride.paymentStatus !== 'PAID' && (
                <div style={{ marginTop: '16px' }}>
                     <div style={{ fontSize: '14px', color: '#ef4444', marginBottom: '8px', fontWeight: 600 }}>Payment Pending</div>
                     <button 
                        onClick={() => setPaymentModalOpen(true)}
                        style={{ width: '100%', padding: '10px', background: '#3b82f6', color: 'white', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                        Pay Now
                     </button>
                </div>
            )}
            {ride.paymentStatus === 'PAID' && (
                <div style={{ marginTop: '16px', color: '#10b981', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    ✅ Paid Successfully
                </div>
            )}
          </div>

          {/* Driver Card */}
          <div className="details-card">
            <div className="card-title">Driver</div>
            <div className="driver-profile">
              <div className="driver-avatar">
                {ride.driverName ? ride.driverName.charAt(0) : 'D'}
              </div>
              <h3 className="driver-name">{ride.driverName || 'Unknown Driver'}</h3>
              <div className="rating-badge">
                ★ {ride.rating || '4.8'}
              </div>
            </div>

            <div className="vehicle-info">
              <div style={{ fontWeight: 600, color: '#334155' }}>{ride.vehicleType || 'Sedan'}</div>
              <div className="vehicle-plate">{ride.vehicleNumber || 'NO PLATE'}</div>
            </div>
          </div>

          {/* Timestamps Card */}
          <div className="details-card">
            <div className="card-title">Timeline</div>
            <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Requested:</span>
                <span style={{ fontWeight: 600 }}>{ride.createdAt ? new Date(ride.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
              </div>
              {ride.startedAt && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Started:</span>
                  <span style={{ fontWeight: 600 }}>{new Date(ride.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
              {ride.completedAt && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Completed:</span>
                  <span style={{ fontWeight: 600 }}>{new Date(ride.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      <PaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setPaymentModalOpen(false)} 
        rideId={ride.id} 
        fare={ride.fare} 
        onSuccess={() => {
            setPaymentModalOpen(false);
            setRide({...ride, paymentStatus: 'PAID'});
            alert("Payment Successful! Webhook confirmation pending.");
        }} 
      />
    </div>
  );
};

export default RideDetails;
