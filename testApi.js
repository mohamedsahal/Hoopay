#!/usr/bin/env node

/**
 * Standalone API Test Script for Hoopay API
 * Run this script with Node.js to test the API endpoints
 * Usage: node testApi.js [email] [password]
 */

const https = require('https');

const BASE_URL = 'https://hoopaywallet.com/api/v1';

// Get credentials from command line args or use defaults
const args = process.argv.slice(2);
const testConfig = {
  testEmail: args[0] || 'test@example.com',
  testPassword: args[1] || 'testPassword123',
  authToken: null,
};

// Helper function to make HTTPS requests
function makeRequest(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + endpoint);
    
    const requestOptions = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
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
          });
        } catch (error) {
          resolve({
            success: false,
            status: res.statusCode,
            error: 'Failed to parse response',
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

// Test functions
async function testLogin() {
  console.log('\n📝 Testing Login Endpoint...');
  console.log(`   Email: ${testConfig.testEmail}`);
  
  const result = await makeRequest('/login', {
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
  }
  
  return result;
}

async function testGetUserProfile() {
  console.log('\n📝 Testing Get User Profile...');
  
  if (!testConfig.authToken) {
    console.log('⚠️  No auth token available. Skipping...');
    return;
  }
  
  const result = await makeRequest('/user', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${testConfig.authToken}`,
    },
  });
  
  if (result.success && result.data.success) {
    console.log('✅ User profile retrieved!');
    const user = result.data.data.user;
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Phone: ${user.phone || 'Not set'}`);
  } else {
    console.log('❌ Failed to get user profile!');
    console.log(`   Status: ${result.status}`);
    console.log(`   Message: ${result.data?.message || result.error}`);
  }
  
  return result;
}

async function testGetWallets() {
  console.log('\n📝 Testing Get Wallets...');
  
  if (!testConfig.authToken) {
    console.log('⚠️  No auth token available. Skipping...');
    return;
  }
  
  const result = await makeRequest('/wallets', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${testConfig.authToken}`,
    },
  });
  
  if (result.success && result.data.success) {
    console.log('✅ Wallets retrieved!');
    const wallets = result.data.data.wallets;
    console.log(`   Total wallets: ${wallets.length}`);
    wallets.forEach(wallet => {
      console.log(`   - ${wallet.wallet_type}: ${wallet.currency} ${wallet.balance}`);
    });
  } else {
    console.log('❌ Failed to get wallets!');
    console.log(`   Status: ${result.status}`);
    console.log(`   Message: ${result.data?.message || result.error}`);
  }
  
  return result;
}

async function testGetTransactions() {
  console.log('\n📝 Testing Get Transactions...');
  
  if (!testConfig.authToken) {
    console.log('⚠️  No auth token available. Skipping...');
    return;
  }
  
  const result = await makeRequest('/transactions?per_page=5', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${testConfig.authToken}`,
    },
  });
  
  if (result.success && result.data.success) {
    console.log('✅ Transactions retrieved!');
    const transactions = result.data.data.transactions;
    console.log(`   Total transactions: ${result.data.data.pagination.total}`);
    console.log(`   Showing: ${transactions.length}`);
    transactions.forEach(tx => {
      console.log(`   - ${tx.type}: ${tx.amount} (${tx.status})`);
    });
  } else {
    console.log('❌ Failed to get transactions!');
    console.log(`   Status: ${result.status}`);
    console.log(`   Message: ${result.data?.message || result.error}`);
  }
  
  return result;
}

async function testSystemStatus() {
  console.log('\n📝 Testing System Status (No Auth)...');
  
  const result = await makeRequest('/master/system-status', {
    method: 'GET',
  });
  
  if (result.success && result.data.success) {
    console.log('✅ System status retrieved!');
    console.log(`   Status: ${result.data.data.system_status}`);
    result.data.data.components.forEach(comp => {
      console.log(`   - ${comp.name}: ${comp.status}`);
    });
  } else {
    console.log('❌ Failed to get system status!');
    console.log(`   Status: ${result.status}`);
    console.log(`   Message: ${result.data?.message || result.error}`);
  }
  
  return result;
}

// Main test runner
async function runTests() {
  console.log('🚀 Hoopay API Test Runner');
  console.log('=========================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Email: ${testConfig.testEmail}`);
  console.log('=========================');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
  };

  // List of tests to run
  const tests = [
    { name: 'System Status', fn: testSystemStatus },
    { name: 'Login', fn: testLogin },
    { name: 'User Profile', fn: testGetUserProfile },
    { name: 'Wallets', fn: testGetWallets },
    { name: 'Transactions', fn: testGetTransactions },
  ];

  // Run each test
  for (const test of tests) {
    results.total++;
    try {
      const result = await test.fn();
      if (result && result.success) {
        results.passed++;
      } else if (result) {
        results.failed++;
      }
    } catch (error) {
      console.log(`\n❌ Error in ${test.name}: ${error.message}`);
      results.failed++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n=========================');
  console.log('📊 Test Summary');
  console.log('=========================');
  console.log(`Total tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log('=========================');

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 