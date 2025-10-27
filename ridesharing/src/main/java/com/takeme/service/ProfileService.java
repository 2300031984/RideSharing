package com.takeme.service;

import com.takeme.model.Driver;
import com.takeme.model.Rider;
import com.takeme.repository.DriverRepository;
import com.takeme.repository.RiderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProfileService {
    
    @Autowired
    private RiderRepository riderRepository;
    
    @Autowired
    private DriverRepository driverRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    public Object getProfile(Long userId, String role) {
        if ("Driver".equalsIgnoreCase(role)) {
            return driverRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));
        } else {
            return riderRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        }
    }
    
    public Object getProfileByEmail(String email, String role) {
        if ("Driver".equalsIgnoreCase(role)) {
            return driverRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new RuntimeException("Driver not found"));
        } else {
            return riderRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new RuntimeException("User not found"));
        }
    }
    
    public Object updateProfile(Long userId, Object profileData, String role) {
        if ("Driver".equalsIgnoreCase(role)) {
            Driver driver = driverRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));
            
            // Update driver fields (basic implementation)
            if (profileData instanceof java.util.Map) {
                java.util.Map<String, Object> data = (java.util.Map<String, Object>) profileData;
                if (data.containsKey("name")) driver.setName((String) data.get("name"));
                if (data.containsKey("phoneNumber")) driver.setPhoneNumber((String) data.get("phoneNumber"));
                if (data.containsKey("vehicleType")) driver.setVehicleType((String) data.get("vehicleType"));
                if (data.containsKey("vehicleNumber")) driver.setVehicleNumber((String) data.get("vehicleNumber"));
                if (data.containsKey("vehicleModel")) driver.setVehicleModel((String) data.get("vehicleModel"));
                if (data.containsKey("currentLocation")) driver.setCurrentLocation((String) data.get("currentLocation"));
            }
            
            return driverRepository.save(driver);
        } else {
            Rider rider = riderRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            // Update rider fields
            if (profileData instanceof java.util.Map) {
                java.util.Map<String, Object> data = (java.util.Map<String, Object>) profileData;
                if (data.containsKey("username")) rider.setUsername((String) data.get("username"));
                if (data.containsKey("phoneNumber")) rider.setPhoneNumber((String) data.get("phoneNumber"));
                if (data.containsKey("age") && data.get("age") != null) {
                    rider.setAge(Integer.parseInt(data.get("age").toString()));
                }
                if (data.containsKey("location")) rider.setLocation((String) data.get("location"));
            }
            
            return riderRepository.save(rider);
        }
    }
    
    public List<String> getVehicleTypes(Boolean onlyAvailable) {
        if (onlyAvailable != null && onlyAvailable) {
            return driverRepository.findAvailableVehicleTypes();
        }
        return driverRepository.findDistinctVehicleTypes();
    }
    
    public Driver updateDriverStatus(Long driverId, Driver.DriverStatus status) {
        Driver driver = driverRepository.findById(driverId)
            .orElseThrow(() -> new RuntimeException("Driver not found"));
        
        driver.setStatus(status);
        return driverRepository.save(driver);
    }
    
    public Driver updateDriverLocation(Long driverId, Double latitude, Double longitude, String location) {
        Driver driver = driverRepository.findById(driverId)
            .orElseThrow(() -> new RuntimeException("Driver not found"));
        
        driver.setCurrentLatitude(latitude);
        driver.setCurrentLongitude(longitude);
        if (location != null) {
            driver.setCurrentLocation(location);
        }
        
        return driverRepository.save(driver);
    }
}
