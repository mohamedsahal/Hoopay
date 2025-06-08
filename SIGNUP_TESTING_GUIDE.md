# Signup Process Testing Guide

## Overview
This guide covers testing the complete user registration flow in the Hoopay mobile app.

## Fixed Issues ✅

### 1. **Missing Auth Service Methods**
- ✅ Added `register()` method to auth service
- ✅ Added `verifyEmail()` method for email verification
- ✅ Added `resendVerificationEmail()` method
- ✅ Added `forgotPassword()` method
- ✅ Added `getStoredEmail()` utility method

### 2. **Navigation Consistency**
- ✅ Fixed navigation from `Verification` to `EmailVerification`
- ✅ Updated navigation types to include email parameter
- ✅ Consistent screen naming across all flows

### 3. **Error Handling**
- ✅ Comprehensive validation error handling
- ✅ Network error handling with user-friendly messages
- ✅ API response error parsing
- ✅ Specific error messages for email/password issues

### 4. **Biometric Integration**
- ✅ Optional biometric setup after successful registration
- ✅ Graceful fallback if biometric setup fails
- ✅ User choice to skip biometric setup

### 5. **Theme Integration**
- ✅ All auth screens use theme context
- ✅ Dynamic styling based on light/dark mode
- ✅ Consistent visual design

### 6. **Backend Route Issues**
- ✅ Fixed 404 error for `/api/mobile/register` endpoint
- ✅ Updated to use working `/auth/register` endpoint
- ✅ Updated email verification to use `/auth/verify-email`
- ✅ Updated resend verification to use `/auth/resend-verification`
- ✅ Updated password reset to use `/auth/reset-password`

## Testing Flow

### 1. **Basic Registration**
1. Open the app
2. Navigate to signup screen
3. Fill in all required fields:
   - Full Name
   - Email (unique email)
   - Password (8+ characters)
   - Confirm Password (must match)
   - Referral Code (optional)
4. Tap "CREATE ACCOUNT"
5. **Expected**: Success message and navigation

### 2. **Validation Testing**
Test each validation rule:
- Empty name: ❌ "Name is required"
- Invalid email: ❌ "Please enter a valid email"
- Short password: ❌ "Password must be at least 8 characters"
- Mismatched passwords: ❌ "Passwords do not match"

### 3. **Email Verification Flow**
If backend requires email verification:
1. After registration → Navigate to EmailVerification screen
2. Check email for verification code
3. Enter 6-digit code
4. Tap "VERIFY EMAIL"
5. **Expected**: Login or main app navigation

### 4. **Biometric Setup**
If registration succeeds immediately:
1. Biometric prompt appears (if device supports it)
2. Choose "Enable" or "Not Now"
3. If enabled: Authenticate with biometrics
4. **Expected**: Welcome message and main app navigation

### 5. **Error Scenarios**
Test error handling:
- Duplicate email registration
- Network connectivity issues
- Invalid verification codes
- Expired verification codes

## API Endpoints Used

### Registration
```
POST /auth/register
{
  "name": "User Name",
  "email": "user@example.com", 
  "password": "password123",
  "password_confirmation": "password123",
  "referral_code": "ABC123" // optional
}
```

### Email Verification
```
POST /auth/verify-email
{
  "email": "user@example.com",
  "code": "123456"
}
```

### Resend Verification
```
POST /auth/resend-verification
{
  "email": "user@example.com"
}
```

### Password Reset
```
POST /auth/reset-password
{
  "email": "user@example.com"
}
```

## Expected Response Formats

### Successful Registration (No Verification)
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { ... },
    "token": "jwt_token_here"
  }
}
```

### Registration Requiring Verification
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": {
    "user": { ... },
    "needs_verification": true
  }
}
```

### Validation Error
```json
{
  "success": false,
  "message": "Validation Error",
  "errors": {
    "email": ["The email has already been taken."],
    "password": ["The password must be at least 8 characters."]
  }
}
```

## Testing Checklist

### Pre-Testing Setup
- [ ] Ensure backend API is running
- [ ] Check API endpoints in `apiConfig.js`
- [ ] Verify email service is configured (if using verification)

### Manual Testing
- [ ] Basic registration flow
- [ ] Form validation (all fields)
- [ ] Email verification flow (if applicable)
- [ ] Biometric setup prompt and authentication
- [ ] Error handling for duplicate emails
- [ ] Network error handling
- [ ] Theme switching during signup
- [ ] Navigation back to login

### Edge Cases
- [ ] Registration with existing email
- [ ] Network disconnection during signup
- [ ] Invalid verification codes
- [ ] Biometric authentication failures
- [ ] App backgrounding during signup

### Cross-Platform Testing
- [ ] iOS device testing
- [ ] Android device testing
- [ ] Different screen sizes
- [ ] Different biometric types (Face ID, Fingerprint)

## Troubleshooting

### Common Issues

1. **"Register method not found"**
   - ✅ Fixed: Added register method to auth service

2. **Navigation errors**
   - ✅ Fixed: Updated screen names and navigation types

3. **Biometric setup failures**
   - Check device biometric enrollment
   - Verify biometric permissions in app manifest
   - Test fallback scenarios

4. **Email verification not working**
   - Check backend email service configuration
   - Verify API endpoints are correct
   - Test resend functionality

### Debug Steps
1. Check console logs for detailed error messages
2. Verify API responses in network tab
3. Test with different email providers
4. Check secure storage for token persistence

## Success Criteria

A successful signup implementation should:
- ✅ Handle all validation scenarios gracefully
- ✅ Provide clear user feedback at each step
- ✅ Support both immediate login and email verification flows
- ✅ Integrate biometric authentication seamlessly
- ✅ Maintain consistent theming
- ✅ Handle network and API errors properly
- ✅ Navigate correctly between screens
- ✅ Store authentication data securely

## Notes
- The signup process now supports both immediate registration and email verification workflows
- Biometric setup is optional and fails gracefully
- All error messages are user-friendly and actionable
- The implementation follows React Native best practices
- Theme integration ensures consistent visual experience 