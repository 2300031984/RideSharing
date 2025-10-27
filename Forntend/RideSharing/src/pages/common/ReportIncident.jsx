import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Toast from '../../components/Toast';
import EmergencyService from '../../services/EmergencyService';

const ReportIncident = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  
  const [formData, setFormData] = useState({
    incidentType: '',
    description: '',
    location: '',
    date: '',
    time: '',
    driverName: '',
    vehicleNumber: '',
    rideId: '',
    severity: 'medium',
    contactNumber: user.phone || '',
    email: user.email || ''
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const incidentTypes = [
    { value: 'safety', label: 'Safety Concern', description: 'Driver behavior, vehicle condition, etc.' },
    { value: 'harassment', label: 'Harassment', description: 'Verbal, physical, or sexual harassment' },
    { value: 'theft', label: 'Theft/Lost Items', description: 'Missing belongings or theft' },
    { value: 'accident', label: 'Accident', description: 'Vehicle accident or collision' },
    { value: 'fraud', label: 'Fraud/Scam', description: 'Payment fraud or driver scam' },
    { value: 'discrimination', label: 'Discrimination', description: 'Based on race, gender, religion, etc.' },
    { value: 'other', label: 'Other', description: 'Any other incident not listed above' }
  ];

  const severityLevels = [
    { value: 'low', label: 'Low', description: 'Minor inconvenience' },
    { value: 'medium', label: 'Medium', description: 'Moderate concern' },
    { value: 'high', label: 'High', description: 'Serious issue' },
    { value: 'critical', label: 'Critical', description: 'Emergency situation' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const incidentData = {
        incidentType: formData.incidentType,
        severity: formData.severity,
        description: formData.description,
        location: formData.location,
        latitude: location?.latitude,
        longitude: location?.longitude,
        incidentDate: formData.date && formData.time ? 
          new Date(`${formData.date}T${formData.time}`).toISOString() : 
          new Date().toISOString(),
        driverName: formData.driverName,
        vehicleNumber: formData.vehicleNumber,
        rideId: formData.rideId ? parseInt(formData.rideId) : null,
        contactNumber: formData.contactNumber,
        contactEmail: formData.email
      };

      const response = await EmergencyService.reportIncident(user.id, incidentData);
      
      if (response.success) {
        setToast({ 
          message: 'Incident report submitted successfully. We will investigate and get back to you within 24 hours.', 
          type: 'success' 
        });
        
        // Reset form
        setFormData({
          incidentType: '',
          description: '',
          location: '',
          date: '',
          time: '',
          driverName: '',
          vehicleNumber: '',
          rideId: '',
          severity: 'medium',
          contactNumber: user.phone || '',
          email: user.email || ''
        });
        
        // Redirect after 3 seconds
        setTimeout(() => {
          navigate('/emergency');
        }, 3000);
      } else {
        setToast({ message: response.message || 'Failed to submit report. Please try again.', type: 'error' });
      }
      
    } catch (error) {
      setToast({ message: 'Failed to submit report. Please try again.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].substring(0, 5);
    return { date, time };
  };

  const handleSetCurrentDateTime = () => {
    const { date, time } = getCurrentDateTime();
    setFormData(prev => ({
      ...prev,
      date,
      time
    }));
  };

  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      const location = await EmergencyService.getCurrentLocation();
      setLocation(location);
      setFormData(prev => ({
        ...prev,
        location: `Lat: ${location.latitude.toFixed(6)}, Lng: ${location.longitude.toFixed(6)}`
      }));
      setToast({ message: 'Location captured successfully', type: 'success' });
    } catch (error) {
      setToast({ message: 'Unable to get your location. Please enter manually.', type: 'error' });
    } finally {
      setLoadingLocation(false);
    }
  };

  useEffect(() => {
    // Set current date and time by default
    const { date, time } = getCurrentDateTime();
    setFormData(prev => ({
      ...prev,
      date,
      time
    }));
  }, []);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <h1 style={{ marginBottom: 24, fontSize: 28, fontWeight: 700, color: '#dc2626' }}>
        Report an Incident
      </h1>

      <Card>
        <form onSubmit={handleSubmit}>
          {/* Incident Type */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 16 }}>
              Type of Incident *
            </label>
            <div style={{ display: 'grid', gap: 12 }}>
              {incidentTypes.map(type => (
                <label
                  key={type.value}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: 12,
                    border: formData.incidentType === type.value ? '2px solid #2563eb' : '1px solid #e5e7eb',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: formData.incidentType === type.value ? '#f0f9ff' : '#fff'
                  }}
                >
                  <input
                    type="radio"
                    name="incidentType"
                    value={type.value}
                    checked={formData.incidentType === type.value}
                    onChange={(e) => handleInputChange('incidentType', e.target.value)}
                    style={{ marginTop: 2 }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{type.label}</div>
                    <div style={{ fontSize: 14, color: '#6b7280' }}>{type.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Severity Level */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 16 }}>
              Severity Level *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              {severityLevels.map(level => (
                <label
                  key={level.value}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 12,
                    border: formData.severity === level.value ? '2px solid #2563eb' : '1px solid #e5e7eb',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: formData.severity === level.value ? '#f0f9ff' : '#fff',
                    textAlign: 'center'
                  }}
                >
                  <input
                    type="radio"
                    name="severity"
                    value={level.value}
                    checked={formData.severity === level.value}
                    onChange={(e) => handleInputChange('severity', e.target.value)}
                    style={{ marginBottom: 8 }}
                  />
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{level.label}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{level.description}</div>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 16 }}>
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Please provide a detailed description of what happened..."
              rows={6}
              style={{
                width: '100%',
                padding: 12,
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                resize: 'vertical'
              }}
              required
            />
          </div>

          {/* Date and Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 16 }}>
                Date of Incident *
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  style={{
                    flex: 1,
                    padding: 8,
                    border: '1px solid #d1d5db',
                    borderRadius: 6
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={handleSetCurrentDateTime}
                  style={{
                    padding: '8px 12px',
                    background: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12
                  }}
                >
                  Now
                </button>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 16 }}>
                Time of Incident *
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #d1d5db',
                  borderRadius: 6
                }}
                required
              />
            </div>
          </div>

          {/* Location */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 16 }}>
              Location *
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Where did the incident occur?"
                style={{
                  flex: 1,
                  padding: 12,
                  border: '1px solid #d1d5db',
                  borderRadius: 8
                }}
                required
              />
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={loadingLocation}
                style={{
                  padding: '12px 16px',
                  background: loadingLocation ? '#9ca3af' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: loadingLocation ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}
              >
                {loadingLocation ? '⏳' : '📍'} Get Location
              </button>
            </div>
            {location && (
              <div style={{ marginTop: 8, padding: 8, background: '#f0f9ff', borderRadius: 6, fontSize: 12, color: '#1e40af' }}>
                ✅ Location captured: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                {location.accuracy && ` (Accuracy: ±${Math.round(location.accuracy)}m)`}
              </div>
            )}
          </div>

          {/* Driver and Vehicle Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 16 }}>
                Driver Name
              </label>
              <input
                type="text"
                value={formData.driverName}
                onChange={(e) => handleInputChange('driverName', e.target.value)}
                placeholder="Driver's name (if known)"
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #d1d5db',
                  borderRadius: 6
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 16 }}>
                Vehicle Number
              </label>
              <input
                type="text"
                value={formData.vehicleNumber}
                onChange={(e) => handleInputChange('vehicleNumber', e.target.value)}
                placeholder="Vehicle number (if known)"
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #d1d5db',
                  borderRadius: 6
                }}
              />
            </div>
          </div>

          {/* Ride ID */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 16 }}>
              Ride ID
            </label>
            <input
              type="text"
              value={formData.rideId}
              onChange={(e) => handleInputChange('rideId', e.target.value)}
              placeholder="Ride ID (if available)"
              style={{
                width: '100%',
                padding: 8,
                border: '1px solid #d1d5db',
                borderRadius: 6
              }}
            />
          </div>

          {/* Contact Information */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 16 }}>
                Contact Number *
              </label>
              <input
                type="tel"
                value={formData.contactNumber}
                onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #d1d5db',
                  borderRadius: 6
                }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 16 }}>
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #d1d5db',
                  borderRadius: 6
                }}
                required
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                padding: '12px 24px',
                background: 'none',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.incidentType || !formData.description}
              style={{
                padding: '12px 24px',
                background: submitting ? '#9ca3af' : '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: 600
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </Card>

      {/* Important Notice */}
      <Card style={{ marginTop: 24, background: '#fef2f2', border: '1px solid #fecaca' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ fontSize: 20 }}>⚠️</div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8, color: '#dc2626' }}>
              Important Notice
            </div>
            <div style={{ fontSize: 14, color: '#7f1d1d', lineHeight: 1.5 }}>
              • All reports are taken seriously and will be investigated promptly<br/>
              • False reports may result in account suspension<br/>
              • For immediate emergencies, please contact local authorities<br/>
              • We will contact you within 24 hours regarding your report
            </div>
          </div>
        </div>
      </Card>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </div>
  );
};

export default ReportIncident;
