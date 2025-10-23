# Emergency System Backend Setup & Database Configuration

## 🗄️ Database Configuration

### Database Type: H2 In-Memory Database
- **URL**: `jdbc:h2:mem:testdb`
- **Driver**: `org.h2.Driver`
- **Username**: `sa`
- **Password**: (empty)
- **Console**: Available at `http://localhost:8081/h2-console`

### JPA/Hibernate Settings
- **DDL Mode**: `create-drop` (tables created on startup, dropped on shutdown)
- **Dialect**: `org.hibernate.dialect.H2Dialect`
- **SQL Logging**: Enabled for debugging

## 📊 Database Tables

### 1. Emergency Contacts Table (`emergency_contacts`)
```sql
CREATE TABLE emergency_contacts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    contact_number VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    relationship VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    is_emergency_service BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### 2. Incident Reports Table (`incident_reports`)
```sql
CREATE TABLE incident_reports (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    incident_type VARCHAR(255) NOT NULL,
    severity VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255),
    latitude DOUBLE,
    longitude DOUBLE,
    incident_date TIMESTAMP,
    driver_name VARCHAR(255),
    vehicle_number VARCHAR(255),
    ride_id BIGINT,
    contact_number VARCHAR(255),
    contact_email VARCHAR(255),
    status VARCHAR(255) DEFAULT 'PENDING',
    admin_notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### 3. Notifications Table (`notifications`)
```sql
CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    message VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    type VARCHAR(50),
    title VARCHAR(100)
);
```

## 🔧 Backend Services

### 1. Emergency Contact Service
- **Repository**: `EmergencyContactRepository`
- **Service**: `EmergencyContactService`
- **Endpoints**:
  - `GET /api/emergency/{userId}/contacts` - Get all contacts (system + user)
  - `POST /api/emergency/{userId}/contacts` - Add new contact
  - `PUT /api/emergency/{userId}/contacts/{contactId}` - Update contact
  - `DELETE /api/emergency/{userId}/contacts/{contactId}` - Delete contact

### 2. Incident Report Service
- **Repository**: `IncidentReportRepository`
- **Service**: `IncidentReportService`
- **Endpoints**:
  - `POST /api/emergency/{userId}/incidents` - Report incident
  - `GET /api/emergency/{userId}/incidents` - Get user incidents

### 3. Location Sharing Service
- **Endpoint**: `POST /api/emergency/{userId}/share-location`
- **Features**: Generate sharing URLs for WhatsApp, SMS, Email

### 4. SOS Alert Service
- **Endpoint**: `POST /api/emergency/{userId}/sos`
- **Features**: Send alerts to emergency contacts and authorities

## 🚀 Data Initialization

### Default Emergency Services
The system automatically initializes these emergency services on startup:
- **Police**: 100
- **Ambulance**: 108
- **Fire Service**: 101
- **Women Helpline**: 1091
- **Child Helpline**: 1098

These are stored with `userId = 0` to make them available to all users.

## 🌐 API Configuration

### Server Port
- **Backend**: `http://localhost:8081`
- **Frontend**: Configured to connect to port 8081

### CORS Configuration
- **Origins**: `*` (all origins allowed)
- **Headers**: All headers allowed
- **Methods**: All HTTP methods allowed

## 🔍 Health Check

### Endpoint
- `GET /api/emergency/health`
- **Response**: Service status and timestamp

## 📱 Frontend Integration

### Emergency Service (JavaScript)
- **File**: `Forntend/RideSharing/src/services/EmergencyService.js`
- **Base URL**: `http://localhost:8081/api`
- **Authentication**: JWT token from localStorage

### Components
- **Emergency Page**: `Forntend/RideSharing/src/pages/common/Emergency.jsx`
- **Contact Manager**: `Forntend/RideSharing/src/components/EmergencyContactManager.jsx`
- **Location Sharing**: `Forntend/RideSharing/src/components/LocationSharing.jsx`

## 🔐 Security Features

### Authentication
- JWT token required for all API calls
- User-specific data access (users can only access their own data)
- System emergency services available to all authenticated users

### Data Validation
- Required field validation
- Input sanitization
- SQL injection prevention through JPA

## 🚨 Emergency Features

### SOS Alert
- One-click emergency activation
- Automatic contact notification
- Location sharing with emergency contacts
- 5-minute auto-deactivation

### Location Services
- GPS location capture
- Accuracy tracking
- Multiple sharing methods (WhatsApp, SMS, Email)

### Incident Reporting
- Comprehensive incident types
- Severity levels
- Location capture
- Admin notification system

## 📋 Testing

### Database Console
1. Start the application
2. Navigate to `http://localhost:8081/h2-console`
3. Use credentials: `sa` / (empty password)
4. Connect to `jdbc:h2:mem:testdb`

### API Testing
- Use the health check endpoint: `GET /api/emergency/health`
- Test with Postman or similar tools
- All endpoints require valid JWT token

## 🔄 Data Flow

1. **User Access**: User navigates to Emergency page
2. **Data Loading**: System loads emergency services + user contacts
3. **User Actions**: User can add contacts, report incidents, share location
4. **Database Storage**: All data persisted in H2 database
5. **Real-time Updates**: Changes reflected immediately in UI

## 🛠️ Troubleshooting

### Common Issues
1. **Port Conflicts**: Ensure port 8081 is available
2. **Database Connection**: Check H2 console access
3. **CORS Issues**: Verify CORS configuration
4. **Authentication**: Ensure valid JWT token in localStorage

### Logs
- SQL queries logged to console
- Application logs show service initialization
- Error handling with detailed error messages
