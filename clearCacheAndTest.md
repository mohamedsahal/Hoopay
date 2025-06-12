# Clear React Native Cache and Test Fix

## The Issue
The error `_auth.authService.requestPasswordReset is not a function` suggests that the React Native bundler might be using a cached version of the auth service.

## Steps to Fix

### 1. Clear React Native Cache
```bash
# Stop the current Metro bundler (Ctrl+C)

# Clear React Native cache
npx react-native start --reset-cache

# Or if using Expo
npx expo start --clear
```

### 2. Clear Node Modules (if needed)
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install

# Or
yarn install
```

### 3. Clear Watchman Cache (if on macOS/Linux)
```bash
watchman watch-del-all
```

### 4. Test the Fix
1. Start the app with cleared cache
2. Navigate to Login screen
3. Tap "Forgot Password?"
4. Enter an email address
5. Tap "Send Reset Code"
6. Check the console logs for debug information

## Debug Information Added
I've added debug logging to the ForgotPasswordScreen that will show:
- `authService type`: Should be "object"
- `authService keys`: Should show function names including "requestPasswordReset"
- `requestPasswordReset type`: Should be "function"

## Expected Results
After clearing cache, you should see:
```
=== DEBUG FORGOT PASSWORD ===
authService type: object
authService keys: ["login", "verify2FALogin", "logout", "register", "requestPasswordReset", ...]
requestPasswordReset type: function
About to call authService.requestPasswordReset with email: test@example.com
```

## If Still Not Working
If the issue persists after clearing cache, the problem might be:
1. Import/export mismatch in the auth service
2. Bundler configuration issue
3. File corruption

Let me know what the debug logs show and I can provide further assistance. 