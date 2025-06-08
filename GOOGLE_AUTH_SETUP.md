# Google Authentication Setup for Mobile App

This document provides instructions for setting up Google authentication in the Hoopay mobile app using Firebase.

## Overview

We've implemented Google Sign-In for the mobile app using:
- Firebase Authentication
- @react-native-google-signin/google-signin
- Firebase ID token verification on the backend

## Current Implementation Status

✅ **Completed:**
- Firebase dependencies installed
- Firebase configuration created (`HoopayApp/src/config/firebase.js`)
- Google Auth Service implemented (`HoopayApp/src/services/googleAuthService.js`)
- Backend API endpoint created (`/api/mobile/firebase-login`)
- Login screen updated to use real Google authentication
- App configuration updated for Android/iOS

⚠️ **Still Needed:**
- Correct Google Web Client ID configuration
- Firebase project Google Services files
- Testing on physical device

## Required Setup Steps

### 1. Get the Correct Web Client ID

You need to get the correct web client ID from your Firebase project:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `hoopay-ef6ae`
3. Go to **Project Settings** (gear icon)
4. Click on the **General** tab
5. Scroll down to **Your apps** section
6. Look for the **Web app** configuration
7. Copy the **Web client ID** (it should look like: `1094121922053-xxxxxxxxxx.apps.googleusercontent.com`)

### 2. Update the Mobile App Configuration

Replace the placeholder web client ID in `HoopayApp/src/config/firebase.js`:

```javascript
GoogleSignin.configure({
  webClientId: 'YOUR_ACTUAL_WEB_CLIENT_ID_HERE', // Replace this
  offlineAccess: true,
  hostedDomain: '', 
  forceCodeForRefreshToken: true,
});
```

### 3. Download Firebase Configuration Files

You'll need to download the platform-specific configuration files:

#### For Android:
1. In Firebase Console → Project Settings → Your apps
2. Click on your Android app
3. Download `google-services.json`
4. Place it in `HoopayApp/google-services.json`

#### For iOS:
1. In Firebase Console → Project Settings → Your apps  
2. Click on your iOS app (or create one if it doesn't exist)
3. Download `GoogleService-Info.plist`
4. Place it in `HoopayApp/GoogleService-Info.plist`

### 4. Configure Google Sign-In for Android

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to **APIs & Services** → **Credentials**
4. Create OAuth 2.0 Client IDs for:
   - **Android** (using your app's package name: `com.exaliye.HoopayNew`)
   - **Web** (for Firebase Authentication)

### 5. Test the Implementation

1. Start your Laravel backend:
   ```bash
   cd app && php artisan serve
   ```

2. Start the React Native app:
   ```bash
   cd HoopayApp && npm start
   ```

3. Try the Google Sign-In button on the login screen

## How It Works

1. **User taps Google Sign-In button** → `LoginScreen.js`
2. **Google Sign-In popup appears** → Native Google authentication
3. **Firebase ID token is generated** → `googleAuthService.js`
4. **Token sent to backend** → `/api/mobile/firebase-login`
5. **Backend verifies token and creates/logs in user** → Returns JWT token
6. **User is authenticated** → AuthContext updated, user logged in

## Troubleshooting

### Common Issues:

1. **"Network Error" or connection refused**
   - Make sure Laravel backend is running on port 8000
   - Check that `HoopayApp/src/config/apiConfig.js` has correct base URL

2. **"Invalid client ID" error**
   - Verify you're using the correct web client ID
   - Make sure the client ID matches your Firebase project

3. **"Google Play Services not available"**
   - This error happens on iOS or emulator without Google Play
   - Test on a real Android device with Google Play Services

4. **"Firebase project not found"**
   - Check that `google-services.json` and `GoogleService-Info.plist` are in the right location
   - Verify the project ID matches your Firebase project

### Testing on Development:

For development testing, you can verify the backend endpoint works by running:

```bash
cd HoopayApp && node testGoogleAuth.js
```

This will test the backend API endpoint with a sample token payload.

## Security Notes

- The current implementation uses simplified Firebase token verification for development
- For production, implement proper Firebase Admin SDK token verification
- Ensure proper error handling for network failures
- Consider implementing token refresh logic for long-lived sessions

## Next Steps

1. Get the correct web client ID and update the configuration
2. Download and add the Firebase configuration files
3. Test on a real Android device
4. Implement proper production-grade token verification
5. Add error handling for various edge cases
6. Consider implementing Facebook and Apple Sign-In as well 