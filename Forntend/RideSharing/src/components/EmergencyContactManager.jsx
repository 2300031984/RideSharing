import React, { useState, useEffect } from 'react';
import Card from './ui/Card';
import Toast from './Toast';
import EmergencyService from '../services/EmergencyService';

const EmergencyContactManager = ({ userId, onClose }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [formData, setFormData] = useState({
    contactName: '',
    contactNumber: '',
    contactEmail: '',
    relationship: '',
    isPrimary: false,
    isEmergencyService: false
  });

  useEffect(() => {
    loadContacts();
  }, [userId]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const response = await EmergencyService.getEmergencyContacts(userId);
      if (response.success) {
        setContacts(response.contacts || []);
      } else {
        setToast({ message: 'Failed to load contacts', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Error loading contacts', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (editingContact) {
        response = await EmergencyService.updateEmergencyContact(userId, editingContact.id, formData);
      } else {
        response = await EmergencyService.addEmergencyContact(userId, formData);
      }

      if (response.success) {
        setToast({ 
          message: editingContact ? 'Contact updated successfully' : 'Contact added successfully', 
          type: 'success' 
        });
        setShowAddForm(false);
        setEditingContact(null);
        setFormData({
          contactName: '',
          contactNumber: '',
          contactEmail: '',
          relationship: '',
          isPrimary: false,
          isEmergencyService: false
        });
        loadContacts();
      } else {
        setToast({ message: response.message || 'Failed to save contact', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Error saving contact', type: 'error' });
    }
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      contactName: contact.contactName,
      contactNumber: contact.contactNumber,
      contactEmail: contact.contactEmail || '',
      relationship: contact.relationship || '',
      isPrimary: contact.isPrimary || false,
      isEmergencyService: contact.isEmergencyService || false
    });
    setShowAddForm(true);
  };

  const handleDelete = async (contactId) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        const response = await EmergencyService.deleteEmergencyContact(userId, contactId);
        if (response.success) {
          setToast({ message: 'Contact deleted successfully', type: 'success' });
          loadContacts();
        } else {
          setToast({ message: response.message || 'Failed to delete contact', type: 'error' });
        }
      } catch (error) {
        setToast({ message: 'Error deleting contact', type: 'error' });
      }
    }
  };

  const handleCall = (contact) => {
    window.open(`tel:${contact.contactNumber}`, '_self');
  };

  const handleSMS = (contact) => {
    const message = `Emergency: I need help! Please call me back immediately.`;
    const smsUrl = EmergencyService.generateSMSUrl(contact.contactNumber, message);
    window.open(smsUrl, '_self');
  };

  const handleWhatsApp = (contact) => {
    const message = `Emergency: I need help! Please call me back immediately.`;
    const whatsappUrl = EmergencyService.generateWhatsAppUrl(message);
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
        <div>Loading emergency contacts...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#dc2626' }}>
          Emergency Contacts
        </h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              padding: '8px 16px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600
            }}
          >
            + Add Contact
          </button>
          <button
            onClick={onClose}
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
            Close
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card style={{ marginBottom: 24, padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
            {editingContact ? 'Edit Contact' : 'Add New Contact'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 14 }}>
                  Contact Name *
                </label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => handleInputChange('contactName', e.target.value)}
                  placeholder="Enter contact name"
                  style={{
                    width: '100%',
                    padding: 8,
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 14 }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.contactNumber}
                  onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                  placeholder="Enter phone number"
                  style={{
                    width: '100%',
                    padding: 8,
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 14 }}>
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  placeholder="Enter email address"
                  style={{
                    width: '100%',
                    padding: 8,
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 14 }}>
                  Relationship
                </label>
                <select
                  value={formData.relationship}
                  onChange={(e) => handleInputChange('relationship', e.target.value)}
                  style={{
                    width: '100%',
                    padding: 8,
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                >
                  <option value="">Select relationship</option>
                  <option value="Family">Family</option>
                  <option value="Friend">Friend</option>
                  <option value="Colleague">Colleague</option>
                  <option value="Neighbor">Neighbor</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.isPrimary}
                  onChange={(e) => handleInputChange('isPrimary', e.target.checked)}
                />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Primary Contact</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.isEmergencyService}
                  onChange={(e) => handleInputChange('isEmergencyService', e.target.checked)}
                />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Emergency Service</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingContact(null);
                  setFormData({
                    contactName: '',
                    contactNumber: '',
                    contactEmail: '',
                    relationship: '',
                    isPrimary: false,
                    isEmergencyService: false
                  });
                }}
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
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600
                }}
              >
                {editingContact ? 'Update Contact' : 'Add Contact'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Contacts List */}
      <div style={{ display: 'grid', gap: 16 }}>
        {contacts.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📞</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#6b7280' }}>
              No Emergency Contacts
            </h3>
            <p style={{ color: '#9ca3af', marginBottom: 16 }}>
              Add emergency contacts to get help quickly when needed
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                padding: '12px 24px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600
              }}
            >
              Add Your First Contact
            </button>
          </Card>
        ) : (
          contacts.map((contact) => (
            <Card key={contact.id} style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <h4 style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>
                      {contact.contactName}
                    </h4>
                    {contact.isPrimary && (
                      <span style={{
                        background: '#fef3c7',
                        color: '#92400e',
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600
                      }}>
                        PRIMARY
                      </span>
                    )}
                    {contact.isEmergencyService && (
                      <span style={{
                        background: '#fecaca',
                        color: '#dc2626',
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600
                      }}>
                        EMERGENCY
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>
                    📞 {contact.contactNumber}
                  </div>
                  {contact.contactEmail && (
                    <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>
                      ✉️ {contact.contactEmail}
                    </div>
                  )}
                  {contact.relationship && (
                    <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>
                      👤 {contact.relationship}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleCall(contact)}
                      style={{
                        padding: '6px 12px',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600
                      }}
                    >
                      📞 Call
                    </button>
                    <button
                      onClick={() => handleSMS(contact)}
                      style={{
                        padding: '6px 12px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600
                      }}
                    >
                      💬 SMS
                    </button>
                    <button
                      onClick={() => handleWhatsApp(contact)}
                      style={{
                        padding: '6px 12px',
                        background: '#25d366',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600
                      }}
                    >
                      📱 WhatsApp
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleEdit(contact)}
                    style={{
                      padding: '6px 12px',
                      background: '#f3f4f6',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(contact.id)}
                    style={{
                      padding: '6px 12px',
                      background: '#fef2f2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </div>
  );
};

export default EmergencyContactManager;
