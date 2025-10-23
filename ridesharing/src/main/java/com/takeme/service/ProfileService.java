package com.takeme.service;

import com.takeme.dto.ProfileDTO;
import com.takeme.model.Driver;
import com.takeme.model.DriverStatus;
import com.takeme.model.Rider;
import com.takeme.repository.DriverRepository;
import com.takeme.repository.RiderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.List;

@Service
public class ProfileService {

    @Autowired
    private RiderRepository riderRepository;

    @Autowired
    private DriverRepository driverRepository;

    // Get profile by user ID and role
    public Optional<ProfileDTO> getProfile(Long userId, String role) {
        if ("RIDER".equalsIgnoreCase(role) || "User".equalsIgnoreCase(role)) {
            return getRiderProfile(userId);
        } else if ("DRIVER".equalsIgnoreCase(role)) {
            return getDriverProfile(userId);
        }
        return Optional.empty();
    }

    // Get rider profile
    private Optional<ProfileDTO> getRiderProfile(Long userId) {
        Optional<Rider> riderOpt = riderRepository.findById(userId);
        if (riderOpt.isPresent()) {
            Rider rider = riderOpt.get();
            return Optional.of(ProfileDTO.builder()
                    .id(rider.getId())
                    .username(rider.getUsername())
                    .email(rider.getEmail())
                    .phone(rider.getPhone())
                    .age(rider.getAge())
                    .location(rider.getLocation())
                    .avatar(rider.getAvatar())
                    .role(rider.getRole())
                    .build());
        }
        return Optional.empty();
    }

    // Get driver profile
    private Optional<ProfileDTO> getDriverProfile(Long userId) {
        Optional<Driver> driverOpt = driverRepository.findById(userId);
        if (driverOpt.isPresent()) {
            Driver driver = driverOpt.get();
            return Optional.of(ProfileDTO.builder()
                    .id(driver.getId())
                    .email(driver.getEmail())
                    .name(driver.getName())
                    .licenseNumber(driver.getLicenseNumber())
                    .gender(driver.getGender())
                    .vehicleNumber(driver.getVehicleNumber())
                    .vehicleType(driver.getVehicleType())
                    .vehicleModel(driver.getVehicleModel())
                    .vehicleColor(driver.getVehicleColor())
                    .role(driver.getRole())
                    .status(driver.getStatus() != null ? driver.getStatus().toString() : null)
                    .build());
        }
        return Optional.empty();
    }

    // Update profile
    public Optional<ProfileDTO> updateProfile(Long userId, String role, ProfileDTO profileDTO) {
        if ("RIDER".equalsIgnoreCase(role) || "User".equalsIgnoreCase(role)) {
            return updateRiderProfile(userId, profileDTO);
        } else if ("DRIVER".equalsIgnoreCase(role)) {
            return updateDriverProfile(userId, profileDTO);
        }
        return Optional.empty();
    }

    // Update rider profile
    private Optional<ProfileDTO> updateRiderProfile(Long userId, ProfileDTO profileDTO) {
        Optional<Rider> riderOpt = riderRepository.findById(userId);
        if (riderOpt.isPresent()) {
            Rider rider = riderOpt.get();
            
            // Update fields if provided
            if (profileDTO.getUsername() != null) {
                rider.setUsername(profileDTO.getUsername());
            }
            if (profileDTO.getPhone() != null) {
                rider.setPhone(profileDTO.getPhone());
            }
            if (profileDTO.getAge() > 0) {
                rider.setAge(profileDTO.getAge());
            }
            if (profileDTO.getLocation() != null) {
                rider.setLocation(profileDTO.getLocation());
            }
            if (profileDTO.getAvatar() != null) {
                rider.setAvatar(profileDTO.getAvatar());
            }
            
            Rider updatedRider = riderRepository.save(rider);
            return Optional.of(ProfileDTO.builder()
                    .id(updatedRider.getId())
                    .username(updatedRider.getUsername())
                    .email(updatedRider.getEmail())
                    .phone(updatedRider.getPhone())
                    .age(updatedRider.getAge())
                    .location(updatedRider.getLocation())
                    .avatar(updatedRider.getAvatar())
                    .role(updatedRider.getRole())
                    .build());
        }
        return Optional.empty();
    }

    // Update driver profile
    private Optional<ProfileDTO> updateDriverProfile(Long userId, ProfileDTO profileDTO) {
        Optional<Driver> driverOpt = driverRepository.findById(userId);
        if (driverOpt.isPresent()) {
            Driver driver = driverOpt.get();
            
            // Update fields if provided
            if (profileDTO.getName() != null) {
                driver.setName(profileDTO.getName());
            }
            if (profileDTO.getLicenseNumber() != null) {
                driver.setLicenseNumber(profileDTO.getLicenseNumber());
            }
            if (profileDTO.getGender() != null) {
                driver.setGender(profileDTO.getGender());
            }
            if (profileDTO.getVehicleNumber() != null) {
                driver.setVehicleNumber(profileDTO.getVehicleNumber());
            }
            if (profileDTO.getVehicleType() != null) {
                driver.setVehicleType(profileDTO.getVehicleType());
            }
            if (profileDTO.getVehicleModel() != null) {
                driver.setVehicleModel(profileDTO.getVehicleModel());
            }
            if (profileDTO.getVehicleColor() != null) {
                driver.setVehicleColor(profileDTO.getVehicleColor());
            }
            if (profileDTO.getStatus() != null) {
                try {
                    driver.setStatus(DriverStatus.valueOf(profileDTO.getStatus().toUpperCase()));
                } catch (IllegalArgumentException e) {
                    // Keep existing status if invalid
                }
            }
            
            Driver updatedDriver = driverRepository.save(driver);
            return Optional.of(ProfileDTO.builder()
                    .id(updatedDriver.getId())
                    .email(updatedDriver.getEmail())
                    .name(updatedDriver.getName())
                    .licenseNumber(updatedDriver.getLicenseNumber())
                    .gender(updatedDriver.getGender())
                    .vehicleNumber(updatedDriver.getVehicleNumber())
                    .vehicleType(updatedDriver.getVehicleType())
                    .vehicleModel(updatedDriver.getVehicleModel())
                    .vehicleColor(updatedDriver.getVehicleColor())
                    .role(updatedDriver.getRole())
                    .status(updatedDriver.getStatus() != null ? updatedDriver.getStatus().toString() : null)
                    .build());
        }
        return Optional.empty();
    }

    // Get profile by email
    public Optional<ProfileDTO> getProfileByEmail(String email, String role) {
        if ("RIDER".equalsIgnoreCase(role) || "User".equalsIgnoreCase(role)) {
            Optional<Rider> riderOpt = riderRepository.findByEmail(email);
            if (riderOpt.isPresent()) {
                return getRiderProfile(riderOpt.get().getId());
            }
            return Optional.empty();
        } else if ("DRIVER".equalsIgnoreCase(role)) {
            Optional<Driver> driverOpt = driverRepository.findByEmail(email);
            if (driverOpt.isPresent()) {
                return getDriverProfile(driverOpt.get().getId());
            }
            return Optional.empty();
        }
        return Optional.empty();
    }

    // Check if profile exists
    public boolean profileExists(Long userId, String role) {
        if ("RIDER".equalsIgnoreCase(role) || "User".equalsIgnoreCase(role)) {
            return riderRepository.existsById(userId);
        } else if ("DRIVER".equalsIgnoreCase(role)) {
            return driverRepository.existsById(userId);
        }
        return false;
    }

    // Distinct vehicle types available among drivers
    public List<String> getDistinctVehicleTypes(boolean onlyAvailable) {
        if (onlyAvailable) {
            return driverRepository.findDistinctVehicleTypesOfAvailableDrivers();
        }
        return driverRepository.findDistinctVehicleTypes();
    }
}
