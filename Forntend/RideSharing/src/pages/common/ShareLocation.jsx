import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Toast from '../../components/Toast';
import EmergencyService from '../../services/EmergencyService';

const ShareLocation = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [shareData, setShareData] = useState({
    message: '',
    shareMethod: 'whatsapp',
    contactNumbers: [],
    contactEmails: []
  });
  const [emergencyContacts, setEmergencyContacts] = useState([]);

  useEffect(() => {
    getCurrentLocation();
    loadEmergencyContacts();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const location = await EmergencyService.getCurrentLocation();
      setLocation(location);
    } catch (error) {
      setToast({ 
        message: 'Unable to get your location. Please enable location services.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEmergencyContacts = async () => {
    try {
      const response = await EmergencyService.getEmergencyContacts(user.id);
      if (response.success) {
        setEmergencyContacts(response.contacts || []);
      }
    } catch (error) {
      console.error('Error loading emergency contacts:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setShareData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContactToggle = (contactNumber, isSelected) => {
    if (isSelected) {
      setShareData(prev => ({
        ...prev,
        contactNumbers: [...prev.contactNumbers, contactNumber]
      }));
    } else {
      setShareData(prev => ({
        ...prev,
        contactNumbers: prev.contactNumbers.filter(num => num !== contactNumber)
      }));
    }
  };

  const handleEmailToggle = (email, isSelected) => {
    if (isSelected) {
      setShareData(prev => ({
        ...prev,
        contactEmails: [...prev.contactEmails, email]
      }));
    } else {
      setShareData(prev => ({
        ...prev,
        contactEmails: prev.contactEmails.filter(e => e !== email)
      }));
    }
  };

  const handleShare = async () => {
    if (!location) {
      setToast({ message: 'Location not available', type: 'error' });
      return;
    }

    try {
      const locationData = {
        latitude: location.latitude,
        longitude: location.longitude,
        message: shareData.message || 'Emergency: I need help! My location is shared below.',
        shareMethod: shareData.shareMethod,
        contactNumbers: shareData.contactNumbers,
        contactEmails: shareData.contactEmails
      };

      const response = await EmergencyService.shareLocation(user.id, locationData);
      
      if (response.success) {
        // Open the appropriate sharing method
        if (response.shareUrls) {
          const shareUrl = response.shareUrls[shareData.shareMethod];
          if (shareUrl) {
            window.open(shareUrl, '_blank');
            setToast({ message: 'Location shared successfully!', type: 'success' });
          }
        }
      } else {
        setToast({ message: response.message || 'Failed to share location', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Error sharing location', type: 'error' });
    }
  };

  const handleQuickShare = (method) => {
    if (!location) {
      setToast({ message: 'Location not available', type: 'error' });
      return;
    }

    const message = shareData.message || 'Emergency: I need help! My location is shared below.';
    const mapsUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    const fullMessage = `${message}\n\nLocation: ${mapsUrl}`;

    let shareUrl;
    switch (method) {
      case 'whatsapp':
        shareUrl = EmergencyService.generateWhatsAppUrl(fullMessage);
        break;
      case 'sms':
        if (shareData.contactNumbers.length > 0) {
          shareUrl = EmergencyService.generateSMSUrl(shareData.contactNumbers[0], fullMessage);
        } else {
          setToast({ message: 'Please select a contact for SMS', type: 'error' });
          return;
        }
        break;
      case 'email':
        if (shareData.contactEmails.length > 0) {
          shareUrl = EmergencyService.generateEmailUrl(
            shareData.contactEmails[0], 
            'Emergency Location Share', 
            fullMessage
          );
        } else {
          setToast({ message: 'Please select a contact for email', type: 'error' });
          return;
        }
        break;
      default:
        return;
    }

    window.open(shareUrl, method === 'whatsapp' ? '_blank' : '_self');
    setToast({ message: `Location shared via ${method.toUpperCase()}!`, type: 'success' });
  };

  const handleEmergencyShare = () => {
    if (!location) {
      setToast({ message: 'Location not available', type: 'error' });
      return;
    }

    // Share with all emergency contacts simultaneously
    const message = '🚨 EMERGENCY: I need immediate help! Please call me back right away.';
    const mapsUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    const fullMessage = `${message}\n\nMy current location: ${mapsUrl}\n\nTime: ${new Date().toLocaleString()}`;

    // Share via WhatsApp
    const whatsappUrl = EmergencyService.generateWhatsAppUrl(fullMessage);
    window.open(whatsappUrl, '_blank');

    // Share via SMS to all selected contacts
    emergencyContacts.forEach(contact => {
      if (contact.contactNumber) {
        const smsUrl = EmergencyService.generateSMSUrl(contact.contactNumber, fullMessage);
        setTimeout(() => window.open(smsUrl, '_self'), 1000);
      }
    });

    setToast({ message: 'Emergency location shared with all contacts!', type: 'success' });
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: '#dc2626' }}>
            📍 Share Location
          </h1>
          <p style={{ fontSize: 16, color: '#6b7280' }}>
            Share your location with emergency contacts
          </p>
        </div>
        <button
          onClick={() => navigate('/emergency')}
          style={{
            padding: '8px 16px',
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          ← Back to Emergency
        </button>
      </div>

      {/* Location Status */}
      <Card style={{ marginBottom: 24, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 24 }}>
            {loading ? '⏳' : location ? '📍' : '❌'}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
              {loading ? 'Getting Location...' : location ? 'Location Available' : 'Location Not Available'}
            </h3>
            {location && (
              <p style={{ fontSize: 14, color: '#6b7280' }}>
                Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}
                {location.accuracy && ` (Accuracy: ±${Math.round(location.accuracy)}m)`}
              </p>
            )}
          </div>
          {!location && !loading && (
            <button
              onClick={getCurrentLocation}
              style={{
                padding: '8px 16px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              Get Location
            </button>
          )}
        </div>
      </Card>

      {/* Emergency Share Button */}
      <Card style={{ marginBottom: 24, padding: 16, background: '#fef2f2', border: '2px solid #fecaca' }}>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#dc2626' }}>
            🚨 Emergency Share
          </h3>
          <p style={{ fontSize: 14, color: '#7f1d1d', marginBottom: 16 }}>
            Share location with ALL emergency contacts immediately
          </p>
          <button
            onClick={handleEmergencyShare}
            disabled={!location}
            style={{
              padding: '12px 24px',
              background: location ? '#dc2626' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: location ? 'pointer' : 'not-allowed',
              fontSize: 16,
              fontWeight: 600,
              boxShadow: location ? '0 4px 12px rgba(220, 38, 38, 0.3)' : 'none'
            }}
          >
            🚨 Share with All Contacts
          </button>
        </div>
      </Card>

      {/* Share Message */}
      <Card style={{ marginBottom: 24, padding: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
          Custom Message
        </h3>
        <textarea
          value={shareData.message}
          onChange={(e) => handleInputChange('message', e.target.value)}
          placeholder="Enter your emergency message (optional)"
          rows={3}
          style={{
            width: '100%',
            padding: 12,
            border: '1px solid #d1d5db',
            borderRadius: 8,
            fontSize: 14,
            resize: 'vertical'
          }}
        />
      </Card>

      {/* Emergency Contacts Selection */}
      {emergencyContacts.length > 0 && (
        <Card style={{ marginBottom: 24, padding: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
            Select Contacts to Share With
          </h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {emergencyContacts.map((contact) => (
              <div key={contact.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  id={`contact-${contact.id}`}
                  checked={shareData.contactNumbers.includes(contact.contactNumber)}
                  onChange={(e) => handleContactToggle(contact.contactNumber, e.target.checked)}
                />
                <label htmlFor={`contact-${contact.id}`} style={{ flex: 1, cursor: 'pointer' }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{contact.contactName}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    {contact.contactNumber}
                    {contact.contactEmail && ` • ${contact.contactEmail}`}
                  </div>
                </label>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick Share Buttons */}
      <Card style={{ marginBottom: 24, padding: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
          Quick Share
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
          <button
            onClick={() => handleQuickShare('whatsapp')}
            disabled={!location}
            style={{
              padding: '12px 16px',
              background: location ? '#25d366' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: location ? 'pointer' : 'not-allowed',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            📱 WhatsApp
          </button>
          <button
            onClick={() => handleQuickShare('sms')}
            disabled={!location || shareData.contactNumbers.length === 0}
            style={{
              padding: '12px 16px',
              background: (location && shareData.contactNumbers.length > 0) ? '#3b82f6' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: (location && shareData.contactNumbers.length > 0) ? 'pointer' : 'not-allowed',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            💬 SMS
          </button>
          <button
            onClick={() => handleQuickShare('email')}
            disabled={!location || shareData.contactEmails.length === 0}
            style={{
              padding: '12px 16px',
              background: (location && shareData.contactEmails.length > 0) ? '#dc2626' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: (location && shareData.contactEmails.length > 0) ? 'pointer' : 'not-allowed',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            ✉️ Email
          </button>
        </div>
      </Card>

      {/* Advanced Share */}
      <Card style={{ padding: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
          Advanced Share
        </h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <select
            value={shareData.shareMethod}
            onChange={(e) => handleInputChange('shareMethod', e.target.value)}
            style={{
              flex: 1,
              padding: 8,
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 14
            }}
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="sms">SMS</option>
            <option value="email">Email</option>
          </select>
          <button
            onClick={handleShare}
            disabled={!location}
            style={{
              padding: '8px 16px',
              background: location ? '#2563eb' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: location ? 'pointer' : 'not-allowed',
              fontSize: 14,
              fontWeight: 600
            }}
          >
            Share Location
          </button>
        </div>
      </Card>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </div>
  );
};

export default ShareLocation;
