package com.takeme.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RideResponse {
    private Long id;
    private Long riderId;
    private String riderName;
    private Long driverId;
    private String driverName;
    private String pickupAddress;
    private String dropoffAddress;
    private String vehicleType;
    private String vehicleNumber;
    private String status;
    private Double fare;
    private Double distance;
    private Integer duration;
    private String otp;
    private Integer rating;
    private LocalDateTime createdAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime completedAt;
}
