import React, { useState, useEffect, useRef } from 'react';
import UserNavbar from '../../components/UserNavbar';
import Toast from '../../components/Toast';

const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8081';
const GOOGLE_KEY = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY;

const SavedPlaces = () => {
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const token = user?.token;
  
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlace, setEditingPlace] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: null,
    longitude: null,
    type: 'other'
  });
  
  const addressInputRef = useRef(null);
  const mapsLoadedRef = useRef(false);
  const autocompleteRef = useRef(null);

  const placeTypes = [
    { id: 'home', name: 'Home', icon: '🏠', color: '#10b981' },
    { id: 'work', name: 'Work', icon: '🏢', color: '#3b82f6' },
    { id: 'gym', name: 'Gym', icon: '💪', color: '#f59e0b' },
    { id: 'restaurant', name: 'Restaurant', icon: '🍽️', color: '#ef4444' },
    { id: 'other', name: 'Other', icon: '📍', color: '#6b7280' },
  ];

  useEffect(() => {
    fetchSavedPlaces();
    loadGoogleMaps();
  }, []);

  const loadGoogleMaps = () => {
    if (!GOOGLE_KEY || mapsLoadedRef.current) return;
    const existing = document.querySelector("script[data-google='places']");
    if (existing) {
      mapsLoadedRef.current = true;
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&libraries=places&region=IN`;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-google', 'places');
    script.onload = () => { mapsLoadedRef.current = true; };
    document.head.appendChild(script);
  };

  useEffect(() => {
    if (mapsLoadedRef.current && addressInputRef.current && (showAddModal || editingPlace)) {
      initAutocomplete();
    }
  }, [showAddModal, editingPlace]);

  const initAutocomplete = () => {
    try {
      if (!window.google?.maps?.places || !addressInputRef.current) return;
      
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
      
      const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
        fields: ['formatted_address', 'geometry'],
        componentRestrictions: { country: 'in' }
      });
      
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place?.formatted_address) {
          const location = place.geometry?.location;
          setFormData(prev => ({
            ...prev,
            address: place.formatted_address,
            latitude: location ? location.lat() : null,
            longitude: location ? location.lng() : null
          }));
        }
      });
      
      autocompleteRef.current = autocomplete;
    } catch (error) {
      console.error('Autocomplete initialization failed:', error);
    }
  };

  const fetchSavedPlaces = async () => {
    if (!user.id) return;
    
    try {
      const response = await fetch(`${API_URL}/api/saved-places/${user.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        setSavedPlaces(data);
      }
    } catch (error) {
      console.error('Error fetching saved places:', error);
      setToast({ message: 'Failed to load saved places', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlace = () => {
    setEditingPlace(null);
    setFormData({
      name: '',
      address: '',
      latitude: null,
      longitude: null,
      type: 'other'
    });
    setShowAddModal(true);
  };

  const handleEditPlace = (place) => {
    setEditingPlace(place);
    setFormData({
      name: place.name,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      type: place.type || 'other'
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.address) {
      setToast({ message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    try {
      const url = editingPlace
        ? `${API_URL}/api/saved-places/${editingPlace.id}`
        : `${API_URL}/api/saved-places/${user.id}`;
      
      const method = editingPlace ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        setToast({ 
          message: result.message || (editingPlace ? 'Place updated successfully' : 'Place added successfully'), 
          type: 'success' 
        });
        setShowAddModal(false);
        setEditingPlace(null);
        setFormData({
          name: '',
          address: '',
          latitude: null,
          longitude: null,
          type: 'other'
        });
        fetchSavedPlaces();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save place');
      }
    } catch (error) {
      console.error('Error saving place:', error);
      setToast({ message: error.message || 'Failed to save place', type: 'error' });
    }
  };

  const handleDeletePlace = async (placeId) => {
    if (!confirm('Are you sure you want to delete this place?')) return;

    try {
      const response = await fetch(`${API_URL}/api/saved-places/${placeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (response.ok) {
        const result = await response.json();
        setToast({ 
          message: result.message || 'Place deleted successfully', 
          type: 'success' 
        });
        fetchSavedPlaces();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete place');
      }
    } catch (error) {
      console.error('Error deleting place:', error);
      setToast({ message: error.message || 'Failed to delete place', type: 'error' });
    }
  };

  const getPlaceIcon = (type) => {
    const placeType = placeTypes.find(pt => pt.id === type);
    return placeType ? placeType.icon : '📍';
  };

  const getPlaceColor = (type) => {
    const placeType = placeTypes.find(pt => pt.id === type);
    return placeType ? placeType.color : '#6b7280';
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <UserNavbar />
      
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'info' })}
        />
      )}
      
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Saved Places</h1>
            <p style={{ color: '#6b7280' }}>Manage your favorite locations for quick booking</p>
          </div>
          <button
            onClick={handleAddPlace}
            style={{
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <span style={{ fontSize: 18 }}>+</span>
            Add Place
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
            Loading saved places...
          </div>
        ) : (
          /* Places List */
          <div style={{ display: 'grid', gap: 16 }}>
            {savedPlaces.length === 0 ? (
              <div style={{
                background: '#fff',
                border: '2px dashed #e5e7eb',
                borderRadius: 12,
                padding: 40,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📍</div>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No saved places yet</h3>
                <p style={{ color: '#6b7280', marginBottom: 16 }}>Add your home, work, or favorite locations for quick access</p>
                <button
                  onClick={handleAddPlace}
                  style={{
                    background: '#6366f1',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 20px',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Add Your First Place
                </button>
              </div>
            ) : (
              savedPlaces.map(place => (
                <div
                  key={place.id}
                  style={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 12,
                    padding: 20,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div style={{ display: 'flex', gap: 16, flex: 1 }}>
                    <div style={{
                      fontSize: 32,
                      width: 56,
                      height: 56,
                      background: `${getPlaceColor(place.type)}15`,
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {getPlaceIcon(place.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600 }}>{place.name}</h3>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 12,
                          background: `${getPlaceColor(place.type)}15`,
                          color: getPlaceColor(place.type)
                        }}>
                          {place.type}
                        </span>
                      </div>
                      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>{place.address}</p>
                      {place.latitude && place.longitude && (
                        <p style={{ fontSize: 12, color: '#9ca3af' }}>
                          📍 {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditPlace(place);
                      }}
                      style={{
                        background: '#f3f4f6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 16px',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePlace(place.id);
                      }}
                      style={{
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 16px',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            maxWidth: 500,
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              padding: 24,
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>
                {editingPlace ? 'Edit Place' : 'Add New Place'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: 24 }}>
              {/* Place Name */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  Place Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Home, Office, Favorite Cafe"
                  required
                  style={{
                    width: '100%',
                    padding: 12,
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    fontSize: 14
                  }}
                />
              </div>

              {/* Place Type */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  Type
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
                  {placeTypes.map(type => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.id })}
                      style={{
                        padding: '12px 8px',
                        border: `2px solid ${formData.type === type.id ? type.color : '#e5e7eb'}`,
                        borderRadius: 8,
                        background: formData.type === type.id ? `${type.color}15` : '#fff',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{type.icon}</span>
                      <span style={{ color: formData.type === type.id ? type.color : '#6b7280' }}>
                        {type.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Address */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  Address *
                </label>
                <input
                  ref={addressInputRef}
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Start typing to search address..."
                  required
                  style={{
                    width: '100%',
                    padding: 12,
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    fontSize: 14
                  }}
                />
                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                  {GOOGLE_KEY ? 'Start typing to use address autocomplete' : 'Enter full address'}
                </p>
              </div>

              {/* GPS Coordinates (Optional) */}
              {formData.latitude && formData.longitude && (
                <div style={{
                  padding: 12,
                  background: '#f3f4f6',
                  borderRadius: 8,
                  marginBottom: 20
                }}>
                  <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>GPS Coordinates:</p>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>
                    📍 {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    background: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#374151'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: 8,
                    background: '#6366f1',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {editingPlace ? 'Update Place' : 'Add Place'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedPlaces;
