#!/usr/bin/env node

/**
 * Comprehensive API Test Script for Hoopay API
 * Tests all documented endpoints from the API documentation
 * Usage: node testComprehensiveApi.js [email] [password]
 */

const https = require('https');

// Configuration
const BASE_URL = 'https://hoopaywallet.com';
const API_V1_BASE = `${BASE_URL}/api/v1`;
const API_BASE = `${BASE_URL}/api`;

// Get credentials from command line args or use defaults
const args = process.argv.slice(2);
const testConfig = {
  testEmail: args[0] || `test${Date.now()}@example.com`, // Use unique email for registration
  testPassword: args[1] || 'TestPassword123!',
  testName: 'Test User',
  authToken: null,
  userId: null,
};

// Helper function to make HTTPS requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Hoopay-API-Test/2.0',
        ...options.headers,
      },
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data: jsonData,
            rawData: data,
          });
        } catch (error) {
          resolve({
            success: false,
            status: res.statusCode,
            error: 'Failed to parse JSON response',
            rawData: data,
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
      });
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// Test basic API connectivity
async function testBasicConnectivity() {
  console.log('\n🔍 Testing Basic API Connectivity...');
  
  const result = await makeRequest(`${API_BASE}/test`);
  
  if (result.success && result.data.message) {
    console.log('✅ Basic API test endpoint working!');
    console.log(`   Message: ${result.data.message}`);
    console.log(`   Timestamp: ${result.data.timestamp}`);
  } else {
    console.log('❌ Basic API test failed!');
    console.log(`   Status: ${result.status}`);
    console.log(`   Error: ${result.error || result.data?.message}`);
    if (result.rawData) {
      console.log(`   Raw response: ${result.rawData.substring(0, 200)}...`);
    }
  }
  
  return result;
}

// Test user registration (V1 API)
async function testRegistration() {
  console.log('\n📝 Testing User Registration (V1)...');
  console.log(`   Email: ${testConfig.testEmail}`);
  console.log(`   Name: ${testConfig.testName}`);
  
  const result = await makeRequest(`${API_V1_BASE}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({
      name: testConfig.testName,
      email: testConfig.testEmail,
      password: testConfig.testPassword,
      password_confirmation: testConfig.testPassword,
    }),
  });
  
  if (result.success && result.data.success) {
    console.log('✅ Registration successful!');
    console.log(`   User ID: ${result.data.data.user?.id}`);
    console.log(`   User: ${result.data.data.user?.name}`);
    testConfig.userId = result.data.data.user?.id;
    if (result.data.data.token) {
      testConfig.authToken = result.data.data.token;
      console.log(`   Token: ${testConfig.authToken.substring(0, 30)}...`);
    }
  } else {
    console.log('❌ Registration failed!');
    console.log(`   Status: ${result.status}`);
    console.log(`   Message: ${result.data?.message || result.error}`);
    if (result.data?.errors) {
      console.log(`   Errors: ${JSON.stringify(result.data.errors)}`);
    }
  }
  
  return result;
}

// Test save user (basic API)
async function testSaveUser() {
  console.log('\n📝 Testing Save User (Basic API)...');
  
  const userData = {
    name: testConfig.testName,
    email: testConfig.testEmail,
    role: 'user'
  };
  
  const result = await makeRequest(`${API_BASE}/save-user`, {
    method: 'POST',
    body: JSON.stringify(userData),
  });
  
  if (result.success && result.data.success) {
    console.log('✅ User saved successfully!');
    console.log(`   User ID: ${result.data.data.user.id}`);
    console.log(`   Name: ${result.data.data.user.name}`);
    console.log(`   Email: ${result.data.data.user.email}`);
    if (!testConfig.userId) {
      testConfig.userId = result.data.data.user.id;
    }
  } else {
    console.log('❌ Save user failed!');
    console.log(`   Status: ${result.status}`);
    console.log(`   Message: ${result.data?.message || result.error}`);
  }
  
  return result;
}

// Test get user (basic API)
async function testGetUser() {
  console.log('\n📝 Testing Get User (Basic API)...');
  
  if (!testConfig.userId) {
    console.log('⚠️  No user ID available. Skipping...');
    return { success: false, skipped: true };
  }
  
  const result = await makeRequest(`${API_BASE}/get-user/${testConfig.userId}`);
  
  if (result.success && result.data.success) {
    console.log('✅ User retrieved successfully!');
    console.log(`   User ID: ${result.data.data.user.id}`);
    console.log(`   Name: ${result.data.data.user.name}`);
    console.log(`   Email: ${result.data.data.user.email}`);
    if (result.data.data.user.profile) {
      console.log(`   Profile ID: ${result.data.data.user.profile.id}`);
    }
  } else {
    console.log('❌ Get user failed!');
    console.log(`   Status: ${result.status}`);
    console.log(`   Message: ${result.data?.message || result.error}`);
  }
  
  return result;
}

// Test login (V1 API)
async function testLogin() {
  console.log('\n📝 Testing Login (V1 API)...');
  console.log(`   Email: ${testConfig.testEmail}`);
  
  const result = await makeRequest(`${API_V1_BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: testConfig.testEmail,
      password: testConfig.testPassword,
    }),
  });
  
  if (result.success && result.data.success) {
    testConfig.authToken = result.data.data.token;
    console.log('✅ Login successful!');
    console.log(`   User: ${result.data.data.user.name}`);
    console.log(`   Token: ${testConfig.authToken.substring(0, 30)}...`);
  } else {
    console.log('❌ Login failed!');
    console.log(`   Status: ${result.status}`);
    console.log(`   Message: ${result.data?.message || result.error}`);
    if (result.data?.errors) {
      console.log(`   Errors: ${JSON.stringify(result.data.errors)}`);
    }
  }
  
  return result;
}

// Test authenticated user profile (V1 API)
async function testAuthenticatedProfile() {
  console.log('\n📝 Testing Authenticated Profile (V1 API)...');
  
  if (!testConfig.authToken) {
    console.log('⚠️  No auth token available. Skipping...');
    return { success: false, skipped: true };
  }
  
  const result = await makeRequest(`${API_V1_BASE}/auth/user`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${testConfig.authToken}`,
    },
  });
  
  if (result.success && result.data.success) {
    console.log('✅ Authenticated profile retrieved!');
    const user = result.data.data.user;
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
  } else {
    console.log('❌ Failed to get authenticated profile!');
    console.log(`   Status: ${result.status}`);
    console.log(`   Message: ${result.data?.message || result.error}`);
  }
  
  return result;
}

// Test dashboard endpoints
async function testDashboard() {
  console.log('\n📝 Testing Dashboard...');
  
  if (!testConfig.authToken) {
    console.log('⚠️  No auth token available. Skipping...');
    return { success: false, skipped: true };
  }
  
  const result = await makeRequest(`${API_BASE}/dashboard`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${testConfig.authToken}`,
    },
  });
  
  if (result.success && result.data.success) {
    console.log('✅ Dashboard data retrieved!');
    if (result.data.data) {
      console.log(`   Dashboard data available`);
    }
  } else {
    console.log('❌ Failed to get dashboard!');
    console.log(`   Status: ${result.status}`);
    console.log(`   Message: ${result.data?.message || result.error}`);
  }
  
  return result;
}

// Test Firebase login (if available)
async function testFirebaseLogin() {
  console.log('\n📝 Testing Firebase Login...');
  console.log('   Note: This test will likely fail without valid Firebase token');
  
  const result = await makeRequest(`${API_BASE}/firebase-login`, {
    method: 'POST',
    body: JSON.stringify({
      idToken: 'fake-firebase-token-for-testing',
      referral_code: null,
    }),
  });
  
  if (result.success && result.data.success) {
    console.log('✅ Firebase login endpoint working!');
  } else {
    console.log('⚠️  Firebase login failed (expected without valid token)!');
    console.log(`   Status: ${result.status}`);
    console.log(`   Message: ${result.data?.message || result.error}`);
  }
  
  return result;
}

// Main test runner
async function runComprehensiveTests() {
  console.log('🚀 Hoopay Comprehensive API Test Runner');
  console.log('=======================================');
  console.log(`API Base URL: ${API_BASE}`);
  console.log(`V1 API Base URL: ${API_V1_BASE}`);
  console.log(`Test Email: ${testConfig.testEmail}`);
  console.log(`Test Name: ${testConfig.testName}`);
  console.log('=======================================');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
  };

  // List of tests to run in order
  const tests = [
    { name: 'Basic Connectivity', fn: testBasicConnectivity, required: true },
    { name: 'Save User (Basic)', fn: testSaveUser, required: false },
    { name: 'Get User (Basic)', fn: testGetUser, required: false },
    { name: 'Registration (V1)', fn: testRegistration, required: true },
    { name: 'Login (V1)', fn: testLogin, required: true },
    { name: 'Authenticated Profile (V1)', fn: testAuthenticatedProfile, required: false },
    { name: 'Dashboard', fn: testDashboard, required: false },
    { name: 'Firebase Login', fn: testFirebaseLogin, required: false },
  ];

  // Run each test
  for (const test of tests) {
    console.log(`\n${'='.repeat(50)}`);
    results.total++;
    
    try {
      const result = await test.fn();
      
      if (result && result.skipped) {
        results.skipped++;
        console.log(`⏭️  ${test.name} skipped`);
      } else if (result && result.success) {
        results.passed++;
        console.log(`✅ ${test.name} passed`);
      } else {
        results.failed++;
        console.log(`❌ ${test.name} failed`);
        
        // If this is a required test and it failed, show more details
        if (test.required) {
          console.log(`   ⚠️  This is a required test for the registration system!`);
        }
      }
    } catch (error) {
      console.log(`\n❌ Error in ${test.name}: ${error.message}`);
      results.failed++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Comprehensive Test Summary');
  console.log('='.repeat(50));
  console.log(`Total tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log('='.repeat(50));

  // Recommendations
  console.log('\n💡 Recommendations for Registration System:');
  if (results.passed > 0) {
    console.log('✅ Some API endpoints are working!');
    if (testConfig.authToken) {
      console.log('✅ Authentication is working - you can implement login/register!');
    }
    if (testConfig.userId) {
      console.log('✅ User creation is working - registration flow can be implemented!');
    }
  } else {
    console.log('❌ No API endpoints are working. Check server configuration.');
  }

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runComprehensiveTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 