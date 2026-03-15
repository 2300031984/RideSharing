package com.takeme.controller;

import com.takeme.dto.ApiResponse;
import com.takeme.model.Driver;
import com.takeme.service.DriverService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/drivers")
@CrossOrigin(origins = "*")
public class DriverController {

    @Autowired
    private DriverService driverService;

    @GetMapping("/nearby-available")
    public ResponseEntity<?> getNearbyDrivers(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {
        try {
            List<Driver> drivers = driverService.getNearbyDrivers(lat, lng);
            return ResponseEntity.ok(ApiResponse.success(drivers));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDriverById(@PathVariable Long id) {
        try {
            Driver driver = driverService.getDriverById(id);
            return ResponseEntity.ok(driver);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateDriverStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        try {
            Driver driver = driverService.updateDriverStatus(id, status);
            return ResponseEntity.ok(ApiResponse.success("Status updated", driver));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
}
