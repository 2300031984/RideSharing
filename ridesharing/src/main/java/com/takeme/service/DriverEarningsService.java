package com.takeme.service;

import com.takeme.model.Driver;
import com.takeme.model.Ride;
import com.takeme.repository.DriverRepository;
import com.takeme.repository.RideRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DriverEarningsService {
    
    @Autowired
    private DriverRepository driverRepository;
    
    @Autowired
    private RideRepository rideRepository;
    
    public Map<String, Object> getDriverEarnings(Long driverId) {
        Driver driver = driverRepository.findById(driverId)
            .orElseThrow(() -> new RuntimeException("Driver not found"));
        
        List<Ride> completedRides = rideRepository.findByDriverIdAndStatus(
            driverId, Ride.RideStatus.COMPLETED
        );
        
        double totalEarnings = completedRides.stream()
            .mapToDouble(Ride::getFare)
            .sum();
        
        double commission = totalEarnings * 0.15; // 15% platform commission
        double netEarnings = totalEarnings - commission;
        
        // Today's earnings
        LocalDateTime todayStart = LocalDateTime.now().toLocalDate().atStartOfDay();
        double todayEarnings = completedRides.stream()
            .filter(r -> r.getCompletedAt() != null && r.getCompletedAt().isAfter(todayStart))
            .mapToDouble(Ride::getFare)
            .sum();
        
        // This week's earnings
        LocalDateTime weekStart = LocalDateTime.now().minusDays(7);
        double weekEarnings = completedRides.stream()
            .filter(r -> r.getCompletedAt() != null && r.getCompletedAt().isAfter(weekStart))
            .mapToDouble(Ride::getFare)
            .sum();
        
        // This month's earnings
        LocalDateTime monthStart = LocalDateTime.now().minusDays(30);
        double monthEarnings = completedRides.stream()
            .filter(r -> r.getCompletedAt() != null && r.getCompletedAt().isAfter(monthStart))
            .mapToDouble(Ride::getFare)
            .sum();
        
        Map<String, Object> earnings = new HashMap<>();
        earnings.put("totalEarnings", totalEarnings);
        earnings.put("commission", commission);
        earnings.put("netEarnings", netEarnings);
        earnings.put("todayEarnings", todayEarnings);
        earnings.put("weekEarnings", weekEarnings);
        earnings.put("monthEarnings", monthEarnings);
        earnings.put("totalRides", completedRides.size());
        earnings.put("rating", driver.getRating());
        earnings.put("walletBalance", driver.getWalletBalance());
        
        return earnings;
    }
    
    public List<Map<String, Object>> getEarningsHistory(Long driverId) {
        List<Ride> completedRides = rideRepository.findByDriverIdAndStatus(
            driverId, Ride.RideStatus.COMPLETED
        );
        
        return completedRides.stream()
            .sorted((r1, r2) -> r2.getCompletedAt().compareTo(r1.getCompletedAt()))
            .map(ride -> {
                Map<String, Object> record = new HashMap<>();
                record.put("rideId", ride.getId());
                record.put("date", ride.getCompletedAt());
                record.put("pickup", ride.getPickupAddress());
                record.put("dropoff", ride.getDropoffAddress());
                record.put("fare", ride.getFare());
                record.put("distance", ride.getDistance());
                record.put("rating", ride.getRating());
                return record;
            })
            .collect(Collectors.toList());
    }
    
    public List<Driver> getNearbyDrivers(Double latitude, Double longitude, Double radiusKm) {
        // Simple distance calculation - in production, use spatial queries
        List<Driver> availableDrivers = driverRepository.findByStatus(Driver.DriverStatus.AVAILABLE);
        
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
}
