package com.takeme.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "app.feature.kafka.enabled", havingValue = "false", matchIfMissing = true)
public class MockRideEventProducer implements RideEventService {

    @Override
    public void publishRideCompletedEvent(
            Long rideId, Long riderId, Long driverId,
            Double amount, Double distanceKm, String paymentMethod) {
        
        System.out.println("[KAFKA MOCK] Kafka is disabled. Skipping async event publication for Ride: " + rideId);
        System.out.println("             (This is a silent mock for prototype mode)");
    }
}
