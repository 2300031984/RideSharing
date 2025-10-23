package com.takeme.exception;

public class ErrorResponse {
    private String message;
    private String error;
    private int status;
    private Object details;
    
    // Default constructor
    public ErrorResponse() {}
    
    // Constructor with all parameters
    public ErrorResponse(String message, String error, int status, Object details) {
        this.message = message;
        this.error = error;
        this.status = status;
        this.details = details;
    }
    
    // Getters and setters
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public String getError() {
        return error;
    }
    
    public void setError(String error) {
        this.error = error;
    }
    
    public int getStatus() {
        return status;
    }
    
    public void setStatus(int status) {
        this.status = status;
    }
    
    public Object getDetails() {
        return details;
    }
    
    public void setDetails(Object details) {
        this.details = details;
    }
}
