import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Toast from '../../components/Toast';
import EmergencyContactManager from '../../components/EmergencyContactManager';
import LocationSharing from '../../components/LocationSharing';
import EmergencyService from '../../services/EmergencyService';

const Emergency = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [personalContacts, setPersonalContacts] = useState([]);
  const [currentRide, setCurrentRide] = useState(null);
  const [location, setLocation] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [sosActive, setSosActive] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(0);
  const [showContactManager, setShowContactManager] = useState(false);
  const [showLocationSharing, setShowLocationSharing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeEmergency();
  }, []);

  const initializeEmergency = async () => {
    try {
      setLoading(true);
      
      // Get current location
      try {
        const location = await EmergencyService.getCurrentLocation();
        setLocation(location);
      } catch (error) {
        console.error('Error getting location:', error);
      }

      // Load emergency contacts
      await loadEmergencyContacts();

      // Check for active ride
      checkActiveRide();
    } catch (error) {
      console.error('Error initializing emergency:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmergencyContacts = async () => {
    try {
      const response = await EmergencyService.getEmergencyContacts(user.id);
      if (response.success) {
        const contacts = response.contacts || [];
        // System emergency services (userId = 0) and user emergency services
        setEmergencyContacts(contacts.filter(c => c.isEmergencyService));
        // Personal contacts (user's own contacts)
        setPersonalContacts(contacts.filter(c => !c.isEmergencyService && c.userId === user.id));
      }
    } catch (error) {
      console.error('Error loading emergency contacts:', error);
      // No fallback emergency services - let users add their own
      setEmergencyContacts([]);
    }
  };

  useEffect(() => {
    let interval;
    if (sosActive && sosCountdown > 0) {
      interval = setInterval(() => {
        setSosCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sosActive, sosCountdown]);

  const checkActiveRide = () => {
    // Mock checking for active ride
    const activeRide = JSON.parse(localStorage.getItem('activeRide'));
    if (activeRide) {
      setCurrentRide(activeRide);
    }
  };

  const handleEmergencyCall = (contact) => {
    if (contact.type === 'emergency') {
      // For emergency numbers, try to call directly
      window.open(`tel:${contact.number}`, '_self');
    } else {
      // For personal contacts, show confirmation
      if (window.confirm(`Call ${contact.name} at ${contact.number}?`)) {
        window.open(`tel:${contact.number}`, '_self');
      }
    }
  };

  const handleSOS = async () => {
    if (sosActive) {
      setSosActive(false);
      setSosCountdown(0);
      setToast({ message: 'SOS deactivated', type: 'info' });
      return;
    }

    if (window.confirm('Are you sure you want to activate SOS? This will alert emergency contacts and authorities.')) {
      try {
        const sosData = {
          latitude: location?.latitude,
          longitude: location?.longitude,
          message: 'SOS ALERT: User needs immediate help!'
        };

        const response = await EmergencyService.triggerSOS(user.id, sosData);
        
        if (response.success) {
          setSosActive(true);
          setSosCountdown(300); // 5 minutes
          setToast({ 
            message: `SOS activated! ${response.contactsNotified} contacts have been notified.`, 
            type: 'error' 
          });
          
          // Automatically call police station
          setTimeout(() => {
            callNearbyPoliceStation();
          }, 2000); // Call after 2 seconds
          
          // Auto-deactivate after 5 minutes
          setTimeout(() => {
            setSosActive(false);
            setSosCountdown(0);
            setToast({ message: 'SOS auto-deactivated', type: 'info' });
          }, 300000);
        } else {
          setToast({ message: response.message || 'Failed to activate SOS', type: 'error' });
        }
      } catch (error) {
        setToast({ message: 'Error activating SOS', type: 'error' });
      }
    }
  };

  const callNearbyPoliceStation = () => {
    try {
      // Find police contact from emergency services
      const policeContact = emergencyContacts.find(contact => 
        contact.contactName && contact.contactName.toLowerCase().includes('police')
      );
      
      if (policeContact && policeContact.contactNumber) {
        // Attempt to make the call
        window.open(`tel:${policeContact.contactNumber}`, '_self');
        setToast({ 
          message: `Calling police station: ${policeContact.contactNumber}`, 
          type: 'error' 
        });
      } else {
        // Fallback to emergency number 100
        window.open('tel:100', '_self');
        setToast({ 
          message: 'Calling emergency police number: 100', 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('Error calling police station:', error);
      setToast({ 
        message: 'Failed to initiate call. Please call 100 manually.', 
        type: 'error' 
      });
    }
  };

  const handleShareLocation = () => {
    setShowLocationSharing(true);
  };

  const handleReportIncident = () => {
    navigate('/report-incident');
  };

  const handleAddContact = () => {
    setShowContactManager(true);
  };

  const handleContactManagerClose = () => {
    setShowContactManager(false);
    loadEmergencyContacts(); // Refresh contacts
  };

  const handleLocationSharingClose = () => {
    setShowLocationSharing(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#6b7280' }}>Loading Emergency Services...</div>
        </div>
      </div>
    );
  }

  if (showContactManager) {
    return <EmergencyContactManager userId={user.id} onClose={handleContactManagerClose} />;
  }

  if (showLocationSharing) {
    return <LocationSharing userId={user.id} onClose={handleLocationSharingClose} />;
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, color: '#dc2626' }}>
            Emergency & Safety 🚨
          </h1>
          <p style={{ fontSize: 16, color: '#6b7280' }}>
            Quick access to emergency services and safety features
          </p>
        </div>

        {/* Compact SOS Button */}
        <div style={{ 
          marginBottom: 24, 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          gap: 16
        }}>
          <button
            onClick={handleSOS}
            style={{
              padding: '12px 24px',
              background: sosActive ? '#dc2626' : '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 16,
              boxShadow: sosActive ? '0 0 20px rgba(220, 38, 38, 0.5)' : '0 4px 12px rgba(0,0,0,0.1)',
              animation: sosActive ? 'pulse 1s infinite' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              minWidth: 160
            }}
          >
            <span style={{ fontSize: 20 }}>
              {sosActive ? '🚨' : '🆘'}
            </span>
            {sosActive ? 'DEACTIVATE SOS' : 'ACTIVATE SOS'}
          </button>
          
          {sosActive && (
            <div style={{ 
              fontSize: 14, 
              fontWeight: 600, 
              color: '#dc2626',
              background: '#fef2f2',
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #fecaca'
            }}>
              Auto-deactivate in: {formatTime(sosCountdown)}
            </div>
          )}
        </div>

        {/* Emergency Services */}
        {emergencyContacts.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: '#1f2937' }}>
              Emergency Services
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {emergencyContacts.map((contact) => (
                <Card
                  key={contact.id}
                  style={{ padding: 12, cursor: 'pointer' }}
                  onClick={() => handleEmergencyCall(contact)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ fontSize: 20 }}>
                      {contact.contactName === 'Police' ? '🚔' :
                       contact.contactName === 'Ambulance' ? '🚑' :
                       contact.contactName === 'Fire Service' ? '🚒' :
                       contact.contactName === 'Women Helpline' ? '👩' :
                       contact.contactName === 'Child Helpline' ? '👶' : '🚨'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#dc2626' }}>
                        {contact.contactName}
                      </div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>
                        {contact.contactNumber}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
         <div style={{ marginBottom: 24 }}>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
             <Card style={{ padding: 16, textAlign: 'center', cursor: 'pointer' }} onClick={handleShareLocation}>
               <div style={{ fontSize: 24, marginBottom: 8 }}>📍</div>
               <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Share Location</h3>
               <p style={{ fontSize: 11, color: '#6b7280' }}>Share location via WhatsApp</p>
             </Card>
             
             <Card style={{ padding: 16, textAlign: 'center', cursor: 'pointer' }} onClick={handleReportIncident}>
               <div style={{ fontSize: 24, marginBottom: 8 }}>📝</div>
               <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Report Incident</h3>
               <p style={{ fontSize: 11, color: '#6b7280' }}>Report safety incidents</p>
             </Card>
             
             <Card style={{ padding: 16, textAlign: 'center', cursor: 'pointer' }} onClick={handleAddContact}>
               <div style={{ fontSize: 24, marginBottom: 8 }}>➕</div>
               <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Manage Contacts</h3>
               <p style={{ fontSize: 11, color: '#6b7280' }}>Add emergency contacts</p>
             </Card>
           </div>
         </div>

        {/* Personal Emergency Contacts */}
        {personalContacts.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: '#1f2937' }}>
              Your Emergency Contacts
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {personalContacts.map((contact) => (
                <Card
                  key={contact.id}
                  style={{ padding: 12, cursor: 'pointer' }}
                  onClick={() => handleEmergencyCall(contact)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ fontSize: 20 }}>👤</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#2563eb' }}>
                        {contact.contactName || contact.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>
                        {contact.contactNumber || contact.number}
                      </div>
                      {contact.relationship && (
                        <div style={{ fontSize: 10, color: '#9ca3af' }}>
                          {contact.relationship}
                        </div>
                      )}
                    </div>
                    {contact.isPrimary && (
                      <Badge variant="yellow" style={{ fontSize: 8, padding: '2px 4px' }}>PRIMARY</Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Sections in Grid Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

          {/* Current Ride Info */}
          {currentRide && (
            <Card style={{ padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ fontSize: 20 }}>🚗</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1f2937' }}>Ride #{currentRide.id}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>
                    {currentRide.pickup} → {currentRide.dropoff}
                  </div>
                  <div style={{ fontSize: 10, color: '#6b7280' }}>
                    {currentRide.passenger} • {currentRide.distance}
                  </div>
                </div>
                <Badge variant="blue" style={{ fontSize: 10, padding: '2px 6px' }}>Active</Badge>
              </div>
            </Card>
          )}

          {/* Location Status */}
          <Card style={{ padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ fontSize: 20 }}>📍</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#1f2937' }}>
                  {location ? 'Location Available' : 'Location Not Available'}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>
                  {location 
                    ? `Lat: ${location.latitude.toFixed(2)}, Lng: ${location.longitude.toFixed(2)}`
                    : 'Enable location services'
                  }
                </div>
              </div>
              <Badge variant={location ? 'green' : 'red'} style={{ fontSize: 10, padding: '2px 6px' }}>
                {location ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </Card>
        </div>
      </div>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
      
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
        `}
      </style>
    </div>
  );
};

export default Emergency;