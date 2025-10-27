-- RideSharing Database Schema
-- MySQL Database Creation Script

-- Create Database
CREATE DATABASE IF NOT EXISTS ridesharing_db;
USE ridesharing_db;

-- Riders Table
CREATE TABLE IF NOT EXISTS riders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'User',
    phone_number VARCHAR(20),
    age INT,
    location VARCHAR(255),
    profile_picture VARCHAR(500),
    wallet_balance DOUBLE DEFAULT 0.0,
    rating DOUBLE DEFAULT 0.0,
    total_rides INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Drivers Table
CREATE TABLE IF NOT EXISTS drivers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Driver',
    license_number VARCHAR(100) UNIQUE,
    phone_number VARCHAR(20),
    vehicle_type VARCHAR(50),
    vehicle_number VARCHAR(50),
    vehicle_model VARCHAR(100),
    profile_picture VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'OFFLINE',
    current_latitude DOUBLE,
    current_longitude DOUBLE,
    current_location VARCHAR(255),
    wallet_balance DOUBLE DEFAULT 0.0,
    rating DOUBLE DEFAULT 0.0,
    total_rides INT DEFAULT 0,
    total_earnings DOUBLE DEFAULT 0.0,
    verified BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_vehicle_type (vehicle_type),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Rides Table
CREATE TABLE IF NOT EXISTS rides (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rider_id BIGINT NOT NULL,
    rider_name VARCHAR(255),
    driver_id BIGINT,
    driver_name VARCHAR(255),
    pickup_address VARCHAR(500) NOT NULL,
    dropoff_address VARCHAR(500) NOT NULL,
    pickup_latitude DOUBLE,
    pickup_longitude DOUBLE,
    dropoff_latitude DOUBLE,
    dropoff_longitude DOUBLE,
    vehicle_type VARCHAR(50),
    vehicle_number VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'REQUESTED',
    fare DOUBLE DEFAULT 0.0,
    distance DOUBLE,
    duration INT,
    otp VARCHAR(10),
    is_scheduled BOOLEAN DEFAULT FALSE,
    scheduled_date VARCHAR(20),
    scheduled_time VARCHAR(20),
    scheduled_date_time TIMESTAMP,
    accepted_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason VARCHAR(500),
    cancelled_by VARCHAR(50),
    rating INT,
    review TEXT,
    payment_method VARCHAR(50),
    payment_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_rider_id (rider_id),
    INDEX idx_driver_id (driver_id),
    INDEX idx_status (status),
    INDEX idx_vehicle_type (vehicle_type),
    INDEX idx_is_scheduled (is_scheduled),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (rider_id) REFERENCES riders(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Emergency Contacts Table
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    relationship VARCHAR(100),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Incidents Table
CREATE TABLE IF NOT EXISTS incidents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    ride_id BIGINT,
    incident_type VARCHAR(100) NOT NULL,
    description TEXT,
    latitude DOUBLE,
    longitude DOUBLE,
    location VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'REPORTED',
    severity VARCHAR(20),
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_ride_id (ride_id),
    INDEX idx_status (status),
    FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message VARCHAR(500),
    type VARCHAR(50),
    related_ride_id BIGINT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (related_ride_id) REFERENCES rides(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Saved Places Table
CREATE TABLE IF NOT EXISTS saved_places (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500) NOT NULL,
    latitude DOUBLE,
    longitude DOUBLE,
    type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample Data (Optional - for testing)
-- Insert a test rider
INSERT IGNORE INTO riders (username, email, password, role, phone_number, active) 
VALUES ('Test User', 'user@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'User', '9876543210', TRUE);

-- Insert a test driver
INSERT IGNORE INTO drivers (name, email, password, role, license_number, phone_number, vehicle_type, vehicle_number, status, active) 
VALUES ('Test Driver', 'driver@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Driver', 'DL1234567890', '9876543211', 'Car', 'KA01AB1234', 'AVAILABLE', TRUE);

-- Note: Default password for both test accounts is 'password123'

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL,
    amount DOUBLE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    ride_id BIGINT,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    description VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_ride_id (ride_id),
    INDEX idx_status (status),
    FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ride_id BIGINT NOT NULL,
    reviewer_id BIGINT NOT NULL,
    reviewee_id BIGINT NOT NULL,
    rating INT NOT NULL,
    comment TEXT,
    reviewer_type VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ride_id (ride_id),
    INDEX idx_reviewer_id (reviewer_id),
    INDEX idx_reviewee_id (reviewee_id),
    FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
