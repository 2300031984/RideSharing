package com.takeme.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Entity
@Table(name = "rides")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ride {
    
    public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Long getRiderId() {
		return riderId;
	}

	public void setRiderId(Long riderId) {
		this.riderId = riderId;
	}

	public Long getDriverId() {
		return driverId;
	}

	public void setDriverId(Long driverId) {
		this.driverId = driverId;
	}

	public String getPickupLocation() {
		return pickupLocation;
	}

	public void setPickupLocation(String pickupLocation) {
		this.pickupLocation = pickupLocation;
	}

	public String getDropoffLocation() {
		return dropoffLocation;
	}

	public void setDropoffLocation(String dropoffLocation) {
		this.dropoffLocation = dropoffLocation;
	}

	public Double getPickupLatitude() {
		return pickupLatitude;
	}

	public void setPickupLatitude(Double pickupLatitude) {
		this.pickupLatitude = pickupLatitude;
	}

	public Double getPickupLongitude() {
		return pickupLongitude;
	}

	public void setPickupLongitude(Double pickupLongitude) {
		this.pickupLongitude = pickupLongitude;
	}

	public Double getDropoffLatitude() {
		return dropoffLatitude;
	}

	public void setDropoffLatitude(Double dropoffLatitude) {
		this.dropoffLatitude = dropoffLatitude;
	}

	public Double getDropoffLongitude() {
		return dropoffLongitude;
	}

	public void setDropoffLongitude(Double dropoffLongitude) {
		this.dropoffLongitude = dropoffLongitude;
	}

	public RideStatus getStatus() {
		return status;
	}

	public void setStatus(RideStatus status) {
		this.status = status;
	}

	public Double getFare() {
		return fare;
	}

	public void setFare(Double fare) {
		this.fare = fare;
	}

	public Double getDistance() {
		return distance;
	}

	public void setDistance(Double distance) {
		this.distance = distance;
	}

	public Integer getDuration() {
		return duration;
	}

	public void setDuration(Integer duration) {
		this.duration = duration;
	}

	public String getOtpCode() {
		return otpCode;
	}

	public void setOtpCode(String otpCode) {
		this.otpCode = otpCode;
	}

	public String getVehicleType() {
		return vehicleType;
	}

	public void setVehicleType(String vehicleType) {
		this.vehicleType = vehicleType;
	}

	public java.time.LocalDateTime getScheduledTime() {
		return scheduledTime;
	}

	public void setScheduledTime(java.time.LocalDateTime scheduledTime) {
		this.scheduledTime = scheduledTime;
	}

	public java.time.LocalDateTime getRequestedAt() {
		return requestedAt;
	}

	public void setRequestedAt(java.time.LocalDateTime requestedAt) {
		this.requestedAt = requestedAt;
	}

	public java.time.LocalDateTime getAcceptedAt() {
		return acceptedAt;
	}

	public void setAcceptedAt(java.time.LocalDateTime acceptedAt) {
		this.acceptedAt = acceptedAt;
	}

	public java.time.LocalDateTime getStartedAt() {
		return startedAt;
	}

	public void setStartedAt(java.time.LocalDateTime startedAt) {
		this.startedAt = startedAt;
	}

	public java.time.LocalDateTime getCompletedAt() {
		return completedAt;
	}

	public void setCompletedAt(java.time.LocalDateTime completedAt) {
		this.completedAt = completedAt;
	}

	public java.time.LocalDateTime getCancelledAt() {
		return cancelledAt;
	}

	public void setCancelledAt(java.time.LocalDateTime cancelledAt) {
		this.cancelledAt = cancelledAt;
	}

	public String getCancellationReason() {
		return cancellationReason;
	}

	public void setCancellationReason(String cancellationReason) {
		this.cancellationReason = cancellationReason;
	}

	public Double getCurrentDriverLatitude() {
		return currentDriverLatitude;
	}

	public void setCurrentDriverLatitude(Double currentDriverLatitude) {
		this.currentDriverLatitude = currentDriverLatitude;
	}

	public Double getCurrentDriverLongitude() {
		return currentDriverLongitude;
	}

	public void setCurrentDriverLongitude(Double currentDriverLongitude) {
		this.currentDriverLongitude = currentDriverLongitude;
	}

	public java.time.LocalDateTime getLastLocationAt() {
		return lastLocationAt;
	}

	public void setLastLocationAt(java.time.LocalDateTime lastLocationAt) {
		this.lastLocationAt = lastLocationAt;
	}

	public java.time.LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(java.time.LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}

	public java.time.LocalDateTime getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(java.time.LocalDateTime updatedAt) {
		this.updatedAt = updatedAt;
	}

	@Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "rider_id", nullable = false)
    private Long riderId;
    
    @Column(name = "driver_id")
    private Long driverId;
    
    @Column(name = "pickup_location", nullable = false)
    private String pickupLocation;
    
    @Column(name = "dropoff_location", nullable = false)
    private String dropoffLocation;
    
    @Column(name = "pickup_latitude")
    private Double pickupLatitude;
    
    @Column(name = "pickup_longitude")
    private Double pickupLongitude;
    
    @Column(name = "dropoff_latitude")
    private Double dropoffLatitude;
    
    @Column(name = "dropoff_longitude")
    private Double dropoffLongitude;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private RideStatus status = RideStatus.REQUESTED;
    
    @Column(name = "fare")
    private Double fare;
    
    @Column(name = "distance")
    private Double distance;
    
    @Column(name = "duration")
    private Integer duration; // in minutes

    // One-Time Password for starting the ride (driver verification)
    @Column(name = "otp_code")
    private String otpCode;
    
    @Column(name = "vehicle_type")
    private String vehicleType;
    
    @Column(name = "scheduled_time")
    private java.time.LocalDateTime scheduledTime;
    
    @Column(name = "requested_at")
    private java.time.LocalDateTime requestedAt;
    
    @Column(name = "accepted_at")
    private java.time.LocalDateTime acceptedAt;
    
    @Column(name = "started_at")
    private java.time.LocalDateTime startedAt;
    
    @Column(name = "completed_at")
    private java.time.LocalDateTime completedAt;
    
    @Column(name = "cancelled_at")
    private java.time.LocalDateTime cancelledAt;
    
    @Column(name = "cancellation_reason")
    private String cancellationReason;

    // Live tracking fields (optional simple implementation)
    @Column(name = "current_driver_latitude")
    private Double currentDriverLatitude;

    @Column(name = "current_driver_longitude")
    private Double currentDriverLongitude;

    @Column(name = "last_location_at")
    private java.time.LocalDateTime lastLocationAt;
    
    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
        updatedAt = java.time.LocalDateTime.now();
        if (requestedAt == null) {
            requestedAt = java.time.LocalDateTime.now();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = java.time.LocalDateTime.now();
    }

	

	
}
