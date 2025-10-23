package com.takeme.service;

import com.takeme.model.Driver;
import com.takeme.model.DriverStatus;
import com.takeme.repository.DriverRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

@Service
public class DriverService {

    @Autowired
    private DriverRepository driverRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    public Driver saveDriver(Driver driver) {
        // Ensure default role if not set
        if (driver.getRole() == null || driver.getRole().isEmpty()) {
            driver.setRole("Driver");
        }
        // Hash password before saving
        driver.setPassword(passwordEncoder.encode(driver.getPassword()));
        return driverRepository.save(driver);
    }

    public Optional<Driver> login(String email, String password, String role) {
        Optional<Driver> opt = driverRepository.findByEmail(email);
        if (opt.isEmpty()) return Optional.empty();
        Driver d = opt.get();
        boolean roleOk = true;
        if (role != null && !role.isBlank()) {
            roleOk = d.getRole() != null && d.getRole().equalsIgnoreCase(role);
        }
        boolean pwOk = passwordEncoder.matches(password, d.getPassword());
        return (roleOk && pwOk) ? Optional.of(d) : Optional.empty();
    }

    public Optional<Driver> findById(Long id) {
        return driverRepository.findById(id);
    }

    public Optional<Driver> findByEmail(String email) {
        return driverRepository.findByEmail(email);
    }

    public Driver updateStatus(Long id, DriverStatus status) {
        Driver d = driverRepository.findById(id).orElseThrow();
        d.setStatus(status);
        return driverRepository.save(d);
    }
}