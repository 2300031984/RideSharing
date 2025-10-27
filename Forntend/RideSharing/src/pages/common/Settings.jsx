import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Toast from '../../components/Toast';

const API = (import.meta.env?.VITE_API_URL || 'http://localhost:8081');

const Settings = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const token = user?.token;
  
  const [settings, setSettings] = useState({
    notifications: {
      rideUpdates: true,
      promotions: false,
      safety: true,
      payment: true
    },
    privacy: {
      shareLocation: true,
      showPhoneNumber: false,
      showEmail: false
    },
    preferences: {
      language: 'en',
      currency: 'INR',
      theme: 'light',
      autoAcceptRides: false
    },
    emergency: {
      emergencyContact: '',
      autoShareLocation: true,
      sosEnabled: true
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Mock loading settings - in real app, fetch from API
      setLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Mock saving settings - in real app, save to API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setToast({ message: 'Settings saved successfully', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to save settings', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };

  const handlePrivacyChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value
      }
    }));
  };

  const handlePreferenceChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }));
  };

  const handleEmergencyChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      emergency: {
        ...prev.emergency,
        [key]: value
      }
    }));
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <h1 style={{ marginBottom: 24, fontSize: 28, fontWeight: 700 }}>Settings</h1>
      
      {/* Notifications */}
      <Card title="Notifications" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Ride Updates</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>Get notified about ride status changes</div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: 50, height: 24 }}>
              <input
                type="checkbox"
                checked={settings.notifications.rideUpdates}
                onChange={(e) => handleNotificationChange('rideUpdates', e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: settings.notifications.rideUpdates ? '#2563eb' : '#ccc',
                borderRadius: 24,
                transition: '0.4s'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '""',
                  height: 18,
                  width: 18,
                  left: 3,
                  bottom: 3,
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: '0.4s',
                  transform: settings.notifications.rideUpdates ? 'translateX(26px)' : 'translateX(0)'
                }} />
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Promotions</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>Receive promotional offers and discounts</div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: 50, height: 24 }}>
              <input
                type="checkbox"
                checked={settings.notifications.promotions}
                onChange={(e) => handleNotificationChange('promotions', e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: settings.notifications.promotions ? '#2563eb' : '#ccc',
                borderRadius: 24,
                transition: '0.4s'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '""',
                  height: 18,
                  width: 18,
                  left: 3,
                  bottom: 3,
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: '0.4s',
                  transform: settings.notifications.promotions ? 'translateX(26px)' : 'translateX(0)'
                }} />
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Safety Alerts</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>Important safety notifications</div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: 50, height: 24 }}>
              <input
                type="checkbox"
                checked={settings.notifications.safety}
                onChange={(e) => handleNotificationChange('safety', e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: settings.notifications.safety ? '#2563eb' : '#ccc',
                borderRadius: 24,
                transition: '0.4s'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '""',
                  height: 18,
                  width: 18,
                  left: 3,
                  bottom: 3,
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: '0.4s',
                  transform: settings.notifications.safety ? 'translateX(26px)' : 'translateX(0)'
                }} />
              </span>
            </label>
          </div>
        </div>
      </Card>

      {/* Privacy */}
      <Card title="Privacy" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Share Location</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>Allow drivers to see your location during rides</div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: 50, height: 24 }}>
              <input
                type="checkbox"
                checked={settings.privacy.shareLocation}
                onChange={(e) => handlePrivacyChange('shareLocation', e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: settings.privacy.shareLocation ? '#2563eb' : '#ccc',
                borderRadius: 24,
                transition: '0.4s'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '""',
                  height: 18,
                  width: 18,
                  left: 3,
                  bottom: 3,
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: '0.4s',
                  transform: settings.privacy.shareLocation ? 'translateX(26px)' : 'translateX(0)'
                }} />
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Show Phone Number</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>Display your phone number to drivers</div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: 50, height: 24 }}>
              <input
                type="checkbox"
                checked={settings.privacy.showPhoneNumber}
                onChange={(e) => handlePrivacyChange('showPhoneNumber', e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: settings.privacy.showPhoneNumber ? '#2563eb' : '#ccc',
                borderRadius: 24,
                transition: '0.4s'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '""',
                  height: 18,
                  width: 18,
                  left: 3,
                  bottom: 3,
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: '0.4s',
                  transform: settings.privacy.showPhoneNumber ? 'translateX(26px)' : 'translateX(0)'
                }} />
              </span>
            </label>
          </div>
        </div>
      </Card>

      {/* Preferences */}
      <Card title="Preferences" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Language</label>
            <select
              value={settings.preferences.language}
              onChange={(e) => handlePreferenceChange('language', e.target.value)}
              style={{
                width: '100%',
                padding: 8,
                border: '1px solid #d1d5db',
                borderRadius: 6
              }}
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="ta">Tamil</option>
              <option value="te">Telugu</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Currency</label>
            <select
              value={settings.preferences.currency}
              onChange={(e) => handlePreferenceChange('currency', e.target.value)}
              style={{
                width: '100%',
                padding: 8,
                border: '1px solid #d1d5db',
                borderRadius: 6
              }}
            >
              <option value="INR">Indian Rupee (₹)</option>
              <option value="USD">US Dollar ($)</option>
              <option value="EUR">Euro (€)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Auto Accept Rides</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>Automatically accept ride requests (Drivers only)</div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: 50, height: 24 }}>
              <input
                type="checkbox"
                checked={settings.preferences.autoAcceptRides}
                onChange={(e) => handlePreferenceChange('autoAcceptRides', e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: settings.preferences.autoAcceptRides ? '#2563eb' : '#ccc',
                borderRadius: 24,
                transition: '0.4s'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '""',
                  height: 18,
                  width: 18,
                  left: 3,
                  bottom: 3,
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: '0.4s',
                  transform: settings.preferences.autoAcceptRides ? 'translateX(26px)' : 'translateX(0)'
                }} />
              </span>
            </label>
          </div>
        </div>
      </Card>

      {/* Emergency Settings */}
      <Card title="Emergency & Safety" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Emergency Contact</label>
            <input
              type="tel"
              value={settings.emergency.emergencyContact}
              onChange={(e) => handleEmergencyChange('emergencyContact', e.target.value)}
              placeholder="Enter emergency contact number"
              style={{
                width: '100%',
                padding: 8,
                border: '1px solid #d1d5db',
                borderRadius: 6
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Auto Share Location</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>Automatically share location during emergency</div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: 50, height: 24 }}>
              <input
                type="checkbox"
                checked={settings.emergency.autoShareLocation}
                onChange={(e) => handleEmergencyChange('autoShareLocation', e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: settings.emergency.autoShareLocation ? '#2563eb' : '#ccc',
                borderRadius: 24,
                transition: '0.4s'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '""',
                  height: 18,
                  width: 18,
                  left: 3,
                  bottom: 3,
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: '0.4s',
                  transform: settings.emergency.autoShareLocation ? 'translateX(26px)' : 'translateX(0)'
                }} />
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>SOS Button</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>Enable emergency SOS button in app</div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: 50, height: 24 }}>
              <input
                type="checkbox"
                checked={settings.emergency.sosEnabled}
                onChange={(e) => handleEmergencyChange('sosEnabled', e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: settings.emergency.sosEnabled ? '#dc2626' : '#ccc',
                borderRadius: 24,
                transition: '0.4s'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '""',
                  height: 18,
                  width: 18,
                  left: 3,
                  bottom: 3,
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: '0.4s',
                  transform: settings.emergency.sosEnabled ? 'translateX(26px)' : 'translateX(0)'
                }} />
              </span>
            </label>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSaveSettings}
          disabled={loading}
          style={{
            padding: '12px 24px',
            background: loading ? '#9ca3af' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </div>
  );
};

export default Settings;
