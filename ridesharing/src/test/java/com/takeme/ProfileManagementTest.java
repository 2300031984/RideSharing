package com.takeme;

import com.takeme.dto.ProfileDTO;
import com.takeme.service.ProfileService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

@SpringBootTest
@ActiveProfiles("test")
public class ProfileManagementTest {

    @Autowired
    private ProfileService profileService;

    @Test
    public void testGetRiderProfile() {
        // Test getting a rider profile
        Optional<ProfileDTO> profile = profileService.getProfile(1L, "RIDER");
        if (profile.isPresent()) {
            System.out.println("Rider Profile: " + profile.get());
        } else {
            System.out.println("Rider profile not found");
        }
    }

    @Test
    public void testGetDriverProfile() {
        // Test getting a driver profile
        Optional<ProfileDTO> profile = profileService.getProfile(1L, "DRIVER");
        if (profile.isPresent()) {
            System.out.println("Driver Profile: " + profile.get());
        } else {
            System.out.println("Driver profile not found");
        }
    }

    @Test
    public void testUpdateRiderProfile() {
        // Test updating a rider profile
        ProfileDTO updateData = ProfileDTO.builder()
                .phone("+1234567890")
                .location("New York")
                .age(25)
                .build();

        Optional<ProfileDTO> updatedProfile = profileService.updateProfile(1L, "RIDER", updateData);
        if (updatedProfile.isPresent()) {
            System.out.println("Updated Rider Profile: " + updatedProfile.get());
        } else {
            System.out.println("Failed to update rider profile");
        }
    }

    @Test
    public void testUpdateDriverProfile() {
        // Test updating a driver profile
        ProfileDTO updateData = ProfileDTO.builder()
                .name("John Driver")
                .licenseNumber("DL123456789")
                .status("ONLINE")
                .build();

        Optional<ProfileDTO> updatedProfile = profileService.updateProfile(1L, "DRIVER", updateData);
        if (updatedProfile.isPresent()) {
            System.out.println("Updated Driver Profile: " + updatedProfile.get());
        } else {
            System.out.println("Failed to update driver profile");
        }
    }

    @Test
    public void testProfileExists() {
        // Test checking if profile exists
        boolean riderExists = profileService.profileExists(1L, "RIDER");
        boolean driverExists = profileService.profileExists(1L, "DRIVER");
        
        System.out.println("Rider profile exists: " + riderExists);
        System.out.println("Driver profile exists: " + driverExists);
    }
}
