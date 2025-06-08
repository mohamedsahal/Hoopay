#!/usr/bin/env node

/**
 * Test Specific Email Verification Endpoints
 * Tests the exact endpoints mentioned in the API documentation
 * Usage: node testSpecificEndpoints.js
 */

const https = require('https');

// Configuration
const BASE_URL = 'https://hoopaywallet.com';
const API_BASE = `${BASE_URL}/api`;

const testEmail = `endpoint-test-${Date.now()}@example.com`;

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
        'User-Agent': 'Hoopay-Specific-Endpoint-Test/1.0',
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

// Test the specific documented endpoints
async function testDocumentedEndpoints() {
  console.log('🔍 Testing Specific Documented Email Verification Endpoints');
  console.log('========================================================');
  console.log(`Test Email: ${testEmail}`);
  
  // Test 1: POST /api/auth/verify-email
  console.log('\n📝 Testing POST /api/auth/verify-email...');
  const verifyResult = await makeRequest(`${API_BASE}/auth/verify-email`, {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      verification_code: '123456',
    }),
  });
  
  console.log(`   Status: ${verifyResult.status}`);
  console.log(`   Success: ${verifyResult.success}`);
  
  if (verifyResult.status === 404) {
    console.log('   ❌ Endpoint not found');
  } else if (verifyResult.status === 422) {
    console.log('   ✅ Endpoint exists (validation error expected)');
  } else if (verifyResult.status === 401) {
    console.log('   ✅ Endpoint exists (auth error expected)');
  } else {
    console.log(`   ✅ Endpoint responds (status: ${verifyResult.status})`);
  }
  
  if (verifyResult.data?.message) {
    console.log(`   Message: ${verifyResult.data.message}`);
  }
  
  // Test 2: POST /api/auth/resend-verification
  console.log('\n📝 Testing POST /api/auth/resend-verification...');
  const resendResult = await makeRequest(`${API_BASE}/auth/resend-verification`, {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
    }),
  });
  
  console.log(`   Status: ${resendResult.status}`);
  console.log(`   Success: ${resendResult.success}`);
  
  if (resendResult.status === 404) {
    console.log('   ❌ Endpoint not found');
  } else if (resendResult.status === 422) {
    console.log('   ✅ Endpoint exists (validation error expected)');
  } else if (resendResult.status === 401) {
    console.log('   ✅ Endpoint exists (auth error expected)');
  } else {
    console.log(`   ✅ Endpoint responds (status: ${resendResult.status})`);
  }
  
  if (resendResult.data?.message) {
    console.log(`   Message: ${resendResult.data.message}`);
  }
  
  // Test 3: GET /api/auth/verification-status
  console.log('\n📝 Testing GET /api/auth/verification-status...');
  const statusResult = await makeRequest(`${API_BASE}/auth/verification-status?email=${encodeURIComponent(testEmail)}`);
  
  console.log(`   Status: ${statusResult.status}`);
  console.log(`   Success: ${statusResult.success}`);
  
  if (statusResult.status === 404) {
    console.log('   ❌ Endpoint not found');
  } else if (statusResult.status === 422) {
    console.log('   ✅ Endpoint exists (validation error expected)');
  } else if (statusResult.status === 401) {
    console.log('   ✅ Endpoint exists (auth error expected)');
  } else {
    console.log(`   ✅ Endpoint responds (status: ${statusResult.status})`);
  }
  
  if (statusResult.data?.message) {
    console.log(`   Message: ${statusResult.data.message}`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Documented Endpoints Test Summary');
  console.log('='.repeat(60));
  
  const results = [
    { name: 'verify-email', status: verifyResult.status, exists: verifyResult.status !== 404 },
    { name: 'resend-verification', status: resendResult.status, exists: resendResult.status !== 404 },
    { name: 'verification-status', status: statusResult.status, exists: statusResult.status !== 404 },
  ];
  
  const existingEndpoints = results.filter(r => r.exists);
  const missingEndpoints = results.filter(r => !r.exists);
  
  console.log(`\n✅ Working endpoints (${existingEndpoints.length}):`);
  existingEndpoints.forEach(ep => {
    console.log(`   - /api/auth/${ep.name} (Status: ${ep.status})`);
  });
  
  console.log(`\n❌ Missing endpoints (${missingEndpoints.length}):`);
  missingEndpoints.forEach(ep => {
    console.log(`   - /api/auth/${ep.name}`);
  });
  
  if (existingEndpoints.length > 0) {
    console.log('\n🎉 Email verification endpoints are now available!');
    console.log('📱 Mobile app can use the full verification flow.');
    console.log('🔧 You may need to update authService.js to use the correct endpoints.');
  } else {
    console.log('\n⚠️  Email verification endpoints are still missing.');
    console.log('📱 Mobile app will continue using fallback UI.');
  }
  
  return {
    existing: existingEndpoints,
    missing: missingEndpoints,
    allWorking: existingEndpoints.length === 3,
  };
}

// Run the test
testDocumentedEndpoints()
  .then((results) => {
    console.log('\n' + '='.repeat(60));
    if (results.allWorking) {
      console.log('🚀 All email verification endpoints are working!');
    } else if (results.existing.length > 0) {
      console.log('🔄 Some email verification endpoints are working.');
    } else {
      console.log('⏳ Email verification endpoints are not yet implemented.');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  }); 