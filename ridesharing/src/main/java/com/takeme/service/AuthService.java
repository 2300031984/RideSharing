package com.takeme.service;

import com.takeme.dto.*;
import com.takeme.model.Driver;
import com.takeme.model.Rider;
import com.takeme.repository.DriverRepository;
import com.takeme.repository.RiderRepository;
import com.takeme.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {
    
    @Autowired
    private RiderRepository riderRepository;
    
    @Autowired
    private DriverRepository driverRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    
    
    public AuthResponse riderLogin(LoginRequest request) {
        Optional<Rider> riderOpt = riderRepository.findByEmail(request.getEmail().toLowerCase());
        
        if (riderOpt.isEmpty()) {
            throw new RuntimeException("Invalid email or password");
        }
        
        Rider rider = riderOpt.get();
        
        if (!passwordEncoder.matches(request.getPassword(), rider.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }
        
        if (!rider.getActive()) {
            throw new RuntimeException("Account is deactivated");
        }
        
        String token = jwtTokenProvider.generateToken(rider.getEmail(), rider.getRole(), rider.getId());
        
        // ✅ Consistent constructor order and argument count
        return new AuthResponse(
            rider.getId(),
            rider.getUsername(),
            rider.getEmail(),
            rider.getRole(),
            token,
            null,
            rider.getPhoneNumber(),
            rider.getAge(),
            rider.getLocation()
        );
    }

    
    public AuthResponse driverLogin(LoginRequest request) {
        Optional<Driver> driverOpt = driverRepository.findByEmail(request.getEmail().toLowerCase());
        
        if (driverOpt.isEmpty()) {
            throw new RuntimeException("Invalid email or password");
        }
        
        Driver driver = driverOpt.get();
        
        if (!passwordEncoder.matches(request.getPassword(), driver.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }
        
        if (!driver.getActive()) {
            throw new RuntimeException("Account is deactivated");
        }
        
        String token = jwtTokenProvider.generateToken(driver.getEmail(), driver.getRole(), driver.getId());
        
        return new AuthResponse(
            driver.getId(),
            driver.getName(),
            driver.getEmail(),
            driver.getRole(),
            token,
            driver.getVehicleType(),
            driver.getPhoneNumber(),
            null,
            null
        );
    }
    
    public AuthResponse riderSignup(SignupRequest request) {
        if (riderRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new RuntimeException("Email already exists");
        }
        
        Rider rider = new Rider();
        rider.setUsername(request.getUsername());
        rider.setEmail(request.getEmail().toLowerCase());
        rider.setPassword(passwordEncoder.encode(request.getPassword()));
        rider.setRole(request.getRole() != null ? request.getRole() : "User");
        rider.setPhoneNumber(request.getPhoneNumber());
        rider.setAge(request.getAge());
        rider.setLocation(request.getLocation());
        rider.setActive(true);
        
        rider = riderRepository.save(rider);
        
        String token = jwtTokenProvider.generateToken(rider.getEmail(), rider.getRole(), rider.getId());
        
        return new AuthResponse(
            rider.getId(),
            rider.getUsername(),
            rider.getEmail(),
            rider.getRole(),
            token,
            null,
            rider.getPhoneNumber(),
            rider.getAge(),
            rider.getLocation()
        );
    }
    
    public AuthResponse driverRegister(DriverRegisterRequest request) {
        if (driverRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new RuntimeException("Email already exists");
        }
        
        if (driverRepository.existsByLicenseNumber(request.getLicenseNumber())) {
            throw new RuntimeException("License number already registered");
        }
        
        Driver driver = new Driver();
        driver.setName(request.getName());
        driver.setEmail(request.getEmail().toLowerCase());
        driver.setPassword(passwordEncoder.encode(request.getPassword()));
        driver.setRole("Driver");
        driver.setLicenseNumber(request.getLicenseNumber());
        driver.setPhoneNumber(request.getPhoneNumber());
        driver.setVehicleType(request.getVehicleType());
        driver.setVehicleNumber(request.getVehicleNumber());
        driver.setVehicleModel(request.getVehicleModel());
        driver.setStatus(Driver.DriverStatus.OFFLINE);
        driver.setVerified(false);
        driver.setActive(true);
        
        driver = driverRepository.save(driver);
        
        String token = jwtTokenProvider.generateToken(driver.getEmail(), driver.getRole(), driver.getId());
        
        return new AuthResponse(
            driver.getId(),
            driver.getName(),
            driver.getEmail(),
            driver.getRole(),
            token,
            driver.getVehicleType(),
            driver.getPhoneNumber(),
            null,
            null
        );
    }
}
