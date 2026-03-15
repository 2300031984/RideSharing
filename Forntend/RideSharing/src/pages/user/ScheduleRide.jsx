import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';
import Toast from '../../components/Toast';
import '../../Styles/ScheduleRide.css';

const API = (import.meta.env?.VITE_API_URL || 'http://localhost:8081');

const ScheduleRide = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const token = user?.token;

  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [rideType, setRideType] = useState('car');
  const [specialRequests, setSpecialRequests] = useState('');
  const [contactNumber, setContactNumber] = useState(user.phone || '');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [fareEstimate, setFareEstimate] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);

  const [rideTypes, setRideTypes] = useState([
    { id: 'bike', name: 'Bike', icon: '🏍️', description: 'Quick and affordable', baseFare: 20, perKm: 8, perMin: 1 },
    { id: 'car', name: 'Car', icon: '🚗', description: 'Regular ride', baseFare: 40, perKm: 15, perMin: 2 },
    { id: 'suv', name: 'SUV', icon: '🚙', description: 'Comfortable ride', baseFare: 60, perKm: 20, perMin: 2.5 },
    { id: 'van', name: 'Van', icon: '🚐', description: 'Larger vehicle', baseFare: 80, perKm: 25, perMin: 3 },
    { id: 'auto', name: 'Auto Rickshaw', icon: '🛺', description: '3-wheeler', baseFare: 25, perKm: 12, perMin: 1.8 }
  ]);

  // Default date = tomorrow, time = 09:00
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduledDate(tomorrow.toISOString().split('T')[0]);
    setScheduledTime('09:00');
  }, []);

  // Calculate Fare Effect
  useEffect(() => {
    if (pickupAddress && dropoffAddress) {
      calculateDistanceAndFare();
    } else {
      setFareEstimate(null);
    }
  }, [pickupAddress, dropoffAddress, rideType]);

  const calculateDistanceAndFare = () => {
    // Mock calculation (simulating Google Maps)
    const mockDistance = Math.random() * 50 + 5;
    const mockDuration = Math.round(mockDistance * 2.5);

    setDistance(mockDistance.toFixed(1));
    setDuration(mockDuration);

    const selectedType = rideTypes.find(rt => rt.id === rideType) || rideTypes[1];

    let fare = Math.max(selectedType.baseFare, selectedType.baseFare + (mockDistance * selectedType.perKm) + (mockDuration * selectedType.perMin));

    if (mockDistance > 25) fare *= 0.95; // 5% discount for long rides

    setFareEstimate({
      total: Math.round(fare),
      distance: mockDistance,
      duration: mockDuration
    });
  };

  const handleScheduleRide = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const selectedVehicle = rideTypes.find(rt => rt.id === rideType);

      const payload = {
        passengerId: user.id,
        passengerName: user.username || 'User',
        pickupAddress,
        dropoffAddress,
        scheduledDate,
        scheduledTime,
        vehicleType: selectedVehicle?.name || 'Car',
        fare: fareEstimate ? parseFloat(fareEstimate.total) : 0.0,
        specialRequests, // Note: Backend DTO might not have this, but good to send if updated later
        // contactNumber is not in DTO but standard practice to include in specialRequests or update DTO
      };

      const res = await fetch(`${API}/api/rides/book-scheduled`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setToast({ message: 'Ride scheduled successfully!', type: 'success' });
        setTimeout(() => navigate('/user/dashboard'), 2000);
      } else {
        const err = await res.json();
        throw new Error(err.message || 'Failed to schedule');
      }

    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <UserNavbar />

      <div className="schedule-container">
        <div className="schedule-header">
          <h1>Schedule a Ride</h1>
          <p>Plan your trip in advance for peace of mind.</p>
        </div>

        <form className="schedule-layout" onSubmit={handleScheduleRide}>

          {/* Left Column: Trip Details */}
          <div className="schedule-left">
            <div className="schedule-card">
              <div className="card-title">Trip Details</div>

              <div className="form-group">
                <label className="form-label">Pickup Location</label>
                <input className="form-input" value={pickupAddress} onChange={e => setPickupAddress(e.target.value)} required placeholder="Enter pickup address" />
              </div>

              <div className="form-group">
                <label className="form-label">Dropoff Location</label>
                <input className="form-input" value={dropoffAddress} onChange={e => setDropoffAddress(e.target.value)} required placeholder="Enter dropoff address" />
              </div>

              <div className="datetime-row">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} required min={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input type="time" className="form-input" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Contact Number</label>
                <input className="form-input" type="tel" value={contactNumber} onChange={e => setContactNumber(e.target.value)} placeholder="Phone number" />
              </div>

              <div className="form-group">
                <label className="form-label">Special Requests</label>
                <textarea className="form-textarea" rows="2" value={specialRequests} onChange={e => setSpecialRequests(e.target.value)} placeholder="Notes for driver..." />
              </div>
            </div>
          </div>

          {/* Right Column: Vehicle & Summary */}
          <div className="schedule-right">

            <div className="schedule-card">
              <div className="card-title">Select Vehicle</div>
              <div className="vehicle-grid">
                {rideTypes.map(type => (
                  <div k={type.id} className={`vehicle-option ${rideType === type.id ? 'selected' : ''}`} onClick={() => setRideType(type.id)}>
                    <div className="vehicle-icon">{type.icon}</div>
                    <div className="vehicle-name">{type.name}</div>
                    <div className="vehicle-price">Base ₹{type.baseFare}</div>
                  </div>
                ))}
              </div>
            </div>

            {fareEstimate && (
              <div className="schedule-card pricing-card">
                <div className="card-title">Fare Estimate</div>
                <div className="pricing-row">
                  <span>Base Fare</span>
                  <span>₹{rideTypes.find(r => r.id === rideType).baseFare}</span>
                </div>
                <div className="pricing-row">
                  <span>Est. Distance</span>
                  <span>{fareEstimate.distance ? fareEstimate.distance.toFixed(1) : 0} km</span>
                </div>
                <div className="pricing-row">
                  <span>Est. Time</span>
                  <span>{fareEstimate.duration} min</span>
                </div>
                <div className="pricing-total">
                  <span>Total Estimate</span>
                  <span>₹{fareEstimate.total}</span>
                </div>
              </div>
            )}

            <button type="submit" className="schedule-btn" disabled={loading}>
              {loading ? 'Scheduling...' : 'Confirm Schedule'}
            </button>

          </div>
        </form>
      </div>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </div>
  );
};

export default ScheduleRide;
