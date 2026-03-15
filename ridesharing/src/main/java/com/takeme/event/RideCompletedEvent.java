package com.takeme.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RideCompletedEvent {
    private String eventId; // Unique UUID for idempotency keys
    public String getEventId() {
		return eventId;
	}
	public void setEventId(String eventId) {
		this.eventId = eventId;
	}
	public Long getRideId() {
		return rideId;
	}
	public void setRideId(Long rideId) {
		this.rideId = rideId;
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
	public Double getAmount() {
		return amount;
	}
	public void setAmount(Double amount) {
		this.amount = amount;
	}
	public Double getDistanceKm() {
		return distanceKm;
	}
	public void setDistanceKm(Double distanceKm) {
		this.distanceKm = distanceKm;
	}
	public String getPaymentMethod() {
		return paymentMethod;
	}
	public void setPaymentMethod(String paymentMethod) {
		this.paymentMethod = paymentMethod;
	}
	public LocalDateTime getTimestamp() {
		return timestamp;
	}
	public void setTimestamp(LocalDateTime timestamp) {
		this.timestamp = timestamp;
	}
	private Long rideId;
    private Long riderId;
    private Long driverId;
    private Double amount;
    private Double distanceKm;
    private String paymentMethod;
    private LocalDateTime timestamp;
	 
}
