package com.takeme.repository;

import com.takeme.model.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Long> {
    Optional<Driver> findByEmail(String email);

    @Query("SELECT DISTINCT d.vehicleType FROM Driver d WHERE d.vehicleType IS NOT NULL")
    List<String> findDistinctVehicleTypes();

    @Query("SELECT DISTINCT d.vehicleType FROM Driver d WHERE d.vehicleType IS NOT NULL AND d.status = com.takeme.model.DriverStatus.AVAILABLE")
    List<String> findDistinctVehicleTypesOfAvailableDrivers();
}
