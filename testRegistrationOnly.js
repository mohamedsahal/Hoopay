#!/usr/bin/env node

/**
 * Registration-focused API Test Script for Hoopay API
 * Tests only the V1 registration and authentication endpoints
 * Usage: node testRegistrationOnly.js [email] [password]
 */

const https = require('https');

// Configuration
const BASE_URL = 'https://9e98-102-217-123-227.ngrok-free.app';
const API_V1_BASE = `${BASE_URL}/api/v1`;

// Get credentials from command line args or use unique defaults
const args = process.argv.slice(2);
const testConfig = {
  testEmail: args[0] || `regtest${Date.now()}@example.com`, // Use unique email
  testPassword: args[1] || 'TestPassword123!',
  testName: 'Registration Test User',
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
        'User-Agent': 'Hoopay-Registration-Test/1.0',
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

// Test V1 registration endpoint
async function testV1Registration() {
  console.log('\n📝 Testing V1 Registration...');
  console.log(`   Email: ${testConfig.testEmail}`);
  console.log(`   Name: ${testConfig.testName}`);
  console.log(`   Password: ${'*'.repeat(testConfig.testPassword.length)}`);
  
  const result = await makeRequest(`${API_V1_BASE}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({
      name: testConfig.testName,
      email: testConfig.testEmail,
      password: testConfig.testPassword,
      password_confirmation: testConfig.testPassword,
    }),
  });
  
  console.log(`\n📊 Registration Response:`);
  console.log(`   Status: ${result.status}`);
  console.log(`   Success: ${result.success}`);
  
  if (result.success && result.data.success) {
    console.log('✅ Registration successful!');
    console.log(`   User ID: ${result.data.data.user?.id}`);
    console.log(`   User Name: ${result.data.data.user?.name}`);
    console.log(`   User Email: ${result.data.data.user?.email}`);
    testConfig.userId = result.data.data.user?.id;
    
    if (result.data.data.token) {
      testConfig.authToken = result.data.data.token;
      console.log(`   Auth Token: ${testConfig.authToken.substring(0, 30)}...`);
    }
  } else {
    console.log('❌ Registration failed!');
    console.log(`   Message: ${result.data?.message || result.error}`);
    if (result.data?.errors) {
      console.log(`   Validation Errors:`);
      Object.entries(result.data.errors).forEach(([field, errors]) => {
        console.log(`     ${field}: ${errors.join(', ')}`);
      });
    }
    
    if (result.rawData && result.status >= 500) {
      console.log(`   Raw Response: ${result.rawData.substring(0, 500)}...`);
    }
  }
  
  return result;
}

// Test V1 login endpoint
async function testV1Login() {
  console.log('\n📝 Testing V1 Login...');
  console.log(`   Email: ${testConfig.testEmail}`);
  console.log(`   Password: ${'*'.repeat(testConfig.testPassword.length)}`);
  
  const result = await makeRequest(`${API_V1_BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: testConfig.testEmail,
      password: testConfig.testPassword,
    }),
  });
  
  console.log(`\n📊 Login Response:`);
  console.log(`   Status: ${result.status}`);
  console.log(`   Success: ${result.success}`);
  
  if (result.success && result.data.success) {
    testConfig.authToken = result.data.data.token;
    console.log('✅ Login successful!');
    console.log(`   User Name: ${result.data.data.user.name}`);
    console.log(`   User Email: ${result.data.data.user.email}`);
    console.log(`   Auth Token: ${testConfig.authToken.substring(0, 30)}...`);
  } else {
    console.log('❌ Login failed!');
    console.log(`   Message: ${result.data?.message || result.error}`);
    if (result.data?.errors) {
      console.log(`   Login Errors:`);
      Object.entries(result.data.errors).forEach(([field, errors]) => {
        console.log(`     ${field}: ${errors}`);
      });
    }
  }
  
  return result;
}

// Test authenticated user profile
async function testAuthenticatedUser() {
  console.log('\n📝 Testing Authenticated User Profile...');
  
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
  
  console.log(`\n📊 Profile Response:`);
  console.log(`   Status: ${result.status}`);
  console.log(`   Success: ${result.success}`);
  
  if (result.success && result.data.success) {
    console.log('✅ Profile retrieved successfully!');
    const user = result.data.data.user;
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Created: ${user.created_at}`);
  } else {
    console.log('❌ Failed to get profile!');
    console.log(`   Message: ${result.data?.message || result.error}`);
  }
  
  return result;
}

// Test logout
async function testLogout() {
  console.log('\n📝 Testing Logout...');
  
  if (!testConfig.authToken) {
    console.log('⚠️  No auth token available. Skipping...');
    return { success: false, skipped: true };
  }
  
  const result = await makeRequest(`${API_V1_BASE}/auth/logout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${testConfig.authToken}`,
    },
  });
  
  console.log(`\n📊 Logout Response:`);
  console.log(`   Status: ${result.status}`);
  console.log(`   Success: ${result.success}`);
  
  if (result.success && result.data.success) {
    console.log('✅ Logout successful!');
    console.log(`   Message: ${result.data.message}`);
    testConfig.authToken = null;
  } else {
    console.log('❌ Logout failed!');
    console.log(`   Message: ${result.data?.message || result.error}`);
  }
  
  return result;
}

// Main test runner
async function runRegistrationTests() {
  console.log('🚀 Hoopay Registration System Test');
  console.log('==================================');
  console.log(`V1 API Base: ${API_V1_BASE}`);
  console.log(`Test Email: ${testConfig.testEmail}`);
  console.log(`Test Name: ${testConfig.testName}`);
  console.log('==================================');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
  };

  // Registration flow tests
  const tests = [
    { name: 'V1 Registration', fn: testV1Registration, required: true },
    { name: 'V1 Login', fn: testV1Login, required: true },
    { name: 'Authenticated Profile', fn: testAuthenticatedUser, required: false },
    { name: 'Logout', fn: testLogout, required: false },
  ];

  // Run each test
  for (const test of tests) {
    console.log(`\n${'='.repeat(60)}`);
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
        
        if (test.required) {
          console.log(`   ⚠️  This is critical for the registration system!`);
        }
      }
    } catch (error) {
      console.log(`\n❌ Error in ${test.name}: ${error.message}`);
      results.failed++;
    }
    
    // Delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Registration Test Summary');
  console.log('='.repeat(60));
  console.log(`Total tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log('='.repeat(60));

  // Analysis and recommendations
  console.log('\n🔍 Analysis & Recommendations:');
  
  if (results.passed >= 2) {
    console.log('✅ V1 Authentication System is WORKING!');
    console.log('✅ You can implement registration and login in your app!');
    console.log('\n📱 Next Steps for Mobile App:');
    console.log('1. Use V1 registration endpoint for new users');
    console.log('2. Use V1 login endpoint for authentication');
    console.log('3. Store auth token for API calls');
    console.log('4. Implement proper logout flow');
  } else if (results.passed >= 1) {
    console.log('⚠️  Partial functionality detected');
    console.log('   - Some endpoints working, others need investigation');
  } else {
    console.log('❌ V1 Authentication System has issues');
    console.log('   - Check server configuration');
    console.log('   - Verify database setup');
    console.log('   - Check Laravel route definitions');
  }

  return {
    success: results.passed >= 2,
    results,
    config: testConfig,
  };
}

// Run the tests
runRegistrationTests()
  .then(({ success, results, config }) => {
    if (success) {
      console.log('\n🎉 Registration system is ready for mobile app implementation!');
      if (config.authToken) {
        console.log(`\n🔑 Test credentials (save for further testing):`);
        console.log(`   Email: ${config.testEmail}`);
        console.log(`   Password: ${config.testPassword}`);
        console.log(`   Token: ${config.authToken}`);
      }
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  }); 