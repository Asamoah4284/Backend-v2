# User Details API Documentation

This document describes the API endpoints for retrieving user details.

## Overview

The user details API provides endpoints to retrieve specific user information, including profile data, business information (for artisans), and fingerprint data.

## Authentication

All user details endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### 1. Get Specific User Details

**GET** `/app/users/:userId`

Retrieve detailed information about a specific user by their ID.

**Parameters:**
- `userId` (path parameter): The MongoDB ObjectId of the user (24-character string)

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (Success - 200):**
```javascript
{
  "message": "User details retrieved successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "userType": "customer",
    "points": 150,
    "myReferralCode": "ABC12345",
    "enteredReferralCode": "XYZ67890",
    "businessName": null,
    "businessCategory": null,
    "businessDescription": null,
    "phone": null,
    "country": null,
    "city": null,
    "website": null,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "fingerprint": {
      "visitorId": "58d047a06034819c3deda39c1ab5446a",
      "confidence": 0.6,
      "components": ["fonts", "canvas", "audio"],
      "platform": "Win32",
      "vendor": "Google Inc.",
      "timezone": "Africa/Accra"
    }
  }
}
```

**Response (Artisan User):**
```javascript
{
  "message": "User details retrieved successfully",
  "user": {
    "id": "507f1f77bcf86cd799439012",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "userType": "artisan",
    "points": 75,
    "myReferralCode": "ART12345",
    "enteredReferralCode": null,
    "businessName": "Artisan Crafts",
    "businessCategory": "Handmade",
    "businessDescription": "Beautiful handmade crafts and jewelry",
    "phone": "+1234567890",
    "country": "Ghana",
    "city": "Accra",
    "website": "https://artisancrafts.com",
    "isActive": true,
    "createdAt": "2024-01-10T09:15:00.000Z",
    "updatedAt": "2024-01-15T14:20:00.000Z",
    "fingerprint": {
      "visitorId": "artisan-visitor-id-123",
      "confidence": 0.8,
      "components": ["fonts", "canvas", "audio", "screenFrame"],
      "platform": "MacIntel",
      "vendor": "Apple Inc.",
      "timezone": "Africa/Accra"
    }
  }
}
```

**Error Responses:**

**Invalid User ID Format (400):**
```javascript
{
  "error": "Invalid user ID format",
  "message": "User ID must be a valid 24-character MongoDB ObjectId"
}
```

**User Not Found (404):**
```javascript
{
  "error": "User not found",
  "message": "No user found with the provided ID"
}
```

**Unauthorized (401):**
```javascript
{
  "error": "Access denied",
  "message": "No token provided"
}
```

**Server Error (500):**
```javascript
{
  "error": "Failed to fetch user details",
  "message": "Internal server error details"
}
```

## Frontend Integration

### Example Usage

```javascript
const getUserDetails = async (userId, token) => {
  try {
    const response = await fetch(`/app/users/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch user details');
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

// Usage example
const displayUserProfile = async (userId) => {
  try {
    const user = await getUserDetails(userId, authToken);
    
    // Update UI with user data
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('userPoints').textContent = user.points;
    
    if (user.userType === 'artisan') {
      document.getElementById('businessName').textContent = user.businessName;
      document.getElementById('businessCategory').textContent = user.businessCategory;
    }
    
    // Display fingerprint info if needed
    if (user.fingerprint) {
      console.log('Device fingerprint:', user.fingerprint);
    }
  } catch (error) {
    console.error('Failed to load user profile:', error);
    // Handle error (show error message to user)
  }
};
```

### React Example

```jsx
import React, { useState, useEffect } from 'react';

const UserProfile = ({ userId, token }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/app/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user details');
        }

        const data = await response.json();
        setUser(data.user);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId, token]);

  if (loading) return <div>Loading user details...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      <p>Email: {user.email}</p>
      <p>User Type: {user.userType}</p>
      <p>Points: {user.points}</p>
      <p>Referral Code: {user.myReferralCode}</p>
      
      {user.userType === 'artisan' && (
        <div className="business-info">
          <h3>Business Information</h3>
          <p>Business Name: {user.businessName}</p>
          <p>Category: {user.businessCategory}</p>
          <p>Description: {user.businessDescription}</p>
          <p>Phone: {user.phone}</p>
          <p>Location: {user.city}, {user.country}</p>
          {user.website && <p>Website: <a href={user.website}>{user.website}</a></p>}
        </div>
      )}
      
      {user.fingerprint && (
        <div className="fingerprint-info">
          <h3>Device Information</h3>
          <p>Platform: {user.fingerprint.platform}</p>
          <p>Vendor: {user.fingerprint.vendor}</p>
          <p>Timezone: {user.fingerprint.timezone}</p>
          <p>Confidence: {user.fingerprint.confidence}</p>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
```

## Security Considerations

1. **Authentication Required**: All endpoints require valid JWT tokens
2. **Password Exclusion**: User passwords are never included in responses
3. **Input Validation**: User IDs are validated for proper MongoDB ObjectId format
4. **Error Handling**: Comprehensive error handling for various scenarios

## Testing

Run the user details tests:

```bash
npm test tests/user-details.test.js
```

The tests cover:
- Successful user details retrieval
- Error handling for invalid user IDs
- Authentication requirements
- Password exclusion
- Artisan user details with business information 