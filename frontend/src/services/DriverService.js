import api from './AuthInterceptor';

const getRole = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.role || 'Driver';
  } catch {
    return 'Driver';
  }
};

// Get driver profile via unified ProfileController
export const getDriverProfile = async (userId) => {
  try {
    const response = await api.get(`/profile/${userId}`, { params: { role: getRole() } });
    return response.data;
  } catch (error) {
    console.warn('DriverService: Failed to get driver profile, using mock from localStorage');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return {
      id: userId,
      name: user.name || 'Demo Driver',
      email: user.email || 'driver@example.com',
      phoneNumber: user.phoneNumber || '0987654321',
      vehicleType: user.vehicleType || 'SUV',
      vehicleNumber: 'CA-9999',
      vehicleModel: 'Tesla Model Y',
      rating: 4.8
    };
  }
};

// Update driver profile via unified ProfileController
export const updateDriverProfile = async (userId, profileData) => {
  try {
    const response = await api.put(`/profile/${userId}`, profileData, { params: { role: getRole() } });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to update driver profile' };
  }
};

export const updateDriverStatus = async (driverId, status) => {
  try {
    // Map UI status to backend enum: ONLINE -> AVAILABLE, OFFLINE -> OFFLINE
    let apiStatus;
    if ((status || '').toUpperCase() === 'ONLINE') {
      apiStatus = 'AVAILABLE';
    } else if ((status || '').toUpperCase() === 'OFFLINE') {
      apiStatus = 'OFFLINE';
    } else {
      // If status is already AVAILABLE, BUSY, or OFFLINE, use it directly
      apiStatus = (status || 'OFFLINE').toUpperCase();
    }
    
    const response = await api.put(`/drivers/${driverId}/status`, null, { params: { status: apiStatus } });
    return response.data;
  } catch (error) {
    // If driver not found (e.g., localStorage has stale id), try to resolve by email and retry once
    if (error?.response?.status === 404) {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const email = user?.email;
        if (email) {
          const profRes = await api.get(`/profile/email/${encodeURIComponent(email)}`, { params: { role: 'Driver' } });
          const resolvedId = profRes?.data?.id;
          if (resolvedId) {
            // persist corrected id for later calls
            try { localStorage.setItem('user', JSON.stringify({ ...user, id: resolvedId })); } catch {}
            
            let apiStatusResolved;
            if ((status || '').toUpperCase() === 'ONLINE') {
              apiStatusResolved = 'AVAILABLE';
            } else if ((status || '').toUpperCase() === 'OFFLINE') {
              apiStatusResolved = 'OFFLINE';
            } else {
              apiStatusResolved = (status || 'OFFLINE').toUpperCase();
            }
            
            const retry = await api.put(`/drivers/${resolvedId}/status`, null, { params: { status: apiStatusResolved } });
            return retry.data;
          }
        }
      } catch (_) {}
    }
    throw error.response?.data || { success: false, message: 'Failed to update driver status' };
  }
};

export const getDriverById = async (driverId) => {
  try {
    const response = await api.get(`/drivers/${driverId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to fetch driver' };
  }
};

export default {
  getDriverProfile,
  updateDriverProfile,
  updateDriverStatus,
  getDriverById,
};


