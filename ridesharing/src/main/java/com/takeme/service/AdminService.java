package com.takeme.service;

import com.takeme.model.*;
import com.takeme.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminService {
    
    @Autowired
    private RiderRepository riderRepository;
    
    @Autowired
    private DriverRepository driverRepository;
    
    @Autowired
    private RideRepository rideRepository;
    
    @Autowired
    private TransactionRepository transactionRepository;
    
    @Autowired
    private IncidentRepository incidentRepository;
    
    // Dashboard Statistics
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // User statistics
        long totalUsers = riderRepository.count();
        long activeUsers = riderRepository.findAll().stream()
            .filter(Rider::getActive)
            .count();
        
        // Driver statistics  
        long totalDrivers = driverRepository.count();
        long activeDrivers = driverRepository.findByStatus(Driver.DriverStatus.AVAILABLE).size();
        long onlineDrivers = driverRepository.findAll().stream()
            .filter(d -> d.getStatus() != Driver.DriverStatus.OFFLINE)
            .count();
        
        // Ride statistics
        long totalRides = rideRepository.count();
        long completedRides = rideRepository.findByStatus(Ride.RideStatus.COMPLETED).size();
        long activeRides = rideRepository.findByStatus(Ride.RideStatus.STARTED).size() +
                          rideRepository.findByStatus(Ride.RideStatus.ACCEPTED).size();
        long requestedRides = rideRepository.findByStatus(Ride.RideStatus.REQUESTED).size();
        
        // Revenue statistics
        double totalRevenue = rideRepository.findByStatus(Ride.RideStatus.COMPLETED).stream()
            .mapToDouble(Ride::getFare)
            .sum();
        
        long totalTransactions = transactionRepository.count();
        
        // Incident statistics
        long totalIncidents = incidentRepository.count();
        long unresolvedIncidents = incidentRepository.findByStatus(Incident.IncidentStatus.REPORTED).size();
        
        stats.put("totalUsers", totalUsers);
        stats.put("activeUsers", activeUsers);
        stats.put("totalDrivers", totalDrivers);
        stats.put("activeDrivers", activeDrivers);
        stats.put("onlineDrivers", onlineDrivers);
        stats.put("totalRides", totalRides);
        stats.put("completedRides", completedRides);
        stats.put("activeRides", activeRides);
        stats.put("requestedRides", requestedRides);
        stats.put("totalRevenue", totalRevenue);
        stats.put("totalTransactions", totalTransactions);
        stats.put("totalIncidents", totalIncidents);
        stats.put("unresolvedIncidents", unresolvedIncidents);
        
        return stats;
    }
    
    // Get all users with pagination
    public List<Rider> getAllUsers() {
        return riderRepository.findAll();
    }
    
    // Get all drivers with pagination
    public List<Driver> getAllDrivers() {
        return driverRepository.findAll();
    }
    
    // Get all rides
    public List<Ride> getAllRides() {
        return rideRepository.findAll();
    }
    
    // Deactivate user
    public Rider deactivateUser(Long userId) {
        Rider user = riderRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setActive(false);
        return riderRepository.save(user);
    }
    
    // Activate user
    public Rider activateUser(Long userId) {
        Rider user = riderRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setActive(true);
        return riderRepository.save(user);
    }
    
    // Verify driver
    public Driver verifyDriver(Long driverId) {
        Driver driver = driverRepository.findById(driverId)
            .orElseThrow(() -> new RuntimeException("Driver not found"));
        driver.setVerified(true);
        return driverRepository.save(driver);
    }
    
    // Get revenue report
    public Map<String, Object> getRevenueReport() {
        Map<String, Object> report = new HashMap<>();
        
        List<Ride> completedRides = rideRepository.findByStatus(Ride.RideStatus.COMPLETED);
        
        double totalRevenue = completedRides.stream()
            .mapToDouble(Ride::getFare)
            .sum();
        
        double avgFare = completedRides.isEmpty() ? 0 :
            completedRides.stream()
                .mapToDouble(Ride::getFare)
                .average()
                .orElse(0);
        
        report.put("totalRevenue", totalRevenue);
        report.put("averageFare", avgFare);
        report.put("totalCompletedRides", completedRides.size());
        report.put("commission", totalRevenue * 0.15); // 15% commission
        
        return report;
    }
    
    // Get top performing drivers
    public List<Driver> getTopDrivers() {
        return driverRepository.findAll().stream()
            .sorted((d1, d2) -> Double.compare(d2.getRating(), d1.getRating()))
            .limit(10)
            .toList();
    }
}
