package com.takeme.consumer;

import com.takeme.config.KafkaConfig;
import com.takeme.event.RideCompletedEvent;
import com.takeme.service.NotificationService;
import com.takeme.service.RideNotificationService;
import com.takeme.model.Ride;
import com.takeme.repository.RideRepository;
import com.takeme.dto.RideResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@ConditionalOnProperty(name = "app.feature.kafka.enabled", havingValue = "true")
public class NotificationConsumer {

    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private RideNotificationService rideNotificationService;
    
    @Autowired
    private RideRepository rideRepository;
    
    @Autowired
    private com.takeme.service.FcmNotificationService fcmNotificationService;
    
    @Autowired
    private com.takeme.repository.RiderRepository riderRepository;

    @KafkaListener(topics = KafkaConfig.RIDE_COMPLETED_TOPIC, groupId = "notification-group")
    public void consumeNotificationEvent(RideCompletedEvent event) {
        System.out.println("NotificationConsumer received event for Ride: " + event.getRideId());
        
        // 1. Send Mobile Push Notifications
        notificationService.createNotification(
            event.getRiderId(),
            "Ride Completed",
            "Your ride has been completed. Fare: ₹" + event.getAmount(),
            "RIDE_UPDATE",
            event.getRideId()
        );
        
        // 2. Broadcast via WebSockets (STOMP) exactly like the old synchronous path
        Optional<Ride> rideOpt = rideRepository.findById(event.getRideId());
        if(rideOpt.isPresent()) {
            Ride ride = rideOpt.get();
            rideNotificationService.sendRideUpdate(event.getRideId(), convertToResponse(ride));
            
            // 3. Trigger Firebase Google Push Notification Pipeline
            Optional<com.takeme.model.Rider> riderOpt = riderRepository.findById(event.getRiderId());
            if (riderOpt.isPresent() && riderOpt.get().getFcmToken() != null) {
                fcmNotificationService.sendPushNotification(
                    riderOpt.get().getFcmToken(),
                    "Ride Completed ✅",
                    "Your receipt mapping ₹" + event.getAmount() + " is ready.",
                    java.util.Map.of("rideId", event.getRideId().toString(), "type", "RECEIPT")
                );
            }
        }
    }
    
    // Extracted DTO mapper matching RideService's original implementation
    private RideResponse convertToResponse(Ride ride) {
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
