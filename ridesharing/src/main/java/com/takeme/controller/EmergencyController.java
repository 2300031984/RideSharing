package com.takeme.controller;

import com.takeme.dto.ApiResponse;
import com.takeme.model.EmergencyContact;
import com.takeme.model.Incident;
import com.takeme.service.EmergencyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/emergency")
@CrossOrigin(origins = "*")
public class EmergencyController {
    
    @Autowired
    private EmergencyService emergencyService;
    
    // Emergency Contacts
    @GetMapping("/{userId}/contacts")
    public ResponseEntity<?> getEmergencyContacts(@PathVariable Long userId) {
        try {
            List<EmergencyContact> contacts = emergencyService.getEmergencyContacts(userId);
            return ResponseEntity.ok(contacts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/{userId}/contacts")
    public ResponseEntity<?> addEmergencyContact(
            @PathVariable Long userId, 
            @RequestBody EmergencyContact contact) {
        try {
            EmergencyContact savedContact = emergencyService.addEmergencyContact(userId, contact);
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Contact added successfully", savedContact));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PutMapping("/{userId}/contacts/{contactId}")
    public ResponseEntity<?> updateEmergencyContact(
            @PathVariable Long userId,
            @PathVariable Long contactId,
            @RequestBody EmergencyContact contact) {
        try {
            EmergencyContact updatedContact = emergencyService.updateEmergencyContact(userId, contactId, contact);
            return ResponseEntity.ok(ApiResponse.success("Contact updated successfully", updatedContact));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @DeleteMapping("/{userId}/contacts/{contactId}")
    public ResponseEntity<?> deleteEmergencyContact(
            @PathVariable Long userId,
            @PathVariable Long contactId) {
        try {
            emergencyService.deleteEmergencyContact(userId, contactId);
            return ResponseEntity.ok(ApiResponse.success("Contact deleted successfully", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    // Incident Reports
    @PostMapping("/{userId}/incidents")
    public ResponseEntity<?> reportIncident(
            @PathVariable Long userId, 
            @RequestBody Incident incident) {
        try {
            Incident savedIncident = emergencyService.reportIncident(userId, incident);
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Incident reported successfully", savedIncident));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/{userId}/incidents")
    public ResponseEntity<?> getUserIncidents(@PathVariable Long userId) {
        try {
            List<Incident> incidents = emergencyService.getUserIncidents(userId);
            return ResponseEntity.ok(incidents);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    // SOS Alert
    @PostMapping("/{userId}/sos")
    public ResponseEntity<?> triggerSOS(
            @PathVariable Long userId, 
            @RequestBody Map<String, Object> payload) {
        try {
            Long rideId = payload.get("rideId") != null ? 
                Long.valueOf(payload.get("rideId").toString()) : null;
            Double latitude = payload.get("lat") != null ? 
                Double.valueOf(payload.get("lat").toString()) : null;
            Double longitude = payload.get("lng") != null ? 
                Double.valueOf(payload.get("lng").toString()) : null;
            
            emergencyService.triggerSOS(userId, rideId, latitude, longitude);
            return ResponseEntity.ok(ApiResponse.success("SOS alert triggered successfully", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    // Location Sharing
    @PostMapping("/{userId}/share-location")
    public ResponseEntity<?> shareLocation(
            @PathVariable Long userId, 
            @RequestBody Map<String, Object> payload) {
        try {
            Double latitude = Double.valueOf(payload.get("latitude").toString());
            Double longitude = Double.valueOf(payload.get("longitude").toString());
            String location = (String) payload.get("location");
            
            emergencyService.shareLocation(userId, latitude, longitude, location);
            return ResponseEntity.ok(ApiResponse.success("Location shared successfully", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
}
