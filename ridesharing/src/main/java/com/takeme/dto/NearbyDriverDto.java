package com.takeme.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NearbyDriverDto {
    private Long driverId;
    private double latitude;
    private double longitude;
    private double distanceKm;
    public NearbyDriverDto(long driverId, double latitude, double longitude, double distance) {
        this.driverId = driverId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.distanceKm = distanceKm;
    }
}
