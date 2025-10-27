import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Toast from '../../components/Toast';

const API = (import.meta.env?.VITE_API_URL || 'http://localhost:8081');
const GOOGLE_KEY = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY;

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
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffCoords, setDropoffCoords] = useState(null);

  const [rideTypes, setRideTypes] = useState([
    { id: 'bike', name: 'Bike', icon: '🏍️', description: 'Quick and affordable', baseFare: 20, perKm: 8, perMin: 1, recommendedFor: 'Short distances (0-5 km)' },
    { id: 'car', name: 'Car', icon: '🚗', description: 'Regular ride', baseFare: 40, perKm: 15, perMin: 2, recommendedFor: 'Short distances (0-10 km)' },
    { id: 'suv', name: 'SUV', icon: '🚙', description: 'Comfortable ride', baseFare: 60, perKm: 20, perMin: 2.5, recommendedFor: 'Medium distances (10-25 km)' },
    { id: 'van', name: 'Van', icon: '🚐', description: 'Larger vehicle', baseFare: 80, perKm: 25, perMin: 3, recommendedFor: 'Long distances (25+ km)' },
    { id: 'auto', name: 'Auto Rickshaw', icon: '🛺', description: '3-wheeler', baseFare: 25, perKm: 12, perMin: 1.8, recommendedFor: 'Short hops (0-7 km)' }
  ]);

  const savedPlaces = [
    { name: 'Home', address: '123 Main Street, Bangalore', icon: '🏠' },
    { name: 'Office', address: 'Tech Park, Whitefield', icon: '🏢' },
    { name: 'Airport', address: 'Kempegowda International Airport', icon: '✈️' },
    { name: 'Railway Station', address: 'Bangalore City Railway Station', icon: '🚂' }
  ];

  // Set default date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduledDate(tomorrow.toISOString().split('T')[0]);
    setScheduledTime('09:00');
    // Fetch allowed vehicle types from backend (only available drivers)
    (async () => {
      try {
        const res = await fetch(`${API}/api/profile/vehicle-types?onlyAvailable=true`);
        if (res.ok) {
          const types = await res.json();
          if (Array.isArray(types) && types.length) {
            const normalized = types.map(v => String(v || '').toLowerCase());
            const catalog = [
              { id: 'bike', name: 'Bike', icon: '🏍️', description: 'Quick and affordable', baseFare: 20, perKm: 8, perMin: 1, recommendedFor: 'Short distances (0-5 km)' },
              { id: 'car', name: 'Car', icon: '🚗', description: 'Regular ride', baseFare: 40, perKm: 15, perMin: 2, recommendedFor: 'Short distances (0-10 km)' },
              { id: 'suv', name: 'SUV', icon: '🚙', description: 'Comfortable ride', baseFare: 60, perKm: 20, perMin: 2.5, recommendedFor: 'Medium distances (10-25 km)' },
              { id: 'van', name: 'Van', icon: '🚐', description: 'Larger vehicle', baseFare: 80, perKm: 25, perMin: 3, recommendedFor: 'Long distances (25+ km)' },
              { id: 'auto', name: 'Auto Rickshaw', icon: '🛺', description: '3-wheeler', baseFare: 25, perKm: 12, perMin: 1.8, recommendedFor: 'Short hops (0-7 km)' }
            ];
            const filtered = catalog.filter(c => normalized.includes(c.id));
            if (filtered.length) {
              setRideTypes(filtered);
              setRideType(filtered[0].id);
            }
          }
        }
      } catch {}
    })();
  }, []);

  // Calculate distance and fare when addresses change
  useEffect(() => {
    if (pickupAddress && dropoffAddress) {
      calculateDistanceAndFare();
    } else {
      setFareEstimate(null);
      setDistance(null);
      setDuration(null);
    }
  }, [pickupAddress, dropoffAddress, rideType, rideTypes]);

  const calculateDistanceAndFare = async () => {
    try {
      // Mock calculation - in real app, use Google Maps API
      const mockDistance = Math.random() * 50 + 5; // 5-55 km
      const mockDuration = Math.round(mockDistance * 2.5); // minutes
      
      setDistance(mockDistance.toFixed(1));
      setDuration(mockDuration);
      
      const selectedRideType = rideTypes.find(rt => rt.id === rideType) || rideTypes[0];
      
      // Calculate fare based on distance and vehicle type
      let fare = 0;
      const distance = parseFloat(mockDistance);
      
      if (selectedRideType.id === 'bike') {
        // Bike pricing: Lower base fare, lower per km rate
        fare = Math.max(20, 20 + (distance * 8) + (mockDuration * 1));
      } else if (selectedRideType.id === 'car') {
        fare = Math.max(40, 40 + (distance * 15) + (mockDuration * 2));
      } else if (selectedRideType.id === 'suv') {
        fare = Math.max(60, 60 + (distance * 20) + (mockDuration * 2.5));
      } else if (selectedRideType.id === 'van') {
        fare = Math.max(80, 80 + (distance * 25) + (mockDuration * 3));
      } else if (selectedRideType.id === 'auto') {
        fare = Math.max(25, 25 + (distance * 12) + (mockDuration * 1.8));
      }
      
      // Apply distance-based multipliers
      if (distance > 25) {
        // Long distance discount (5% off for rides over 25km)
        fare = fare * 0.95;
      } else if (distance < 5) {
        // Short distance minimum charge
        fare = Math.max(fare, selectedRideType.baseFare);
      }
      
      setFareEstimate({
        base: selectedRideType.baseFare,
        distance: mockDistance,
        duration: mockDuration,
        total: Math.round(fare),
        rideType: selectedRideType.name,
        distanceRate: selectedRideType.perKm,
        timeRate: selectedRideType.perMin
      });
    } catch (error) {
      console.error('Error calculating fare:', error);
    }
  };

  const getRecommendedRideType = () => {
    if (!distance) return rideTypes[0]?.id || 'car';
    const dist = parseFloat(distance);
    const byDist = dist <= 5 ? 'bike' : dist <= 10 ? 'car' : dist <= 25 ? 'suv' : 'van';
    // Return first available that matches, else fallback
    return rideTypes.find(rt => rt.id === byDist)?.id || rideTypes[0]?.id || 'car';
  };

  const handleQuickSelect = (place, type) => {
    if (type === 'pickup') {
      setPickupAddress(place.address);
    } else {
      setDropoffAddress(place.address);
    }
  };

  const handleScheduleRide = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validate required fields
      if (!pickupAddress || !dropoffAddress || !scheduledDate || !scheduledTime) {
        setToast({ message: 'Please fill in all required fields', type: 'error' });
        return;
      }

      // Validate future date/time
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      const now = new Date();
      if (scheduledDateTime <= now) {
        setToast({ message: 'Please schedule for a future date and time', type: 'error' });
        return;
      }

      // Create scheduled ride object
      const scheduledRide = {
        id: Date.now(),
        pickup: pickupAddress,
        dropoff: dropoffAddress,
        scheduledDate,
        scheduledTime,
        rideType,
        vehicleType: (rideTypes.find(rt => rt.id === rideType)?.name) || 'Car',
        fare: fareEstimate?.total || 0,
        distance: distance || '0 km',
        duration: duration || '0 min',
        specialRequests,
        contactNumber,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        userId: user.id
      };

      // Save to backend and localStorage
      try {
        const response = await fetch(`${API}/api/rides/book-scheduled`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            passengerId: user.id,
            passengerName: user.username || 'User',
            pickupAddress,
            dropoffAddress,
            scheduledDate,
            scheduledTime,
            vehicleType: (rideTypes.find(rt => rt.id === rideType)?.name) || 'Car',
            specialRequests,
            contactNumber
          })
        });

        if (response.ok) {
          const backendRide = await response.json();
          scheduledRide.id = backendRide.id;
          scheduledRide.backendId = backendRide.id;
        }
      } catch (error) {
        console.warn('Failed to save to backend, using localStorage only:', error);
      }

      // Save to localStorage as backup
      const scheduledRides = JSON.parse(localStorage.getItem('scheduledRides') || '[]');
      scheduledRides.push(scheduledRide);
      localStorage.setItem('scheduledRides', JSON.stringify(scheduledRides));

      setToast({ 
        message: `Ride scheduled for ${scheduledDate} at ${scheduledTime}`, 
        type: 'success' 
      });
      
      // Reset form
      setPickupAddress('');
      setDropoffAddress('');
      setSpecialRequests('');
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/user/dashboard');
      }, 2000);
      
    } catch (error) {
      setToast({ 
        message: error.message || 'Failed to schedule ride', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const isLongDistance = distance && parseFloat(distance) > 25;

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
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Schedule a Ride</h1>
          {isLongDistance && (
            <div style={{ 
              background: '#f0f9ff', 
              border: '1px solid #0ea5e9', 
              borderRadius: 6, 
              padding: 8, 
              marginBottom: 12 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 16 }}>💡</span>
                <span style={{ fontWeight: 600, color: '#0c4a6e', fontSize: 14 }}>
                  Long distance detected! This ride is perfect for scheduling.
                </span>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Left Column - Form */}
          <Card>
          <form onSubmit={handleScheduleRide}>
            {/* Pickup Location */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 13 }}>
                Pickup Location *
              </label>
              <input
                type="text"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="Enter pickup address"
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #d1d5db',
                  borderRadius: 4,
                  fontSize: 13
                }}
                required
              />
              
            </div>

            {/* Dropoff Location */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 13 }}>
                Dropoff Location *
              </label>
              <input
                type="text"
                value={dropoffAddress}
                onChange={(e) => setDropoffAddress(e.target.value)}
                placeholder="Enter destination"
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #d1d5db',
                  borderRadius: 4,
                  fontSize: 13
                }}
                required
              />
              
            </div>

            {/* Schedule Date and Time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 13 }}>
                  Schedule Date *
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    width: '100%',
                    padding: 8,
                    border: '1px solid #d1d5db',
                    borderRadius: 4,
                    fontSize: 13
                  }}
                  required
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 13 }}>
                  Schedule Time *
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 8,
                    border: '1px solid #d1d5db',
                    borderRadius: 4,
                    fontSize: 13
                  }}
                  required
                />
              </div>
            </div>

            {/* Ride Type Selection */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 13 }}>
                Ride Type
              </label>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {rideTypes.map(type => (
                  <label
                    key={type.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 8px',
                      border: rideType === type.id ? '2px solid #2563eb' : '1px solid #e5e7eb',
                      borderRadius: 4,
                      cursor: 'pointer',
                      background: rideType === type.id ? '#f0f9ff' : '#fff',
                      transition: 'all 0.2s ease',
                      minWidth: '80px'
                    }}
                  >
                    <input
                      type="radio"
                      name="rideType"
                      value={type.id}
                      checked={rideType === type.id}
                      onChange={(e) => setRideType(e.target.value)}
                      style={{ margin: 0 }}
                    />
                    <div style={{ fontSize: 14 }}>{type.icon}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 11 }}>{type.name}</div>
                      <div style={{ fontSize: 8, color: '#6b7280' }}>{type.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Contact Number */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 13 }}>
                Contact Number *
              </label>
              <input
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="Enter your contact number"
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #d1d5db',
                  borderRadius: 4,
                  fontSize: 13
                }}
                required
              />
            </div>

            {/* Fare Estimate */}
            {fareEstimate && (
              <Card style={{ background: '#f0f9ff', border: '1px solid #0ea5e9', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ margin: 0, color: '#0ea5e9' }}>Estimated Fare</h4>
                  <Badge variant="blue">{fareEstimate.rideType}</Badge>
                </div>
                
                {/* Pricing Breakdown */}
                <div style={{ marginBottom: 12, fontSize: 12, color: '#6b7280' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Base Fare:</span>
                    <span>₹{fareEstimate.base}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Distance ({fareEstimate.distance} km × ₹{fareEstimate.distanceRate}):</span>
                    <span>₹{Math.round(fareEstimate.distance * fareEstimate.distanceRate)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Time ({fareEstimate.duration} min × ₹{fareEstimate.timeRate}):</span>
                    <span>₹{Math.round(fareEstimate.duration * fareEstimate.timeRate)}</span>
                  </div>
                  {fareEstimate.distance > 25 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#059669' }}>
                      <span>Long Distance Discount (5%):</span>
                      <span>-₹{Math.round((fareEstimate.total / 0.95) - fareEstimate.total)}</span>
                    </div>
                  )}
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginTop: 12, 
                  paddingTop: 12, 
                  borderTop: '1px solid #e5e7eb' 
                }}>
                  <span style={{ fontWeight: 600 }}>Estimated Total</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#059669' }}>
                    ₹{fareEstimate.total}
                  </span>
                </div>
              </Card>
            )}

            {/* Schedule Button */}
            <button
              type="submit"
              disabled={loading || !pickupAddress || !dropoffAddress || !scheduledDate || !scheduledTime}
              style={{
                width: '100%',
                padding: 10,
                background: loading ? '#9ca3af' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s ease'
              }}
            >
              {loading ? 'Scheduling Ride...' : `Schedule Ride for ${scheduledDate} at ${scheduledTime}`}
            </button>
          </form>
          </Card>

          {/* Right Column - Information and Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Special Requests */}
            <Card>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 13 }}>
                Special Requests (Optional)
              </label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Any special requirements or notes for the driver..."
                rows={2}
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #d1d5db',
                  borderRadius: 4,
                  fontSize: 13,
                  resize: 'vertical'
                }}
              />
            </Card>


            {/* Information Card */}
            <Card style={{ background: '#fef3c7', border: '1px solid #f59e0b' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ fontSize: 20 }}>ℹ️</div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 8, color: '#92400e' }}>
                    Why Schedule a Ride?
                  </div>
                  <div style={{ fontSize: 14, color: '#92400e', lineHeight: 1.5 }}>
                    • Perfect for long-distance trips (25+ km)<br/>
                    • Guaranteed driver availability<br/>
                    • Better pricing for advance bookings<br/>
                    • No waiting time on the scheduled day<br/>
                    • Special requests and preferences noted
                  </div>
                </div>
              </div>
            </Card>

            {/* Ride Type Information */}
            <Card>
              <h4 style={{ margin: '0 0 12px 0', color: '#1f2937' }}>Pricing by Vehicle</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {rideTypes.map(type => (
                  <div key={type.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    padding: 8, 
                    background: rideType === type.id ? '#f0f9ff' : '#f8fafc',
                    borderRadius: 6,
                    border: rideType === type.id ? '1px solid #0ea5e9' : '1px solid #e5e7eb'
                  }}>
                    <div style={{ fontSize: 16 }}>{type.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{type.name}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>
                        Base: ₹{type.baseFare} • Per km: ₹{type.perKm} • Per min: ₹{type.perMin}
                      </div>
                      <div style={{ fontSize: 10, color: '#059669' }}>{type.recommendedFor}</div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 11 }}>
                      <div style={{ fontWeight: 600, color: '#059669' }}>
                        ₹{type.baseFare}
                      </div>
                      <div style={{ color: '#6b7280' }}>base</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </div>
  );
};

export default ScheduleRide;
