package com.takeme.service;

import com.takeme.dto.RideRequest;
import com.takeme.dto.RideResponse;
import com.takeme.dto.ScheduledRideRequest;
import com.takeme.model.Driver;
import com.takeme.model.Ride;
import com.takeme.model.Rider;
import com.takeme.repository.DriverRepository;
import com.takeme.repository.RideRepository;
import com.takeme.repository.RiderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class RideService {
    
    @Autowired
    private RideRepository rideRepository;
    
    @Autowired
    private RiderRepository riderRepository;
    
    @Autowired
    private DriverRepository driverRepository;
    
    @Autowired
    private NotificationService notificationService;
    
    public Ride createRide(RideRequest request) {
        Optional<Rider> riderOpt = riderRepository.findById(request.getRiderId());
        if (riderOpt.isEmpty()) {
            throw new RuntimeException("Rider not found");
        }
        
        Rider rider = riderOpt.get();
        
        Ride ride = new Ride();
        ride.setRiderId(request.getRiderId());
        ride.setRiderName(rider.getUsername());
        ride.setPickupAddress(request.getPickupLocation());
        ride.setDropoffAddress(request.getDropoffLocation());
        ride.setPickupLatitude(request.getPickupLatitude());
        ride.setPickupLongitude(request.getPickupLongitude());
        ride.setDropoffLatitude(request.getDropoffLatitude());
        ride.setDropoffLongitude(request.getDropoffLongitude());
        ride.setVehicleType(request.getVehicleType());
        ride.setStatus(Ride.RideStatus.REQUESTED);
        ride.setIsScheduled(false);
        ride.setOtp(generateOTP());
        
        // Calculate distance and fare
        if (request.getPickupLatitude() != null && request.getDropoffLatitude() != null) {
            double distance = calculateDistance(
                request.getPickupLatitude(), request.getPickupLongitude(),
                request.getDropoffLatitude(), request.getDropoffLongitude()
            );
            ride.setDistance(distance);
            ride.setDuration(calculateDuration(distance));
            ride.setFare(calculateFare(distance, request.getVehicleType()));
        }
        
        ride = rideRepository.save(ride);
        
        // Notify user
        notificationService.createNotification(
            request.getRiderId(),
            "Ride Requested",
            "Your ride request has been placed successfully.",
            "RIDE_UPDATE",
            ride.getId()
        );
        
        return ride;
    }
    
    public Ride createScheduledRide(ScheduledRideRequest request) {
        Optional<Rider> riderOpt = riderRepository.findById(request.getPassengerId());
        if (riderOpt.isEmpty()) {
            throw new RuntimeException("Rider not found");
        }
        
        Rider rider = riderOpt.get();
        
        Ride ride = new Ride();
        ride.setRiderId(request.getPassengerId());
        ride.setRiderName(request.getPassengerName() != null ? request.getPassengerName() : rider.getUsername());
        ride.setPickupAddress(request.getPickupAddress());
        ride.setDropoffAddress(request.getDropoffAddress());
        ride.setPickupLatitude(request.getPickupLatitude());
        ride.setPickupLongitude(request.getPickupLongitude());
        ride.setDropoffLatitude(request.getDropoffLatitude());
        ride.setDropoffLongitude(request.getDropoffLongitude());
        ride.setVehicleType(request.getVehicleType());
        ride.setStatus(Ride.RideStatus.REQUESTED);
        ride.setIsScheduled(true);
        ride.setScheduledDate(request.getScheduledDate());
        ride.setScheduledTime(request.getScheduledTime());
        ride.setFare(request.getFare());
        ride.setOtp(generateOTP()); // Generate OTP for scheduled rides too
        
        // Calculate distance if coordinates are provided
        if (request.getPickupLatitude() != null && request.getDropoffLatitude() != null) {
            double distance = calculateDistance(
                request.getPickupLatitude(), request.getPickupLongitude(),
                request.getDropoffLatitude(), request.getDropoffLongitude()
            );
            ride.setDistance(distance);
            ride.setDuration(calculateDuration(distance));
        }
        
        // Parse scheduled datetime
        try {
            String dateTimeStr = request.getScheduledDate() + "T" + request.getScheduledTime();
            ride.setScheduledDateTime(LocalDateTime.parse(dateTimeStr));
        } catch (Exception e) {
            // Fallback if parsing fails
        }
        
        ride = rideRepository.save(ride);
        
        // Notify user
        notificationService.createNotification(
            request.getPassengerId(),
            "Scheduled Ride Booked",
            "Your ride has been scheduled for " + request.getScheduledDate() + " at " + request.getScheduledTime(),
            "RIDE_UPDATE",
            ride.getId()
        );
        
        return ride;
    }
    
    public Ride getRideById(Long id) {
        return rideRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Ride not found"));
    }
    
    public List<Ride> getRiderRides(Long riderId) {
        return rideRepository.findByRiderIdOrderByCreatedAtDesc(riderId);
    }
    
    public List<Ride> getDriverRides(Long driverId) {
        return rideRepository.findByDriverIdOrderByCreatedAtDesc(driverId);
    }
    
    public List<Ride> getRidesByStatus(Ride.RideStatus status) {
        return rideRepository.findByStatus(status);
    }
    
    public List<Ride> getAvailableRides(String vehicleType) {
        if (vehicleType != null && !vehicleType.isEmpty()) {
            return rideRepository.findByStatusAndVehicleType(Ride.RideStatus.REQUESTED, vehicleType);
        }
        return rideRepository.findByStatus(Ride.RideStatus.REQUESTED);
    }
    
    public Ride acceptRide(Long rideId, Long driverId) {
        Ride ride = getRideById(rideId);
        
        if (ride.getStatus() != Ride.RideStatus.REQUESTED) {
            throw new RuntimeException("Ride is not available");
        }
        
        Optional<Driver> driverOpt = driverRepository.findById(driverId);
        if (driverOpt.isEmpty()) {
            throw new RuntimeException("Driver not found");
        }
        
        Driver driver = driverOpt.get();
        
        ride.setDriverId(driverId);
        ride.setDriverName(driver.getName());
        ride.setVehicleNumber(driver.getVehicleNumber());
        ride.setStatus(Ride.RideStatus.ACCEPTED);
        ride.setAcceptedAt(LocalDateTime.now());
        
        ride = rideRepository.save(ride);
        
        // Update driver status
        driver.setStatus(Driver.DriverStatus.BUSY);
        driverRepository.save(driver);
        
        // Notify rider
        notificationService.createNotification(
            ride.getRiderId(),
            "Ride Accepted",
            "Your ride has been accepted by " + driver.getName(),
            "RIDE_UPDATE",
            rideId
        );
        
        return ride;
    }
    
    public Ride startRide(Long rideId) {
        Ride ride = getRideById(rideId);
        
        if (ride.getStatus() != Ride.RideStatus.ACCEPTED) {
            throw new RuntimeException("Ride must be accepted before starting");
        }
        
        ride.setStatus(Ride.RideStatus.STARTED);
        ride.setStartedAt(LocalDateTime.now());
        
        ride = rideRepository.save(ride);
        
        // Notify rider
        notificationService.createNotification(
            ride.getRiderId(),
            "Ride Started",
            "Your ride has started",
            "RIDE_UPDATE",
            rideId
        );
        
        return ride;
    }
    
    public Ride verifyOtpAndStartRide(Long rideId, String otp) {
        Ride ride = getRideById(rideId);
        
        if (ride.getStatus() != Ride.RideStatus.ACCEPTED) {
            throw new RuntimeException("Ride must be in ACCEPTED status to verify OTP");
        }
        
        if (ride.getOtp() == null || !ride.getOtp().equals(otp)) {
            throw new RuntimeException("Invalid OTP");
        }
        
        ride.setStatus(Ride.RideStatus.STARTED);
        ride.setStartedAt(LocalDateTime.now());
        
        ride = rideRepository.save(ride);
        
        // Notify rider that ride has started
        notificationService.createNotification(
            ride.getRiderId(),
            "Ride Started",
            "Your ride has started. Driver verified OTP.",
            "RIDE_UPDATE",
            rideId
        );
        
        return ride;
    }
    
    public Ride completeRide(Long rideId) {
        Ride ride = getRideById(rideId);
        
        if (ride.getStatus() != Ride.RideStatus.STARTED) {
            throw new RuntimeException("Ride must be started before completing");
        }
        
        ride.setStatus(Ride.RideStatus.COMPLETED);
        ride.setCompletedAt(LocalDateTime.now());
        
        ride = rideRepository.save(ride);
        
        // Update rider stats
        Optional<Rider> riderOpt = riderRepository.findById(ride.getRiderId());
        if (riderOpt.isPresent()) {
            Rider rider = riderOpt.get();
            rider.setTotalRides(rider.getTotalRides() + 1);
            riderRepository.save(rider);
        }
        
        // Update driver stats and status
        if (ride.getDriverId() != null) {
            Optional<Driver> driverOpt = driverRepository.findById(ride.getDriverId());
            if (driverOpt.isPresent()) {
                Driver driver = driverOpt.get();
                driver.setTotalRides(driver.getTotalRides() + 1);
                driver.setTotalEarnings(driver.getTotalEarnings() + ride.getFare());
                driver.setStatus(Driver.DriverStatus.AVAILABLE);
                driverRepository.save(driver);
            }
        }
        
        // Notify rider
        notificationService.createNotification(
            ride.getRiderId(),
            "Ride Completed",
            "Your ride has been completed. Fare: ₹" + ride.getFare(),
            "RIDE_UPDATE",
            rideId
        );
        
        return ride;
    }
    
    public Ride cancelRide(Long rideId, Long userId, String reason) {
        Ride ride = getRideById(rideId);
        
        if (ride.getStatus() == Ride.RideStatus.COMPLETED || 
            ride.getStatus() == Ride.RideStatus.CANCELLED) {
            throw new RuntimeException("Ride cannot be cancelled");
        }
        
        ride.setStatus(Ride.RideStatus.CANCELLED);
        ride.setCancelledAt(LocalDateTime.now());
        ride.setCancellationReason(reason);
        
        // Determine who cancelled
        if (userId.equals(ride.getRiderId())) {
            ride.setCancelledBy("Rider");
        } else if (userId.equals(ride.getDriverId())) {
            ride.setCancelledBy("Driver");
            // If driver cancels, make driver available again
            if (ride.getDriverId() != null) {
                Optional<Driver> driverOpt = driverRepository.findById(ride.getDriverId());
                if (driverOpt.isPresent()) {
                    Driver driver = driverOpt.get();
                    driver.setStatus(Driver.DriverStatus.AVAILABLE);
                    driverRepository.save(driver);
                }
            }
        }
        
        ride = rideRepository.save(ride);
        
        // Notify parties
        if (ride.getRiderId() != null && !userId.equals(ride.getRiderId())) {
            notificationService.createNotification(
                ride.getRiderId(),
                "Ride Cancelled",
                "Your ride has been cancelled" + (reason != null ? ": " + reason : ""),
                "RIDE_UPDATE",
                rideId
            );
        }
        
        if (ride.getDriverId() != null && !userId.equals(ride.getDriverId())) {
            notificationService.createNotification(
                ride.getDriverId(),
                "Ride Cancelled",
                "The ride has been cancelled" + (reason != null ? ": " + reason : ""),
                "RIDE_UPDATE",
                rideId
            );
        }
        
        return ride;
    }
    
    public Ride rateRide(Long rideId, Integer rating) {
        Ride ride = getRideById(rideId);
        
        if (ride.getStatus() != Ride.RideStatus.COMPLETED) {
            throw new RuntimeException("Only completed rides can be rated");
        }
        
        ride.setRating(rating);
        ride = rideRepository.save(ride);
        
        // Update driver rating
        if (ride.getDriverId() != null) {
            updateDriverRating(ride.getDriverId());
        }
        
        return ride;
    }
    
    private void updateDriverRating(Long driverId) {
        List<Ride> completedRides = rideRepository.findByDriverIdAndStatus(
            driverId, Ride.RideStatus.COMPLETED
        );
        
        double avgRating = completedRides.stream()
            .filter(r -> r.getRating() != null)
            .mapToInt(Ride::getRating)
            .average()
            .orElse(0.0);
        
        Optional<Driver> driverOpt = driverRepository.findById(driverId);
        if (driverOpt.isPresent()) {
            Driver driver = driverOpt.get();
            driver.setRating(avgRating);
            driverRepository.save(driver);
        }
    }
    
    private String generateOTP() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }
    
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Radius of the earth in km
        
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c; // Distance in km
    }
    
    private int calculateDuration(double distanceKm) {
        // Assume average speed of 30 km/h
        return (int) Math.ceil((distanceKm / 30.0) * 60);
    }
    
    private double calculateFare(double distanceKm, String vehicleType) {
        double baseFare = 40;
        double perKm = 15;
        
        if ("Bike".equalsIgnoreCase(vehicleType)) {
            baseFare = 20;
            perKm = 10;
        } else if ("SUV".equalsIgnoreCase(vehicleType)) {
            baseFare = 60;
            perKm = 20;
        } else if ("Van".equalsIgnoreCase(vehicleType)) {
            baseFare = 80;
            perKm = 25;
        } else if ("Auto".equalsIgnoreCase(vehicleType)) {
            baseFare = 25;
            perKm = 12;
        }
        
        return baseFare + (distanceKm * perKm);
    }
    
    public List<RideResponse> convertToResponseList(List<Ride> rides) {
        return rides.stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    public RideResponse convertToResponse(Ride ride) {
        RideResponse response = new RideResponse();
        response.setId(ride.getId());
        response.setRiderId(ride.getRiderId());
        response.setRiderName(ride.getRiderName());
        response.setDriverId(ride.getDriverId());
        response.setDriverName(ride.getDriverName());
        response.setPickupAddress(ride.getPickupAddress());
        response.setDropoffAddress(ride.getDropoffAddress());
        response.setVehicleType(ride.getVehicleType());
        response.setVehicleNumber(ride.getVehicleNumber());
        response.setStatus(ride.getStatus().toString());
        response.setFare(ride.getFare());
        response.setDistance(ride.getDistance());
        response.setDuration(ride.getDuration());
        response.setOtp(ride.getOtp());
        response.setRating(ride.getRating());
        response.setCreatedAt(ride.getCreatedAt());
        response.setAcceptedAt(ride.getAcceptedAt());
        response.setCompletedAt(ride.getCompletedAt());
        return response;
    }
}
