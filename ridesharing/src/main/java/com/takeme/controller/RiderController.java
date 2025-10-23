package com.takeme.controller;

import com.takeme.model.Rider;
import com.takeme.service.RiderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import com.takeme.security.JwtService;
import com.takeme.dto.LoginRequest;
import com.takeme.dto.RiderSignupRequest;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.security.crypto.password.PasswordEncoder;

@RestController
@RequestMapping("/api/riders")
@CrossOrigin(origins = "*")
@Tag(name = "Riders", description = "Rider authentication and profile operations")
public class RiderController {

    @Autowired
    private RiderService service;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // --- Register Rider ---
    @PostMapping("/signup")
    @Operation(summary = "Register a new rider")
    public ResponseEntity<?> registerRider(@Valid @RequestBody RiderSignupRequest req) {
        try {
            Optional<Rider> existingRider = service.findByEmail(req.getEmail());
            if (existingRider.isPresent()) {
                return ResponseEntity.badRequest().body("Email already registered");
            }
            Rider rider = new Rider();
            rider.setUsername(req.getUsername());
            rider.setEmail(req.getEmail());
            rider.setPassword(req.getPassword());
            rider.setRole(req.getRole());
            Rider savedRider = service.register(rider);
            String token = jwtService.generateToken(
                savedRider.getEmail(),
                Map.of("id", savedRider.getId(), "role", savedRider.getRole(), "type", "rider")
            );
            return ResponseEntity.status(201).body(Map.of(
                "id", savedRider.getId(),
                "username", savedRider.getUsername(),
                "email", savedRider.getEmail(),
                "role", savedRider.getRole(),
                "token", token
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Registration failed: " + e.getMessage());
        }
    }

    // --- Login Rider ---
    @PostMapping("/login")
    @Operation(summary = "Login rider and return token")
    public ResponseEntity<?> loginRider(@Valid @RequestBody LoginRequest credentials) {
        String email = credentials.getEmail();
        String password = credentials.getPassword();
        String role = credentials.getRole(); // optional

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body("Missing credentials");
        }

        try {
            Rider rider = service.login(email, password, role)
                    .orElse(null);
            if (rider == null) {
                return ResponseEntity.status(401).body("Invalid credentials");
            }
            String token = jwtService.generateToken(
                rider.getEmail(),
                Map.of("id", rider.getId(), "role", rider.getRole(), "type", "rider")
            );
            return ResponseEntity.ok(Map.of(
                "id", rider.getId(),
                "username", rider.getUsername(),
                "email", rider.getEmail(),
                "role", rider.getRole(),
                "token", token
            ));
        } catch (Exception ex) {
            return ResponseEntity.status(500).body("Login failed: " + ex.getMessage());
        }
    }

    // --- Get Rider Profile ---
    @GetMapping("/{id}")
    public ResponseEntity<?> getRider(@PathVariable Long id) {
        Optional<Rider> riderOpt = service.findById(id);
        if (riderOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Rider not found");
        }
        Rider rider = riderOpt.get();
        Map<String, Object> riderMap = new HashMap<>();
        riderMap.put("id", rider.getId());
        riderMap.put("username", rider.getUsername());
        riderMap.put("email", rider.getEmail());
        riderMap.put("role", rider.getRole());
        riderMap.put("phone", rider.getPhone());
        riderMap.put("age", rider.getAge());
        riderMap.put("location", rider.getLocation());
        riderMap.put("avatar", rider.getAvatar());
        return ResponseEntity.ok(Map.of("success", true, "rider", riderMap));
    }

    // --- Update Rider Profile ---
    @PutMapping("/{id}")
    public ResponseEntity<?> updateRider(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        Optional<Rider> riderOpt = service.findById(id);
        if (riderOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Rider not found");
        }
        Rider rider = riderOpt.get();

        if (updates.containsKey("username")) rider.setUsername((String) updates.get("username"));
        if (updates.containsKey("email")) rider.setEmail((String) updates.get("email"));
        if (updates.containsKey("avatar")) rider.setAvatar((String) updates.get("avatar"));
        if (updates.containsKey("phone")) rider.setPhone((String) updates.get("phone"));
        if (updates.containsKey("age")) {
            Object ageObj = updates.get("age");
            if (ageObj instanceof Integer) {
                rider.setAge((Integer) ageObj);
            } else if (ageObj instanceof String && !((String) ageObj).isEmpty()) {
                rider.setAge(Integer.parseInt((String) ageObj));
            }
        }
        if (updates.containsKey("location")) rider.setLocation((String) updates.get("location"));

        service.save(rider);

        Map<String, Object> riderMap = new HashMap<>();
        riderMap.put("id", rider.getId());
        riderMap.put("username", rider.getUsername());
        riderMap.put("email", rider.getEmail());
        riderMap.put("role", rider.getRole());
        riderMap.put("phone", rider.getPhone());
        riderMap.put("age", rider.getAge());
        riderMap.put("location", rider.getLocation());
        riderMap.put("avatar", rider.getAvatar());

        return ResponseEntity.ok(Map.of("success", true, "rider", riderMap));
    }

    // --- Change Password ---
    @PostMapping("/{id}/change-password")
    public ResponseEntity<?> changePassword(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");

        Optional<Rider> riderOpt = service.findById(id);
        if (riderOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Rider not found"));
        }
        Rider rider = riderOpt.get();

        if (!passwordEncoder.matches(currentPassword, rider.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Current password is incorrect"));
        }

        rider.setPassword(passwordEncoder.encode(newPassword));
        service.save(rider);
        return ResponseEntity.ok(Map.of("success", true, "message", "Password updated"));
    }
}
