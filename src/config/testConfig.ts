export const TEST_CONFIG = {
  // Test user credentials - removed test email to prevent 404 errors
  user: {
    email: '', // Use actual user emails instead of test emails
    password: 'password123'
  },
  
  // API URLs for different environments
  apiUrls: {
    android: 'http://10.0.2.2:8000/api',
    ios: 'http://localhost:8000/api',
    default: 'http://192.168.0.106:8000/api'
  },
  
  // Default headers
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
}; 