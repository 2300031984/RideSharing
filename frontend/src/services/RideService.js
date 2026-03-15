// src/services/RideService.js
import api from './AuthInterceptor';

const API_ROOT = (import.meta.env?.VITE_API_URL || 'http://localhost:8081');
const API_BASE = API_ROOT + '/api';

// Use the authenticated axios instance

// ✅ Get all available ride requests (for drivers)
export const getRideRequests = async () => {
  try {
    const res = await api.get(`/rides/requests`);
    return res.data;
  } catch (error) {
    console.warn('RideService: Failed to get ride requests from API, using mock/local data');
    const pending = readPending();
    // If no local pending, provide some sample data for the demo
    if (pending.length === 0) {
      return [{
        id: 'mock-ride-1',
        pickupAddress: 'Downtown Mall',
        dropoffAddress: 'Tech Park',
        fare: 450,
        status: 'REQUESTED',
        createdAt: new Date().toISOString()
      }];
    }
    return pending;
  }
};

// ✅ Get ride details by ID
export const getRideById = (id) => {
  try {
    return api.get(`/rides/${id}`);
  } catch (error) {
    throw new Error(`Failed to get ride by ID: ${error.message}`);
  }
};

// ✅ Get ride request status (for waiting page)
export const getRideRequestStatus = async (rideId) => {
  try {
    const res = await api.get(`/rides/${rideId}`);
    // Backend returns { success, ride, driver }
    return res?.data?.ride || null;
  } catch (error) {
    console.error('Failed to get ride request status:', error);
    return null;
  }
};

// ✅ Poll ride request status (for real-time updates) with retry logic
export const pollRideRequestStatus = async (rideId, onStatusUpdate) => {
  try {
    const res = await api.get(`/rides/${rideId}`);
    console.log('📡 Full API response:', res);
    console.log('📡 Response data:', res?.data);
    const ride = res?.data?.ride;
    console.log('📡 Extracted ride:', ride);
    if (ride) {
      console.log('📡 Polling response:', ride);
      onStatusUpdate && onStatusUpdate(ride);
      return ride;
    }
    return null;
  } catch (error) {
    console.error('Failed to poll ride request status:', error);
    // Return null to allow fallback to local storage
    return null;
  }
};

// helpers for mock storage
const readRecent = () => {
  try { return JSON.parse(localStorage.getItem('recentRides')) || []; } catch { return []; }
};
const writeRecent = (list) => {
  try { localStorage.setItem('recentRides', JSON.stringify(list)); } catch { }
};

// pending requests (for driver mock feed)
const readPending = () => {
  try { return JSON.parse(localStorage.getItem('pendingRideRequests')) || []; } catch { return []; }
};
const writePending = (list) => {
  try { localStorage.setItem('pendingRideRequests', JSON.stringify(list)); } catch { }
};

// ✅ Book a new ride (for users) with mock fallback
export const bookRide = async (rideData) => {
  try {
    // Backend expects POST /api/rides with { riderId, pickupLocation, dropoffLocation, pickupLatitude, pickupLongitude, dropoffLatitude, dropoffLongitude, vehicleType }
    const res = await api.post(`/rides`, {
      riderId: rideData?.passengerId || rideData?.riderId,
      pickupLocation: rideData?.pickup?.address,
      dropoffLocation: rideData?.drop?.address,
      pickupLatitude: rideData?.pickup?.lat,
      pickupLongitude: rideData?.pickup?.lng,
      dropoffLatitude: rideData?.drop?.lat,
      dropoffLongitude: rideData?.drop?.lng,
      vehicleType: rideData?.vehicleType
    });
    // also mirror into recent in case the page expects it
    const list = readRecent();
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit
    list.unshift({
      id: res?.data?.id || res?.data?.rideRequestId,
      date: new Date().toISOString(),
      pickup: rideData?.pickup?.address,
      dropoff: rideData?.drop?.address,
      fare: rideData?.price,
      status: 'requested',
      otp,
      distance: rideData?.distance,
      duration: rideData?.duration
    });
    writeRecent(list.slice(0, 20));
    return { data: { ...(res?.data || {}), otp } };
  } catch (error) {
    // return mock response and persist to recent
    const mockId = Math.floor(Math.random() * 1e9).toString();
    const otp = Math.floor(100000 + Math.random() * 900000);
    const list = readRecent();
    list.unshift({
      id: mockId,
      date: new Date().toISOString(),
      pickup: rideData?.pickup?.address,
      dropoff: rideData?.drop?.address,
      fare: rideData?.price,
      status: 'requested',
      otp,
      distance: rideData?.distance,
      duration: rideData?.duration
    });
    writeRecent(list.slice(0, 20));
    return { data: { id: mockId, status: 'requested', otp } };
  }
};

// ✅ Get all rides of a specific user (legacy, non-paged)
export const getUserRides = (userId) => {
  try {
    return api.get(`/rides/user/${userId}`);
  } catch (error) {
    throw new Error(`Failed to get user rides: ${error.message}`);
  }
};

// ✅ Get paged rides of a specific user with filters
export const getUserRidesPaged = async ({ userId, status, from, to, page = 0, size = 10 }) => {
  try {
    // Use the correct backend endpoint
    const res = await api.get(`/rides/rider/${userId}`);
    if (res?.data?.rides) {
      // Transform the data to match expected format
      const rides = res.data.rides.map(ride => ({
        id: ride.id,
        date: ride.createdAt ? new Date(ride.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        time: ride.createdAt ? new Date(ride.createdAt).toTimeString().slice(0, 5) : new Date().toTimeString().slice(0, 5),
        pickup: ride.pickupAddress || 'Unknown',
        dropoff: ride.dropoffAddress || 'Unknown',
        driver: ride.driverName || '—',
        vehicle: ride.vehicleNumber || '—',
        fare: ride.fare || 0,
        status: (ride.status || '').toLowerCase(),
        rating: ride.rating || null,
        distance: ride.distance ? `${ride.distance} km` : '—',
        duration: ride.duration ? `${ride.duration} min` : '—',
        createdAt: ride.createdAt,
        requestedAt: ride.createdAt,
        pickupAddress: ride.pickupAddress,
        dropoffAddress: ride.dropoffAddress,
        pickupLatitude: ride.pickupLatitude,
        pickupLongitude: ride.pickupLongitude,
        dropoffLatitude: ride.dropoffLatitude,
        dropoffLongitude: ride.dropoffLongitude
      }));

      // Apply filters
      let filteredRides = rides;
      if (status && status !== 'all') {
        filteredRides = rides.filter(ride => ride.status === status);
      }

      // Apply pagination
      const startIndex = page * size;
      const endIndex = startIndex + size;
      const paginatedRides = filteredRides.slice(startIndex, endIndex);

      return {
        data: {
          content: paginatedRides,
          totalElements: filteredRides.length,
          totalPages: Math.ceil(filteredRides.length / size),
          size: size,
          number: page
        }
      };
    }
    return { data: { content: [], totalElements: 0 } };
  } catch (error) {
    console.error('Failed to get user rides:', error);
    // Fallback to local storage
    const localRides = getRecentRidesLocal();
    const mappedRides = localRides.map(ride => ({
      id: ride.id,
      date: ride.date ? new Date(ride.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      time: ride.date ? new Date(ride.date).toTimeString().slice(0, 5) : new Date().toTimeString().slice(0, 5),
      pickup: ride.pickup || 'Unknown',
      dropoff: ride.dropoff || 'Unknown',
      driver: '—',
      vehicle: '—',
      fare: ride.fare || 0,
      status: ride.status || 'requested',
      rating: ride.rating || null,
      distance: ride.distance || '—',
      duration: ride.duration || '—',
      createdAt: ride.date
    }));

    return {
      data: {
        content: mappedRides,
        totalElements: mappedRides.length,
        totalPages: 1,
        size: size,
        number: page
      }
    };
  }
};

// ✅ Cancel a ride by user (only if REQUESTED)
export const cancelRide = (rideId, userId) => {
  return api.post(`/rides/${rideId}/cancel?userId=${encodeURIComponent(userId)}`);
};

// ✅ Reject a ride by driver (only if REQUESTED)
export const rejectRide = (rideId) => {
  return api.post(`/rides/${rideId}/reject`);
};

// Mock-friendly getters
export const getRecentRidesLocal = () => readRecent();

export const updateRecentStatusLocal = (rideId, status) => {
  const list = readRecent();
  const idx = list.findIndex(r => String(r.id) === String(rideId));
  if (idx !== -1) {
    list[idx] = { ...list[idx], status };
    writeRecent(list);
  }
  return list;
};

// Pending requests API (mock)
export const addPendingRideLocal = (pending) => {
  const list = readPending();
  list.unshift({ ...pending, createdAt: new Date().toISOString() });
  writePending(list.slice(0, 50));
  return list;
};

export const getPendingRidesLocal = () => readPending();

export const removePendingRideLocal = (rideId) => {
  const list = readPending().filter(r => String(r.id) !== String(rideId));
  writePending(list);
  return list;
};

export const getRecentByIdLocal = (rideId) => {
  const list = readRecent();
  return list.find(r => String(r.id) === String(rideId));
};

// =============================
// API helpers with mock fallback
// =============================

export const requestRide = async ({ pickup, drop, vehicleType, paymentMethod, price, distance, duration }) => {
  try {
    // Get current user info
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user?.id;

    if (!userId) {
      throw new Error('User not found');
    }

    // Use the correct backend endpoint with proper data structure
    const res = await api.post('/rides', {
      riderId: userId,
      pickupLocation: pickup?.address,
      dropoffLocation: drop?.address,
      pickupLatitude: pickup?.lat,
      pickupLongitude: pickup?.lng,
      dropoffLatitude: drop?.lat,
      dropoffLongitude: drop?.lng,
      vehicleType: vehicleType
    });

    const rideData = res?.data?.ride || res?.data;
    const id = rideData?.id || Math.floor(Math.random() * 1e9).toString();
    const otp = res?.data?.otp || Math.floor(100000 + Math.random() * 900000);

    // Save to local storage for immediate UI feedback
    const list = readRecent();
    list.unshift({
      id,
      date: new Date().toISOString(),
      pickup: pickup?.address,
      dropoff: drop?.address,
      fare: price,
      status: 'requested',
      otp,
      distance,
      duration,
      vehicleType,
      passengerId: userId,
      passengerName: user?.username || 'User'
    });
    writeRecent(list.slice(0, 20));

    console.log('Ride request saved to database with ID:', id);
    return { data: { id, otp, ...rideData } };
  } catch (e) {
    console.error('Request ride error:', e);
    // fallback to mock booking
    return bookRide({ pickup, drop, vehicleType, price, distance, duration });
  }
};

export const estimateFare = async ({ pickup, drop, vehicleType, distance }) => {
  try {
    // Distance from frontend map or auto-calc
    // Send to backend
    const res = await api.post('/rides/estimate-fare', {
      vehicleType,
      distance: distance || 5.0, // fallback distance if map not ready
      pickup,
      drop
    });
    return res?.data?.data?.fare ? Math.round(res.data.data.fare) : null;
  } catch (e) {
    console.warn('Fare estimation failed:', e);
    return null;
  }
};

export const getNearbyDrivers = async ({ lat, lng }) => {
  try {
    const res = await api.get(`/drivers/nearby`, { params: { lat, lng, radius: 5.0 } });
    return res?.data || [];
  } catch (e) {
    console.error('Failed to get nearby drivers:', e);
    return [];
  }
};

// Ride status APIs with graceful fallback
export const cancelRideApi = async (rideId, userId, reason = 'User cancelled') => {
  try {
    // Use the correct backend endpoint with proper parameters
    const res = await api.post(`/rides/${rideId}/cancel?userId=${encodeURIComponent(userId || '')}`, {
      reason: reason
    });

    // Update local storage for immediate UI feedback
    updateRecentStatusLocal(rideId, 'cancelled');

    return {
      success: true,
      data: res?.data || { status: 'cancelled' },
      message: 'Ride cancelled successfully'
    };
  } catch (error) {
    console.error('Cancel ride API error:', error);

    // Update local storage even if API fails
    updateRecentStatusLocal(rideId, 'cancelled');

    return {
      success: false,
      data: { status: 'cancelled' },
      message: 'Ride cancelled locally (API unavailable)',
      error: error.message
    };
  }
};

export const acceptRideApi = async (rideId) => {
  try {
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const res = await api.post(`/rides/${rideId}/accept`, { driverId: user?.id });
    updateRecentStatusLocal(rideId, 'accepted');
    return res?.data || { status: 'accepted' };
  } catch (e) {
    updateRecentStatusLocal(rideId, 'accepted');
    return { status: 'accepted' };
  }
};

export const completeRideApi = async (rideId) => {
  try {
    const res = await api.post(`/rides/${rideId}/complete`);
    updateRecentStatusLocal(rideId, 'completed');
    return res?.data || { status: 'completed' };
  } catch (e) {
    updateRecentStatusLocal(rideId, 'completed');
    return { status: 'completed' };
  }
};

// Basic WebSocket connector for live ride updates
export const connectRideSocket = (rideId, onMessage) => {
  try {
    // WebSocket not implemented in backend; return null
    const ws = null;
    ws.onmessage = (evt) => {
      try { const data = JSON.parse(evt.data); onMessage && onMessage(data); } catch { }
    };
    return ws;
  } catch {
    return null;
  }
};

export const rateRideApi = async (rideId, rating) => {
  try {
    const res = await api.post(`/rides/${rideId}/rate`, { rating });
    // update local store for immediate UI feedback
    const list = readRecent();
    const idx = list.findIndex(r => String(r.id) === String(rideId));
    if (idx !== -1) { list[idx] = { ...list[idx], rating }; writeRecent(list); }
    return res?.data || { rating };
  } catch (e) {
    const list = readRecent();
    const idx = list.findIndex(r => String(r.id) === String(rideId));
    if (idx !== -1) { list[idx] = { ...list[idx], rating }; writeRecent(list); }
    return { rating };
  }
};

export const sosApi = async ({ rideId, lat, lng }) => {
  try {
    const res = await api.post(`/sos`, { rideId, lat, lng });
    return res?.data || { ok: true };
  } catch (e) {
    return { ok: true };
  }
};

export const reportIssueApi = async ({ rideId, reason }) => {
  try {
    const res = await api.post(`/rides/${rideId}/report`, { reason });
    return res?.data || { status: 'received' };
  } catch (e) {
    return { status: 'received' };
  }
};

// =============================
// Payments & Wallet (with fallbacks)
// =============================

const readWalletLocal = () => {
  const v = localStorage.getItem('wallet_balance');
  return Number.isFinite(parseFloat(v)) ? parseFloat(v) : 0;
};
const writeWalletLocal = (amt) => {
  localStorage.setItem('wallet_balance', String(amt));
};
const readPaymentsLocal = () => {
  try { return JSON.parse(localStorage.getItem('payments_history') || '[]'); } catch { return []; }
};
const writePaymentsLocal = (list) => {
  localStorage.setItem('payments_history', JSON.stringify(list));
};

export const createPaymentOrder = async ({ amount, currency = 'INR', meta = {} }) => {
  try {
    return { id: 'order_local_' + Date.now(), amount, currency };
  } catch (e) {
    return { id: 'order_local_' + Date.now(), amount, currency };
  }
};

export const capturePayment = async ({ orderId, paymentId, signature }) => {
  try {
    // mirror in local history
    const hist = readPaymentsLocal();
    hist.unshift({ id: paymentId || ('pay_' + Date.now()), orderId, status: 'captured', date: new Date().toISOString() });
    writePaymentsLocal(hist.slice(0, 50));
    return { status: 'captured' };
  } catch (e) {
    const hist = readPaymentsLocal();
    hist.unshift({ id: paymentId || ('pay_' + Date.now()), orderId, status: 'captured', date: new Date().toISOString() });
    writePaymentsLocal(hist.slice(0, 50));
    return { status: 'captured' };
  }
};

export const getWalletBalance = async () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user?.id) return 0;
    const res = await api.get(`/wallet/${user.id}/balance`);
    return res?.data?.balance || 0;
  } catch (e) {
    console.error("Wallet balance fetch failed:", e);
    return 0;
  }
};

export const addWalletFunds = async ({ amount }) => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user?.id) throw new Error("User not found");

    const res = await api.post(`/wallet/${user.id}/recharge`, { amount, paymentMethod: 'Card' });
    return { balance: res?.data?.data?.newBalance || 0 };
  } catch (e) {
    console.error("Add funds failed:", e);
    throw e;
  }
};

export const getPaymentsHistory = async () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user?.id) return [];
    const res = await api.get(`/wallet/${user.id}/transactions`);
    return res?.data || [];
  } catch (e) {
    console.warn("Payment history fetch failed:", e);
    return [];
  }
};

// =============================
// Real-time Tracking & Notifications
// =============================

export const getRideTracking = async (rideId) => {
  try {
    const res = await api.get(`/rides/${rideId}/tracking`);
    return res?.data || null;
  } catch (e) {
    console.error('Failed to get ride tracking:', e);
    return null;
  }
};

export const updateDriverLocation = async (rideId, locationData) => {
  try {
    const res = await api.post(`/rides/${rideId}/location`, locationData);
    return res?.data || null;
  } catch (e) {
    console.error('Failed to update driver location:', e);
    return null;
  }
};

export const getRideETA = async (rideId) => {
  try {
    const res = await api.get(`/rides/${rideId}/eta`);
    return res?.data || null;
  } catch (e) {
    console.error('Failed to get ride ETA:', e);
    return null;
  }
};

export const getUserNotifications = async (userId) => {
  try {
    const res = await api.get(`/users/${userId}/notifications`);
    return res?.data?.notifications || [];
  } catch (e) {
    console.error('Failed to get notifications:', e);
    return [];
  }
};

export const markNotificationAsRead = async (userId, notificationId) => {
  try {
    const res = await api.post(`/users/${userId}/notifications/${notificationId}/mark-read`);
    return res?.data || null;
  } catch (e) {
    console.error('Failed to mark notification as read:', e);
    return null;
  }
};

// =============================
// Scheduled Rides Database Persistence
// =============================

export const requestScheduledRide = async ({ pickup, drop, vehicleType, price, distance, duration, scheduledDate, scheduledTime }) => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user?.id;

    if (!userId) {
      throw new Error('User not found');
    }

    // Use the scheduled ride booking endpoint
    const res = await api.post('/rides/book-scheduled', {
      passengerId: userId,
      passengerName: user?.username || 'User',
      pickupAddress: pickup?.address,
      dropoffAddress: drop?.address,
      pickupLatitude: pickup?.lat,
      pickupLongitude: pickup?.lng,
      dropoffLatitude: drop?.lat,
      dropoffLongitude: drop?.lng,
      fare: price,
      vehicleType: vehicleType,
      scheduledDate: scheduledDate,
      scheduledTime: scheduledTime
    });

    const rideData = res?.data;
    const id = rideData?.id || Math.floor(Math.random() * 1e9).toString();

    // Save to local storage for immediate UI feedback
    const list = readRecent();
    list.unshift({
      id,
      date: new Date().toISOString(),
      pickup: pickup?.address,
      dropoff: drop?.address,
      fare: price,
      status: 'requested',
      distance,
      duration,
      vehicleType,
      passengerId: userId,
      passengerName: user?.username || 'User',
      isScheduled: true,
      scheduledAt: `${scheduledDate}T${scheduledTime}`
    });
    writeRecent(list.slice(0, 20));

    // Persist a compact scheduled rides list (used by driver scheduled page)
    try {
      const sched = JSON.parse(localStorage.getItem('scheduledRides') || '[]');
      sched.unshift({
        id,
        pickup: pickup?.address,
        dropoff: drop?.address,
        fare: price,
        distance,
        duration,
        vehicleType,
        scheduledDate,
        scheduledTime
      });
      localStorage.setItem('scheduledRides', JSON.stringify(sched.slice(0, 100)));
    } catch { }

    console.log('Scheduled ride request saved to database with ID:', id);
    return { data: { id, ...rideData } };
  } catch (e) {
    console.error('Scheduled ride request error:', e);
    // fallback to mock booking
    return bookRide({ pickup, drop, vehicleType, price, distance, duration });
  }
};

// =============================
// Database Status Updates
// =============================

export const updateRideStatusInDatabase = async (rideId, status) => {
  try {
    // Update status in backend database
    const res = await api.put(`/rides/${rideId}/status`, { status });
    console.log(`Ride ${rideId} status updated to ${status} in database`);
    return res?.data || null;
  } catch (e) {
    console.error('Failed to update ride status in database:', e);
    return null;
  }
};

export const getAllRideRequestsFromDatabase = async () => {
  try {
    const res = await api.get('/rides');
    return res?.data || [];
  } catch (e) {
    console.error('Failed to fetch ride requests from database:', e);
    return [];
  }
};

export const getRideRequestsByStatusFromDatabase = async (status) => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const vehicleType = user?.vehicleType || undefined;
    const res = await api.get(`/rides/status/${status}`, { params: vehicleType ? { vehicleType } : {} });
    return res?.data || [];
  } catch (e) {
    console.error('Failed to fetch ride requests by status from database:', e);
    return [];
  }
};