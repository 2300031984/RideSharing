package com.takeme.controller;

import com.takeme.dto.NearbyDriverDto;
import com.takeme.service.DriverLocationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/drivers")
@CrossOrigin(origins = "*")
public class DriverGeospatialController {

    @Autowired
    private DriverLocationService driverLocationService;

    @GetMapping("/nearby")
    public ResponseEntity<List<NearbyDriverDto>> getNearbyDrivers(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "5.0") double radius) {
            
        List<NearbyDriverDto> nearbyDrivers = driverLocationService.getNearbyDrivers(lat, lng, radius);
        return ResponseEntity.ok(nearbyDrivers);
    }
}
