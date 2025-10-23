# Profile Management API Documentation

## Overview
The Profile Management system provides comprehensive CRUD operations for user profiles in the RideSharing application. It supports both Rider and Driver profiles with unified API endpoints.

## API Endpoints

### Base URL
```
/api/profile
```

### 1. Get Profile by User ID
**GET** `/api/profile/{userId}?role={role}`

**Parameters:**
- `userId` (path): User ID
- `role` (query): User role ("RIDER", "User", or "DRIVER")

**Response:**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "age": 25,
  "location": "New York",
  "avatar": "avatar_url",
  "role": "RIDER"
}
```

### 2. Get Profile by Email
**GET** `/api/profile/email/{email}?role={role}`

**Parameters:**
- `email` (path): User email
- `role` (query): User role ("RIDER", "User", or "DRIVER")

### 3. Update Profile (Full Update)
**PUT** `/api/profile/{userId}?role={role}`

**Request Body:**
```json
{
  "username": "john_doe_updated",
  "phone": "+1234567890",
  "age": 26,
  "location": "Los Angeles",
  "avatar": "new_avatar_url"
}
```

### 4. Partial Update Profile
**PATCH** `/api/profile/{userId}?role={role}`

**Request Body:**
```json
{
  "phone": "+1234567890",
  "location": "San Francisco"
}
```

### 5. Check Profile Existence
**GET** `/api/profile/{userId}/exists?role={role}`

**Response:**
```json
{
  "exists": true
}
```

### 6. Get Current User Profile
**GET** `/api/profile/me?role={role}&userId={userId}`

### 7. Update Current User Profile
**PUT** `/api/profile/me?role={role}&userId={userId}`

## Profile Fields

### Common Fields (Rider & Driver)
- `id`: User ID
- `email`: Email address
- `role`: User role ("RIDER", "User", "DRIVER")

### Rider-Specific Fields
- `username`: Username
- `phone`: Phone number
- `age`: Age
- `location`: Current location
- `avatar`: Profile picture URL

### Driver-Specific Fields
- `name`: Full name
- `licenseNumber`: Driver's license number
- `status`: Driver status ("ONLINE", "OFFLINE", "BUSY")

### Extended Profile Fields (Available in ProfileDTO)
- `firstName`: First name
- `lastName`: Last name
- `dateOfBirth`: Date of birth
- `gender`: Gender
- `address`: Street address
- `city`: City
- `state`: State/Province
- `country`: Country
- `zipCode`: ZIP/Postal code
- `emergencyContact`: Emergency contact name
- `emergencyPhone`: Emergency contact phone
- `preferences`: User preferences
- `bio`: User biography
- `profilePicture`: Profile picture URL
- `isVerified`: Verification status
- `verificationStatus`: Detailed verification status

## Usage Examples

### 1. Get Rider Profile
```bash
curl -X GET "http://localhost:8080/api/profile/1?role=RIDER"
```

### 2. Update Driver Profile
```bash
curl -X PUT "http://localhost:8080/api/profile/2?role=DRIVER" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "licenseNumber": "DL123456789",
    "status": "ONLINE"
  }'
```

### 3. Partial Update Rider Profile
```bash
curl -X PATCH "http://localhost:8080/api/profile/1?role=RIDER" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "location": "New York"
  }'
```

## Error Responses

### 404 Not Found
```json
{
  "message": "Profile not found for user ID: 1 with role: RIDER"
}
```

### 400 Bad Request
```json
{
  "message": "User ID is required"
}
```

### 500 Internal Server Error
```json
{
  "message": "Error updating profile: [error details]"
}
```

## Database Integration

The Profile Management system integrates with existing database entities:

- **Rider Entity**: Stores rider-specific profile information
- **Driver Entity**: Stores driver-specific profile information
- **ProfileDTO**: Unified data transfer object for API responses

## Security Considerations

1. **Authentication**: All endpoints should be protected with JWT authentication
2. **Authorization**: Users can only access/update their own profiles
3. **Data Validation**: Input validation should be implemented for all fields
4. **Password Security**: Password fields are excluded from profile operations

## Future Enhancements

1. **Profile Picture Upload**: Implement file upload for profile pictures
2. **Profile Verification**: Add verification workflows for drivers
3. **Profile Analytics**: Track profile update patterns
4. **Bulk Operations**: Support for bulk profile updates
5. **Profile History**: Track profile change history

## Testing

Use the provided endpoints with tools like Postman or curl to test the profile management functionality. Ensure proper authentication headers are included in requests.
