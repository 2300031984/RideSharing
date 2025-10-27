import React, { useState, useRef, useEffect } from 'react';
import { updateUserProfile, changeUserPassword } from '../../services/UserService';
import Card from '../../components/ui/Card';

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=User&background=0984e3&color=fff&size=128';

const RiderProfile = () => {
  const storedUser = JSON.parse(localStorage.getItem('user'));
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    username: storedUser?.username || '',
    email: storedUser?.email || '',
    phone: storedUser?.phone || '',
    age: storedUser?.age || '',
    location: storedUser?.location || '',
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

  const handleSave = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Prepare profile data
      const profileData = {
        username: form.username,
        email: form.email,
        phoneNumber: form.phone,
        age: parseInt(form.age) || 0,
        location: form.location,
      };

      // Add avatar if changed
      if (avatarPreview && avatarPreview !== avatar) {
        profileData.avatar = avatarPreview;
      }

      // Call API to update profile
      const response = await updateUserProfile(user.id, profileData);

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
          username: updatedUser.username || '',
          email: updatedUser.email || '',
          phone: updatedUser.phoneNumber || updatedUser.phone || '',
          age: updatedUser.age || '',
          location: updatedUser.location || ''
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
      username: user.username, 
      email: user.email, 
      phone: user.phone || '',
      age: user.age || '',
      location: user.location || ''
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
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: '#1f2937' }}>Rider Profile</h1>
          <p style={{ color: '#6b7280', fontSize: 16 }}>Manage your rider account information and preferences</p>
        </div>

        <Card style={{ padding: 24 }}>
          {user ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24 }}>
                <img
                  src={editMode ? (avatarPreview || DEFAULT_AVATAR) : (avatar || DEFAULT_AVATAR)}
                  alt="Avatar"
                  style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid #2563eb', background: '#f0f9ff' }}
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
                        background: '#f0f9ff', 
                        color: '#2563eb', 
                        fontWeight: 600, 
                        border: '1px solid #2563eb', 
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
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <label>
                      <strong>Name:</strong>
                      <input
                        type="text"
                        name="username"
                        value={form.username}
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
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
                      <strong>Age:</strong>
                      <input
                        type="number"
                        name="age"
                        value={form.age}
                        onChange={handleChange}
                        min="18"
                        max="100"
                        style={{ marginLeft: 8, padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, width: '100%' }}
                        disabled={loading}
                      />
                    </label>
                  </div>

                  <label>
                    <strong>Location:</strong>
                    <input
                      type="text"
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      placeholder="City, State"
                      style={{ marginLeft: 8, padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, width: '100%' }}
                      disabled={loading}
                    />
                  </label>

                  <button 
                    type="button" 
                    onClick={() => setShowPasswordFields(v => !v)} 
                    style={{ 
                      background: '#f0f9ff', 
                      color: '#2563eb', 
                      fontWeight: 600, 
                      border: '1px solid #2563eb', 
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
                      marginTop: 8, 
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

                  <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <button 
                      type="submit" 
                      style={{ 
                        background: loading ? '#9ca3af' : '#2563eb', 
                        color: '#fff', 
                        fontWeight: 600, 
                        border: 'none', 
                        borderRadius: 6, 
                        padding: '10px 20px', 
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
                        padding: '10px 20px', 
                        cursor: 'pointer' 
                      }}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div><strong>Name:</strong> {user.username}</div>
                    <div><strong>Email:</strong> {user.email}</div>
                    <div><strong>Phone:</strong> {user.phone || 'Not provided'}</div>
                    <div><strong>Age:</strong> {user.age || 'Not provided'}</div>
                    <div><strong>Location:</strong> {user.location || 'Not provided'}</div>
                    <div><strong>Role:</strong> {user.role}</div>
                  </div>
                  <button 
                    onClick={() => setEditMode(true)} 
                    style={{ 
                      background: '#2563eb', 
                      color: '#fff', 
                      fontWeight: 600, 
                      border: 'none', 
                      borderRadius: 6, 
                      padding: '10px 20px', 
                      cursor: 'pointer' 
                    }}
                  >
                    Edit Profile
                  </button>
                </>
              )}
              {message && (
                <div style={{ 
                  color: message.includes('success') ? '#059669' : '#dc2626', 
                  marginTop: 14, 
                  fontWeight: 600 
                }}>
                  {message}
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: '#dc2626' }}>You are not logged in.</div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default RiderProfile;
