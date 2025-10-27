package com.takeme.service;

import com.takeme.model.EmergencyContact;
import com.takeme.model.Incident;
import com.takeme.repository.EmergencyContactRepository;
import com.takeme.repository.IncidentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmergencyService {
    
    @Autowired
    private EmergencyContactRepository contactRepository;
    
    @Autowired
    private IncidentRepository incidentRepository;
    
    @Autowired
    private NotificationService notificationService;
    
    // Emergency Contacts
    public List<EmergencyContact> getEmergencyContacts(Long userId) {
        return contactRepository.findByUserIdAndActive(userId, true);
    }
    
    public EmergencyContact addEmergencyContact(Long userId, EmergencyContact contact) {
        contact.setUserId(userId);
        contact.setActive(true);
        return contactRepository.save(contact);
    }
    
    public EmergencyContact updateEmergencyContact(Long userId, Long contactId, EmergencyContact contactData) {
        EmergencyContact contact = contactRepository.findById(contactId)
            .orElseThrow(() -> new RuntimeException("Contact not found"));
        
        if (!contact.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        
        contact.setName(contactData.getName());
        contact.setPhoneNumber(contactData.getPhoneNumber());
        contact.setRelationship(contactData.getRelationship());
        
        return contactRepository.save(contact);
    }
    
    public void deleteEmergencyContact(Long userId, Long contactId) {
        EmergencyContact contact = contactRepository.findById(contactId)
            .orElseThrow(() -> new RuntimeException("Contact not found"));
        
        if (!contact.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        
        contact.setActive(false);
        contactRepository.save(contact);
    }
    
    // Incident Reports
    public Incident reportIncident(Long userId, Incident incident) {
        incident.setUserId(userId);
        incident.setStatus(Incident.IncidentStatus.REPORTED);
        
        incident = incidentRepository.save(incident);
        
        // Notify user
        notificationService.createNotification(
            userId,
            "Incident Reported",
            "Your incident report has been submitted and is under review.",
            "ALERT",
            null
        );
        
        return incident;
    }
    
    public List<Incident> getUserIncidents(Long userId) {
        return incidentRepository.findByUserId(userId);
    }
    
    public List<Incident> getRideIncidents(Long rideId) {
        return incidentRepository.findByRideId(rideId);
    }
    
    // SOS Alert
    public void triggerSOS(Long userId, Long rideId, Double latitude, Double longitude) {
        // Create an incident
        Incident incident = new Incident();
        incident.setUserId(userId);
        incident.setRideId(rideId);
        incident.setIncidentType("SOS");
        incident.setDescription("Emergency SOS triggered");
        incident.setLatitude(latitude);
        incident.setLongitude(longitude);
        incident.setSeverity("Critical");
        incident.setStatus(Incident.IncidentStatus.REPORTED);
        
        incidentRepository.save(incident);
        
        // Send critical notification
        notificationService.createNotification(
            userId,
            "SOS Alert Triggered",
            "Emergency services have been notified. Help is on the way.",
            "ALERT",
            rideId
        );
    }
    
    // Location Sharing
    public void shareLocation(Long userId, Double latitude, Double longitude, String location) {
        // This could be implemented with WebSocket or stored in a separate table
        // For now, we'll just acknowledge the request
        
        notificationService.createNotification(
            userId,
            "Location Shared",
            "Your location has been shared with your emergency contacts.",
            "ALERT",
            null
        );
    }
}
