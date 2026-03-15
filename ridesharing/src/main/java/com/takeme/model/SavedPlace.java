package com.takeme.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "saved_places")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SavedPlace {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long userId;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private String address;
    
    private Double latitude;
    private Double longitude;
    
    private String type; // home, work, gym, other
    
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;


}
