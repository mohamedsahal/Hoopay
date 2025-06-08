# Email Verification Endpoints Implementation Guide

## Required Endpoints for Mobile App Email Verification

### 1. Verify Email with Code
```
POST /api/auth/verify-email
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "verification_code": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully! Welcome to Hoopay.",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "user@example.com",
      "email_verified": true,
      "email_verified_at": "2025-01-24T10:30:00Z"
    },
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
```

**Error Response (422):**
```json
{
  "success": false,
  "message": "Verification failed.",
  "errors": {
    "verification_code": ["Invalid or expired verification code."]
  }
}
```

### 2. Resend Verification Email
```
POST /api/auth/resend-verification
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Verification code has been sent to your email.",
  "data": {
    "email": "user@example.com",
    "code_expires_at": "2025-01-24T11:30:00Z"
  }
}
```

### 3. Check Verification Status (Optional)
```
GET /api/auth/verification-status?email=user@example.com
```

**Response:**
```json
{
  "success": true,
  "data": {
    "email": "user@example.com",
    "email_verified": false,
    "verification_required": true,
    "can_resend": true,
    "last_sent": "2025-01-24T10:25:00Z"
  }
}
```

## Implementation Notes

### Database Requirements
Ensure your users table has these columns:
- `email_verified_at` (timestamp, nullable)
- `verification_code` (string, nullable)  
- `verification_code_expires_at` (timestamp, nullable)

### Email Verification Flow
1. User registers → User created with `email_verified_at = null`
2. Send 6-digit verification code via email
3. User enters code → Verify and set `email_verified_at`
4. User can now login successfully

### Mobile App Integration
Once these endpoints are implemented:
- EmailVerificationScreen will automatically detect them
- Users will see the verification code input form
- Resend functionality will work
- Smooth verification flow

### Current Mobile App Behavior
- ✅ Gracefully handles missing endpoints
- ✅ Shows fallback UI with helpful options
- ✅ Directs users to try login or contact support
- 🔄 Will automatically use verification endpoints once available

## Laravel Implementation Example

```php
// routes/api.php
Route::post('/auth/verify-email', [AuthController::class, 'verifyEmail']);
Route::post('/auth/resend-verification', [AuthController::class, 'resendVerification']);
Route::get('/auth/verification-status', [AuthController::class, 'verificationStatus']);

// AuthController.php methods needed:
public function verifyEmail(Request $request) {
    // Validate request
    // Check verification code
    // Update user email_verified_at
    // Return success with token
}

public function resendVerification(Request $request) {
    // Validate email
    // Generate new verification code
    // Send email
    // Return success response
}

public function verificationStatus(Request $request) {
    // Get user by email
    // Return verification status
}
```

## Testing the Implementation

Once implemented, you can test with:
```bash
node testSpecificEndpoints.js
node testEmailVerificationEndpoints.js
```

The mobile app will automatically start using the verification flow once these endpoints return non-404 responses. 