package com.takeme.repository;

import com.takeme.model.Driver;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DriverRepository extends MongoRepository<Driver, String> {
    Optional<Driver> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByLicenseNumber(String licenseNumber);
    
    List<Driver> findByStatus(Driver.DriverStatus status);
    Optional<Driver> findByFcmToken(String fcmToken);
    List<Driver> findByVehicleType(String vehicleType);
    
    @Query("SELECT DISTINCT d.vehicleType FROM Driver d WHERE d.vehicleType IS NOT NULL AND d.active = true")
    List<String> findDistinctVehicleTypes();
    
    @Query("SELECT DISTINCT d.vehicleType FROM Driver d WHERE d.vehicleType IS NOT NULL AND d.status = 'AVAILABLE' AND d.active = true")
    List<String> findAvailableVehicleTypes();
}
