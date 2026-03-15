package com.takeme.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "rides")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Ride {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long riderId;
    
    private String riderName;
    
    private Long driverId;
    private String driverName;
    
    @Column(nullable = false)
    private String pickupAddress;
    
    @Column(nullable = false)
    private String dropoffAddress;
    
    private Double pickupLatitude;
    private Double pickupLongitude;
    private Double dropoffLatitude;
    private Double dropoffLongitude;
    
    private String vehicleType;
    private String vehicleNumber;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RideStatus status = RideStatus.REQUESTED;
    
    @Column(columnDefinition = "DOUBLE DEFAULT 0.0")
    private Double fare = 0.0;
    
    private Double distance; // in kilometers
    private Integer duration; // in minutes
    
    private String otp;
    
    private Boolean isScheduled = false;
    private String scheduledDate;
    private String scheduledTime;
    private LocalDateTime scheduledDateTime;
    
    private LocalDateTime acceptedAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime cancelledAt;
    
    private String cancellationReason;
    private String cancelledBy; // Rider or Driver
    
    private Integer rating;
    private String review;
    
    private String paymentMethod;
    private String paymentStatus;
    
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    public enum RideStatus {
        REQUESTED, ACCEPTED, STARTED, COMPLETED, CANCELLED
    }

}
