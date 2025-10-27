package com.takeme.controller;

import com.takeme.dto.*;
import com.takeme.model.Ride;
import com.takeme.service.RideService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rides")
@CrossOrigin(origins = "*")
public class RideController {
    
    @Autowired
    private RideService rideService;
    
    @PostMapping
    public ResponseEntity<?> createRide(@Valid @RequestBody RideRequest request) {
        try {
            Ride ride = rideService.createRide(request);
            RideResponse response = rideService.convertToResponse(ride);
            
            Map<String, Object> result = new HashMap<>();
            result.put("id", ride.getId());
            result.put("status", ride.getStatus().toString());
            result.put("otp", ride.getOtp());
            result.put("ride", response);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/book-scheduled")
    public ResponseEntity<?> createScheduledRide(@Valid @RequestBody ScheduledRideRequest request) {
        try {
            Ride ride = rideService.createScheduledRide(request);
            RideResponse response = rideService.convertToResponse(ride);
            
            Map<String, Object> result = new HashMap<>();
            result.put("id", ride.getId());
            result.put("status", ride.getStatus().toString());
            result.put("ride", response);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getRideById(@PathVariable Long id) {
        try {
            Ride ride = rideService.getRideById(id);
            RideResponse response = rideService.convertToResponse(ride);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("ride", response);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/rider/{riderId}")
    public ResponseEntity<?> getRiderRides(@PathVariable Long riderId) {
        try {
            List<Ride> rides = rideService.getRiderRides(riderId);
            List<RideResponse> responses = rideService.convertToResponseList(rides);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("rides", responses);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/driver/{driverId}")
    public ResponseEntity<?> getDriverRides(@PathVariable Long driverId) {
        try {
            List<Ride> rides = rideService.getDriverRides(driverId);
            List<RideResponse> responses = rideService.convertToResponseList(rides);
            
            return ResponseEntity.ok(ApiResponse.success(responses));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/requests")
    public ResponseEntity<?> getAvailableRides(@RequestParam(required = false) String vehicleType) {
        try {
            List<Ride> rides = rideService.getAvailableRides(vehicleType);
            List<RideResponse> responses = rideService.convertToResponseList(rides);
            
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<?> getRidesByStatus(
            @PathVariable String status,
            @RequestParam(required = false) String vehicleType) {
        try {
            Ride.RideStatus rideStatus = Ride.RideStatus.valueOf(status.toUpperCase());
            List<Ride> rides;
            
            if (vehicleType != null && !vehicleType.isEmpty()) {
                rides = rideService.getAvailableRides(vehicleType);
            } else {
                rides = rideService.getRidesByStatus(rideStatus);
            }
            
            List<RideResponse> responses = rideService.convertToResponseList(rides);
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/{id}/accept")
    public ResponseEntity<?> acceptRide(
            @PathVariable Long id, 
            @RequestBody Map<String, Object> payload) {
        try {
            Long driverId = Long.valueOf(payload.get("driverId").toString());
            Ride ride = rideService.acceptRide(id, driverId);
            RideResponse response = rideService.convertToResponse(ride);
            
            return ResponseEntity.ok(ApiResponse.success("Ride accepted successfully", response));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/{id}/start")
    public ResponseEntity<?> startRide(@PathVariable Long id) {
        try {
            Ride ride = rideService.startRide(id);
            RideResponse response = rideService.convertToResponse(ride);
            
            return ResponseEntity.ok(ApiResponse.success("Ride started successfully", response));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/{id}/complete")
    public ResponseEntity<?> completeRide(@PathVariable Long id) {
        try {
            Ride ride = rideService.completeRide(id);
            RideResponse response = rideService.convertToResponse(ride);
            
            return ResponseEntity.ok(ApiResponse.success("Ride completed successfully", response));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelRide(
            @PathVariable Long id, 
            @RequestParam Long userId,
            @RequestBody(required = false) Map<String, String> payload) {
        try {
            String reason = payload != null ? payload.get("reason") : null;
            Ride ride = rideService.cancelRide(id, userId, reason);
            RideResponse response = rideService.convertToResponse(ride);
            
            return ResponseEntity.ok(ApiResponse.success("Ride cancelled successfully", response));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/{id}/rate")
    public ResponseEntity<?> rateRide(
            @PathVariable Long id, 
            @RequestBody Map<String, Integer> payload) {
        try {
            Integer rating = payload.get("rating");
            Ride ride = rideService.rateRide(id, rating);
            RideResponse response = rideService.convertToResponse(ride);
            
            return ResponseEntity.ok(ApiResponse.success("Rating submitted successfully", response));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/{id}/verify-otp")
    public ResponseEntity<?> verifyOtp(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        try {
            String otp = payload.get("otp");
            if (otp == null || otp.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("OTP is required"));
            }
            
            Ride ride = rideService.verifyOtpAndStartRide(id, otp.trim());
            RideResponse response = rideService.convertToResponse(ride);
            
            return ResponseEntity.ok(ApiResponse.success("OTP verified and ride started", response));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
}
