#!/usr/bin/env node

/**
 * Email Verification Endpoints Test Script
 * Tests the email verification endpoints specifically
 * Usage: node testEmailVerificationEndpoints.js
 */

const https = require('https');

// Configuration
const BASE_URL = 'https://9e98-102-217-123-227.ngrok-free.app';
const API_V1_BASE = `${BASE_URL}/api/v1`;
const API_BASE = `${BASE_URL}/api`;

const testEmail = 'test-verification@example.com';

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
        'User-Agent': 'Hoopay-Email-Verification-Test/1.0',
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

// Test email verification endpoints
async function testEmailVerificationEndpoints() {
  console.log('🔍 Testing Email Verification Endpoints');
  console.log('=======================================');

  const endpoints = [
    // V1 API endpoints
    { name: 'V1 Email Verify', url: `${API_V1_BASE}/auth/email/verify`, method: 'POST' },
    { name: 'V1 Email Resend', url: `${API_V1_BASE}/auth/email/resend`, method: 'POST' },
    
    // Base API endpoints
    { name: 'Base Email Verify', url: `${API_BASE}/auth/email/verify`, method: 'POST' },
    { name: 'Base Email Resend', url: `${API_BASE}/auth/email/resend`, method: 'POST' },
    
    // Alternative endpoint patterns
    { name: 'Email Verification', url: `${API_BASE}/email/verify`, method: 'POST' },
    { name: 'Email Confirm', url: `${API_BASE}/email/confirm`, method: 'POST' },
    { name: 'Verify Email', url: `${API_BASE}/verify-email`, method: 'POST' },
    
    // Standard Laravel auth endpoints
    { name: 'Laravel Email Verify', url: `${API_BASE}/email/verify`, method: 'GET' },
    { name: 'Laravel Email Resend', url: `${API_BASE}/email/resend`, method: 'POST' },
  ];

  const results = [];

  for (const endpoint of endpoints) {
    console.log(`\n📝 Testing: ${endpoint.name}`);
    console.log(`   URL: ${endpoint.url}`);
    console.log(`   Method: ${endpoint.method}`);

    const result = await makeRequest(endpoint.url, {
      method: endpoint.method,
      body: JSON.stringify({
        email: testEmail,
        verification_code: '123456',
        token: 'test-token'
      }),
    });

    console.log(`   Status: ${result.status}`);
    console.log(`   Success: ${result.success}`);
    
    if (result.status === 404) {
      console.log(`   ❌ Endpoint not found`);
    } else if (result.status === 422) {
      console.log(`   ⚠️  Endpoint exists but validation failed (expected)`);
    } else if (result.status === 401) {
      console.log(`   ⚠️  Endpoint exists but requires authentication`);
    } else if (result.status === 500) {
      console.log(`   ⚠️  Endpoint exists but server error`);
    } else {
      console.log(`   ✅ Endpoint responds (status: ${result.status})`);
    }

    if (result.data && result.data.message) {
      console.log(`   Message: ${result.data.message}`);
    }

    results.push({
      ...endpoint,
      status: result.status,
      success: result.success,
      exists: result.status !== 404,
    });

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Email Verification Endpoints Summary');
  console.log('='.repeat(60));

  const existingEndpoints = results.filter(r => r.exists);
  const missingEndpoints = results.filter(r => !r.exists);

  console.log(`\n✅ Found endpoints (${existingEndpoints.length}):`);
  existingEndpoints.forEach(ep => {
    console.log(`   - ${ep.name} (${ep.method}) - Status: ${ep.status}`);
  });

  console.log(`\n❌ Missing endpoints (${missingEndpoints.length}):`);
  missingEndpoints.forEach(ep => {
    console.log(`   - ${ep.name} (${ep.method})`);
  });

  console.log('\n🎯 Recommendations:');
  if (existingEndpoints.length > 0) {
    console.log('✅ Some verification endpoints exist!');
    console.log('   - Update authService to use working endpoints');
    console.log('   - Test with proper parameters');
  } else {
    console.log('❌ No email verification endpoints found!');
    console.log('   - Server needs email verification implementation');
    console.log('   - Consider implementing fallback solution');
    console.log('   - Contact backend developer for endpoint implementation');
  }

  return {
    existing: existingEndpoints,
    missing: missingEndpoints,
    total: results.length,
  };
}

// Run the test
testEmailVerificationEndpoints()
  .then((summary) => {
    console.log('\n' + '='.repeat(60));
    if (summary.existing.length > 0) {
      console.log('🎉 Email verification infrastructure partially available!');
    } else {
      console.log('⚠️  Email verification endpoints need to be implemented on server!');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  }); 