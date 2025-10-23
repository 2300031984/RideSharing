# Scheduled Rides Feature

## Overview
This feature allows users to schedule rides for future dates and times, view their scheduled rides, and track whether a driver has been found and accepted the ride.

## Features Implemented

### Frontend Components

#### 1. ScheduledRides.jsx
- **Location**: `Forntend/RideSharing/src/pages/user/ScheduledRides.jsx`
- **Purpose**: Main page to view and manage scheduled rides
- **Features**:
  - Display all scheduled rides with status information
  - Filter rides by status (all, upcoming, completed, cancelled)
  - Show driver information when available
  - Time remaining until scheduled rides
  - Action buttons (reschedule, cancel, view details)
  - Special requests display
  - Responsive design with cards layout

#### 2. ScheduleRide.jsx (Enhanced)
- **Location**: `Forntend/RideSharing/src/pages/user/ScheduleRide.jsx`
- **Purpose**: Form to schedule new rides
- **Enhancements**:
  - Backend integration for saving scheduled rides
  - Fallback to localStorage if backend fails
  - Improved error handling

### Backend Components

#### 1. RideRequest Model (Enhanced)
- **Location**: `ridesharing/src/main/java/com/takeme/model/RideRequest.java`
- **New Fields**:
  - `scheduledAt`: LocalDateTime for scheduled date/time
  - `isScheduled`: Boolean flag to identify scheduled rides
- **Methods**: Added getters and setters for new fields

#### 2. RideController (Enhanced)
- **Location**: `ridesharing/src/main/java/com/takeme/controller/RideController.java`
- **New Endpoints**:
  - `POST /api/rides/book-scheduled`: Book a scheduled ride
  - `GET /api/rides/user/{userId}/scheduled`: Get scheduled rides for a user

#### 3. RideRequestService (Enhanced)
- **Location**: `ridesharing/src/main/java/com/takeme/service/RideRequestService.java`
- **New Methods**:
  - `bookScheduledRide()`: Create a scheduled ride
  - `listScheduledRides()`: Get scheduled rides for a user

#### 4. RideRequestRepository (Enhanced)
- **Location**: `ridesharing/src/main/java/com/takeme/repository/RideRequestRepository.java`
- **New Method**:
  - `findByPassengerIdAndIsScheduled()`: Query scheduled rides by user

### Navigation Integration

#### 1. App.jsx (Updated)
- **Location**: `Forntend/RideSharing/src/App.jsx`
- **Changes**:
  - Added import for ScheduledRides component
  - Added route `/user/scheduled-rides` with User role protection

#### 2. UserDashboard.jsx (Updated)
- **Location**: `Forntend/RideSharing/src/pages/user/UserDashboard.jsx`
- **Changes**:
  - Added "Scheduled Rides" launcher card
  - Updated grid layout to accommodate 6 cards
  - Added navigation to scheduled rides page

## Status System

### Ride Statuses
1. **Scheduled**: Ride is scheduled for future date/time
2. **Requested**: Ride request has been sent to drivers
3. **Accepted**: Driver has accepted the ride
4. **In Progress**: Ride is currently happening
5. **Completed**: Ride has been completed
6. **Cancelled**: Ride has been cancelled

### Driver Status
- **Driver Found**: Driver has been assigned and accepted
- **Driver Searching**: System is looking for available drivers
- **No Driver**: No driver has been assigned yet

## User Interface Features

### Status Indicators
- **Icons**: Each status has a unique icon (⏰, 🔍, 👨‍💼, 🚗, ✅, ❌)
- **Colors**: Status-specific color coding (blue, yellow, green, red)
- **Badges**: Clear status badges with appropriate styling

### Filtering System
- **All Rides**: Show all scheduled rides
- **Upcoming**: Show future rides that aren't completed/cancelled
- **Completed**: Show completed rides
- **Cancelled**: Show cancelled rides

### Time Display
- **Time Until**: Shows time remaining until scheduled ride
- **Format**: "X days left", "X hours left", "X minutes left"
- **Overdue**: Shows "Overdue" for past scheduled rides

### Action Buttons
- **Reschedule**: Available for scheduled rides
- **Cancel**: Available for scheduled rides
- **View Details**: Available for accepted/completed rides

## Data Flow

### Creating a Scheduled Ride
1. User fills out ScheduleRide form
2. Frontend sends POST to `/api/rides/book-scheduled`
3. Backend creates RideRequest with `isScheduled=true`
4. Frontend saves to localStorage as backup
5. User is redirected to dashboard

### Viewing Scheduled Rides
1. User navigates to `/user/scheduled-rides`
2. Frontend fetches from `/api/rides/user/{userId}/scheduled`
3. If backend fails, falls back to localStorage
4. Rides are displayed with status information
5. User can filter and interact with rides

## Testing

### Test Script
- **Location**: `Forntend/RideSharing/src/test-scheduled-rides.js`
- **Purpose**: Demonstrates functionality with mock data
- **Features**:
  - Status determination testing
  - Driver status testing
  - Filtering testing
  - Time calculation testing

### Manual Testing Steps
1. Navigate to `/user/scheduled-rides`
2. Use filter tabs to view different ride statuses
3. Test action buttons (reschedule, cancel, view details)
4. Verify driver information displays correctly
5. Check time calculations are accurate

## API Endpoints

### POST /api/rides/book-scheduled
- **Purpose**: Create a scheduled ride
- **Body**: 
  ```json
  {
    "passengerId": 1,
    "passengerName": "User",
    "pickupAddress": "123 Main St",
    "dropoffAddress": "456 Oak Ave",
    "scheduledDate": "2024-01-15",
    "scheduledTime": "09:00",
    "specialRequests": "Help with luggage"
  }
  ```

### GET /api/rides/user/{userId}/scheduled
- **Purpose**: Get scheduled rides for a user
- **Response**: Array of RideRequest objects with scheduled rides

## Error Handling

### Frontend
- Backend API failures fall back to localStorage
- User-friendly error messages via Toast component
- Loading states during API calls

### Backend
- Proper validation of scheduled date/time
- Error responses for invalid requests
- Database constraint handling

## Future Enhancements

### Potential Improvements
1. **Real-time Updates**: WebSocket integration for live status updates
2. **Driver Notifications**: Push notifications when drivers accept rides
3. **Advanced Scheduling**: Recurring rides, multiple stops
4. **Pricing**: Dynamic pricing for scheduled rides
5. **Analytics**: Usage statistics and reporting

### Backend Enhancements
1. **Scheduled Job**: Auto-process scheduled rides at their time
2. **Driver Matching**: Intelligent driver assignment for scheduled rides
3. **Notifications**: Email/SMS notifications for ride updates
4. **Cancellation Policies**: Time-based cancellation rules

## Dependencies

### Frontend
- React Router for navigation
- Local Storage for data persistence
- Fetch API for backend communication

### Backend
- Spring Boot for REST API
- JPA/Hibernate for database operations
- Spring Security for authentication

## Configuration

### Environment Variables
- `VITE_API_URL`: Backend API URL (default: http://localhost:8081)

### Database
- New columns in `ride_requests` table:
  - `scheduled_at`: DATETIME
  - `is_scheduled`: BOOLEAN

## Usage

1. **Schedule a Ride**:
   - Navigate to `/schedule-ride`
   - Fill out the form with pickup, dropoff, date, time
   - Submit to create scheduled ride

2. **View Scheduled Rides**:
   - Navigate to `/user/scheduled-rides`
   - Use filters to view different ride statuses
   - Interact with action buttons as needed

3. **Track Driver Status**:
   - View driver information when assigned
   - See real-time status updates
   - Contact driver if needed

This feature provides a complete solution for scheduling and managing rides with proper status tracking and driver assignment visibility.
