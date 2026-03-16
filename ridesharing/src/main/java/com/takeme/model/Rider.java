package com.takeme.model;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Document(collection = "riders")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Rider {
	
	@Id
    private String id;
    
    private String username;
    
    private String email;
    
    private String password;
    
    private String role = "User"; // User, Admin
    
    private String phoneNumber;
    private Integer age;
    private String location;
    private String profilePicture;
    
    private Double walletBalance = 0.0;
    
    private Double rating = 0.0;
    
    private Integer totalRides = 0;
    
    private Boolean active = true;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    private String fcmToken;
