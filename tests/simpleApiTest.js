const axios = require('axios');

// Configuration - using production URL
const API_URL = 'https://hoopaywallet.com';

// You'll need to replace this with a valid JWT token
// You can copy this from your app's secure storage or from the login response
const JWT_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjMwMDAiLCJzdWIiOjU3LCJpYXQiOjE3NDgzODQ4NjIsImV4cCI6MTc0ODk4OTY2MiwidXNlciI6eyJpZCI6NTcsImVtYWlsIjoibW5vcnNhaGFsQGdtYWlsLmNvbSIsIm5hbWUiOiJNb2hhbWVkIn19.I2jasGJ-BL9sh9JlMrFu7RSgjU2WzMwEKyMYW0ZUSso';

// Create axios instance with JWT auth headers
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${JWT_TOKEN}`
  }
});

// Test /api/auth/user endpoint
async function testUserEndpoint() {
  console.log('Testing /api/auth/user endpoint...');
  
  try {
    const response = await api.get('/api/auth/user');
    console.log('SUCCESS: /api/auth/user - Status:', response.status);
    console.log('Response data:', JSON.stringify(response.data).substring(0, 100) + '...');
    return true;
  } catch (error) {
    console.log('ERROR: /api/auth/user - Status:', error.response ? error.response.status : 'No response');
    console.log('Error details:', error.response ? error.response.data : error.message);
    return false;
  }
}

// Test /api/profile endpoint
async function testProfileEndpoint() {
  console.log('\nTesting /api/profile endpoint...');
  
  try {
    const response = await api.get('/api/profile');
    console.log('SUCCESS: /api/profile - Status:', response.status);
    console.log('Response data:', JSON.stringify(response.data).substring(0, 100) + '...');
    return true;
  } catch (error) {
    console.log('ERROR: /api/profile - Status:', error.response ? error.response.status : 'No response');
    console.log('Error details:', error.response ? error.response.data : error.message);
    return false;
  }
}

// Test /api/auth/logout endpoint
async function testLogoutEndpoint() {
  console.log('\nTesting /api/auth/logout endpoint...');
  
  try {
    const response = await api.post('/api/auth/logout');
    console.log('SUCCESS: /api/auth/logout - Status:', response.status);
    console.log('Response data:', JSON.stringify(response.data));
    return true;
  } catch (error) {
    console.log('ERROR: /api/auth/logout - Status:', error.response ? error.response.status : 'No response');
    console.log('Error details:', error.response ? error.response.data : error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('========== TESTING API ENDPOINTS ==========\n');
  
  const userResult = await testUserEndpoint();
  const profileResult = await testProfileEndpoint();
  const logoutResult = await testLogoutEndpoint();
  
  console.log('\n========== TEST RESULTS ==========');
  console.log('/api/auth/user:', userResult ? 'PASSED' : 'FAILED');
  console.log('/api/profile:', profileResult ? 'PASSED' : 'FAILED');
  console.log('/api/auth/logout:', logoutResult ? 'PASSED' : 'FAILED');
  
  const allPassed = userResult && profileResult && logoutResult;
  console.log('\nOVERALL:', allPassed ? 'ALL TESTS PASSED!' : 'SOME TESTS FAILED');
}

// Run the tests
runAllTests().catch(err => {
  console.error('Unhandled error:', err);
});
