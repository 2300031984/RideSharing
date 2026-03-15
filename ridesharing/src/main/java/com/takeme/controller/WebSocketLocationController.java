package com.takeme.controller;

import com.takeme.dto.LocationPayload;
import com.takeme.service.DriverLocationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class WebSocketLocationController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private DriverLocationService driverLocationService;

    @MessageMapping("/driver/location/{rideId}")
    public void receiveAndBroadcastDriverLocation(
            @DestinationVariable Long rideId,
            LocationPayload locationPayload) {
        
        // Push current location state into the Redis buffer for Geospatial queries
        if (locationPayload.getDriverId() != null) {
            driverLocationService.updateDriverLocation(
                locationPayload.getDriverId(), 
                locationPayload.getLatitude(), 
                locationPayload.getLongitude()
            );
        }

        // Broadcast the mapped coordinates downstream to the topic subscribers 
        messagingTemplate.convertAndSend(
                "/topic/driver-location/" + rideId,
                locationPayload
        );
    }
}
