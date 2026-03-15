package com.takeme.config;

import com.takeme.model.Driver;
import com.takeme.model.Rider;
import com.takeme.repository.DriverRepository;
import com.takeme.repository.RiderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private RiderRepository riderRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        seedDemoRider();
        seedDemoDriver();
    }

    private void seedDemoRider() {
        String email = "rider@example.com";
        Optional<Rider> existing = riderRepository.findByEmail(email);
        
        if (existing.isEmpty()) {
            Rider rider = new Rider();
            rider.setUsername("Demo Rider");
            rider.setEmail(email);
            rider.setPassword(passwordEncoder.encode("password123"));
            rider.setRole("User");
            rider.setPhoneNumber("1234567890");
            rider.setAge(25);
            rider.setLocation("California, USA");
            rider.setActive(true);
            riderRepository.save(rider);
            System.out.println("✅ Demo Rider created: " + email);
        }
    }

    private void seedDemoDriver() {
        String email = "driver@example.com";
        Optional<Driver> existing = driverRepository.findByEmail(email);
        
        if (existing.isEmpty()) {
            Driver driver = new Driver();
            driver.setName("Demo Driver");
            driver.setEmail(email);
            driver.setPassword(passwordEncoder.encode("password123"));
            driver.setRole("Driver");
            driver.setLicenseNumber("DL123456789");
            driver.setPhoneNumber("0987654321");
            driver.setVehicleType("SUV");
            driver.setVehicleNumber("CA-9999");
            driver.setVehicleModel("Tesla Model Y");
            driver.setStatus(Driver.DriverStatus.OFFLINE);
            driver.setVerified(true);
            driver.setActive(true);
            driverRepository.save(driver);
            System.out.println("✅ Demo Driver created: " + email);
        }
    }
}
