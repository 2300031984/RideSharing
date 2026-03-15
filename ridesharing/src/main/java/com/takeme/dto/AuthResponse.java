package com.takeme.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
	private Long id;
    private String username;
    private String email;
    private String role;
    private String token;
    private String vehicleType;
    private String phone;
    private Integer age;
    private String location;
    
    public AuthResponse(Long id, String name, String email, String role, String token, String vehicleType) {
        this.id = id;
        this.username = name;
        this.email = email;
        this.role = role;
        this.token = token;
        this.vehicleType = vehicleType;
    }
}
