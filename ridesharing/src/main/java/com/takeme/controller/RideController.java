package com.takeme.controller;

import com.takeme.model.Ride;
import com.takeme.model.Driver;
import com.takeme.repository.DriverRepository;
import com.takeme.model.RideStatus;
import com.takeme.service.RideService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/rides")
@CrossOrigin(origins = "*")
public class RideController {

    @Autowired
    private RideService rideService;

    @Autowired
    private DriverRepository driverRepository;

    // Get all rides (for testing)
    @GetMapping
    public ResponseEntity<?> getAllRides() {
        try {
            // This is a simple endpoint for testing
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Ride API is working",
                    "rides", List.of()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Failed to get rides: " + e.getMessage()
            ));
        }
    }

    // Create a new ride request
    @PostMapping
    public ResponseEntity<?> createRide(@RequestBody Map<String, Object> rideData) {
        try {
            Ride ride = Ride.builder()
                    .riderId(Long.valueOf(rideData.get("riderId").toString()))
                    .pickupLocation((String) rideData.get("pickupLocation"))
                    .dropoffLocation((String) rideData.get("dropoffLocation"))
                    .pickupLatitude(rideData.get("pickupLatitude") != null ? 
                            Double.valueOf(rideData.get("pickupLatitude").toString()) : null)
                    .pickupLongitude(rideData.get("pickupLongitude") != null ? 
                            Double.valueOf(rideData.get("pickupLongitude").toString()) : null)
                    .dropoffLatitude(rideData.get("dropoffLatitude") != null ? 
                            Double.valueOf(rideData.get("dropoffLatitude").toString()) : null)
                    .dropoffLongitude(rideData.get("dropoffLongitude") != null ? 
                            Double.valueOf(rideData.get("dropoffLongitude").toString()) : null)
                    .vehicleType((String) rideData.get("vehicleType"))
                    .build();

            Ride savedRide = rideService.createRide(ride);
            return ResponseEntity.status(201).body(Map.of(
                    "success", true,
                    "ride", savedRide,
                    "otp", savedRide.getOtpCode(),
                    "message", "Ride request created successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Failed to create ride: " + e.getMessage()
            ));
        }
    }

    // Get ride by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getRide(@PathVariable Long id) {
        Optional<Ride> ride = rideService.findById(id);
        if (ride.isPresent()) {
            Map<String, Object> body = new java.util.HashMap<>();
            body.put("success", true);
            body.put("ride", ride.get());
            if (ride.get().getDriverId() != null) {
                Optional<Driver> dopt = driverRepository.findById(ride.get().getDriverId());
                if (dopt.isPresent()) {
                    Driver d = dopt.get();
                    body.put("driver", Map.of(
                        "id", d.getId(),
                        "name", d.getName(),
                        "phone", d.getPhoneNumber(),
                        "gender", d.getGender(),
                        "vehicleNumber", d.getVehicleNumber(),
                        "vehicleType", d.getVehicleType()
                    ));
                }
            }
            return ResponseEntity.ok(body);
        } else {
            return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "message", "Ride not found"
            ));
        }
    }

    // Get rides by rider ID
    @GetMapping("/rider/{riderId}")
    public ResponseEntity<?> getRidesByRider(@PathVariable Long riderId) {
        try {
            List<Ride> rides = rideService.getRidesByRiderId(riderId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "rides", rides
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Failed to get rides: " + e.getMessage()
            ));
        }
    }

    // Get rides by driver ID
    @GetMapping("/driver/{driverId}")
    public ResponseEntity<?> getRidesByDriver(@PathVariable Long driverId) {
        try {
            List<Ride> rides = rideService.getRidesByDriverId(driverId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "rides", rides
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Failed to get rides: " + e.getMessage()
            ));
        }
    }

    // Get active rides for a rider
    @GetMapping("/rider/{riderId}/active")
    public ResponseEntity<?> getActiveRidesByRider(@PathVariable Long riderId) {
        try {
            List<Ride> rides = rideService.getActiveRidesByRiderId(riderId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "rides", rides
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Failed to get active rides: " + e.getMessage()
            ));
        }
    }

    // Get active rides for a driver
    @GetMapping("/driver/{driverId}/active")
    public ResponseEntity<?> getActiveRidesByDriver(@PathVariable Long driverId) {
        try {
            List<Ride> rides = rideService.getActiveRidesByDriverId(driverId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "rides", rides
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Failed to get active rides: " + e.getMessage()
            ));
        }
    }

    // Accept a ride
    @PostMapping("/{id}/accept")
    public ResponseEntity<?> acceptRide(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        try {
            Long driverId = Long.valueOf(data.get("driverId").toString());
            Optional<Ride> ride = rideService.acceptRide(id, driverId);
            if (ride.isPresent()) {
                // Minimal driver details for user visibility
                Map<String, Object> driver;
                Optional<Driver> dopt = driverRepository.findById(driverId);
                if (dopt.isPresent()) {
                    Driver d = dopt.get();
                    driver = new java.util.HashMap<>();
                    driver.put("id", d.getId());
                    driver.put("name", d.getName());
                    driver.put("phone", d.getPhoneNumber());
                    driver.put("gender", d.getGender());
                    driver.put("vehicleNumber", d.getVehicleNumber());
                    driver.put("vehicleType", d.getVehicleType());
                } else {
                    driver = Map.of("id", driverId);
                }
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "ride", ride.get(),
                        "driver", driver,
                        "message", "Ride accepted successfully"
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Failed to accept ride"
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Failed to accept ride: " + e.getMessage()
            ));
        }
    }

    // Update driver location (called by driver app)
    @PostMapping("/{id}/location")
    public ResponseEntity<?> updateLocation(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        try {
            Double lat = data.get("latitude") != null ? Double.valueOf(data.get("latitude").toString()) : null;
            Double lng = data.get("longitude") != null ? Double.valueOf(data.get("longitude").toString()) : null;
            if (lat == null || lng == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "latitude and longitude required"));
            }
            Optional<Ride> ride = rideService.updateDriverLocation(id, lat, lng);
            if (ride.isPresent()) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "location", Map.of(
                                "latitude", ride.get().getCurrentDriverLatitude(),
                                "longitude", ride.get().getCurrentDriverLongitude(),
                                "updatedAt", ride.get().getLastLocationAt()
                        )
                ));
            }
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Ride not found"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Get latest driver location (polled by both user and driver)
    @GetMapping("/{id}/tracking")
    public ResponseEntity<?> getTracking(@PathVariable Long id) {
        Optional<Ride> ride = rideService.findById(id);
        if (ride.isPresent()) {
            Ride r = ride.get();
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "tracking", Map.of(
                            "latitude", r.getCurrentDriverLatitude(),
                            "longitude", r.getCurrentDriverLongitude(),
                            "updatedAt", r.getLastLocationAt()
                    )
            ));
        }
        return ResponseEntity.status(404).body(Map.of("success", false, "message", "Ride not found"));
    }

    // Cancel a ride
    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelRide(@PathVariable Long id, @RequestParam(required = false) Long userId, 
                                       @RequestBody(required = false) Map<String, Object> data) {
        try {
            String reason = "User cancelled";
            if (data != null && data.containsKey("reason")) {
                reason = (String) data.get("reason");
            }
            
            Optional<Ride> ride = rideService.cancelRide(id, reason);
            if (ride.isPresent()) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "ride", ride.get(),
                        "message", "Ride cancelled successfully"
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Failed to cancel ride"
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Failed to cancel ride: " + e.getMessage()
            ));
        }
    }

    // Reject a ride
    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectRide(@PathVariable Long id) {
        try {
            Optional<Ride> ride = rideService.rejectRide(id);
            if (ride.isPresent()) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "ride", ride.get(),
                        "message", "Ride rejected successfully"
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Failed to reject ride"
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Failed to reject ride: " + e.getMessage()
            ));
        }
    }

    // Start a ride
    @PostMapping("/{id}/start")
    public ResponseEntity<?> startRide(@PathVariable Long id) {
        try {
            Optional<Ride> ride = rideService.startRide(id);
            if (ride.isPresent()) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "ride", ride.get(),
                        "message", "Ride started successfully"
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Failed to start ride"
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Failed to start ride: " + e.getMessage()
            ));
        }
    }

    // Verify OTP to start ride
    @PostMapping("/{id}/verify-otp")
    public ResponseEntity<?> verifyOtp(@PathVariable Long id, @RequestBody Map<String, String> data) {
        try {
            String otp = data.get("otp");
            if (otp == null || otp.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "OTP required"));
            }
            boolean ok = rideService.verifyOtpAndStart(id, otp);
            if (ok) {
                Optional<Ride> ride = rideService.findById(id);
                return ResponseEntity.ok(Map.of("success", true, "ride", ride.orElse(null), "message", "OTP verified. Ride started"));
            }
            return ResponseEntity.status(400).body(Map.of("success", false, "message", "Invalid OTP or ride state"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Complete a ride
    @PostMapping("/{id}/complete")
    public ResponseEntity<?> completeRide(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        try {
            Double fare = data.get("fare") != null ? Double.valueOf(data.get("fare").toString()) : null;
            Double distance = data.get("distance") != null ? Double.valueOf(data.get("distance").toString()) : null;
            Integer duration = data.get("duration") != null ? Integer.valueOf(data.get("duration").toString()) : null;
            
            Optional<Ride> ride = rideService.completeRide(id, fare, distance, duration);
            if (ride.isPresent()) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "ride", ride.get(),
                        "message", "Ride completed successfully"
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Failed to complete ride"
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Failed to complete ride: " + e.getMessage()
            ));
        }
    }

    // Update ride status
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateRideStatus(@PathVariable Long id, @RequestBody Map<String, String> data) {
        try {
            String statusStr = data.get("status");
            RideStatus status = RideStatus.valueOf(statusStr.toUpperCase());
            
            Optional<Ride> ride = rideService.updateRideStatus(id, status);
            if (ride.isPresent()) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "ride", ride.get(),
                        "message", "Ride status updated successfully"
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Failed to update ride status"
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Failed to update ride status: " + e.getMessage()
            ));
        }
    }

    // Get rides by status, optionally filtered by vehicleType (e.g., bike/car)
    @GetMapping("/status/{status}")
    public ResponseEntity<?> getRidesByStatus(@PathVariable String status, @RequestParam(required = false) String vehicleType) {
        try {
            RideStatus rideStatus = RideStatus.valueOf(status.toUpperCase());
            List<Ride> rides = rideService.getRidesByStatus(rideStatus, vehicleType);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "rides", rides
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Failed to get rides by status: " + e.getMessage()
            ));
        }
    }
}
