# RideSharing Backend - Spring Boot Application

A comprehensive Spring Boot backend for a ride-sharing application with MySQL database, JWT authentication, and RESTful APIs.

## 🚀 Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (User, Driver, Admin)
- Secure password encryption with BCrypt
- Token-based session management

### User Management
- User registration and login
- Profile management for riders and drivers
- Wallet balance tracking
- Rating system

### Ride Management
- Real-time ride booking
- Scheduled ride booking
- Ride status tracking (Requested, Accepted, Started, Completed, Cancelled)
- OTP-based ride verification
- Distance and fare calculation
- Driver assignment
- Ride history

### Driver Features
- Driver registration with license verification
- Vehicle management
- Real-time location tracking
- Status management (Available, Busy, Offline)
- Earnings tracking
- Ride request acceptance

### Emergency & Safety
- Emergency contact management
- SOS alert system
- Incident reporting
- Location sharing

### Notifications
- Real-time notifications for ride updates
- Unread notification tracking
- Notification history

## 📋 Prerequisites

- Java 17 or higher
- Maven 3.6+
- MySQL 8.0+
- Git

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
cd RideSharing/ridesharing
```

### 2. Configure MySQL Database

Create a MySQL database:

```sql
CREATE DATABASE ridesharing_db;
```

### 3. Update Database Configuration

Edit `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/ridesharing_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC
spring.datasource.username=YOUR_MYSQL_USERNAME
spring.datasource.password=YOUR_MYSQL_PASSWORD
```

### 4. Update JWT Secret (Optional)

For production, change the JWT secret in `application.properties`:

```properties
jwt.secret=YOUR_CUSTOM_SECRET_KEY_MUST_BE_AT_LEAST_256_BITS
```

### 5. Build the Project

```bash
mvn clean install
```

### 6. Run the Application

```bash
mvn spring-boot:run
```

Or run the JAR file:

```bash
java -jar target/com.ridesharing-0.0.1-SNAPSHOT.jar
```

The server will start on `http://localhost:8081`

## 📚 API Documentation

### Base URL
```
http://localhost:8081/api
```

### Authentication Endpoints

#### Rider Login
```http
POST /api/riders/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "role": "User"
}
```

#### Rider Signup
```http
POST /api/riders/signup
Content-Type: application/json

{
  "username": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "User",
  "phoneNumber": "9876543210",
  "age": 25,
  "location": "Bangalore"
}
```

#### Driver Login
```http
POST /api/drivers/login
Content-Type: application/json

{
  "email": "driver@example.com",
  "password": "password123",
  "role": "Driver"
}
```

#### Driver Registration
```http
POST /api/drivers/register
Content-Type: application/json

{
  "name": "John Driver",
  "email": "driver@example.com",
  "password": "password123",
  "licenseNumber": "DL1234567890",
  "phoneNumber": "9876543210",
  "vehicleType": "Car",
  "vehicleNumber": "KA01AB1234",
  "vehicleModel": "Honda City"
}
```

### Ride Endpoints

#### Create Ride
```http
POST /api/rides
Authorization: Bearer {token}
Content-Type: application/json

{
  "riderId": 1,
  "pickupLocation": "MG Road, Bangalore",
  "dropoffLocation": "Koramangala, Bangalore",
  "pickupLatitude": 12.9716,
  "pickupLongitude": 77.5946,
  "dropoffLatitude": 12.9279,
  "dropoffLongitude": 77.6271,
  "vehicleType": "Car"
}
```

#### Book Scheduled Ride
```http
POST /api/rides/book-scheduled
Authorization: Bearer {token}
Content-Type: application/json

{
  "passengerId": 1,
  "passengerName": "John Doe",
  "pickupAddress": "MG Road, Bangalore",
  "dropoffAddress": "Koramangala, Bangalore",
  "pickupLatitude": 12.9716,
  "pickupLongitude": 77.5946,
  "dropoffLatitude": 12.9279,
  "dropoffLongitude": 77.6271,
  "vehicleType": "Car",
  "fare": 250,
  "scheduledDate": "2025-10-27",
  "scheduledTime": "14:30"
}
```

#### Get Ride by ID
```http
GET /api/rides/{rideId}
Authorization: Bearer {token}
```

#### Get Rider's Rides
```http
GET /api/rides/rider/{riderId}
Authorization: Bearer {token}
```

#### Get Available Ride Requests (for Drivers)
```http
GET /api/rides/requests?vehicleType=Car
Authorization: Bearer {token}
```

#### Accept Ride
```http
POST /api/rides/{rideId}/accept
Authorization: Bearer {token}
Content-Type: application/json

{
  "driverId": 1
}
```

#### Start Ride
```http
POST /api/rides/{rideId}/start
Authorization: Bearer {token}
```

#### Complete Ride
```http
POST /api/rides/{rideId}/complete
Authorization: Bearer {token}
```

#### Cancel Ride
```http
POST /api/rides/{rideId}/cancel?userId=1
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "User cancelled"
}
```

#### Rate Ride
```http
POST /api/rides/{rideId}/rate
Authorization: Bearer {token}
Content-Type: application/json

{
  "rating": 5
}
```

### Profile Endpoints

#### Get Profile
```http
GET /api/profile/{userId}?role=User
Authorization: Bearer {token}
```

#### Update Profile
```http
PUT /api/profile/{userId}?role=User
Authorization: Bearer {token}
Content-Type: application/json

{
  "username": "John Updated",
  "phoneNumber": "9876543210",
  "location": "Bangalore"
}
```

#### Get Available Vehicle Types
```http
GET /api/profile/vehicle-types?onlyAvailable=true
```

#### Update Driver Status
```http
PUT /api/drivers/{driverId}/status?status=AVAILABLE
Authorization: Bearer {token}
```

#### Update Driver Location
```http
PUT /api/drivers/{driverId}/location
Authorization: Bearer {token}
Content-Type: application/json

{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "location": "MG Road, Bangalore"
}
```

### Emergency Endpoints

#### Get Emergency Contacts
```http
GET /api/emergency/{userId}/contacts
Authorization: Bearer {token}
```

#### Add Emergency Contact
```http
POST /api/emergency/{userId}/contacts
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Emergency Contact",
  "phoneNumber": "9876543210",
  "relationship": "Family"
}
```

#### Update Emergency Contact
```http
PUT /api/emergency/{userId}/contacts/{contactId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Contact",
  "phoneNumber": "9876543211",
  "relationship": "Friend"
}
```

#### Delete Emergency Contact
```http
DELETE /api/emergency/{userId}/contacts/{contactId}
Authorization: Bearer {token}
```

#### Report Incident
```http
POST /api/emergency/{userId}/incidents
Authorization: Bearer {token}
Content-Type: application/json

{
  "rideId": 1,
  "incidentType": "Safety",
  "description": "Incident description",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "severity": "High"
}
```

#### Trigger SOS
```http
POST /api/emergency/{userId}/sos
Authorization: Bearer {token}
Content-Type: application/json

{
  "rideId": 1,
  "lat": 12.9716,
  "lng": 77.5946
}
```

### Notification Endpoints

#### Get User Notifications
```http
GET /api/users/{userId}/notifications
Authorization: Bearer {token}
```

#### Get Unread Notifications
```http
GET /api/users/{userId}/notifications/unread
Authorization: Bearer {token}
```

#### Mark Notification as Read
```http
POST /api/users/{userId}/notifications/{notificationId}/mark-read
Authorization: Bearer {token}
```

## 🗄️ Database Schema

### Tables
- **riders** - User accounts
- **drivers** - Driver accounts
- **rides** - Ride records
- **emergency_contacts** - Emergency contacts
- **incidents** - Incident reports
- **notifications** - User notifications
- **saved_places** - User saved locations

See `src/main/resources/schema.sql` for complete schema.

## 🔒 Security

- All sensitive endpoints require JWT authentication
- Passwords are encrypted using BCrypt
- CORS configured for frontend integration
- Role-based access control

## 🧪 Testing

### Test Accounts

**Test Rider:**
- Email: user@test.com
- Password: password123
- Role: User

**Test Driver:**
- Email: driver@test.com
- Password: password123
- Role: Driver

## 📦 Tech Stack

- **Framework:** Spring Boot 3.5.3
- **Database:** MySQL 8.0
- **Security:** Spring Security + JWT
- **ORM:** Hibernate/JPA
- **Build Tool:** Maven
- **Java Version:** 21

## 🔧 Configuration

### application.properties

Key configurations:
- Server port: `8081`
- Database: MySQL
- JWT expiration: 24 hours
- CORS origins: `http://localhost:5173`, `http://localhost:3000`

## 🚧 Troubleshooting

### Database Connection Issues
- Ensure MySQL is running
- Verify database credentials
- Check if port 3306 is available

### Port Already in Use
Change the port in `application.properties`:
```properties
server.port=8082
```

### JWT Token Errors
- Verify the JWT secret is at least 256 bits
- Check token expiration time
- Ensure Bearer token format in Authorization header

## 📝 License

This project is open-source and available for educational purposes.

## 👨‍💻 Developer Notes

### Project Structure
```
src/main/java/com/takeme/
├── config/           # Configuration classes
├── controller/       # REST controllers
├── dto/              # Data Transfer Objects
├── exception/        # Exception handlers
├── model/            # JPA entities
├── repository/       # Data repositories
├── security/         # Security & JWT
└── service/          # Business logic
```

### Adding New Features
1. Create entity in `model/`
2. Add repository in `repository/`
3. Implement service in `service/`
4. Create controller in `controller/`
5. Update DTOs as needed

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

---

**Happy Coding! 🚗💨**
