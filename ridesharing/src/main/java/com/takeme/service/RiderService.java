package com.takeme.service;

import com.takeme.model.Rider;
import com.takeme.repository.RiderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

@Service
public class RiderService {

    @Autowired
    private RiderRepository repo;

    @Autowired
    private WalletService walletService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ✅ Register rider and auto-create wallet
    public Rider register(Rider rider) {
        // Ensure default role if not set
        if (rider.getRole() == null || rider.getRole().isEmpty()) {
            rider.setRole("User");
        }
        // Hash password
        rider.setPassword(passwordEncoder.encode(rider.getPassword()));
        Rider savedRider = repo.save(rider);
        walletService.getWallet(savedRider.getId()); // Wallet starts at ₹0
        return savedRider;
    }

    // ✅ Simple login check (email, password). If role provided, compare case-insensitively; otherwise ignore.
    public Optional<Rider> login(String email, String password, String role) {
        Optional<Rider> opt = repo.findByEmail(email);
        if (opt.isEmpty()) return Optional.empty();
        Rider r = opt.get();
        boolean roleOk = true;
        if (role != null && !role.isBlank()) {
            roleOk = r.getRole() != null && r.getRole().equalsIgnoreCase(role);
        }
        boolean pwOk = passwordEncoder.matches(password, r.getPassword());
        return (roleOk && pwOk) ? Optional.of(r) : Optional.empty();
    }

    // ✅ Find rider by email
    public Optional<Rider> findByEmail(String email) {
        return repo.findByEmail(email);
    }

    // ✅ Find rider by ID
    public Optional<Rider> findById(Long id) {
        return repo.findById(id);
    }

    // ✅ Save/update rider
    public Rider save(Rider rider) {
        return repo.save(rider);
    }
}
