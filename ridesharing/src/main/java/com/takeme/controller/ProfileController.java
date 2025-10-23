package com.takeme.controller;

import com.takeme.dto.ProfileDTO;
import com.takeme.service.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.List;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "*")
public class ProfileController {

    @Autowired
    private ProfileService profileService;
    // Get available vehicle types from drivers (distinct)
    @GetMapping("/vehicle-types")
    public ResponseEntity<?> getVehicleTypes(@RequestParam(defaultValue = "false") boolean onlyAvailable) {
        try {
            List<String> types = profileService.getDistinctVehicleTypes(onlyAvailable);
            return ResponseEntity.ok(types);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving vehicle types: " + e.getMessage());
        }
    }

    // Get profile by user ID and role
    @GetMapping("/{userId}")
    public ResponseEntity<?> getProfile(@PathVariable Long userId, @RequestParam String role) {
        try {
            Optional<ProfileDTO> profile = profileService.getProfile(userId, role);
            if (profile.isPresent()) {
                return ResponseEntity.ok(profile.get());
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Profile not found for user ID: " + userId + " with role: " + role);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving profile: " + e.getMessage());
        }
    }

    // Get profile by email and role
    @GetMapping("/email/{email}")
    public ResponseEntity<?> getProfileByEmail(@PathVariable String email, @RequestParam String role) {
        try {
            Optional<ProfileDTO> profile = profileService.getProfileByEmail(email, role);
            if (profile.isPresent()) {
                return ResponseEntity.ok(profile.get());
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Profile not found for email: " + email + " with role: " + role);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving profile: " + e.getMessage());
        }
    }

    // Update profile
    @PutMapping("/{userId}")
    public ResponseEntity<?> updateProfile(@PathVariable Long userId, 
                                         @RequestParam String role, 
                                         @RequestBody ProfileDTO profileDTO) {
        try {
            // Check if profile exists
            if (!profileService.profileExists(userId, role)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Profile not found for user ID: " + userId + " with role: " + role);
            }

            Optional<ProfileDTO> updatedProfile = profileService.updateProfile(userId, role, profileDTO);
            if (updatedProfile.isPresent()) {
                return ResponseEntity.ok(updatedProfile.get());
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Failed to update profile");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating profile: " + e.getMessage());
        }
    }

    // Update specific profile fields (partial update)
    @PatchMapping("/{userId}")
    public ResponseEntity<?> partialUpdateProfile(@PathVariable Long userId,
                                                @RequestParam String role,
                                                @RequestBody ProfileDTO profileDTO) {
        try {
            // Check if profile exists
            if (!profileService.profileExists(userId, role)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Profile not found for user ID: " + userId + " with role: " + role);
            }

            Optional<ProfileDTO> updatedProfile = profileService.updateProfile(userId, role, profileDTO);
            if (updatedProfile.isPresent()) {
                return ResponseEntity.ok(updatedProfile.get());
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Failed to update profile");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating profile: " + e.getMessage());
        }
    }

    // Check if profile exists
    @GetMapping("/{userId}/exists")
    public ResponseEntity<?> checkProfileExists(@PathVariable Long userId, @RequestParam String role) {
        try {
            boolean exists = profileService.profileExists(userId, role);
            return ResponseEntity.ok().body("{\"exists\": " + exists + "}");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error checking profile existence: " + e.getMessage());
        }
    }

    // Get current user profile (requires authentication context)
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUserProfile(@RequestParam String role, @RequestParam(required = false) Long userId) {
        try {
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("User ID is required");
            }

            Optional<ProfileDTO> profile = profileService.getProfile(userId, role);
            if (profile.isPresent()) {
                return ResponseEntity.ok(profile.get());
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Profile not found for current user");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving current user profile: " + e.getMessage());
        }
    }

    // Update current user profile
    @PutMapping("/me")
    public ResponseEntity<?> updateCurrentUserProfile(@RequestParam String role, 
                                                    @RequestParam(required = false) Long userId,
                                                    @RequestBody ProfileDTO profileDTO) {
        try {
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("User ID is required");
            }

            // Check if profile exists
            if (!profileService.profileExists(userId, role)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Profile not found for current user");
            }

            Optional<ProfileDTO> updatedProfile = profileService.updateProfile(userId, role, profileDTO);
            if (updatedProfile.isPresent()) {
                return ResponseEntity.ok(updatedProfile.get());
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Failed to update current user profile");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating current user profile: " + e.getMessage());
        }
    }
}
