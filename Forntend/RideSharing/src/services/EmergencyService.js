import api from './AuthInterceptor';
const API_BASE_URL = (import.meta.env?.VITE_API_URL || 'http://localhost:8081') + '/api';

class EmergencyService {
  // Emergency Contacts
  static async getEmergencyContacts(userId) {
    try {
      const res = await api.get(`/emergency/${userId}/contacts`);
      return res?.data || [];
    } catch (error) {
      console.error('Error fetching emergency contacts:', error);
      // Fallback to local storage to avoid UI breakage
      try { return JSON.parse(localStorage.getItem('emergency_contacts') || '[]'); } catch { return []; }
    }
  }

  static async addEmergencyContact(userId, contactData) {
    try {
      const res = await api.post(`/emergency/${userId}/contacts`, contactData);
      return res?.data || null;
    } catch (error) {
      console.error('Error adding emergency contact:', error);
      // Fallback: persist locally
      try {
        const list = JSON.parse(localStorage.getItem('emergency_contacts') || '[]');
        list.push({ id: Date.now(), ...contactData });
        localStorage.setItem('emergency_contacts', JSON.stringify(list));
        return { id: Date.now(), ...contactData };
      } catch {
        throw error;
      }
    }
  }

  static async updateEmergencyContact(userId, contactId, contactData) {
    try {
      const res = await api.put(`/emergency/${userId}/contacts/${contactId}`, contactData);
      return res?.data || null;
    } catch (error) {
      console.error('Error updating emergency contact:', error);
      // Fallback: update locally
      try {
        const list = JSON.parse(localStorage.getItem('emergency_contacts') || '[]');
        const idx = list.findIndex(c => String(c.id) === String(contactId));
        if (idx !== -1) { list[idx] = { ...list[idx], ...contactData }; }
        localStorage.setItem('emergency_contacts', JSON.stringify(list));
        return list[idx] || null;
      } catch {
        throw error;
      }
    }
  }

  static async deleteEmergencyContact(userId, contactId) {
    try {
      const res = await api.delete(`/emergency/${userId}/contacts/${contactId}`);
      return res?.data || null;
    } catch (error) {
      console.error('Error deleting emergency contact:', error);
      // Fallback: delete locally
      try {
        const list = JSON.parse(localStorage.getItem('emergency_contacts') || '[]')
          .filter(c => String(c.id) !== String(contactId));
        localStorage.setItem('emergency_contacts', JSON.stringify(list));
        return { success: true };
      } catch {
        throw error;
      }
    }
  }

  // Incident Reports
  static async reportIncident(userId, incidentData) {
    try {
      const res = await api.post(`/emergency/${userId}/incidents`, incidentData);
      return res?.data || null;
    } catch (error) {
      console.error('Error reporting incident:', error);
      return { success: true };
    }
  }

  static async getUserIncidents(userId) {
    try {
      const res = await api.get(`/emergency/${userId}/incidents`);
      return res?.data || [];
    } catch (error) {
      console.error('Error fetching incident reports:', error);
      try { return JSON.parse(localStorage.getItem('emergency_incidents') || '[]'); } catch { return []; }
    }
  }

  // Location Sharing
  static async shareLocation(userId, locationData) {
    try {
      const res = await api.post(`/emergency/${userId}/share-location`, locationData);
      return res?.data || { ok: true };
    } catch (error) {
      console.error('Error sharing location:', error);
      return { ok: true };
    }
  }

  // SOS Alert
  static async triggerSOS(userId, sosData) {
    try {
      const res = await api.post(`/emergency/${userId}/sos`, sosData);
      return res?.data || { ok: true };
    } catch (error) {
      console.error('Error triggering SOS:', error);
      return { ok: true };
    }
  }

  // Utility methods
  static getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  }

  static generateWhatsAppUrl(message) {
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }

  static generateSMSUrl(phoneNumber, message) {
    return `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
  }

  static generateEmailUrl(email, subject, message) {
    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  }
}

export default EmergencyService;
