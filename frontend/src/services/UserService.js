import api from './AuthInterceptor';

// Route all profile operations through ProfileController with role param

const getRole = (explicitRole) => {
  if (explicitRole) return explicitRole;
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.role || 'User';
  } catch {
    return 'User';
  }
};

// Get profile by userId and role
export const getUserProfile = async (userId, role) => {
  try {
    const r = getRole(role);
    const response = await api.get(`/profile/${userId}`, { params: { role: r } });
    const data = response.data;
    return { success: true, user: data };
  } catch (error) {
    console.warn('UserService: Failed to get user profile, using mock from localStorage');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return {
      success: true,
      user: {
        id: userId,
        username: user.username || 'Demo Rider',
        email: user.email || 'rider@example.com',
        phoneNumber: user.phone || '1234567890',
        age: user.age || 25,
        location: user.location || 'California, USA',
        role: user.role || 'User'
      }
    };
  }
};

// Update profile by userId and role
export const updateUserProfile = async (userId, profileData, role) => {
  try {
    const r = getRole(role);
    const response = await api.put(`/profile/${userId}`, profileData, { params: { role: r } });
    const data = response.data;
    return { success: true, user: data };
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to update profile' };
  }
};

// Change password (no dedicated endpoint exposed; return error for now)
export const changeUserPassword = async () => {
  return Promise.reject({ success: false, message: 'Password change endpoint not available' });
};

export default {
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
};