import React, { useState, useRef, useEffect } from 'react';
import { updateUserProfile, changeUserPassword, getUserProfile } from '../../services/UserService';
import Card from '../../components/ui/Card';

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=Driver&background=059669&color=fff&size=128';

const DriverProfile = () => {
  const storedUser = JSON.parse(localStorage.getItem('user'));
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: storedUser?.name || storedUser?.username || '',
    email: storedUser?.email || '',
    phone: storedUser?.phone || '',
    gender: storedUser?.gender || '',
    licenseNumber: storedUser?.licenseNumber || '',
    vehicleNumber: storedUser?.vehicleNumber || '',
    vehicleType: storedUser?.vehicleType || 'car',
    vehicleModel: storedUser?.vehicleModel || '',
    vehicleColor: storedUser?.vehicleColor || '',
  });

  const [user, setUser] = useState(storedUser);
  const [message, setMessage] = useState('');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const fileInputRef = useRef();
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const vehicleTypes = [
    { value: 'bike', label: 'Bike', icon: '🏍️' },
    { value: 'car', label: 'Car', icon: '🚗' },
    { value: 'suv', label: 'SUV', icon: '🚙' },
    { value: 'van', label: 'Van', icon: '🚐' },
    { value: 'auto', label: 'Auto Rickshaw', icon: '🛺' }
  ];

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = e => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    // Load fresh profile from backend on mount for real-time accuracy
    (async () => {
      try {
        if (!storedUser?.id) return;
        const res = await getUserProfile(storedUser.id, 'Driver');
        if (res?.success && res.user) {
          const updated = { 
            ...storedUser, 
            ...res.user,
            phone: res.user.phoneNumber || res.user.phone
          };
          localStorage.setItem('user', JSON.stringify(updated));
          setUser(updated);
          setForm({
            name: updated?.name || updated?.username || '',
            email: updated?.email || '',
            phone: updated?.phoneNumber || updated?.phone || '',
            gender: updated?.gender || '',
            licenseNumber: updated?.licenseNumber || '',
            vehicleNumber: updated?.vehicleNumber || '',
            vehicleType: updated?.vehicleType || 'car',
            vehicleModel: updated?.vehicleModel || '',
            vehicleColor: updated?.vehicleColor || '',
          });
          setAvatar(updated?.avatar || '');
          setAvatarPreview(updated?.avatar || '');
        }
      } catch {}
    })();
  }, []);

  const handleSave = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Prepare profile data
      const profileData = {
        name: form.name,
        email: form.email,
        phoneNumber: form.phone,
        gender: form.gender,
        licenseNumber: form.licenseNumber,
        vehicleNumber: form.vehicleNumber,
        vehicleType: form.vehicleType,
        vehicleModel: form.vehicleModel,
        vehicleColor: form.vehicleColor,
      };

      // Add avatar if changed
      if (avatarPreview && avatarPreview !== avatar) {
        profileData.avatar = avatarPreview;
      }

      // Call API to update profile
      const response = await updateUserProfile(user.id, profileData, 'Driver');

      if (response.success) {
        // Update localStorage and state
        const updatedUser = { 
          ...user, 
          ...response.user,
          phone: response.user.phoneNumber || response.user.phone
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setForm({
          name: updatedUser?.name || updatedUser?.username || '',
          email: updatedUser?.email || '',
          phone: updatedUser?.phoneNumber || updatedUser?.phone || '',
          gender: updatedUser?.gender || '',
          licenseNumber: updatedUser?.licenseNumber || '',
          vehicleNumber: updatedUser?.vehicleNumber || '',
          vehicleType: updatedUser?.vehicleType || 'car',
          vehicleModel: updatedUser?.vehicleModel || '',
          vehicleColor: updatedUser?.vehicleColor || '',
        });
        setAvatar(updatedUser.avatar);
        setEditMode(false);
        setMessage('Profile updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(response.message || 'Failed to update profile');
      }
    } catch (error) {
      setMessage(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm({ 
      name: user.name || user.username || '',
      email: user.email || '',
      phone: user.phone || '',
      licenseNumber: user.licenseNumber || '',
      vehicleNumber: user.vehicleNumber || '',
      vehicleType: user.vehicleType || 'car',
      vehicleModel: user.vehicleModel || '',
      vehicleColor: user.vehicleColor || '',
    });
    setAvatarPreview(avatar);
    setEditMode(false);
    setMessage('');
    setShowPasswordFields(false);
    setPasswords({ current: '', new: '', confirm: '' });
    setPasswordMsg('');
  };

  const handlePasswordChange = e => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async e => {
    e.preventDefault();
    
    // Client-side validation
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      setPasswordMsg('Please fill all fields.');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setPasswordMsg('New passwords do not match.');
      return;
    }
    if (passwords.new.length < 6) {
      setPasswordMsg('New password must be at least 6 characters.');
      return;
    }

    setPasswordLoading(true);
    setPasswordMsg('');

    try {
      const response = await changeUserPassword(user.id, {
        currentPassword: passwords.current,
        newPassword: passwords.new
      });

      if (response.success) {
        setPasswordMsg('Password changed successfully!');
        setTimeout(() => {
          setShowPasswordFields(false);
          setPasswordMsg('');
          setPasswords({ current: '', new: '', confirm: '' });
        }, 2000);
      } else {
        setPasswordMsg(response.message || 'Failed to change password');
      }
    } catch (error) {
      setPasswordMsg(error.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: '#1f2937' }}>Driver Profile</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Personal Information */}
          <Card style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#1f2937' }}>Personal Information</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24 }}>
              <img
                src={editMode ? (avatarPreview || DEFAULT_AVATAR) : (avatar || DEFAULT_AVATAR)}
                alt="Avatar"
                style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid #059669', background: '#f0fdf4' }}
              />
              {editMode && (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleAvatarChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    style={{ 
                      background: '#f0fdf4', 
                      color: '#059669', 
                      fontWeight: 600, 
                      border: '1px solid #059669', 
                      borderRadius: 6, 
                      padding: '8px 16px', 
                      cursor: 'pointer' 
                    }}
                  >
                    Change Avatar
                  </button>
                </div>
              )}
            </div>

            {editMode ? (
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <label>
                  <strong>Full Name:</strong>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    style={{ marginLeft: 8, padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, width: '100%' }}
                    required
                    disabled={loading}
                  />
                </label>
                <label>
                  <strong>Email:</strong>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    style={{ marginLeft: 8, padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, width: '100%' }}
                    required
                    disabled={loading}
                  />
                </label>
                <label>
                  <strong>Phone:</strong>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    style={{ marginLeft: 8, padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, width: '100%' }}
                    disabled={loading}
                  />
                </label>
                <label>
                  <strong>Gender:</strong>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    style={{ marginLeft: 8, padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, width: '100%' }}
                    disabled={loading}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <label>
                  <strong>License Number:</strong>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={form.licenseNumber}
                    onChange={handleChange}
                    style={{ marginLeft: 8, padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, width: '100%' }}
                    disabled={loading}
                  />
                </label>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div><strong>Name:</strong> {user.name || user.username}</div>
                <div><strong>Email:</strong> {user.email}</div>
                <div><strong>Phone:</strong> {user.phone || 'Not provided'}</div>
                <div><strong>License:</strong> {user.licenseNumber || 'Not provided'}</div>
                <div><strong>Role:</strong> {user.role}</div>
              </div>
            )}
          </Card>

          {/* Vehicle Information */}
          <Card style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#1f2937' }}>Vehicle Information</h3>
            
            {editMode ? (
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <label>
                  <strong>Vehicle Type:</strong>
                  <select
                    name="vehicleType"
                    value={form.vehicleType}
                    onChange={handleChange}
                    style={{ marginLeft: 8, padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, width: '100%' }}
                    disabled={loading}
                  >
                    {vehicleTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <strong>Vehicle Number:</strong>
                  <input
                    type="text"
                    name="vehicleNumber"
                    value={form.vehicleNumber}
                    onChange={handleChange}
                    placeholder="e.g., KA01AB1234"
                    style={{ marginLeft: 8, padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, width: '100%' }}
                    disabled={loading}
                  />
                </label>
                <label>
                  <strong>Vehicle Model:</strong>
                  <input
                    type="text"
                    name="vehicleModel"
                    value={form.vehicleModel}
                    onChange={handleChange}
                    placeholder="e.g., Honda City"
                    style={{ marginLeft: 8, padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, width: '100%' }}
                    disabled={loading}
                  />
                </label>
                <label>
                  <strong>Vehicle Color:</strong>
                  <input
                    type="text"
                    name="vehicleColor"
                    value={form.vehicleColor}
                    onChange={handleChange}
                    placeholder="e.g., White"
                    style={{ marginLeft: 8, padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, width: '100%' }}
                    disabled={loading}
                  />
                </label>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div><strong>Vehicle Type:</strong> {vehicleTypes.find(v => v.value === user.vehicleType)?.icon} {vehicleTypes.find(v => v.value === user.vehicleType)?.label || user.vehicleType || 'Not provided'}</div>
                <div><strong>Vehicle Number:</strong> {user.vehicleNumber || 'Not provided'}</div>
                <div><strong>Vehicle Model:</strong> {user.vehicleModel || 'Not provided'}</div>
                <div><strong>Vehicle Color:</strong> {user.vehicleColor || 'Not provided'}</div>
              </div>
            )}
          </Card>
        </div>

        {/* Password Section */}
        <Card style={{ padding: 24, marginTop: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#1f2937' }}>Security</h3>
          
          <button 
            type="button" 
            onClick={() => setShowPasswordFields(v => !v)} 
            style={{ 
              background: '#f0fdf4', 
              color: '#059669', 
              fontWeight: 600, 
              border: '1px solid #059669', 
              borderRadius: 6, 
              padding: '8px 16px', 
              cursor: 'pointer', 
              width: 'fit-content' 
            }}
            disabled={loading}
          >
            {showPasswordFields ? 'Cancel Password Change' : 'Change Password'}
          </button>

          {showPasswordFields && (
            <div style={{ 
              marginTop: 16, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 14, 
              background: '#f8fafc', 
              borderRadius: 10, 
              padding: '16px 20px', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)' 
            }}>
              <label>
                <strong>Current Password:</strong>
                <input
                  type="password"
                  name="current"
                  value={passwords.current}
                  onChange={handlePasswordChange}
                  style={{ marginLeft: 8, padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, width: '100%' }}
                  disabled={passwordLoading}
                />
              </label>
              <label>
                <strong>New Password:</strong>
                <input
                  type="password"
                  name="new"
                  value={passwords.new}
                  onChange={handlePasswordChange}
                  style={{ marginLeft: 8, padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, width: '100%' }}
                  disabled={passwordLoading}
                />
              </label>
              <label>
                <strong>Confirm New Password:</strong>
                <input
                  type="password"
                  name="confirm"
                  value={passwords.confirm}
                  onChange={handlePasswordChange}
                  style={{ marginLeft: 8, padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, width: '100%' }}
                  disabled={passwordLoading}
                />
              </label>
              {passwordMsg && (
                <div style={{ 
                  color: passwordMsg.includes('success') ? '#059669' : '#dc2626', 
                  marginTop: 8, 
                  fontWeight: 600 
                }}>
                  {passwordMsg}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'center' }}>
          {editMode ? (
            <>
              <button 
                type="button"
                onClick={handleSave}
                style={{ 
                  background: loading ? '#9ca3af' : '#059669', 
                  color: '#fff', 
                  fontWeight: 600, 
                  border: 'none', 
                  borderRadius: 6, 
                  padding: '12px 24px', 
                  cursor: loading ? 'not-allowed' : 'pointer' 
                }}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                type="button" 
                onClick={handleCancel} 
                style={{ 
                  background: '#f3f4f6', 
                  color: '#374151', 
                  fontWeight: 600, 
                  border: 'none', 
                  borderRadius: 6, 
                  padding: '12px 24px', 
                  cursor: 'pointer' 
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </>
          ) : (
            <button 
              onClick={() => setEditMode(true)} 
              style={{ 
                background: '#059669', 
                color: '#fff', 
                fontWeight: 600, 
                border: 'none', 
                borderRadius: 6, 
                padding: '12px 24px', 
                cursor: 'pointer' 
              }}
            >
              Edit Profile
            </button>
          )}
        </div>

        {message && (
          <div style={{ 
            color: message.includes('success') ? '#059669' : '#dc2626', 
            marginTop: 16, 
            fontWeight: 600,
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverProfile;
