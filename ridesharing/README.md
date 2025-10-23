# Ride Sharing Backend

A Spring Boot REST API for a ride sharing application with JWT authentication, real-time ride management, and wallet functionality.

## Features

- **User Management**: Rider and Driver registration/authentication
- **Ride Management**: Book, accept, track, and complete rides
- **Real-time Updates**: Live ride status tracking
- **Wallet System**: Digital wallet for payments
- **JWT Security**: Secure authentication and authorization
- **Database**: H2 in-memory database for development

## Tech Stack

- Java 21
- Spring Boot 3.5.3
- Spring Security
- Spring Data JPA
- H2 Database
- JWT (JJWT)
- Maven

## Quick Start

### Prerequisites
- Java 21+
- Maven 3.6+

### Running the Application

1. **Clone and navigate to the backend directory:**
   ```bash
   cd ridesharing
   ```

2. **Run the application:**
   ```bash
   mvn spring-boot:run
   ```

3. **Access the application:**
   - API Base URL: `http://localhost:8081`
   - H2 Console: `http://localhost:8081/h2-console`
   - Swagger UI: `http://localhost:8081/swagger-ui.html`

### Environment Variables

You can customize the application using environment variables:

```bash
# Database
export DB_URL=jdbc:h2:mem:ridesharing
export DB_USERNAME=sa
export DB_PASSWORD=

# Server
export SERVER_PORT=8081

# JWT
export JWT_SECRET=your-secret-key
export JWT_EXPIRATION=86400000

# CORS
export CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration

### Riders
- `GET /api/riders/{id}` - Get rider details
- `POST /api/riders` - Create rider
- `PUT /api/riders/{id}` - Update rider

### Drivers
- `GET /api/drivers/{id}` - Get driver details
- `POST /api/drivers` - Create driver
- `PUT /api/drivers/{id}/status` - Update driver status

### Rides
- `POST /api/rides` - Book a ride
- `GET /api/rides/requests` - Get available ride requests
- `POST /api/rides/{id}/accept` - Accept a ride
- `POST /api/rides/{id}/arrived` - Mark as arrived
- `POST /api/rides/{id}/start` - Start ride
- `POST /api/rides/{id}/complete` - Complete ride

### Wallet
- `GET /api/users/{id}/wallet` - Get wallet balance
- `POST /api/users/{id}/wallet/add-funds` - Add funds

## Database Schema

The application uses JPA entities for:
- **Rider**: User information and preferences
- **Driver**: Driver details and status
- **RideRequest**: Ride booking and tracking
- **Wallet**: User wallet and transactions
- **Review**: Ride reviews and ratings
- **Notification**: System notifications

## Security

- JWT-based authentication
- Role-based access control (Rider/Driver/Admin)
- CORS configuration for frontend integration
- Password encryption using BCrypt

## Development

### Building
```bash
mvn clean package
```

### Testing
```bash
mvn test
```

### Docker
```bash
docker build -t ridesharing-backend .
docker run -p 8081:8081 ridesharing-backend
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

