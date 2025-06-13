#!/usr/bin/env node

/**
 * Test Alternative Email Verification Patterns
 * Tests various possible endpoint patterns that might have been implemented
 * Usage: node testAlternativePatterns.js
 */

const https = require('https');

// Configuration
const BASE_URL = 'https://9e98-102-217-123-227.ngrok-free.app';
const API_BASE = `${BASE_URL}/api`;
const API_V1_BASE = `${BASE_URL}/api/v1`;

const testEmail = `alternative-test-${Date.now()}@example.com`;

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
        'User-Agent': 'Hoopay-Alternative-Pattern-Test/1.0',
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

// Test various endpoint patterns
async function testAlternativePatterns() {
  console.log('🔍 Testing Alternative Email Verification Patterns');
  console.log('==================================================');
  console.log(`Test Email: ${testEmail}`);
  
  const endpoints = [
    // Alternative V1 patterns
    { name: 'V1 Verify', url: `${API_V1_BASE}/verify`, method: 'POST' },
    { name: 'V1 Verify Email', url: `${API_V1_BASE}/verify-email`, method: 'POST' },
    { name: 'V1 Email Verify', url: `${API_V1_BASE}/email/verify`, method: 'POST' },
    { name: 'V1 Auth Verify', url: `${API_V1_BASE}/auth/verify`, method: 'POST' },
    
    // Alternative base patterns
    { name: 'Base Verify', url: `${API_BASE}/verify`, method: 'POST' },
    { name: 'Base Verify Email', url: `${API_BASE}/verify-email`, method: 'POST' },
    { name: 'Base Email Verify', url: `${API_BASE}/email/verify`, method: 'POST' },
    
    // User-specific patterns
    { name: 'User Verify', url: `${API_BASE}/user/verify`, method: 'POST' },
    { name: 'User Email Verify', url: `${API_BASE}/user/email/verify`, method: 'POST' },
    
    // Account patterns
    { name: 'Account Verify', url: `${API_BASE}/account/verify`, method: 'POST' },
    { name: 'Account Email Verify', url: `${API_BASE}/account/email/verify`, method: 'POST' },
    
    // Registration patterns
    { name: 'Registration Verify', url: `${API_BASE}/registration/verify`, method: 'POST' },
    { name: 'Register Verify', url: `${API_BASE}/register/verify`, method: 'POST' },
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    console.log(`\n📝 Testing: ${endpoint.name}`);
    console.log(`   URL: ${endpoint.url}`);
    
    const result = await makeRequest(endpoint.url, {
      method: endpoint.method,
      body: JSON.stringify({
        email: testEmail,
        verification_code: '123456',
        code: '123456',
        token: 'test-token'
      }),
    });
    
    console.log(`   Status: ${result.status}`);
    
    if (result.status === 404) {
      console.log(`   ❌ Not found`);
    } else if (result.status === 422) {
      console.log(`   ✅ Found! (Validation error - expected)`);
    } else if (result.status === 401) {
      console.log(`   ✅ Found! (Auth error - expected)`);
    } else if (result.status === 500) {
      console.log(`   ⚠️  Found! (Server error)`);
    } else if (result.status === 405) {
      console.log(`   ⚠️  Found! (Method not allowed)`);
    } else {
      console.log(`   ✅ Found! (Status: ${result.status})`);
    }
    
    if (result.data?.message) {
      console.log(`   Message: ${result.data.message}`);
    }
    
    results.push({
      ...endpoint,
      status: result.status,
      exists: result.status !== 404,
    });
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Alternative Patterns Summary');
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
  
  if (existingEndpoints.length > 0) {
    console.log('\n🎉 Found some verification-related endpoints!');
    console.log('📱 Check if any of these can be used for email verification.');
  } else {
    console.log('\n⚠️  No verification endpoints found with alternative patterns.');
  }
  
  return {
    existing: existingEndpoints,
    missing: missingEndpoints,
  };
}

// Run the test
testAlternativePatterns()
  .then((results) => {
    console.log('\n' + '='.repeat(60));
    if (results.existing.length > 0) {
      console.log('🔍 Some endpoints exist - investigate which ones are for email verification.');
    } else {
      console.log('📝 Email verification endpoints need to be implemented.');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  }); 