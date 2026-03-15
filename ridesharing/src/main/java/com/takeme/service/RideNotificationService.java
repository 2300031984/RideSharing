package com.takeme.service;

import com.takeme.dto.NearbyDriverDto;
import com.takeme.dto.RideResponse;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class RideNotificationService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void sendRideUpdate(Long rideId, RideResponse rideResponse) {
        String destination = "/topic/ride-updates/" + rideId;
        messagingTemplate.convertAndSend(destination, rideResponse);
    }

	public void notifyDriversOfNewRide(Long rideId, List<NearbyDriverDto> nearbyDrivers) {
				
	}
}
