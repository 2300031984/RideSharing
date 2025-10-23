package com.takeme.service;

import com.takeme.model.Ride;
import com.takeme.model.RideStatus;
import com.takeme.repository.RideRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class RideService {

    @Autowired
    private RideRepository rideRepository;

    // Create a new ride request
    public Ride createRide(Ride ride) {
        ride.setStatus(RideStatus.REQUESTED);
        ride.setRequestedAt(LocalDateTime.now());
        // Generate 6-digit OTP for starting the ride
        if (ride.getOtpCode() == null || ride.getOtpCode().isBlank()) {
            String otp = String.valueOf(100000 + (int)(Math.random() * 900000));
            ride.setOtpCode(otp);
        }
        return rideRepository.save(ride);
    }

    // Get ride by ID
    public Optional<Ride> findById(Long id) {
        return rideRepository.findById(id);
    }

    // Get rides by rider ID
    public List<Ride> getRidesByRiderId(Long riderId) {
        return rideRepository.findByRiderIdOrderByCreatedAtDesc(riderId);
    }

    // Get rides by driver ID
    public List<Ride> getRidesByDriverId(Long driverId) {
        return rideRepository.findByDriverIdOrderByCreatedAtDesc(driverId);
    }

    // Get active rides for a rider
    public List<Ride> getActiveRidesByRiderId(Long riderId) {
        return rideRepository.findActiveRidesByRiderId(riderId);
    }

    // Get active rides for a driver
    public List<Ride> getActiveRidesByDriverId(Long driverId) {
        return rideRepository.findActiveRidesByDriverId(driverId);
    }

    // Accept a ride (driver accepts rider's request)
    public Optional<Ride> acceptRide(Long rideId, Long driverId) {
        Optional<Ride> rideOpt = rideRepository.findById(rideId);
        if (rideOpt.isPresent()) {
            Ride ride = rideOpt.get();
            if (ride.getStatus() == RideStatus.REQUESTED) {
                ride.setDriverId(driverId);
                ride.setStatus(RideStatus.ACCEPTED);
                ride.setAcceptedAt(LocalDateTime.now());
                return Optional.of(rideRepository.save(ride));
            }
        }
        return Optional.empty();
    }

    // Update driver location for a ride
    public Optional<Ride> updateDriverLocation(Long rideId, Double lat, Double lng) {
        Optional<Ride> rideOpt = rideRepository.findById(rideId);
        if (rideOpt.isPresent()) {
            Ride ride = rideOpt.get();
            ride.setCurrentDriverLatitude(lat);
            ride.setCurrentDriverLongitude(lng);
            ride.setLastLocationAt(LocalDateTime.now());
            return Optional.of(rideRepository.save(ride));
        }
        return Optional.empty();
    }

    // Cancel a ride
    public Optional<Ride> cancelRide(Long rideId, String reason) {
        Optional<Ride> rideOpt = rideRepository.findById(rideId);
        if (rideOpt.isPresent()) {
            Ride ride = rideOpt.get();
            if (ride.getStatus() == RideStatus.REQUESTED || ride.getStatus() == RideStatus.ACCEPTED) {
                ride.setStatus(RideStatus.CANCELLED);
                ride.setCancelledAt(LocalDateTime.now());
                ride.setCancellationReason(reason);
                return Optional.of(rideRepository.save(ride));
            }
        }
        return Optional.empty();
    }

    // Reject a ride (driver rejects rider's request)
    public Optional<Ride> rejectRide(Long rideId) {
        Optional<Ride> rideOpt = rideRepository.findById(rideId);
        if (rideOpt.isPresent()) {
            Ride ride = rideOpt.get();
            if (ride.getStatus() == RideStatus.REQUESTED) {
                ride.setStatus(RideStatus.REJECTED);
                return Optional.of(rideRepository.save(ride));
            }
        }
        return Optional.empty();
    }

    // Start a ride (driver arrives and starts the ride)
    public Optional<Ride> startRide(Long rideId) {
        Optional<Ride> rideOpt = rideRepository.findById(rideId);
        if (rideOpt.isPresent()) {
            Ride ride = rideOpt.get();
            if (ride.getStatus() == RideStatus.ACCEPTED) {
                ride.setStatus(RideStatus.IN_PROGRESS);
                ride.setStartedAt(LocalDateTime.now());
                return Optional.of(rideRepository.save(ride));
            }
        }
        return Optional.empty();
    }

    public boolean verifyOtpAndStart(Long rideId, String otp) {
        Optional<Ride> rideOpt = rideRepository.findById(rideId);
        if (rideOpt.isEmpty()) return false;
        Ride ride = rideOpt.get();
        if (ride.getStatus() != RideStatus.ACCEPTED) return false;
        if (ride.getOtpCode() == null) return false;
        if (!ride.getOtpCode().equals(otp)) return false;
        ride.setStatus(RideStatus.IN_PROGRESS);
        ride.setStartedAt(LocalDateTime.now());
        rideRepository.save(ride);
        return true;
    }

    // Complete a ride
    public Optional<Ride> completeRide(Long rideId, Double fare, Double distance, Integer duration) {
        Optional<Ride> rideOpt = rideRepository.findById(rideId);
        if (rideOpt.isPresent()) {
            Ride ride = rideOpt.get();
            if (ride.getStatus() == RideStatus.IN_PROGRESS) {
                ride.setStatus(RideStatus.COMPLETED);
                ride.setCompletedAt(LocalDateTime.now());
                ride.setFare(fare);
                ride.setDistance(distance);
                ride.setDuration(duration);
                return Optional.of(rideRepository.save(ride));
            }
        }
        return Optional.empty();
    }

    // Update ride status
    public Optional<Ride> updateRideStatus(Long rideId, RideStatus status) {
        Optional<Ride> rideOpt = rideRepository.findById(rideId);
        if (rideOpt.isPresent()) {
            Ride ride = rideOpt.get();
            ride.setStatus(status);
            return Optional.of(rideRepository.save(ride));
        }
        return Optional.empty();
    }

    // Get rides by status (optionally filtered by vehicle type)
    public List<Ride> getRidesByStatus(RideStatus status, String vehicleType) {
        if (vehicleType != null && !vehicleType.isBlank()) {
            return rideRepository.findByStatusAndVehicleTypeOrderByCreatedAtDesc(status, vehicleType);
        }
        return rideRepository.findByStatusOrderByCreatedAtDesc(status);
    }

    // Get recent rides for a rider (last 30 days)
    public List<Ride> getRecentRidesByRiderId(Long riderId) {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        return rideRepository.findRecentRidesByRiderId(riderId, thirtyDaysAgo);
    }

    // Get recent rides for a driver (last 30 days)
    public List<Ride> getRecentRidesByDriverId(Long driverId) {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        return rideRepository.findRecentRidesByDriverId(driverId, thirtyDaysAgo);
    }
}
