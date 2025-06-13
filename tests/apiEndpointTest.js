const axios = require('axios');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration
const API_URL = 'https://9e98-102-217-123-227.ngrok-free.app';
let authToken = '';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Function to login
async function login(email, password) {
  console.log(`\nAttempting to login with ${email}...`);
  
  try {
    const response = await api.post('/api/auth/login', { 
      email, 
      password 
    });
    
    if (response.data && response.data.data && response.data.data.token) {
      authToken = response.data.data.token;
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      console.log(`✓ Login successful!`);
      return true;
    } else {
      console.log(`✗ Login response missing token:`, response.data);
      return false;
    }
  } catch (error) {
    console.log(`✗ Login error:`, error.response ? error.response.data : error.message);
    return false;
  }
}

// Test /api/auth/user endpoint
async function testUserEndpoint() {
  console.log(`\nTesting /api/auth/user endpoint...`);
  
  try {
    const response = await api.get('/api/auth/user');
    console.log(`✓ Success! Status: ${response.status}`);
    console.log(`Response data:`, JSON.stringify(response.data, null, 2).substring(0, 300) + '...');
    return true;
  } catch (error) {
    console.log(`✗ Error! Status: ${error.response ? error.response.status : 'No response'}`);
    console.log(`Error details:`, error.response ? error.response.data : error.message);
    return false;
  }
}

// Test /api/profile endpoint
async function testProfileEndpoint() {
  console.log(`\nTesting /api/profile endpoint...`);
  
  try {
    const response = await api.get('/api/profile');
    console.log(`✓ Success! Status: ${response.status}`);
    console.log(`Response data:`, JSON.stringify(response.data, null, 2).substring(0, 300) + '...');
    return true;
  } catch (error) {
    console.log(`✗ Error! Status: ${error.response ? error.response.status : 'No response'}`);
    console.log(`Error details:`, error.response ? error.response.data : error.message);
    return false;
  }
}

// Test /api/auth/logout endpoint
async function testLogoutEndpoint() {
  console.log(`\nTesting /api/auth/logout endpoint...`);
  
  try {
    const response = await api.post('/api/auth/logout');
    console.log(`✓ Success! Status: ${response.status}`);
    console.log(`Response data:`, JSON.stringify(response.data, null, 2));
    
    // Clear token after successful logout
    authToken = '';
    delete api.defaults.headers.common['Authorization'];
    
    return true;
  } catch (error) {
    console.log(`✗ Error! Status: ${error.response ? error.response.status : 'No response'}`);
    console.log(`Error details:`, error.response ? error.response.data : error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log(`\n=========================================`);
  console.log(`   TESTING API ENDPOINTS - HOOPAY APP`);
  console.log(`=========================================`);
  
  // Prompt for login credentials
  rl.question(`Enter email: `, async (email) => {
    rl.question(`Enter password: `, async (password) => {
      // Step 1: Login
      const loginSuccess = await login(email, password);
      
      if (!loginSuccess) {
        console.log(`Cannot proceed with tests - login failed.`);
        rl.close();
        return;
      }
      
      // Step 2: Test user endpoint
      const userEndpointSuccess = await testUserEndpoint();
      
      // Step 3: Test profile endpoint
      const profileEndpointSuccess = await testProfileEndpoint();
      
      // Step 4: Test logout endpoint
      const logoutEndpointSuccess = await testLogoutEndpoint();
      
      // Summary
      console.log(`\n=========================================`);
      console.log(`             TEST SUMMARY`);
      console.log(`=========================================`);
      console.log(`Login: ${loginSuccess ? '✓ PASSED' : '✗ FAILED'}`);
      console.log(`/api/auth/user: ${userEndpointSuccess ? '✓ PASSED' : '✗ FAILED'}`);
      console.log(`/api/profile: ${profileEndpointSuccess ? '✓ PASSED' : '✗ FAILED'}`);
      console.log(`/api/auth/logout: ${logoutEndpointSuccess ? '✓ PASSED' : '✗ FAILED'}`);
      
      // Final result
      const allPassed = loginSuccess && userEndpointSuccess && profileEndpointSuccess && logoutEndpointSuccess;
      console.log(`\nOVERALL RESULT: ${allPassed ? 'ALL TESTS PASSED!' : 'SOME TESTS FAILED'}`);
      
      rl.close();
    });
  });
}

// Run the tests
runTests().catch(err => {
  console.error(`Unhandled error:`, err);
  rl.close();
});
