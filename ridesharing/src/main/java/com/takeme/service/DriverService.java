package com.takeme.service;

import com.takeme.model.Driver;
import com.takeme.repository.DriverRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DriverService {

    @Autowired
    private DriverRepository driverRepository;

    public List<Driver> getAvailableDrivers() {
        return driverRepository.findByStatus(Driver.DriverStatus.AVAILABLE);
    }

    public List<Driver> getNearbyDrivers(Double latitude, Double longitude) {
        // Default radius 5.0 km
        double radiusKm = 5.0;
        
        List<Driver> availableDrivers = driverRepository.findByStatus(Driver.DriverStatus.AVAILABLE);

        if (latitude == null || longitude == null) {
             // If no coords provided, just return some available ones
             return availableDrivers.stream()
                .limit(10)
                .collect(Collectors.toList());
        }
        
        return availableDrivers.stream()
            .filter(d -> d.getCurrentLatitude() != null && d.getCurrentLongitude() != null)
            .filter(d -> {
                double distance = calculateDistance(
                    latitude, longitude,
                    d.getCurrentLatitude(), d.getCurrentLongitude()
                );
                return distance <= radiusKm;
            })
            .collect(Collectors.toList());
    }
    
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Radius of the earth in km
        
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }

    public Driver getDriverById(Long id) {
        return driverRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Driver not found"));
    }

    public Driver updateDriverStatus(Long id, String statusStr) {
        Driver driver = getDriverById(id);
        
        try {
            Driver.DriverStatus status = Driver.DriverStatus.valueOf(statusStr.toUpperCase());
            driver.setStatus(status);
            return driverRepository.save(driver);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status: " + statusStr);
        }
    }
}
