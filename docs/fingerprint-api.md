# Fingerprint API Documentation

This document describes how to use the fingerprint functionality in the user authentication system.

## Overview

The fingerprint system allows you to collect and store device fingerprint data from the frontend to enhance security and user identification. The fingerprint data includes various device characteristics like platform, browser, screen resolution, timezone, and many other attributes.

## Fingerprint Data Structure

The fingerprint data follows this structure:

```javascript
{
  visitorId: "58d047a06034819c3deda39c1ab5446a",
  confidence: 0.6, // Number between 0 and 1
  components: ["fonts", "domBlockers", "fontPreferences", "audio", "screenFrame", "canvas", "osCpu", "languages"],
  cookieEnabled: true,
  doNotTrack: null,
  hardwareConcurrency: 8,
  language: "en-US",
  maxTouchPoints: 0,
  platform: "Win32",
  screenResolution: "1920x1080",
  timestamp: "2025-07-03T10:31:48.379Z",
  timezone: "Africa/Accra",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
  vendor: "Google Inc."
}
```

## API Endpoints

### 1. Register User with Fingerprint

**POST** `/auth/register`

Register a new user with fingerprint data.

**Request Body:**
```javascript
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe",
  "userType": "customer",
  "fingerprint": {
    // Fingerprint data object
  }
}
```

**Response:**
```javascript
{
  "message": "User registered successfully",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "userType": "customer",
    "fingerprint": {
      // Stored fingerprint data
    }
  },
  "token": "jwt_token"
}
```

### Pre-Registration Fraud Check

You can check for fraud before registration:

```javascript
const checkFraud = async (fingerprint, referralCode) => {
  const response = await fetch('/auth/check-fingerprint-fraud', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fingerprint: fingerprint,
      referralCode: referralCode
    })
  });
  
  const result = await response.json();
  
  if (result.fraudDetected) {
    console.log('Fraud detected:', result.checks);
    // Handle fraud case - user can still register but won't get points
  } else {
    console.log('Fingerprint check passed');
    // Proceed with registration
  }
};
```

### 2. Login with Fingerprint

**POST** `/auth/login`

Login with optional fingerprint data update.

**Request Body:**
```javascript
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "fingerprint": {
    // Optional: New fingerprint data to update
  }
}
```

**Response:**
```javascript
{
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "fingerprint": {
      // Updated fingerprint data
    }
  },
  "token": "jwt_token"
}
```

### 3. Update Fingerprint

**PUT** `/auth/update-fingerprint`

Update fingerprint data for an existing user.

**Request Body:**
```javascript
{
  "userId": "user_id",
  "fingerprint": {
    // New fingerprint data
  }
}
```

**Response:**
```javascript
{
  "message": "Fingerprint updated successfully",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "fingerprint": {
      // Updated fingerprint data
    }
  }
}
```

### 4. Get Fingerprint

**GET** `/auth/fingerprint/:userId`

Retrieve fingerprint data for a specific user.

**Response:**
```javascript
{
  "fingerprint": {
    // User's fingerprint data
  }
}
```

### 5. Check Fingerprint Fraud

**POST** `/auth/check-fingerprint-fraud`

Check for potential fraud before registration or referral.

**Request Body:**
```javascript
{
  "fingerprint": {
    // Fingerprint data to check
  },
  "referralCode": "ABC12345" // Optional: referral code to check
}
```

**Response:**
```javascript
{
  "fraudDetected": false,
  "checks": {
    "sameDeviceReferral": false,
    "multipleAccounts": false,
    "details": {}
  },
  "message": "Fingerprint check passed"
}
```

**Fraud Detection Response (when fraud is detected):**
```javascript
{
  "fraudDetected": true,
  "checks": {
    "sameDeviceReferral": true,
    "multipleAccounts": false,
    "details": {
      "referrer": {
        "id": "user_id",
        "email": "referrer@example.com",
        "name": "Referrer Name"
      }
    }
  },
  "message": "Fraud detected in fingerprint data"
}
```

## Frontend Integration

### Using a Fingerprinting Library

1. Install a fingerprinting library (e.g., Fingerprint.js, ClientJS, or similar):
```bash
npm install @fingerprintjs/fingerprintjs
# or
npm install clientjs
```

2. Collect fingerprint data:
```javascript
// Example using a fingerprinting library
const getFingerprint = async () => {
  // This is a simplified example - implement based on your chosen library
  const fingerprint = {
    visitorId: generateVisitorId(), // Generate or get from library
    confidence: 0.6,
    components: ["fonts", "canvas", "audio", "screenFrame"],
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
    hardwareConcurrency: navigator.hardwareConcurrency,
    language: navigator.language,
    maxTouchPoints: navigator.maxTouchPoints,
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}`,
    timestamp: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    userAgent: navigator.userAgent,
    vendor: navigator.vendor
  };
  
  return fingerprint;
};

// Use in registration
const registerUser = async (userData) => {
  const fingerprint = await getFingerprint();
  
  const response = await fetch('/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...userData,
      fingerprint: fingerprint
    })
  });
  
  return response.json();
};

// Use in login
const loginUser = async (credentials) => {
  const fingerprint = await getFingerprint();
  
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...credentials,
      fingerprint: fingerprint
    })
  });
  
  return response.json();
};
```

## Security Considerations

1. **Privacy**: Fingerprint data contains sensitive device information. Ensure compliance with privacy regulations.

2. **Data Protection**: Store fingerprint data securely and consider encryption for sensitive components.

3. **Fraud Detection**: Use fingerprint data for fraud detection by comparing fingerprints across sessions.

4. **User Consent**: Inform users about fingerprint collection and obtain consent where required.

## Fraud Detection

The system includes comprehensive fraud detection mechanisms:

### Types of Fraud Detected

1. **Same Device Referral Fraud**: Prevents users from referring themselves using the same device
2. **Multiple Account Fraud**: Detects when the same device is used to create multiple accounts
3. **Referral Code Abuse**: Prevents abuse of referral codes from the same device

### How It Works

The system compares fingerprint data using these critical fields:
- Platform (Windows, Mac, Linux, etc.)
- Vendor (Google Inc., Apple Inc., etc.)
- User Agent (browser and OS information)
- Screen Resolution
- Hardware Concurrency (CPU cores)
- Max Touch Points
- Timezone
- Language

### Fraud Detection Threshold

The system uses a similarity threshold of 70% (0.7) by default. This means:
- If 70% or more of the critical fingerprint fields match, it's considered the same device
- You can adjust this threshold based on your security requirements

### Important: User Registration vs Points Awarding

**Users are always registered successfully**, even when fraud is detected. However:

- ✅ **Registration**: Always succeeds
- ❌ **Points Awarding**: Only happens for legitimate referrals from different devices
- 🔍 **Fraud Detection**: Prevents point abuse while maintaining user experience

### Registration Response Examples

**Successful registration with legitimate referral:**
```javascript
{
  "message": "User registered successfully",
  "user": { /* user data */ },
  "token": "jwt_token",
  "referralInfo": {
    "referrerName": "John Doe",
    "pointsAwarded": 0,
    "referrerPointsAwarded": 100,
    "fraudCheckPassed": true
  }
}
```

**Successful registration with fraud detected:**
```javascript
{
  "message": "User registered successfully",
  "user": { /* user data */ },
  "token": "jwt_token",
  "referralInfo": {
    "fraudDetected": true,
    "fraudMessage": "Fraud detected: Same device attempting to refer itself",
    "pointsAwarded": 0,
    "referrerPointsAwarded": 0,
    "note": "User registered successfully but referral points were not awarded due to fraud detection"
  }
}
```

## Utility Methods

The User model includes several utility methods for fingerprint operations:

```javascript
// Update fingerprint data
await user.updateFingerprint(fingerprintData)

// Get fingerprint data
const fingerprint = user.getFingerprint()

// Find user by visitor ID
const user = await User.findByVisitorId('visitor-id')

// Find users with similar fingerprints (for fraud detection)
const similarUsers = await User.findSimilarFingerprints(fingerprintData, threshold)
```

## Validation

The API includes validation for fingerprint data:

- `fingerprint` must be an object
- `fingerprint.visitorId` must be a string
- `fingerprint.confidence` must be a number between 0 and 1
- `fingerprint.components` must be an array
- `fingerprint.cookieEnabled` must be a boolean
- `fingerprint.doNotTrack` must be null, string, or boolean
- `fingerprint.hardwareConcurrency` must be a non-negative integer
- `fingerprint.language` must be a string
- `fingerprint.maxTouchPoints` must be a non-negative integer
- `fingerprint.platform` must be a string
- `fingerprint.screenResolution` must be a string
- `fingerprint.timestamp` must be a valid ISO 8601 date string
- `fingerprint.timezone` must be a string
- `fingerprint.userAgent` must be a string
- `fingerprint.vendor` must be a string

## Error Handling

Common error responses:

```javascript
// Invalid fingerprint data
{
  "error": "Validation failed",
  "details": [
    {
      "field": "fingerprint.confidence",
      "message": "Fingerprint confidence must be a number between 0 and 1"
    }
  ]
}

// User not found
{
  "error": "User not found"
}

// Missing required fields
{
  "error": "User ID and fingerprint data are required"
}
```

## Testing

Run the fingerprint tests:

```bash
npm test tests/fingerprint.test.js
```

The tests cover:
- User registration with fingerprint data
- Login with fingerprint update
- Fingerprint data retrieval
- Utility methods functionality 