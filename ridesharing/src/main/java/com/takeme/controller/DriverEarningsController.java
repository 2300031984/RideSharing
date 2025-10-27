package com.takeme.controller;

import com.takeme.dto.ApiResponse;
import com.takeme.model.Driver;
import com.takeme.service.DriverEarningsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/drivers")
@CrossOrigin(origins = "*")
public class DriverEarningsController {
    
    @Autowired
    private DriverEarningsService earningsService;
    
    @GetMapping("/{driverId}/earnings")
    public ResponseEntity<?> getDriverEarnings(@PathVariable Long driverId) {
        try {
            Map<String, Object> earnings = earningsService.getDriverEarnings(driverId);
            return ResponseEntity.ok(earnings);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/{driverId}/earnings/history")
    public ResponseEntity<?> getEarningsHistory(@PathVariable Long driverId) {
        try {
            List<Map<String, Object>> history = earningsService.getEarningsHistory(driverId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/nearby")
    public ResponseEntity<?> getNearbyDrivers(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(defaultValue = "5.0") Double radius) {
        try {
            List<Driver> drivers = earningsService.getNearbyDrivers(latitude, longitude, radius);
            return ResponseEntity.ok(drivers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
}
