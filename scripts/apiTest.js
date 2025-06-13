const axios = require('axios');
const fs = require('fs');

// Configuration
const API_URL = 'https://9e98-102-217-123-227.ngrok-free.app'; // Using development ngrok URL
let authToken = '';

// Attempt to read token from file if it exists
try {
  if (fs.existsSync('./token.txt')) {
    authToken = fs.readFileSync('./token.txt', 'utf8').trim();
    console.log('Using saved token from file');
  }
} catch (err) {
  console.error('Error reading token file:', err);
}

// Create axios instance with proper headers
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Add auth token if available
if (authToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
}

// Test authentication by logging in
async function testLogin(email, password) {
  try {
    console.log(`\n📝 Testing login with ${email}...`);
    const response = await api.post('/api/auth/login', { email, password });
    
    if (response.data && response.data.data && response.data.data.token) {
      authToken = response.data.data.token;
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      
      // Save token to file for future use
      fs.writeFileSync('./token.txt', authToken);
      console.log('✅ Login successful! Token saved.');
      return true;
    } else {
      console.log('❌ Login response did not contain token:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response ? error.response.data : error.message);
    return false;
  }
}

// Test user profile endpoint
async function testGetUserProfile() {
  try {
    console.log('\n📝 Testing /api/auth/user endpoint...');
    const response = await api.get('/api/auth/user');
    console.log('✅ User profile retrieved successfully!');
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Failed to get user profile:', error.response ? error.response.data : error.message);
    console.log('Status code:', error.response ? error.response.status : 'No response');
    if (error.response && error.response.headers) {
      console.log('Response headers:', error.response.headers);
    }
    return false;
  }
}

// Test profile endpoint
async function testGetProfile() {
  try {
    console.log('\n📝 Testing /api/profile endpoint...');
    const response = await api.get('/api/profile');
    console.log('✅ Profile retrieved successfully!');
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Failed to get profile:', error.response ? error.response.data : error.message);
    console.log('Status code:', error.response ? error.response.status : 'No response');
    if (error.response && error.response.headers) {
      console.log('Response headers:', error.response.headers);
    }
    return false;
  }
}

// Test logout endpoint
async function testLogout() {
  try {
    console.log('\n📝 Testing /api/auth/logout endpoint...');
    const response = await api.post('/api/auth/logout');
    console.log('✅ Logout successful!');
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    // Clean up token file after successful logout
    if (fs.existsSync('./token.txt')) {
      fs.unlinkSync('./token.txt');
      console.log('Token file removed.');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Logout failed:', error.response ? error.response.data : error.message);
    console.log('Status code:', error.response ? error.response.status : 'No response');
    if (error.response && error.response.headers) {
      console.log('Response headers:', error.response.headers);
    }
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🔍 Starting API endpoint tests...');
  
  // If we don't have a token, try to login
  if (!authToken) {
    // Replace with actual credentials
    const loginSuccess = await testLogin('mnorsahal@gmail.com', 'password123');
    if (!loginSuccess) {
      console.log('❌ Cannot proceed with tests without authentication');
      return;
    }
  }
  
  // Test the problematic endpoints
  await testGetUserProfile();
  await testGetProfile();
  await testLogout();
  
  console.log('\n✨ Tests completed!');
}

// Run the tests
runTests().catch(err => {
  console.error('Unhandled error during tests:', err);
});
