package com.takeme.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "notifications")
public class Notification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId; // recipient

    @Column(length = 500)
    private String message;

    @Column(name = "is_read")
    private boolean read = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Optional: Add more fields as needed
    @Column(length = 50)
    private String type; // e.g., "ride_request", "payment", "system"

    @Column(length = 100)
    private String title; // e.g., "New Ride Request", "Payment Successful"

    // Constructor for creating notifications
    public Notification(Long userId, String message, String type, String title) {
        this.userId = userId;
        this.message = message;
        this.type = type;
        this.title = title;
        this.read = false;
        this.createdAt = LocalDateTime.now();
    }

}