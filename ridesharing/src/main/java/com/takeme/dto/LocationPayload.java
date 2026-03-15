package com.takeme.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LocationPayload {
    private Long driverId;
    private Long rideId;
    private double latitude;
    private double longitude;
    private double heading;
    private long timestamp;
}
