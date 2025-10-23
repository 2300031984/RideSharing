package com.takeme.controller;

import com.takeme.model.Driver;
import com.takeme.service.DriverService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import com.takeme.security.JwtService;
import com.takeme.dto.LoginRequest;
import com.takeme.dto.DriverSignupRequest;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.security.crypto.password.PasswordEncoder;

@RestController
@RequestMapping("/api/drivers")
@CrossOrigin(origins = "*")
@Tag(name = "Drivers", description = "Driver authentication and profile operations")
public class DriverController {

    @Autowired
    private DriverService service;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // --- Register Driver ---
    @PostMapping("/register")
    @Operation(summary = "Register a new driver")
    public ResponseEntity<?> registerDriver(@Valid @RequestBody DriverSignupRequest req) {
        try {
            Optional<Driver> existingDriver = service.findByEmail(req.getEmail());
            if (existingDriver.isPresent()) {
                return ResponseEntity.badRequest().body("Email already registered");
            }
            Driver driver = new Driver();
            driver.setName(req.getName());
            driver.setEmail(req.getEmail());
            driver.setPassword(req.getPassword());
            driver.setLicenseNumber(req.getLicenseNumber());
            driver.setPhoneNumber(req.getPhoneNumber());
            driver.setRole(req.getRole());
            driver.setStatus(com.takeme.model.DriverStatus.OFFLINE); // Default status
            Driver savedDriver = service.saveDriver(driver);
            String token = jwtService.generateToken(
                savedDriver.getEmail(),
                Map.of("id", savedDriver.getId(), "role", savedDriver.getRole(), "type", "driver")
            );
            return ResponseEntity.status(201).body(Map.of(
                "id", savedDriver.getId(),
                "name", savedDriver.getName(),
                "email", savedDriver.getEmail(),
                "licenseNumber", savedDriver.getLicenseNumber(),
                "phoneNumber", savedDriver.getPhoneNumber(),
                "role", savedDriver.getRole(),
                "status", savedDriver.getStatus(),
                "token", token
            ));
        } catch (Exception e) {
            // Log the full exception for debugging
            System.err.println("Driver registration error: " + e.getClass().getSimpleName() + ": " + e.getMessage());
            e.printStackTrace();
            
            String errorMessage = e.getMessage();
            if (errorMessage == null || errorMessage.isEmpty()) {
                errorMessage = "Unknown error occurred during registration";
            }
            
            // Handle specific database constraint violations
            if (errorMessage.contains("Duplicate entry") && errorMessage.contains("license_number")) {
                return ResponseEntity.badRequest().body("License number already exists");
            } else if (errorMessage.contains("Duplicate entry") && errorMessage.contains("email")) {
                return ResponseEntity.badRequest().body("Email already registered");
            } else if (errorMessage.contains("DataIntegrityViolationException")) {
                return ResponseEntity.badRequest().body("Invalid data provided. Please check all fields.");
            } else if (errorMessage.contains("ConstraintViolationException")) {
                return ResponseEntity.badRequest().body("Data validation failed. Please check all required fields.");
            }
            
            // Return more specific error message
            return ResponseEntity.status(500).body("Registration failed: " + errorMessage);
        }
    }

    // --- Login Driver ---
    @PostMapping("/login")
    @Operation(summary = "Login driver and return token")
    public ResponseEntity<?> loginDriver(@Valid @RequestBody LoginRequest credentials) {
        String email = credentials.getEmail();
        String password = credentials.getPassword();
        String role = credentials.getRole(); // optional

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body("Missing credentials");
        }

        try {
            Driver driver = service.login(email, password, role)
                    .orElse(null);
            if (driver == null) {
                return ResponseEntity.status(401).body("Invalid credentials");
            }
            String token = jwtService.generateToken(
                driver.getEmail(),
                Map.of("id", driver.getId(), "role", driver.getRole(), "type", "driver")
            );
            return ResponseEntity.ok(Map.of(
                "id", driver.getId(),
                "name", driver.getName(),
                "email", driver.getEmail(),
                "licenseNumber", driver.getLicenseNumber(),
                "phoneNumber", driver.getPhoneNumber(),
                "role", driver.getRole(),
                "status", driver.getStatus(),
                "token", token
            ));
        } catch (Exception ex) {
            return ResponseEntity.status(500).body("Login failed: " + ex.getMessage());
        }
    }

    // --- Get Driver Profile ---
    @GetMapping("/{id}")
    public ResponseEntity<?> getDriver(@PathVariable Long id) {
        try {
            Optional<Driver> driver = service.findById(id);
            if (driver.isPresent()) {
                Driver d = driver.get();
                return ResponseEntity.ok(Map.of(
                    "id", d.getId(),
                    "name", d.getName(),
                    "email", d.getEmail(),
                    "licenseNumber", d.getLicenseNumber(),
                    "phoneNumber", d.getPhoneNumber(),
                    "role", d.getRole(),
                    "status", d.getStatus(),
                    "createdAt", d.getCreatedAt(),
                    "updatedAt", d.getUpdatedAt()
                ));
            } else {
                return ResponseEntity.status(404).body("Driver not found");
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error retrieving driver: " + e.getMessage());
        }
    }

    // --- Update Driver Status ---
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateDriverStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            // Ensure driver exists
            Optional<Driver> existing = service.findById(id);
            if (existing.isEmpty()) {
                return ResponseEntity.status(404).body("Driver not found with id: " + id);
            }
            com.takeme.model.DriverStatus driverStatus = com.takeme.model.DriverStatus.valueOf(status.toUpperCase());
            Driver updatedDriver = service.updateStatus(id, driverStatus);
            return ResponseEntity.ok(Map.of(
                "id", updatedDriver.getId(),
                "status", updatedDriver.getStatus(),
                "message", "Status updated successfully"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid status: " + status);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error updating status: " + e.getMessage());
        }
    }
}
