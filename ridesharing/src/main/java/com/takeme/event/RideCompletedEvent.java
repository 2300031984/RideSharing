package com.takeme.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RideCompletedEvent {
    private String eventId; 
    private Long rideId;
    private Long riderId;
    private Long driverId;
    private Double amount;
    private Double distanceKm;
    private String paymentMethod;
    private LocalDateTime timestamp;
}
