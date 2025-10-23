package com.takeme.repository;

import com.takeme.model.Ride;
import com.takeme.model.RideStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RideRepository extends JpaRepository<Ride, Long> {
    
    // Find rides by rider ID
    List<Ride> findByRiderIdOrderByCreatedAtDesc(Long riderId);
    
    // Find rides by driver ID
    List<Ride> findByDriverIdOrderByCreatedAtDesc(Long driverId);
    
    // Find rides by status
    List<Ride> findByStatusOrderByCreatedAtDesc(RideStatus status);

    // Find rides by status and vehicle type
    List<Ride> findByStatusAndVehicleTypeOrderByCreatedAtDesc(RideStatus status, String vehicleType);
    
    // Find active rides for a rider (not completed or cancelled)
    @Query("SELECT r FROM Ride r WHERE r.riderId = :riderId AND r.status NOT IN ('COMPLETED', 'CANCELLED') ORDER BY r.createdAt DESC")
    List<Ride> findActiveRidesByRiderId(@Param("riderId") Long riderId);
    
    // Find active rides for a driver (not completed or cancelled)
    @Query("SELECT r FROM Ride r WHERE r.driverId = :driverId AND r.status NOT IN ('COMPLETED', 'CANCELLED') ORDER BY r.createdAt DESC")
    List<Ride> findActiveRidesByDriverId(@Param("driverId") Long driverId);
    
    // Find rides by rider ID and status
    List<Ride> findByRiderIdAndStatusOrderByCreatedAtDesc(Long riderId, RideStatus status);
    
    // Find rides by driver ID and status
    List<Ride> findByDriverIdAndStatusOrderByCreatedAtDesc(Long driverId, RideStatus status);
    
    // Find recent rides for a rider (last 30 days)
    @Query("SELECT r FROM Ride r WHERE r.riderId = :riderId AND r.createdAt >= :since ORDER BY r.createdAt DESC")
    List<Ride> findRecentRidesByRiderId(@Param("riderId") Long riderId, @Param("since") LocalDateTime since);
    
    // Find recent rides for a driver (last 30 days)
    @Query("SELECT r FROM Ride r WHERE r.driverId = :driverId AND r.createdAt >= :since ORDER BY r.createdAt DESC")
    List<Ride> findRecentRidesByDriverId(@Param("driverId") Long driverId, @Param("since") LocalDateTime since);
    
    // Find rides by status and date range
    @Query("SELECT r FROM Ride r WHERE r.status = :status AND r.createdAt BETWEEN :startDate AND :endDate ORDER BY r.createdAt DESC")
    List<Ride> findByStatusAndDateRange(@Param("status") RideStatus status, 
                                       @Param("startDate") LocalDateTime startDate, 
                                       @Param("endDate") LocalDateTime endDate);
}
