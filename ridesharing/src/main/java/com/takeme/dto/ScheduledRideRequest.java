package com.takeme.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScheduledRideRequest {
    @NotNull(message = "Passenger ID is required")
    private Long passengerId;
    
    private String passengerName;
    
    @NotBlank(message = "Pickup address is required")
    private String pickupAddress;
    
    @NotBlank(message = "Dropoff address is required")
    private String dropoffAddress;
    
    private Double pickupLatitude;
    private Double pickupLongitude;
    private Double dropoffLatitude;
    private Double dropoffLongitude;
    
    private Double fare;
    private String vehicleType;
    
    @NotBlank(message = "Scheduled date is required")
    private String scheduledDate;
    
    @NotBlank(message = "Scheduled time is required")
    private String scheduledTime;
    
    private String specialRequests;
}
