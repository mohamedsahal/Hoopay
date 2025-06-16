/**
 * API Test Script for Hoopay API
 * This script tests various endpoints to ensure the API is working correctly
 */

// API Test Configuration for Development
const API_CONFIG = {
  BASE_URL: 'https://hoopaywallet.com/api/v1',
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

const CONFIG = {
  BASE_URL: API_CONFIG.BASE_URL,
  // You'll need to provide valid credentials for testing
  testEmail: '', // Remove default test email to prevent 404 errors
  testPassword: 'testPassword123',
  authToken: null,
};

// Helper function to make API requests
async function makeRequest(endpoint, options = {}) {
  const url = `${CONFIG.BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    const data = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data: data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// Test functions for different endpoints
const apiTests = {
  // Export testConfig so it can be updated from outside
  testConfig: CONFIG,
  
  // Authentication Tests
  async testLogin() {
    console.log('\n📝 Testing Login Endpoint...');
    const result = await makeRequest('/login', {
      method: 'POST',
      body: JSON.stringify({
        email: CONFIG.testEmail,
        password: CONFIG.testPassword,
      }),
    });
    
    if (result.success && result.data.success) {
      CONFIG.authToken = result.data.data.token;
      console.log('✅ Login successful!');
      console.log('   Token:', CONFIG.authToken.substring(0, 20) + '...');
    } else {
      console.log('❌ Login failed:', result.data?.message || result.error);
    }
    
    return result;
  },

  async testRegister() {
    console.log('\n📝 Testing Register Endpoint...');
    const timestamp = Date.now();
    const result = await makeRequest('/register', {
      method: 'POST',
      body: JSON.stringify({
        name: `Test User ${timestamp}`,
        email: `test${timestamp}@example.com`,
        password: 'TestPassword123!',
        password_confirmation: 'TestPassword123!',
        phone: '+1234567890',
      }),
    });
    
    if (result.success && result.data.success) {
      console.log('✅ Registration successful!');
    } else {
      console.log('❌ Registration failed:', result.data?.message || result.error);
    }
    
    return result;
  },

  // User Profile Tests
  async testGetUserProfile() {
    console.log('\n📝 Testing Get User Profile Endpoint...');
    
    if (!CONFIG.authToken) {
      console.log('⚠️  No auth token available. Skipping...');
      return;
    }
    
    const result = await makeRequest('/user', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${CONFIG.authToken}`,
      },
    });
    
    if (result.success && result.data.success) {
      console.log('✅ User profile retrieved successfully!');
      console.log('   User:', result.data.data.user.name);
      console.log('   Email:', result.data.data.user.email);
    } else {
      console.log('❌ Failed to get user profile:', result.data?.message || result.error);
    }
    
    return result;
  },

  // Wallet Tests
  async testGetWallets() {
    console.log('\n📝 Testing Get Wallets Endpoint...');
    
    if (!CONFIG.authToken) {
      console.log('⚠️  No auth token available. Skipping...');
      return;
    }
    
    const result = await makeRequest('/wallets', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${CONFIG.authToken}`,
      },
    });
    
    if (result.success && result.data.success) {
      console.log('✅ Wallets retrieved successfully!');
      console.log('   Number of wallets:', result.data.data.wallets.length);
      result.data.data.wallets.forEach(wallet => {
        console.log(`   - ${wallet.wallet_type}: ${wallet.currency} ${wallet.balance}`);
      });
    } else {
      console.log('❌ Failed to get wallets:', result.data?.message || result.error);
    }
    
    return result;
  },

  // Transaction Tests
  async testGetTransactions() {
    console.log('\n📝 Testing Get Transactions Endpoint...');
    
    if (!CONFIG.authToken) {
      console.log('⚠️  No auth token available. Skipping...');
      return;
    }
    
    const result = await makeRequest('/transactions', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${CONFIG.authToken}`,
      },
    });
    
    if (result.success && result.data.success) {
      console.log('✅ Transactions retrieved successfully!');
      console.log('   Total transactions:', result.data.data.pagination.total);
    } else {
      console.log('❌ Failed to get transactions:', result.data?.message || result.error);
    }
    
    return result;
  },

  // Master Data Tests
  async testGetCurrencies() {
    console.log('\n📝 Testing Get Currencies Endpoint...');
    
    if (!CONFIG.authToken) {
      console.log('⚠️  No auth token available. Skipping...');
      return;
    }
    
    const result = await makeRequest('/master/currencies', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${CONFIG.authToken}`,
      },
    });
    
    if (result.success && result.data.success) {
      console.log('✅ Currencies retrieved successfully!');
      console.log('   Number of currencies:', result.data.data.currencies.length);
      console.log('   Base currency:', result.data.data.exchange_rates.base_currency);
    } else {
      console.log('❌ Failed to get currencies:', result.data?.message || result.error);
    }
    
    return result;
  },

  // KYC Tests
  async testGetKYCStatus() {
    console.log('\n📝 Testing Get KYC Status Endpoint...');
    
    if (!CONFIG.authToken) {
      console.log('⚠️  No auth token available. Skipping...');
      return;
    }
    
    const result = await makeRequest('/mobile/kyc/status', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${CONFIG.authToken}`,
      },
    });
    
    if (result.success && result.data.success) {
      console.log('✅ KYC status retrieved successfully!');
      console.log('   Verification status:', result.data.data.verification_status);
      console.log('   Verification level:', result.data.data.verification_level);
      console.log('   Completion percentage:', result.data.data.completion_percentage + '%');
      console.log('   Required documents:', result.data.data.required_documents?.length || 0);
    } else {
      console.log('❌ Failed to get KYC status:', result.data?.message || result.error);
    }
    
    return result;
  },

  async testSubmitKYCPersonalInfo() {
    console.log('\n📝 Testing Submit KYC Personal Info Endpoint...');
    
    if (!CONFIG.authToken) {
      console.log('⚠️  No auth token available. Skipping...');
      return;
    }

    const personalInfo = {
      full_name: 'John Doe',
      document_type: 'passport',
      document_number: 'P123456789',
      date_of_birth: '1990-01-01',
      nationality: 'United States',
      address: '123 Main Street',
      city: 'New York',
      state: 'NY',
      postal_code: '10001',
      country: 'United States',
      verification_level: 'basic'
    };
    
    const result = await makeRequest('/mobile/kyc/personal-info', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CONFIG.authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(personalInfo),
    });
    
    if (result.success && result.data.success) {
      console.log('✅ KYC personal info submitted successfully!');
      console.log('   KYC ID:', result.data.data.kyc_id);
      console.log('   Status:', result.data.data.status);
      console.log('   Verification level:', result.data.data.verification_level);
    } else {
      console.log('❌ Failed to submit KYC personal info:', result.data?.message || result.error);
      if (result.data?.errors) {
        console.log('   Validation errors:', result.data.errors);
      }
    }
    
    return result;
  },

  async testGetVerificationLimits() {
    console.log('\n📝 Testing Get Verification Limits Endpoint...');
    
    if (!CONFIG.authToken) {
      console.log('⚠️  No auth token available. Skipping...');
      return;
    }
    
    const result = await makeRequest('/mobile/kyc/verification-limits?level=basic', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${CONFIG.authToken}`,
      },
    });
    
    if (result.success && result.data.success) {
      console.log('✅ Verification limits retrieved successfully!');
      console.log('   Level:', result.data.data.level);
      console.log('   Withdrawal limit:', result.data.data.limits.withdrawal_limit);
      console.log('   Deposit limit:', result.data.data.limits.deposit_limit);
      console.log('   Transaction limit:', result.data.data.limits.transaction_limit);
      console.log('   Required documents:', result.data.data.required_documents?.length || 0);
    } else {
      console.log('❌ Failed to get verification limits:', result.data?.message || result.error);
    }
    
    return result;
  },

  async testCheckTransactionLimit() {
    console.log('\n📝 Testing Check Transaction Limit Endpoint...');
    
    if (!CONFIG.authToken) {
      console.log('⚠️  No auth token available. Skipping...');
      return;
    }

    const transactionData = {
      amount: 500.00,
      type: 'withdrawal'
    };
    
    const result = await makeRequest('/mobile/kyc/check-transaction-limit', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CONFIG.authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transactionData),
    });
    
    if (result.success && result.data.success) {
      console.log('✅ Transaction limit check completed!');
      console.log('   Can proceed:', result.data.data.can_proceed);
      console.log('   Amount:', result.data.data.amount);
      console.log('   Current limit:', result.data.data.current_limit);
      console.log('   Verification level:', result.data.data.verification_level);
      if (result.data.data.required_action) {
        console.log('   Required action:', result.data.data.required_action);
      }
    } else {
      console.log('❌ Failed to check transaction limit:', result.data?.message || result.error);
    }
    
    return result;
  },

  // Referral Tests
  async testGetReferrals() {
    console.log('\n📝 Testing Get Referrals Endpoint...');
    
    if (!CONFIG.authToken) {
      console.log('⚠️  No auth token available. Skipping...');
      return;
    }
    
    const result = await makeRequest('/referrals', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${CONFIG.authToken}`,
      },
    });
    
    if (result.success && result.data.success) {
      console.log('✅ Referrals retrieved successfully!');
      console.log('   Referral code:', result.data.data.referral_code);
      console.log('   Referral count:', result.data.data.referral_count);
      console.log('   Total earnings:', result.data.data.total_earnings);
    } else {
      console.log('❌ Failed to get referrals:', result.data?.message || result.error);
    }
    
    return result;
  },

  // App Configuration Test
  async testGetAppConfig() {
    console.log('\n📝 Testing Get App Config Endpoint...');
    
    if (!CONFIG.authToken) {
      console.log('⚠️  No auth token available. Skipping...');
      return;
    }
    
    const result = await makeRequest('/app/config', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${CONFIG.authToken}`,
      },
    });
    
    if (result.success && result.data.success) {
      console.log('✅ App config retrieved successfully!');
      console.log('   Current version:', result.data.data.app_version.current);
      console.log('   Features:', Object.keys(result.data.data.features).join(', '));
    } else {
      console.log('❌ Failed to get app config:', result.data?.message || result.error);
    }
    
    return result;
  },

  // Firebase Login Test
  async testFirebaseLogin() {
    console.log('\n📝 Testing Firebase Login Endpoint...');
    
    const result = await makeRequest('/firebase-login', {
      method: 'POST',
      body: JSON.stringify({
        idToken: 'test-firebase-token-123',
      }),
    });
    
    if (result.success && result.data.success) {
      console.log('✅ Firebase login successful!');
    } else {
      console.log('❌ Firebase login failed (expected in test):', result.data?.message || result.error);
    }
    
    return result;
  },
};

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Hoopay API Tests...');
  console.log('================================');
  console.log('Base URL:', CONFIG.BASE_URL);
  console.log('================================');

  const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
  };

  // Run tests in sequence
  const testsToRun = [
    'testLogin',
    'testGetUserProfile',
    'testGetWallets',
    'testGetTransactions',
    'testGetCurrencies',
    'testGetKYCStatus',
    'testGetReferrals',
    'testGetAppConfig',
    'testFirebaseLogin',
    // Optionally test registration (creates new user each time)
    // 'testRegister',
  ];

  for (const testName of testsToRun) {
    testResults.total++;
    
    try {
      const result = await apiTests[testName]();
      
      if (result === undefined) {
        testResults.skipped++;
      } else if (result.success) {
        testResults.passed++;
      } else {
        testResults.failed++;
      }
    } catch (error) {
      console.log(`❌ Test ${testName} threw an error:`, error.message);
      testResults.failed++;
    }
    
    // Add delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n================================');
  console.log('📊 Test Summary:');
  console.log('================================');
  console.log(`Total tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⚠️  Skipped: ${testResults.skipped}`);
  console.log('================================');

  return testResults;
}

// Export for use in other modules
export { runAllTests, apiTests, makeRequest };

// If running directly (for testing)
if (typeof window === 'undefined' && typeof global !== 'undefined') {
  // Node.js environment
  runAllTests().then(() => {
    console.log('\n✨ API tests completed!');
  }).catch(error => {
    console.error('Fatal error during tests:', error);
  });
} 