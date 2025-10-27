package com.takeme.repository;

import com.takeme.model.Ride;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RideRepository extends JpaRepository<Ride, Long> {
    List<Ride> findByRiderId(Long riderId);
    List<Ride> findByDriverId(Long driverId);
    List<Ride> findByStatus(Ride.RideStatus status);
    
    @Query("SELECT r FROM Ride r WHERE r.status = :status AND r.vehicleType = :vehicleType")
    List<Ride> findByStatusAndVehicleType(@Param("status") Ride.RideStatus status, @Param("vehicleType") String vehicleType);
    
    @Query("SELECT r FROM Ride r WHERE r.riderId = :riderId ORDER BY r.createdAt DESC")
    List<Ride> findByRiderIdOrderByCreatedAtDesc(@Param("riderId") Long riderId);
    
    @Query("SELECT r FROM Ride r WHERE r.driverId = :driverId ORDER BY r.createdAt DESC")
    List<Ride> findByDriverIdOrderByCreatedAtDesc(@Param("driverId") Long driverId);
    
    @Query("SELECT r FROM Ride r WHERE r.isScheduled = true AND r.status = 'REQUESTED' ORDER BY r.scheduledDateTime ASC")
    List<Ride> findScheduledRides();
    
    @Query("SELECT r FROM Ride r WHERE r.riderId = :riderId AND r.status = :status")
    List<Ride> findByRiderIdAndStatus(@Param("riderId") Long riderId, @Param("status") Ride.RideStatus status);
    
    @Query("SELECT r FROM Ride r WHERE r.driverId = :driverId AND r.status = :status")
    List<Ride> findByDriverIdAndStatus(@Param("driverId") Long driverId, @Param("status") Ride.RideStatus status);
}
