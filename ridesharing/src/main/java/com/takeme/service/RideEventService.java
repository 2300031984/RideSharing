package com.takeme.service;

public interface RideEventService {
    void publishRideCompletedEvent(
            Long rideId, Long riderId, Long driverId,
            Double amount, Double distanceKm, String paymentMethod
    );
}
