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
