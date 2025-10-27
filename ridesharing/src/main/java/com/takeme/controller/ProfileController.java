package com.takeme.controller;

import com.takeme.dto.ApiResponse;
import com.takeme.model.Driver;
import com.takeme.service.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ProfileController {
    
    @Autowired
    private ProfileService profileService;
    
    @GetMapping("/profile/{userId}")
    public ResponseEntity<?> getProfile(
            @PathVariable Long userId,
            @RequestParam String role) {
        try {
            Object profile = profileService.getProfile(userId, role);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/profile/email/{email}")
    public ResponseEntity<?> getProfileByEmail(
            @PathVariable String email,
            @RequestParam String role) {
        try {
            Object profile = profileService.getProfileByEmail(email, role);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PutMapping("/profile/{userId}")
    public ResponseEntity<?> updateProfile(
            @PathVariable Long userId,
            @RequestBody Map<String, Object> profileData,
            @RequestParam String role) {
        try {
            Object updatedProfile = profileService.updateProfile(userId, profileData, role);
            return ResponseEntity.ok(updatedProfile);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/profile/vehicle-types")
    public ResponseEntity<?> getVehicleTypes(
            @RequestParam(required = false) Boolean onlyAvailable) {
        try {
            List<String> vehicleTypes = profileService.getVehicleTypes(onlyAvailable);
            return ResponseEntity.ok(vehicleTypes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PutMapping("/drivers/{driverId}/status")
    public ResponseEntity<?> updateDriverStatus(
            @PathVariable Long driverId,
            @RequestParam String status) {
        try {
            Driver.DriverStatus driverStatus = Driver.DriverStatus.valueOf(status.toUpperCase());
            Driver driver = profileService.updateDriverStatus(driverId, driverStatus);
            
            return ResponseEntity.ok(ApiResponse.success("Status updated successfully", driver));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PutMapping("/drivers/{driverId}/location")
    public ResponseEntity<?> updateDriverLocation(
            @PathVariable Long driverId,
            @RequestBody Map<String, Object> locationData) {
        try {
            Double latitude = Double.valueOf(locationData.get("latitude").toString());
            Double longitude = Double.valueOf(locationData.get("longitude").toString());
            String location = (String) locationData.get("location");
            
            Driver driver = profileService.updateDriverLocation(driverId, latitude, longitude, location);
            
            return ResponseEntity.ok(ApiResponse.success("Location updated successfully", driver));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
}
