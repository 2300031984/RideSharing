package com.takeme.repository;

import com.takeme.model.Ride;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RideRepository extends MongoRepository<Ride, String> {
    List<Ride> findByRiderId(String riderId);
    List<Ride> findByDriverId(String driverId);
    List<Ride> findByStatus(Ride.RideStatus status);
    
    List<Ride> findByStatusAndVehicleType(Ride.RideStatus status, String vehicleType);
    
    List<Ride> findByRiderIdOrderByCreatedAtDesc(String riderId);
    
    List<Ride> findByDriverIdOrderByCreatedAtDesc(String driverId);
    
    List<Ride> findByIsScheduledAndStatusOrderByScheduledDateTimeAsc(boolean isScheduled, Ride.RideStatus status);
    
    List<Ride> findByRiderIdAndStatus(String riderId, Ride.RideStatus status);
    List<Ride> findByRiderIdAndStatus(@Param("riderId") Long riderId, @Param("status") Ride.RideStatus status);
    
    @Query("SELECT r FROM Ride r WHERE r.driverId = :driverId AND r.status = :status")
    List<Ride> findByDriverIdAndStatus(String driverId, Ride.RideStatus status);
}
