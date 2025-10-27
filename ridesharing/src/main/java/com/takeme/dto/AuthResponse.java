package com.takeme.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
	
	public Long getId() {
		return id;
	}
	public void setId(Long id) {
		this.id = id;
	}
	public String getUsername() {
		return username;
	}
	public void setUsername(String username) {
		this.username = username;
	}
	public String getEmail() {
		return email;
	}
	public void setEmail(String email) {
		this.email = email;
	}
	public String getRole() {
		return role;
	}
	public void setRole(String role) {
		this.role = role;
	}
	public String getToken() {
		return token;
	}
	public void setToken(String token) {
		this.token = token;
	}
	public String getVehicleType() {
		return vehicleType;
	}
	public void setVehicleType(String vehicleType) {
		this.vehicleType = vehicleType;
	}
	public String getPhone() {
		return phone;
	}
	public void setPhone(String phone) {
		this.phone = phone;
	}
	public Integer getAge() {
		return age;
	}
	public void setAge(Integer age) {
		this.age = age;
	}
	public String getLocation() {
		return location;
	}
	public void setLocation(String location) {
		this.location = location;
	}
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
    
    public AuthResponse(Long id, String name, String email, String role, String token, String vehicleType, String phone, Integer age, String location) {
        this.id = id;
        this.username = name;
        this.email = email;
        this.role = role;
        this.token = token;
        this.vehicleType = vehicleType;
        this.phone = phone;
        this.age = age;
        this.location = location;
    }
	

}
