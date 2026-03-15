package com.takeme.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "incidents")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Incident {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long userId;
    
    private Long rideId;
    
    @Column(nullable = false)
    private String incidentType; // Safety, Accident, Other
    
    @Column(length = 1000)
    private String description;
    
    private Double latitude;
    private Double longitude;
    private String location;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IncidentStatus status = IncidentStatus.REPORTED;
    
    private String severity; // Low, Medium, High, Critical
    
    private String incidentTime; // Time of incident occurrence

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime reportedAt;
    
    private LocalDateTime resolvedAt;
    
    public enum IncidentStatus {
        REPORTED, UNDER_REVIEW, RESOLVED, CLOSED
    }

	
}
