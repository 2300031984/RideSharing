import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getRideById } from '../../services/RideService';

const field = (label, value) => (
  <div style={{ marginBottom: 6 }}>
    <strong>{label}:</strong> {value ?? '-'}
  </div>
);

const RideDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getRideById(id);
        setRide(res.data);
      } catch (e) {
        setError(e?.response?.data?.message || e.message || 'Failed to load ride');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  return (
    <div style={{ padding: 20, maxWidth: 720, margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>&larr; Back</button>
      <h2>Ride Details</h2>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {ride && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
          {field('ID', ride.id)}
          {field('Status', ride.status)}
          {field('Passenger', ride.passengerName)}
          {field('Pickup', ride.pickupAddress)}
          {field('Dropoff', ride.dropoffAddress)}
          {field('Requested At', ride.requestedAt ? new Date(ride.requestedAt).toLocaleString() : '-')}
          {field('Accepted At', ride.acceptedAt ? new Date(ride.acceptedAt).toLocaleString() : '-')}
          {field('Arrived At', ride.arrivedAt ? new Date(ride.arrivedAt).toLocaleString() : '-')}
          {field('Started At', ride.startedAt ? new Date(ride.startedAt).toLocaleString() : '-')}
          {field('Completed At', ride.completedAt ? new Date(ride.completedAt).toLocaleString() : '-')}
          {field('Fare', ride.fare != null ? ride.fare : '-')}
          {field('Driver', ride.driver ? (ride.driver.name || ride.driver.id) : '-')}
        </div>
      )}
      <div style={{ marginTop: 12 }}>
        <Link to="/user/ride-history">Back to Ride History</Link>
      </div>
    </div>
  );
};

export default RideDetails;
