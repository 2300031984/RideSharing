# Ride Sharing Application

A full-stack ride sharing application built with React and Spring Boot, featuring real-time ride tracking, user management, and digital wallet functionality.

## 🚀 Features

### For Riders
- **Easy Ride Booking**: Select pickup and dropoff locations with interactive maps
- **Real-time Tracking**: Live updates on ride status and driver location
- **Digital Wallet**: Secure payment system with fund management
- **Ride History**: Complete history of past rides with ratings
- **Profile Management**: Update personal information and preferences

### For Drivers
- **Ride Requests**: View and accept available ride requests
- **Status Management**: Go online/offline and manage availability
- **Ride Management**: Start, complete, and track rides
- **Earnings Tracking**: Monitor ride earnings and performance
- **Location Updates**: Real-time location sharing

### For Admins
- **Dashboard**: System overview with analytics and metrics
- **User Management**: Manage riders and drivers
- **Ride Monitoring**: Monitor all active and completed rides
- **System Analytics**: Track usage patterns and performance

## 🛠️ Tech Stack

### Frontend
- **React 19.1.0** - Modern UI library
- **Vite 7.0.4** - Fast build tool and dev server
- **React Router DOM 7.7.0** - Client-side routing
- **Mapbox GL JS 2.13.0** - Interactive maps
- **Axios 1.10.0** - HTTP client
- **Tailwind CSS 4.1.11** - Utility-first CSS framework

### Backend
- **Java 21** - Programming language
- **Spring Boot 3.5.3** - Application framework
- **Spring Security** - Authentication and authorization
- **Spring Data JPA** - Data persistence
- **H2 Database** - In-memory database for development
- **JWT (JJWT)** - JSON Web Token authentication
- **Maven** - Build and dependency management

## 📁 Project Structure

```
RideSharing-/
├── ridesharing/                 # Spring Boot Backend
│   ├── src/main/java/com/takeme/
│   │   ├── config/             # Configuration classes
│   │   ├── controller/         # REST controllers
│   │   ├── dto/               # Data Transfer Objects
│   │   ├── exception/         # Exception handling
│   │   ├── model/             # JPA entities
│   │   ├── repository/        # Data repositories
│   │   ├── security/          # Security configuration
│   │   └── service/           # Business logic
│   ├── src/main/resources/
│   │   └── application.properties
│   ├── pom.xml
│   └── README.md
├── Forntend/RideSharing/        # React Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/             # Page components
│   │   │   ├── common/        # Shared pages
│   │   │   ├── user/          # User-specific pages
│   │   │   ├── driver/        # Driver-specific pages
│   │   │   └── admin/         # Admin pages
│   │   ├── services/          # API service functions
│   │   ├── context/           # React context providers
│   │   ├── routes/            # Route configuration
│   │   └── Styles/            # CSS files
│   ├── package.json
│   └── README.md
└── README.md                   # This file
```

## 🚀 Quick Start

### Prerequisites
- Java 21+
- Node.js 18+
- Maven 3.6+

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd ridesharing
   ```

2. **Run the Spring Boot application:**
   ```bash
   mvn spring-boot:run
   ```

3. **Access the application:**
   - API Base URL: `http://localhost:8081`
   - H2 Console: `http://localhost:8081/h2-console`
   - Swagger UI: `http://localhost:8081/swagger-ui.html`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd Forntend/RideSharing
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` and configure:
   ```env
   VITE_API_URL=http://localhost:8081
   VITE_MAPBOX_TOKEN=your_mapbox_token_here
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:5173`

## 🔧 Configuration

### Backend Configuration

The backend uses environment variables for configuration. Key settings in `application.properties`:

```properties
# Database
spring.datasource.url=${DB_URL:jdbc:h2:mem:ridesharing}
spring.datasource.username=${DB_USERNAME:sa}
spring.datasource.password=${DB_PASSWORD:}

# Server
server.port=${SERVER_PORT:8081}

# JWT
app.jwt.secret=${JWT_SECRET:ridesharing-secret-key-change-in-production}
app.jwt.expirationMillis=${JWT_EXPIRATION:86400000}

# CORS
spring.web.cors.allowed-origins=${CORS_ORIGINS:http://localhost:3000,http://localhost:5173}
```

### Frontend Configuration

Environment variables in `.env`:

```env
VITE_API_URL=http://localhost:8081
VITE_MAPBOX_TOKEN=your_mapbox_token_here
VITE_APP_NAME=RideSharing
```

## 📱 API Endpoints

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

## 🗄️ Database Schema

The application uses JPA entities:

- **Rider**: User information and preferences
- **Driver**: Driver details and status
- **RideRequest**: Ride booking and tracking
- **Wallet**: User wallet and transactions
- **Review**: Ride reviews and ratings
- **Notification**: System notifications

## 🔐 Security

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Different access levels for Riders, Drivers, and Admins
- **CORS Configuration**: Secure cross-origin resource sharing
- **Password Encryption**: BCrypt password hashing

## 🚀 Deployment

### Docker Deployment

**Backend:**
```bash
cd ridesharing
docker build -t ridesharing-backend .
docker run -p 8081:8081 ridesharing-backend
```

**Frontend:**
```bash
cd Forntend/RideSharing
docker build -t ridesharing-frontend .
docker run -p 3000:80 ridesharing-frontend
```

### Production Considerations

1. **Database**: Replace H2 with PostgreSQL or MySQL
2. **Environment Variables**: Set secure production values
3. **HTTPS**: Enable SSL/TLS certificates
4. **Monitoring**: Add application monitoring and logging
5. **Scaling**: Consider load balancing and horizontal scaling

## 🧪 Testing

### Backend Testing
```bash
cd ridesharing
mvn test
```

### Frontend Testing
```bash
cd Forntend/RideSharing
npm run test
```

## 📈 Performance Features

- **Real-time Updates**: Polling mechanism for live ride tracking
- **Optimized Queries**: Efficient database queries with JPA
- **Caching**: Strategic caching for better performance
- **Responsive Design**: Mobile-first responsive UI
- **Code Splitting**: Lazy loading for better initial load times

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Backend Development**: Spring Boot, Java, JPA
- **Frontend Development**: React, Vite, Tailwind CSS
- **Database Design**: H2, JPA Entities
- **Authentication**: JWT, Spring Security
- **Maps Integration**: Mapbox GL JS

## 📞 Support

For support, email support@ridesharing.com or create an issue in the repository.

---

**Note**: This is a demo application for interview purposes. For production use, additional security measures, testing, and optimizations would be required.