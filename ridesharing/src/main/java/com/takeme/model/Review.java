package com.takeme.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Review {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Long getRideId() {
		return rideId;
	}

	public void setRideId(Long rideId) {
		this.rideId = rideId;
	}

	public Long getReviewerId() {
		return reviewerId;
	}

	public void setReviewerId(Long reviewerId) {
		this.reviewerId = reviewerId;
	}

	public Long getRevieweeId() {
		return revieweeId;
	}

	public void setRevieweeId(Long revieweeId) {
		this.revieweeId = revieweeId;
	}

	public Integer getRating() {
		return rating;
	}

	public void setRating(Integer rating) {
		this.rating = rating;
	}

	public String getComment() {
		return comment;
	}

	public void setComment(String comment) {
		this.comment = comment;
	}

	public String getReviewerType() {
		return reviewerType;
	}

	public void setReviewerType(String reviewerType) {
		this.reviewerType = reviewerType;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}

	@Column(nullable = false)
    private Long rideId;
    
    @Column(nullable = false)
    private Long reviewerId; // User who gives review
    
    @Column(nullable = false)
    private Long revieweeId; // Driver being reviewed
    
    @Column(nullable = false)
    private Integer rating; // 1-5
    
    @Column(length = 1000)
    private String comment;
    
    private String reviewerType; // RIDER or DRIVER
    
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

	
}
