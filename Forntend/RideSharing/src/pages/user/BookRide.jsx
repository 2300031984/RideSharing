import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Toast from '../../components/Toast';

const API = (import.meta.env?.VITE_API_URL || 'http://localhost:8081');
const GOOGLE_KEY = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY;

const BookRide = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const token = user?.token;
  
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [booking, setBooking] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [rideType, setRideType] = useState('standard');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [fareEstimate, setFareEstimate] = useState(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [pickupCoords, setPickupCoords] = useState(null); // {lat, lng}
  const [dropoffCoords, setDropoffCoords] = useState(null); // {lat, lng}

  const pickupInputRef = useRef(null);
  const dropoffInputRef = useRef(null);
  const mapsLoadedRef = useRef(false);

  const [rideTypes, setRideTypes] = useState([
    // fallback list if API fails
    { id: 'bike', name: 'Bike', icon: '🏍️', description: 'Fast and economical', baseFare: 20, perKm: 10, perMin: 1.5, eta: '3-8 min' },
    { id: 'car', name: 'Car', icon: '🚗', description: 'Regular ride', baseFare: 40, perKm: 15, perMin: 2, eta: '5-10 min' },
    { id: 'suv', name: 'SUV', icon: '🚙', description: 'Comfort ride', baseFare: 60, perKm: 20, perMin: 2.5, eta: '3-7 min' },
    { id: 'van', name: 'Van', icon: '🚐', description: 'Larger vehicle', baseFare: 80, perKm: 25, perMin: 3, eta: '7-12 min' }
  ]);

  const savedPlaces = [
    {
      id: 1,
      name: 'Home',
      address: '123 Main Street, Bangalore',
      icon: '🏠',
      type: 'home'
    },
    {
      id: 2,
      name: 'Office',
      address: 'Tech Park, Whitefield',
      icon: '🏢',
      type: 'work'
    },
    {
      id: 3,
      name: 'Gym',
      address: 'Fitness Center, Koramangala',
      icon: '💪',
      type: 'gym'
    }
  ];

  useEffect(() => {
    // Pre-fill destination if coming from saved places
    if (location.state?.destination) {
      setDropoffAddress(location.state.destination.address);
    }
    // Fetch allowed vehicle types from backend (distinct from drivers)
    (async () => {
      try {
        const res = await fetch(`${API}/api/profile/vehicle-types?onlyAvailable=true`);
        if (res.ok) {
          const types = await res.json();
          if (Array.isArray(types) && types.length) {
            const normalized = types.map(v => String(v || '').toLowerCase());
            const catalog = [
              { id: 'bike', name: 'Bike', icon: '🏍️', description: 'Fast and economical', baseFare: 20, perKm: 10, perMin: 1.5, eta: '3-8 min' },
              { id: 'car', name: 'Car', icon: '🚗', description: 'Regular ride', baseFare: 40, perKm: 15, perMin: 2, eta: '5-10 min' },
              { id: 'suv', name: 'SUV', icon: '🚙', description: 'Comfort ride', baseFare: 60, perKm: 20, perMin: 2.5, eta: '3-7 min' },
              { id: 'van', name: 'Van', icon: '🚐', description: 'Larger vehicle', baseFare: 80, perKm: 25, perMin: 3, eta: '7-12 min' },
              { id: 'auto', name: 'Auto Rickshaw', icon: '🛺', description: '3-wheeler', baseFare: 25, perKm: 12, perMin: 1.8, eta: '4-9 min' }
            ];
            const filtered = catalog.filter(c => normalized.includes(c.id));
            if (filtered.length) setRideTypes(filtered);
          }
        }
      } catch {}
    })();
  }, [location.state]);

  // Load Google Maps Places script (optional)
  useEffect(() => {
    if (!GOOGLE_KEY || mapsLoadedRef.current) return;
    const existing = document.querySelector("script[data-google='places']");
    if (existing) {
      mapsLoadedRef.current = true;
      initAutocomplete();
      return;
    }
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&libraries=places&region=IN`;
    s.async = true;
    s.defer = true;
    s.setAttribute('data-google', 'places');
    s.onload = () => {
      mapsLoadedRef.current = true;
      initAutocomplete();
    };
    document.head.appendChild(s);
    // no cleanup required
  }, []);

  const initAutocomplete = () => {
    try {
      if (!window.google?.maps?.places) return;
      const commonOpts = {
        fields: ['formatted_address', 'geometry'],
        componentRestrictions: { country: 'in' }
      };
      if (pickupInputRef.current) {
        const ac1 = new window.google.maps.places.Autocomplete(pickupInputRef.current, commonOpts);
        ac1.addListener('place_changed', () => {
          const place = ac1.getPlace();
          const addr = place?.formatted_address || pickupInputRef.current.value;
          setPickupAddress(addr);
          const loc = place?.geometry?.location;
          if (loc) setPickupCoords({ lat: loc.lat(), lng: loc.lng() });
        });
      }
      if (dropoffInputRef.current) {
        const ac2 = new window.google.maps.places.Autocomplete(dropoffInputRef.current, commonOpts);
        ac2.addListener('place_changed', () => {
          const place = ac2.getPlace();
          const addr = place?.formatted_address || dropoffInputRef.current.value;
          setDropoffAddress(addr);
          const loc = place?.geometry?.location;
          if (loc) setDropoffCoords({ lat: loc.lat(), lng: loc.lng() });
        });
      }
    } catch (e) {
      // silently ignore; manual input still works
      console.warn('Autocomplete init failed:', e);
    }
  };

  // simple haversine distance in km
  const haversineKm = (a, b) => {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLon = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const c = 2 * Math.asin(Math.sqrt(sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon));
    return R * c;
  };

  useEffect(() => {
    // Calculate fare estimate when addresses change
    if (pickupAddress && dropoffAddress) {
      calculateFareEstimate();
    } else {
      setFareEstimate(null);
    }
  }, [pickupAddress, dropoffAddress, rideType, rideTypes]);

  const calculateFareEstimate = async () => {
    setLoadingEstimate(true);
    try {
      const selectedRideType = rideTypes.find(rt => rt.id === rideType) || rideTypes[0];
      let distanceKm = 8.5;
      if (pickupCoords && dropoffCoords) {
        distanceKm = Math.max(1, haversineKm(pickupCoords, dropoffCoords));
      }
      const mockDistance = Number(distanceKm.toFixed(1));
      const mockDuration = Math.max(5, Math.round((mockDistance / 25) * 60)); // assume avg 25 km/h
      
      const fare = Math.max(
        selectedRideType.baseFare,
        selectedRideType.baseFare + (mockDistance * selectedRideType.perKm) + (mockDuration * selectedRideType.perMin)
      );
      
      setFareEstimate({
        base: selectedRideType.baseFare,
        distance: mockDistance,
        duration: mockDuration,
        total: Math.round(fare),
        rideType: selectedRideType.name
      });
    } catch (error) {
      console.error('Error calculating fare:', error);
    } finally {
      setLoadingEstimate(false);
    }
  };

  const handleBookRide = async (e) => {
    e.preventDefault();
    setBooking(true);
    
    try {
      // Use the real API service
      const selectedRideType = rideTypes.find(rt => rt.id === rideType);
      const rideData = {
        pickup: {
          address: pickupAddress,
          lat: pickupCoords?.lat,
          lng: pickupCoords?.lng
        },
        drop: {
          address: dropoffAddress,
          lat: dropoffCoords?.lat,
          lng: dropoffCoords?.lng
        },
        vehicleType: selectedRideType?.name || 'Car',
        price: fareEstimate?.total || selectedRideType.baseFare,
        distance: fareEstimate?.distance || 5,
        duration: fareEstimate?.duration || 15
      };

      if (isScheduled && scheduledTime) {
        // Handle scheduled ride
        const scheduledDate = new Date(scheduledTime).toISOString().slice(0, 10);
        const scheduledTimeStr = new Date(scheduledTime).toTimeString().slice(0, 5);
        
        const { requestScheduledRide } = await import('../../services/RideService');
        const result = await requestScheduledRide({
          ...rideData,
          scheduledDate,
          scheduledTime: scheduledTimeStr
        });
        
        setToast({ 
          message: `Ride scheduled successfully for ${scheduledDate} at ${scheduledTimeStr}!`, 
          type: 'success' 
        });
      } else {
        // Handle immediate ride
        const { requestRide } = await import('../../services/RideService');
        const result = await requestRide(rideData);
        
        setToast({ 
          message: `Ride booked successfully! Driver will arrive shortly.`, 
          type: 'success' 
        });
        
        // Navigate to ride waiting page
        setTimeout(() => {
          navigate(`/ride-request-waiting/${result.data.id}`);
        }, 1500);
      }
      
      // Reset form
      setPickupAddress('');
      setDropoffAddress('');
      setScheduledTime('');
      setIsScheduled(false);
      setFareEstimate(null);
      setPickupCoords(null);
      setDropoffCoords(null);
      
    } catch (error) {
      console.error('Booking error:', error);
      setToast({ 
        message: error.message || 'Failed to book ride. Please try again.', 
        type: 'error' 
      });
    } finally {
      setBooking(false);
    }
  };

  const handleQuickSelect = (place, type) => {
    if (type === 'pickup') {
      setPickupAddress(place.address);
    } else {
      setDropoffAddress(place.address);
    }
  };

  return (
    <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh' }}>
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
      
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <h1 style={{ 
            fontSize: 36, 
            fontWeight: 800, 
            marginBottom: 12, 
            color: 'white',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            Book Your Ride
          </h1>
          <p style={{ 
            fontSize: 18, 
            color: 'rgba(255,255,255,0.9)',
            fontWeight: 500
          }}>
            Get to your destination quickly, safely, and affordably
          </p>
        </div>

        <Card style={{ 
          background: 'rgba(255,255,255,0.95)', 
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          borderRadius: 20
        }}>
          <form onSubmit={handleBookRide}>
            {/* Ride Type Selection */}
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ marginBottom: 20, fontSize: 20, fontWeight: 700, color: '#1f2937' }}>Choose Your Ride</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                {rideTypes.map(type => (
                  <label
                    key={type.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: 20,
                      border: rideType === type.id ? '2px solid #667eea' : '2px solid #e5e7eb',
                      borderRadius: 16,
                      cursor: 'pointer',
                      background: rideType === type.id ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#fff',
                      color: rideType === type.id ? 'white' : '#374151',
                      transition: 'all 0.3s ease',
                      transform: rideType === type.id ? 'translateY(-2px)' : 'translateY(0)',
                      boxShadow: rideType === type.id ? '0 10px 25px rgba(102, 126, 234, 0.3)' : '0 4px 6px rgba(0,0,0,0.05)'
                    }}
                  >
                    <input
                      type="radio"
                      name="rideType"
                      value={type.id}
                      checked={rideType === type.id}
                      onChange={(e) => setRideType(e.target.value)}
                      style={{ display: 'none' }}
                    />
                    <div style={{ fontSize: 32, marginBottom: 12 }}>{type.icon}</div>
                    <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 16 }}>{type.name}</div>
                    <div style={{ fontSize: 13, textAlign: 'center', marginBottom: 8, opacity: 0.9 }}>
                      {type.description}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.9 }}>
                      ETA: {type.eta}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginTop: 8 }}>
                      ₹{type.baseFare}+
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Pickup Location */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 12, fontWeight: 700, fontSize: 16, color: '#374151' }}>
                📍 Pickup Location *
              </label>
              <input
                type="text"
                value={pickupAddress}
                onChange={(e) => { setPickupAddress(e.target.value); setPickupCoords(null); }}
                placeholder="Where should we pick you up?"
                style={{
                  width: '100%',
                  padding: 16,
                  border: '2px solid #e5e7eb',
                  borderRadius: 12,
                  fontSize: 16,
                  background: '#f9fafb',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.background = 'white';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.background = '#f9fafb';
                }}
                ref={pickupInputRef}
                required
              />
              
              {/* Quick Select for Pickup */}
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Quick select:</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {savedPlaces.map(place => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => handleQuickSelect(place, 'pickup')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '6px 12px',
                        background: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: 20,
                        cursor: 'pointer',
                        fontSize: 12
                      }}
                    >
                      <span>{place.icon}</span>
                      <span>{place.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dropoff Location */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 12, fontWeight: 700, fontSize: 16, color: '#374151' }}>
                🎯 Dropoff Location *
              </label>
              <input
                type="text"
                value={dropoffAddress}
                onChange={(e) => { setDropoffAddress(e.target.value); setDropoffCoords(null); }}
                placeholder="Where are you going?"
                style={{
                  width: '100%',
                  padding: 16,
                  border: '2px solid #e5e7eb',
                  borderRadius: 12,
                  fontSize: 16,
                  background: '#f9fafb',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.background = 'white';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.background = '#f9fafb';
                }}
                ref={dropoffInputRef}
                required
              />
              
              {/* Quick Select for Dropoff */}
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Quick select:</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {savedPlaces.map(place => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => handleQuickSelect(place, 'dropoff')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '6px 12px',
                        background: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: 20,
                        cursor: 'pointer',
                        fontSize: 12
                      }}
                    >
                      <span>{place.icon}</span>
                      <span>{place.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Schedule Ride */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12, 
                marginBottom: 16,
                padding: 16,
                background: '#f8fafc',
                borderRadius: 12,
                border: '2px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>
                <input
                  type="checkbox"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  style={{ transform: 'scale(1.2)' }}
                />
                <span style={{ fontWeight: 700, fontSize: 16, color: '#374151' }}>
                  ⏰ Schedule for later
                </span>
              </label>
              
              {isScheduled && (
                <div style={{ 
                  padding: 16, 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 12,
                  color: 'white'
                }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                    Select Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    style={{
                      width: '100%',
                      padding: 12,
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 16,
                      background: 'rgba(255,255,255,0.9)',
                      color: '#374151'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Fare Estimate */}
            {fareEstimate && (
              <Card style={{ marginBottom: 20, background: '#f0f9ff', border: '1px solid #0ea5e9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ margin: 0, color: '#0ea5e9' }}>Fare Estimate</h4>
                  <Badge variant="blue">{fareEstimate.rideType}</Badge>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, fontSize: 14 }}>
                  <div>
                    <div style={{ color: '#6b7280', marginBottom: 2 }}>Base Fare</div>
                    <div style={{ fontWeight: 600 }}>₹{fareEstimate.base}</div>
                  </div>
                  <div>
                    <div style={{ color: '#6b7280', marginBottom: 2 }}>Distance</div>
                    <div style={{ fontWeight: 600 }}>{fareEstimate.distance} km</div>
                  </div>
                  <div>
                    <div style={{ color: '#6b7280', marginBottom: 2 }}>Duration</div>
                    <div style={{ fontWeight: 600 }}>{fareEstimate.duration} min</div>
                  </div>
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

            {/* Book Button */}
            <button
              type="submit"
              disabled={booking || !pickupAddress || !dropoffAddress || loadingEstimate}
              style={{
                width: '100%',
                padding: 20,
                background: booking || loadingEstimate ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 16,
                fontSize: 20,
                fontWeight: 800,
                cursor: booking || loadingEstimate ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: booking || loadingEstimate ? 'none' : '0 10px 25px rgba(102, 126, 234, 0.3)',
                transform: booking || loadingEstimate ? 'none' : 'translateY(0)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
              onMouseEnter={(e) => {
                if (!booking && !loadingEstimate) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 15px 35px rgba(102, 126, 234, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!booking && !loadingEstimate) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 10px 25px rgba(102, 126, 234, 0.3)';
                }
              }}
            >
              {booking ? '🚗 Booking Your Ride...' : loadingEstimate ? '💰 Calculating Fare...' : `🚀 Book ${rideTypes.find(rt => rt.id === rideType)?.name} Ride`}
            </button>
          </form>
        </Card>

        {/* Safety Notice */}
        <Card style={{ 
          marginTop: 24, 
          background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)', 
          border: '2px solid #fecaca',
          borderRadius: 16,
          boxShadow: '0 8px 20px rgba(220, 38, 38, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: 8 }}>
            <div style={{ fontSize: 28 }}>🛡️</div>
            <div>
              <div style={{ fontWeight: 800, marginBottom: 12, color: '#dc2626', fontSize: 18 }}>
                Safety First
              </div>
              <div style={{ fontSize: 15, color: '#7f1d1d', lineHeight: 1.6 }}>
                <div style={{ marginBottom: 8 }}>✅ Always verify driver details before getting in</div>
                <div style={{ marginBottom: 8 }}>📱 Share your trip details with trusted contacts</div>
                <div style={{ marginBottom: 8 }}>🚨 Use the in-app emergency button if needed</div>
                <div>⭐ Rate your driver after the ride</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </div>
  );
};

export default BookRide;
