import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Toast from '../../components/Toast';
import EmergencyService from '../../services/EmergencyService';
import '../../Styles/ReportIncident.css';

const ReportIncident = () => {
  const navigate = useNavigate();
  const locationState = useLocation();
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
    { value: 'safety', label: 'Safety Concern', description: 'Driver behavior, vehicle condition' },
    { value: 'harassment', label: 'Harassment', description: 'Verbal, physical, or sexual' },
    { value: 'theft', label: 'Theft/Lost Items', description: 'Missing belongings' },
    { value: 'accident', label: 'Accident', description: 'Vehicle collision or damage' },
    { value: 'fraud', label: 'Fraud/Scam', description: 'Payment or route issues' },
    { value: 'discrimination', label: 'Discrimination', description: 'Based on identity or background' },
    { value: 'other', label: 'Other', description: 'Any other concern' }
  ];

  const severityLevels = [
    { value: 'low', label: 'Low', description: 'Minor issue' },
    { value: 'medium', label: 'Medium', description: 'Moderate' },
    { value: 'high', label: 'High', description: 'Serious' },
    { value: 'critical', label: 'Critical', description: 'Emergency' }
  ];

  useEffect(() => {
    // Set Default Date/Time
    const { date, time } = getCurrentDateTime();

    // Check for prefill data from navigation
    const prefillData = locationState.state || {};

    setFormData(prev => ({
      ...prev,
      date,
      time,
      rideId: prefillData.tripId || prev.rideId
    }));
  }, [locationState.state]);

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
        incidentTime: formData.date && formData.time ?
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
          message: 'Report submitted. We will contact you shortly.',
          type: 'success'
        });

        setTimeout(() => {
          navigate('/user/history'); // Redirect back to history or dashboard
        }, 2000);
      } else {
        setToast({ message: response.message || 'Submission failed.', type: 'error' });
      }

    } catch (error) {
      setToast({ message: 'Error submitting report.', type: 'error' });
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
    setFormData(prev => ({ ...prev, date, time }));
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
      setToast({ message: 'Location captured', type: 'success' });
    } catch (error) {
      setToast({ message: 'Could not fetch location.', type: 'error' });
    } finally {
      setLoadingLocation(false);
    }
  };

  return (
    <div className="report-container">
      <h1 className="report-title">Report an Incident</h1>

      <div className="report-card">
        <form onSubmit={handleSubmit}>
          <div className="form-layout">

            {/* Left Column: Selection */}
            <div className="form-column-left">
              {/* Incident Type Grid */}
              <div className="form-section">
                <label className="form-label">Type of Incident <span className="required-mark">*</span></label>
                <div className="incident-grid">
                  {incidentTypes.map(type => (
                    <div
                      key={type.value}
                      className={`incident-option ${formData.incidentType === type.value ? 'selected' : ''}`}
                      onClick={() => handleInputChange('incidentType', type.value)}
                    >
                      <input
                        type="radio"
                        name="incidentType"
                        value={type.value}
                        checked={formData.incidentType === type.value}
                        onChange={() => { }}
                        className="incident-radio"
                      />
                      <div className="incident-content">
                        <h4>{type.label}</h4>
                        <p>{type.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Severity */}
              <div className="form-section">
                <label className="form-label">Severity Level <span className="required-mark">*</span></label>
                <div className="severity-grid">
                  {severityLevels.map(level => (
                    <div
                      key={level.value}
                      className={`severity-option ${formData.severity === level.value ? 'selected' : ''}`}
                      onClick={() => handleInputChange('severity', level.value)}
                    >
                      <span className="severity-label">{level.label}</span>
                      <span className="severity-desc">{level.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Details */}
            <div className="form-column-right">
              {/* Description */}
              <div className="form-section">
                <label className="form-label">Description <span className="required-mark">*</span></label>
                <textarea
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Please describe what happened in detail..."
                  required
                />
              </div>

              {/* Date & Time */}
              <div className="input-group-row">
                <div>
                  <label className="form-label">Date <span className="required-mark">*</span></label>
                  <div className="input-with-action">
                    <input
                      type="date"
                      className="form-input"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Time <span className="required-mark">*</span></label>
                  <div className="input-with-action">
                    <input
                      type="time"
                      className="form-input"
                      value={formData.time}
                      onChange={(e) => handleInputChange('time', e.target.value)}
                      required
                    />
                    <button type="button" className="action-btn secondary" onClick={handleSetCurrentDateTime}>
                      Now
                    </button>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="form-section">
                <label className="form-label">Location <span className="required-mark">*</span></label>
                <div className="input-with-action">
                  <input
                    type="text"
                    className="form-input"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Enter location or use GPS"
                    required
                  />
                  <button
                    type="button"
                    className="action-btn"
                    onClick={getCurrentLocation}
                    disabled={loadingLocation}
                  >
                    {loadingLocation ? '...' : '📍 GPS'}
                  </button>
                </div>
                {location && (
                  <div className="location-status">
                    ✅ GPS: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </div>
                )}
              </div>

              {/* Details Row */}
              <div className="input-group-row">
                <div>
                  <label className="form-label">Driver Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.driverName}
                    onChange={(e) => handleInputChange('driverName', e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="form-label">Vehicle No.</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.vehicleNumber}
                    onChange={(e) => handleInputChange('vehicleNumber', e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Ride ID & Contact */}
              <div className="input-group-row">
                <div>
                  <label className="form-label">Ride ID</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.rideId}
                    onChange={(e) => handleInputChange('rideId', e.target.value)}
                    placeholder="Trip ID"
                    readOnly={!!locationState.state?.tripId}
                  />
                </div>
                <div>
                  <label className="form-label">Contact <span className="required-mark">*</span></label>
                  <input
                    type="tel"
                    className="form-input"
                    value={formData.contactNumber}
                    onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => navigate(-1)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </div>
  );
};

export default ReportIncident;
