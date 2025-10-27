package com.takeme.controller;

import com.takeme.dto.*;
import com.takeme.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class AuthController {
    
    @Autowired
    private AuthService authService;
    
    @PostMapping("/riders/login")
    public ResponseEntity<?> riderLogin(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.riderLogin(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(e.getMessage());
        }
    }
    
    @PostMapping("/riders/signup")
    public ResponseEntity<?> riderSignup(@Valid @RequestBody SignupRequest request) {
        try {
            AuthResponse response = authService.riderSignup(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(e.getMessage());
        }
    }
    
    @PostMapping("/drivers/login")
    public ResponseEntity<?> driverLogin(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.driverLogin(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(e.getMessage());
        }
    }
    
    @PostMapping("/drivers/register")
    public ResponseEntity<?> driverRegister(@Valid @RequestBody DriverRegisterRequest request) {
        try {
            AuthResponse response = authService.driverRegister(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(e.getMessage());
        }
    }
}
