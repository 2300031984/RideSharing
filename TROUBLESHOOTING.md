# RideSharing Application - Troubleshooting Guide

## Issues Fixed

### 1. CSS Zoom and Scrolling Issues ✅
**Problem**: At 100% zoom, users couldn't scroll down on any page.
**Solution**: 
- Fixed `position: fixed` and `overflow: hidden` in Home.css
- Added proper scrolling to all pages
- Updated global CSS for better zoom behavior

### 2. Backend-Frontend Connection Issues ✅
**Problem**: API calls were failing, data not loading properly.
**Solution**:
- Fixed API endpoint URLs and error handling
- Added proper CORS configuration
- Improved error handling in frontend components
- Added fallback data for better user experience

### 3. Database Connection ✅
**Problem**: Database queries were not working properly.
**Solution**:
- Verified MySQL connection configuration
- Fixed JPA/Hibernate settings
- Added proper error handling for database operations

## How to Start the Application

### Prerequisites
- Java 17 or higher
- Node.js 16 or higher
- MySQL 8.0 or higher
- Maven 3.6 or higher

### Database Setup
1. Create a MySQL database named `rideshare`
2. Update database credentials in `ridesharing/src/main/resources/application.properties`:
   ```
   spring.datasource.username=your_username
   spring.datasource.password=your_password
   ```

### Starting the Application
1. **Windows**: Double-click `start.bat`
2. **Linux/Mac**: Run `./start.sh`

### Manual Start (if automated script fails)
1. **Backend**:
   ```bash
   cd ridesharing
   mvn spring-boot:run
   ```

2. **Frontend**:
   ```bash
   cd Forntend/RideSharing
   npm install
   npm run dev
   ```

## Common Issues and Solutions

### Issue 1: "Cannot connect to backend"
**Symptoms**: Frontend shows connection errors, API calls fail
**Solutions**:
1. Check if backend is running on port 8081
2. Verify CORS settings in SecurityConfig.java
3. Check firewall settings
4. Ensure database is connected

### Issue 2: "Database connection failed"
**Symptoms**: Backend fails to start, database errors
**Solutions**:
1. Verify MySQL is running
2. Check database credentials in application.properties
3. Ensure database `rideshare` exists
4. Check MySQL port (default 3306)

### Issue 3: "Frontend not loading"
**Symptoms**: Frontend doesn't start, npm errors
**Solutions**:
1. Run `npm install` in Forntend/RideSharing directory
2. Check Node.js version (16+ required)
3. Clear npm cache: `npm cache clean --force`
4. Delete node_modules and reinstall

### Issue 4: "Zoom/Scrolling issues"
**Symptoms**: Can't scroll at 100% zoom, content cut off
**Solutions**:
1. Clear browser cache
2. Check if CSS files are loading properly
3. Verify no conflicting CSS rules

## API Endpoints

### Authentication
- `POST /api/riders/signup` - Register new rider
- `POST /api/riders/login` - Login rider
- `POST /api/drivers/register` - Register new driver
- `POST /api/drivers/login` - Login driver

### User Management
- `GET /api/riders/{id}` - Get rider profile
- `PUT /api/riders/{id}` - Update rider profile
- `POST /api/riders/{id}/change-password` - Change password

### Driver Management
- `GET /api/drivers/{id}` - Get driver profile
- `PUT /api/drivers/{id}/status` - Update driver status

### Wallet Management
- `GET /api/users/{id}/wallet` - Get wallet balance
- `POST /api/users/{id}/wallet/add-funds` - Add funds
- `POST /api/users/{id}/wallet/deduct-funds` - Deduct funds

### Ride Management
- `GET /api/rides/requests` - Get ride requests
- `POST /api/rides/book` - Book a ride
- `GET /api/rides/user/{id}` - Get user rides

## Environment Variables

Create a `.env` file in `Forntend/RideSharing/` with:
```
VITE_API_URL=http://localhost:8081
```

## Testing the Application

1. **Home Page**: Should load with proper scrolling at all zoom levels
2. **Login/Signup**: Should work with proper validation
3. **User Dashboard**: Should display wallet balance and recent rides
4. **Driver Dashboard**: Should show status toggle and ride requests
5. **API Calls**: Should work without CORS errors

## Performance Tips

1. **Backend**: Ensure MySQL is optimized for your system
2. **Frontend**: Use browser dev tools to check for console errors
3. **Database**: Regular cleanup of old data
4. **Caching**: Consider adding Redis for session management

## Support

If you encounter issues not covered here:
1. Check browser console for errors
2. Check backend logs for database/API errors
3. Verify all prerequisites are installed
4. Ensure ports 8081 and 5173 are not blocked
