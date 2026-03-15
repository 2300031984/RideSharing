package com.takeme.service;

import com.takeme.config.KafkaConfig;
import com.takeme.event.RideCompletedEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "app.feature.kafka.enabled", havingValue = "true")
public class KafkaRideEventProducer implements RideEventService {

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    @Override
    public void publishRideCompletedEvent(
            Long rideId, Long riderId, Long driverId,
            Double amount, Double distanceKm, String paymentMethod) {

        RideCompletedEvent event = RideCompletedEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .rideId(rideId)
                .riderId(riderId)
                .driverId(driverId)
                .amount(amount)
                .distanceKm(distanceKm)
                .paymentMethod(paymentMethod)
                .timestamp(LocalDateTime.now())
                .build();

        // Publish to the topic mapped in config
        kafkaTemplate.send(KafkaConfig.RIDE_COMPLETED_TOPIC, event.getRideId().toString(), event);
        System.out.println("Published RideCompletedEvent to Kafka for ride: " + rideId);
    }
}
