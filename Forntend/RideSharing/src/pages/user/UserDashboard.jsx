import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';
import { requestRide, estimateFare, getNearbyDrivers, addPendingRideLocal } from '../../services/RideService';
import Toast from '../../components/Toast';

const UserDashboard = () => {
  const navigate = useNavigate();
  const locationState = useLocation();
  const user = JSON.parse(localStorage.getItem('user')) || {};

  const GOOGLE_KEY = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY;
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const [rideType, setRideType] = useState('car');
  const [estimate, setEstimate] = useState(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [rideRequest, setRideRequest] = useState(null);
  const [rideStatus, setRideStatus] = useState(null);
  const [isWaitingForDriver, setIsWaitingForDriver] = useState(false);

  const pickupRef = useRef(null);
  const dropoffRef = useRef(null);
  const mapsLoadedRef = useRef(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const dropMarkerRef = useRef(null);
  const directionsRendererRef = useRef(null);

  const rideTypes = [
    { id: 'bike', name: 'Bike', icon: '🏍️', baseFare: 20, perKm: 8, perMin: 1.2, color: '#0ea5e9' },
    { id: 'auto', name: 'Auto', icon: '🛺', baseFare: 25, perKm: 10, perMin: 1.4, color: '#10b981' },
    { id: 'car', name: 'Car', icon: '🚗', baseFare: 40, perKm: 15, perMin: 2, color: '#6366f1' },
    { id: 'prime', name: 'Prime', icon: '🚙', baseFare: 60, perKm: 22, perMin: 2.8, color: '#f59e0b' },
  ];

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
    s.onload = () => { mapsLoadedRef.current = true; initAutocomplete(); };
    s.onerror = () => setToast({ message: 'Failed to load Google Maps script', type: 'error' });
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    if (locationState.state?.repeatTrip) {
      const { pickup, dropoff } = locationState.state.repeatTrip;
      if (pickup) setPickupAddress(pickup);
      if (dropoff) setDropoffAddress(dropoff);
      // Logic to geocode these to coords would ideally go here, but for now we just set text.
      // The computeEstimate logic checks for coords for accurate pricing, but text is enough to start.
    }
  }, [locationState]);

  const initAutocomplete = () => {
    try {
      if (!window.google?.maps?.places) return;
      const opts = { fields: ['formatted_address', 'geometry'], componentRestrictions: { country: 'in' } };
      if (pickupRef.current) {
        const ac1 = new window.google.maps.places.Autocomplete(pickupRef.current, opts);
        ac1.addListener('place_changed', () => {
          const p = ac1.getPlace();
          setPickupAddress(p?.formatted_address || pickupRef.current.value);
          const loc = p?.geometry?.location; if (loc) setPickupCoords({ lat: loc.lat(), lng: loc.lng() });
        });
      }
      if (dropoffRef.current) {
        const ac2 = new window.google.maps.places.Autocomplete(dropoffRef.current, opts);
        ac2.addListener('place_changed', () => {
          const p = ac2.getPlace();
          setDropoffAddress(p?.formatted_address || dropoffRef.current.value);
          const loc = p?.geometry?.location; if (loc) setDropoffCoords({ lat: loc.lat(), lng: loc.lng() });
        });
      }
    } catch (e) {
      setToast({ message: 'Failed to initialize Places Autocomplete', type: 'error' });
    }
  };

  const initMap = () => {
    try {
      if (!window.google?.maps || !mapRef.current || mapInstanceRef.current) return;
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 20.5937, lng: 78.9629 }, // India
        zoom: 5,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
    } catch { }
  };

  useEffect(() => {
    // Initialize map once script is loaded and container is ready
    if (mapsLoadedRef.current && mapRef.current && !mapInstanceRef.current) {
      initMap();
    }
  });

  useEffect(() => {
    // Nearby drivers: try API first, fallback to mock jitter
    const run = async () => {
      if (!pickupCoords) { setDrivers([]); return; }
      const apiDrivers = await getNearbyDrivers({ lat: pickupCoords.lat, lng: pickupCoords.lng });
      if (apiDrivers && apiDrivers.length) {
        // normalize to expected NearbyDriverDto shape from backend
        const list = apiDrivers.map((d, i) => ({
          id: d.driverId || i + 1,
          vehicleType: 'car', // Defaulting since we don't store vehicle type in Geospatial hash yet
          position: { lat: d.latitude, lng: d.longitude },
        }));
        setDrivers(list);
        return;
      }
      // fallback mock
      const count = 6;
      const list = Array.from({ length: count }).map((_, i) => {
        const latJitter = (Math.random() - 0.5) * 0.01; // ~1km
        const lngJitter = (Math.random() - 0.5) * 0.01;
        const types = ['bike', 'auto', 'car', 'prime'];
        return {
          id: i + 1,
          vehicleType: types[i % types.length],
          position: { lat: pickupCoords.lat + latJitter, lng: pickupCoords.lng + lngJitter },
        };
      });
      setDrivers(list);
    };
    run();
  }, [pickupCoords]);

  useEffect(() => {
    // Update markers and bounds when coords change
    const map = mapInstanceRef.current;
    if (!map || !window.google?.maps) return;

    const gmaps = window.google.maps;
    if (pickupCoords) {
      if (!pickupMarkerRef.current) {
        pickupMarkerRef.current = new gmaps.Marker({
          map,
          position: pickupCoords,
          label: 'P',
        });
      } else {
        pickupMarkerRef.current.setPosition(pickupCoords);
      }
    }
    if (dropoffCoords) {
      if (!dropMarkerRef.current) {
        dropMarkerRef.current = new gmaps.Marker({
          map,
          position: dropoffCoords,
          label: 'D',
        });
      } else {
        dropMarkerRef.current.setPosition(dropoffCoords);
      }
    }

    // Remove existing driver markers
    if (!map.__driverMarkers) map.__driverMarkers = [];
    map.__driverMarkers.forEach(m => m.setMap(null));
    map.__driverMarkers = [];
    if (drivers && drivers.length) {
      drivers.forEach(d => {
        const m = new gmaps.Marker({ map, position: d.position, icon: undefined, label: { text: '🚗', fontSize: '16px' } });
        map.__driverMarkers.push(m);
      });
    }

    // Fit bounds when we have both points
    if (pickupCoords && dropoffCoords) {
      const bounds = new gmaps.LatLngBounds();
      bounds.extend(pickupCoords);
      bounds.extend(dropoffCoords);
      map.fitBounds(bounds, 50);

      // Draw route
      try {
        const svc = new gmaps.DirectionsService();
        if (!directionsRendererRef.current) {
          directionsRendererRef.current = new gmaps.DirectionsRenderer({ suppressMarkers: true });
          directionsRendererRef.current.setMap(map);
        }
        svc.route(
          { origin: pickupCoords, destination: dropoffCoords, travelMode: 'DRIVING' },
          (result, status) => {
            if (status === 'OK') {
              directionsRendererRef.current.setDirections(result);
            }
          }
        );
      } catch (e) {
        setToast({ message: 'Failed to draw route', type: 'error' });
      }
    } else if (pickupCoords) {
      map.setCenter(pickupCoords);
      map.setZoom(13);
      if (directionsRendererRef.current) directionsRendererRef.current.set('directions', null);
    } else if (dropoffCoords) {
      map.setCenter(dropoffCoords);
      map.setZoom(13);
      if (directionsRendererRef.current) directionsRendererRef.current.set('directions', null);
    }
  }, [pickupCoords, dropoffCoords, drivers]);

  const haversineKm = (a, b) => {
    const R = 6371; const dLat = ((b.lat - a.lat) * Math.PI) / 180; const dLon = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180; const lat2 = (b.lat * Math.PI) / 180;
    const sinDLat = Math.sin(dLat / 2); const sinDLon = Math.sin(dLon / 2);
    const c = 2 * Math.asin(Math.sqrt(sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon));
    return R * c;
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported');
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const coords = { lat: latitude, lng: longitude };
      setPickupCoords(coords);
      try {
        if (window.google?.maps?.Geocoder) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: coords }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              setPickupAddress(results[0].formatted_address);
            } else {
              setPickupAddress('Current location');
              setToast({ message: 'Reverse geocoding failed', type: 'error' });
            }
          });
        } else {
          setPickupAddress('Current location');
        }
      } catch (e) {
        setPickupAddress('Current location');
        setToast({ message: 'Reverse geocoding error', type: 'error' });
      }
    }, () => setToast({ message: 'Unable to fetch current location', type: 'error' }));
  };

  const computeEstimate = async () => {
    if (!pickupAddress || !dropoffAddress) return;
    setLoadingEstimate(true);
    try {
      const rt = rideTypes.find(r => r.id === rideType);
      // Try API estimate first when coords are available
      if (pickupCoords && dropoffCoords) {
        const apiEst = await estimateFare({
          pickup: { lat: pickupCoords.lat, lng: pickupCoords.lng, address: pickupAddress },
          drop: { lat: dropoffCoords.lat, lng: dropoffCoords.lng, address: dropoffAddress },
          vehicleType: rideType,
        });
        if (apiEst && typeof apiEst.price === 'number') {
          setEstimate({
            distance: Number((apiEst.distanceKm || 0).toFixed?.(1) ?? apiEst.distanceKm ?? 0),
            duration: apiEst.durationMin ?? 0,
            total: Math.round(apiEst.price),
            ride: rt.name,
          });
          return;
        }
      }
      let distanceKm = 6.5;
      let durationMin = 15;

      // Prefer Distance Matrix when available and we have coords
      if (window.google?.maps?.DistanceMatrixService && pickupCoords && dropoffCoords) {
        const svc = new window.google.maps.DistanceMatrixService();
        const origins = [new window.google.maps.LatLng(pickupCoords.lat, pickupCoords.lng)];
        const destinations = [new window.google.maps.LatLng(dropoffCoords.lat, dropoffCoords.lng)];
        const dm = await new Promise((resolve, reject) => {
          svc.getDistanceMatrix({ origins, destinations, travelMode: 'DRIVING' }, (res, status) => {
            if (status === 'OK') resolve(res); else reject(new Error(status));
          });
        });
        const element = dm?.rows?.[0]?.elements?.[0];
        if (element?.status === 'OK') {
          const meters = element.distance.value; // meters
          const seconds = element.duration.value; // seconds
          distanceKm = Math.max(1, meters / 1000);
          durationMin = Math.max(5, Math.round(seconds / 60));
        } else if (pickupCoords && dropoffCoords) {
          distanceKm = Math.max(1, haversineKm(pickupCoords, dropoffCoords));
          durationMin = Math.max(5, Math.round((distanceKm / 22) * 60));
        }
      } else {
        if (pickupCoords && dropoffCoords) distanceKm = Math.max(1, haversineKm(pickupCoords, dropoffCoords));
        durationMin = Math.max(5, Math.round((distanceKm / 22) * 60));
      }

      const total = Math.max(rt.baseFare, rt.baseFare + distanceKm * rt.perKm + durationMin * rt.perMin);
      setEstimate({ distance: Number(distanceKm.toFixed(1)), duration: durationMin, total: Math.round(total), ride: rt.name });
    } catch (e) {
      setToast({ message: 'Failed to compute estimate', type: 'error' });
    } finally {
      setLoadingEstimate(false);
    }
  };

  const onRequestRide = async () => {
    if (!estimate) return;
    setRequesting(true);
    try {
      const res = await requestRide({
        pickup: { address: pickupAddress, lat: pickupCoords?.lat, lng: pickupCoords?.lng },
        drop: { address: dropoffAddress, lat: dropoffCoords?.lat, lng: dropoffCoords?.lng },
        vehicleType: rideType,
        paymentMethod: 'cash',
        price: estimate.total,
        distance: `${estimate.distance} km`,
        duration: `${estimate.duration} min`,
      });
      const rideRequestId = res?.data?.id || res?.data?.rideRequestId || Math.floor(Math.random() * 1e6).toString();
      // also add to pending queue for driver mock feed
      addPendingRideLocal({
        id: rideRequestId,
        pickup: pickupAddress,
        dropoff: dropoffAddress,
        fare: estimate.total,
        distance: `${estimate.distance} km`,
        vehicleType: rideType
      });
      // Navigate to waiting page instead of booking page
      navigate(`/ride-request/${rideRequestId}`);
    } catch (e) {
      setToast({ message: e?.response?.data?.message || e.message || 'Failed to request ride', type: 'error' });
    } finally {
      setRequesting(false);
    }
  };

  const launchers = [
    { title: 'Schedule Ride', icon: '⏰', path: '/schedule-ride', color: '#059669', description: 'Plan for later' },
    { title: 'Scheduled Rides', icon: '📅', path: '/user/scheduled-rides', color: '#0ea5e9', description: 'View scheduled rides' },
    { title: 'Emergency', icon: '🚨', path: '/emergency', color: '#dc2626', description: 'Emergency & Safety' },
    { title: 'Wallet', icon: '💰', path: '/user/wallet', color: '#059669', description: 'Balance and payments' },
    { title: 'Saved Places', icon: '📍', path: '/user/saved-places', color: '#8b5cf6', description: 'Home, work, favorites' },
    { title: 'Recent Rides', icon: '📋', path: '/user/recent-rides', color: '#7c3aed', description: 'Your latest trips' },
    { title: 'Offers', icon: '🏷️', path: '/user/offers', color: '#f59e0b', description: 'Promos and discounts' },
  ];

  return (
    <div className="bg-secondary" style={{ minHeight: '100vh' }}>
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
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'var(--space-xl) var(--space-2xl)' }}>
        <div style={{ marginBottom: 'var(--space-2xl)', marginTop: 'var(--space-xl)' }}>
          <h1 className="text-primary" style={{ marginBottom: 'var(--space-sm)' }}>
            Welcome, {user.username || 'User'}
          </h1>
          <p className="text-secondary">Choose an action below.</p>
        </div>

        {/* Main Content Layout - Everything Side by Side */}
        <div className="three-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-lg)', marginBottom: 'var(--space-2xl)' }}>
          {/* Left Column - Book Your Ride */}
          <div className="card">
            <h3 className="text-primary" style={{ marginBottom: 'var(--space-lg)' }}>Book Your Ride</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div>
                <label className="text-secondary" style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-xs)', marginBottom: 'var(--space-xs)', display: 'block' }}>Pickup Location</label>
                <input
                  ref={pickupRef}
                  value={pickupAddress}
                  onChange={(e) => { setPickupAddress(e.target.value); setPickupCoords(null); }}
                  placeholder="Enter pickup location"
                  style={{ width: '100%', fontSize: 'var(--font-size-xs)', padding: 'var(--space-xs) var(--space-sm)' }}
                />
              </div>

              <div>
                <label className="text-secondary" style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-xs)', marginBottom: 'var(--space-xs)', display: 'block' }}>Destination</label>
                <input
                  ref={dropoffRef}
                  value={dropoffAddress}
                  onChange={(e) => { setDropoffAddress(e.target.value); setDropoffCoords(null); }}
                  placeholder="Enter destination"
                  style={{ width: '100%', fontSize: 'var(--font-size-xs)', padding: 'var(--space-xs) var(--space-sm)' }}
                />
              </div>

              <button
                type="button"
                onClick={useMyLocation}
                className="btn-outline"
                style={{ alignSelf: 'flex-start', fontSize: 'var(--font-size-xs)', padding: 'var(--space-xs) var(--space-sm)' }}
              >
                📍 Use My Location
              </button>
            </div>
          </div>

          {/* Middle Column - Vehicle Selection & Actions */}
          <div className="card">
            <h3 className="text-primary" style={{ marginBottom: 'var(--space-lg)' }}>Choose Vehicle</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xs)', marginBottom: 'var(--space-md)' }}>
              {rideTypes.map(rt => (
                <button
                  key={rt.id}
                  onClick={() => setRideType(rt.id)}
                  className="btn-ghost"
                  style={{
                    padding: 'var(--space-sm)',
                    borderRadius: 'var(--radius-md)',
                    border: rideType === rt.id ? `2px solid ${rt.color}` : '1px solid var(--border-light)',
                    background: rideType === rt.id ? 'var(--primary-50)' : 'var(--bg-primary)',
                    textAlign: 'center'
                  }}
                  onMouseOver={(e) => { if (rideType !== rt.id) { e.target.style.borderColor = rt.color; e.target.style.background = 'var(--gray-100)'; } }}
                  onMouseOut={(e) => { if (rideType !== rt.id) { e.target.style.borderColor = 'var(--border-light)'; e.target.style.background = 'var(--bg-primary)'; } }}
                >
                  <div style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-xs)' }}>{rt.icon}</div>
                  <div className="text-primary" style={{ fontWeight: 'var(--font-weight-bold)', fontSize: 'var(--font-size-xs)' }}>{rt.name}</div>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              <button
                onClick={computeEstimate}
                disabled={!pickupAddress || !dropoffAddress || loadingEstimate}
                className="btn-primary"
                style={{ width: '100%', fontSize: 'var(--font-size-xs)', padding: 'var(--space-xs) var(--space-sm)' }}
              >
                {loadingEstimate ? '⏳ Estimating...' : '💰 Get Estimate'}
              </button>

              <button
                onClick={onRequestRide}
                disabled={!estimate || requesting}
                className="btn-success"
                style={{ width: '100%', fontSize: 'var(--font-size-xs)', padding: 'var(--space-xs) var(--space-sm)' }}
              >
                {requesting ? '⏳ Requesting...' : '🚗 Request Ride'}
              </button>
            </div>

            {estimate && (
              <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-sm)', background: 'var(--primary-50)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary-500)' }}>
                <h4 className="text-primary" style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-xs)' }}>Ride Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xs)', fontSize: 'var(--font-size-xs)' }}>
                  <div className="text-secondary"><strong>Vehicle:</strong> {estimate.ride}</div>
                  <div className="text-secondary"><strong>Distance:</strong> {estimate.distance} km</div>
                  <div className="text-secondary"><strong>ETA:</strong> {estimate.duration} min</div>
                  <div className="text-success-600"><strong>Fare: ₹{estimate.total}</strong></div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Map */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div ref={mapRef} style={{ width: '100%', height: 200 }} />
            <div className="text-tertiary" style={{ padding: 'var(--space-xs)', fontSize: 'var(--font-size-xs)', textAlign: 'center', background: 'var(--bg-tertiary)' }}>
              Nearby drivers shown on the map are mocked for now.
            </div>
          </div>
        </div>

        {/* Action Cards - Full Width */}
        <div className="six-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 'var(--space-md)' }}>
          {launchers.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                minHeight: 120,
                border: '2px solid var(--border-light)',
                cursor: 'pointer',
                padding: 'var(--space-md)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = item.color;
                e.currentTarget.style.background = 'var(--primary-50)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-light)';
                e.currentTarget.style.background = 'var(--bg-primary)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <div style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-xs)' }}>{item.icon}</div>
              <div className="text-primary" style={{ fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-xs)', fontSize: 'var(--font-size-sm)' }}>{item.title}</div>
              <div className="text-tertiary" style={{ fontSize: 'var(--font-size-xs)', lineHeight: 1.3 }}>{item.description}</div>
            </button>
          ))}
        </div>
      </div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </div>
  );
};

export default UserDashboard;