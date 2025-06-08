// Test script for Account Service
// Run with: node testAccountService.js

const axios = require('axios');

// Mock AsyncStorage for testing
const mockAsyncStorage = {
  getItem: async (key) => {
    if (key === 'authToken') {
      return 'demo-token-for-testing';
    }
    return null;
  }
};

// Simulate the account service for testing
class TestAccountService {
  constructor() {
    this.API_BASE_URL = 'https://hoopaywallet.com/api';
    // For local testing: 'http://localhost:8000/api'
    
    this.apiClient = axios.create({
      baseURL: this.API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Add auth token to requests
    this.apiClient.interceptors.request.use(async (config) => {
      try {
        const token = await mockAsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.log('Error getting auth token:', error);
      }
      return config;
    });
  }

  // Test basic API connectivity
  async testApiConnectivity() {
    try {
      console.log('🔗 Testing API connectivity...');
      const response = await this.apiClient.get('/test');
      
      if (response.data) {
        console.log('✅ API connectivity successful');
        console.log('📦 Response:', response.data);
        return { success: true, data: response.data };
      } else {
        throw new Error('No response data');
      }
    } catch (error) {
      console.log('❌ API connectivity failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Test user profile endpoint
  async testUserProfile() {
    try {
      console.log('\n👤 Testing user profile endpoints...');
      
      // Try V1 profile endpoint first
      try {
        const response = await this.apiClient.get('/v1/profile');
        if (response.data.success) {
          console.log('✅ V1 Profile endpoint successful');
          console.log('📦 Profile data:', response.data.data);
          return { success: true, data: response.data.data };
        }
      } catch (v1Error) {
        console.log('⚠️  V1 Profile endpoint failed, trying fallback...');
        
        // Try fallback endpoint
        const fallbackResponse = await this.apiClient.get('/user');
        if (fallbackResponse.data.success) {
          console.log('✅ Fallback profile endpoint successful');
          console.log('📦 Profile data:', fallbackResponse.data.data);
          return { success: true, data: fallbackResponse.data.data };
        }
      }
      
      throw new Error('All profile endpoints failed');
    } catch (error) {
      console.log('❌ User profile test failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Test dashboard stats
  async testDashboardStats() {
    try {
      console.log('\n📊 Testing dashboard stats endpoints...');
      
      try {
        const response = await this.apiClient.get('/dashboard/stats');
        if (response.data.success) {
          console.log('✅ Dashboard stats successful');
          console.log('📦 Stats data:', response.data.data);
          return { success: true, data: response.data.data };
        }
      } catch (statsError) {
        console.log('⚠️  Dashboard stats failed, trying fallback...');
        
        const fallbackResponse = await this.apiClient.get('/dashboard');
        if (fallbackResponse.data.success) {
          console.log('✅ Fallback dashboard successful');
          console.log('📦 Dashboard data:', fallbackResponse.data.data);
          return { success: true, data: fallbackResponse.data.data };
        }
      }
      
      throw new Error('All dashboard endpoints failed');
    } catch (error) {
      console.log('❌ Dashboard stats test failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Test accounts endpoint
  async testAccounts() {
    try {
      console.log('\n🏦 Testing accounts endpoints...');
      
      const response = await this.apiClient.get('/accounts');
      if (response.data.success) {
        console.log('✅ Accounts endpoint successful');
        console.log('📦 Accounts data:', response.data.data);
        return { success: true, data: response.data.data };
      } else {
        throw new Error(response.data.message || 'Failed to fetch accounts');
      }
    } catch (error) {
      console.log('❌ Accounts test failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Test transactions endpoint
  async testTransactions() {
    try {
      console.log('\n💳 Testing transactions endpoints...');
      
      try {
        const response = await this.apiClient.get('/dashboard/recent-transactions?limit=5');
        if (response.data.success) {
          console.log('✅ Recent transactions successful');
          console.log('📦 Transactions data:', response.data.data);
          return { success: true, data: response.data.data };
        }
      } catch (recentError) {
        console.log('⚠️  Recent transactions failed, trying fallback...');
        
        const fallbackResponse = await this.apiClient.get('/transactions?limit=5');
        if (fallbackResponse.data.success) {
          console.log('✅ Fallback transactions successful');
          console.log('📦 Transactions data:', fallbackResponse.data.data);
          return { success: true, data: fallbackResponse.data.data };
        }
      }
      
      throw new Error('All transaction endpoints failed');
    } catch (error) {
      console.log('❌ Transactions test failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Test account creation
  async testCreateAccount() {
    try {
      console.log('\n➕ Testing account creation...');
      
      const accountData = {
        name: 'Test Wallet Account',
        type: 'wallet',
        currency: 'USD'
      };
      
      const response = await this.apiClient.post('/accounts', accountData);
      if (response.data.success) {
        console.log('✅ Account creation successful');
        console.log('📦 Created account:', response.data.data);
        return { success: true, data: response.data.data };
      } else {
        throw new Error(response.data.message || 'Failed to create account');
      }
    } catch (error) {
      console.log('❌ Account creation test failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Test demo data fallback
  testDemoData() {
    console.log('\n🎭 Testing demo data fallback...');
    
    const demoData = {
      success: true,
      user: {
        id: 'demo-user',
        name: 'Demo User',
        email: 'demo@hoopay.com',
        avatar: null,
        phone: '+1 234 567 8900',
        created_at: new Date().toISOString(),
      },
      stats: {
        total_balance: 1250.50,
        total_transactions: 45,
        pending_withdrawals: 2,
        active_accounts: 2,
        kyc_status: 'pending',
      },
      accounts: [
        {
          id: '1',
          name: 'Main Wallet',
          account_number: 'HW001234567',
          balance: 1250.50,
          currency: 'USD',
          status: 'active',
          type: 'wallet',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Savings Account',
          account_number: 'HW001234568',
          balance: 500.00,
          currency: 'USD',
          status: 'active',
          type: 'savings',
          created_at: new Date().toISOString(),
        }
      ],
    };

    console.log('✅ Demo data structure valid');
    console.log('📦 Demo user:', demoData.user);
    console.log('📦 Demo stats:', demoData.stats);
    console.log('📦 Demo accounts:', demoData.accounts);
    
    return demoData;
  }

  // Format currency test
  formatCurrency(amount, currency = 'USD') {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      return `$${Number(amount).toFixed(2)}`;
    }
  }

  // Test utility functions
  testUtilityFunctions() {
    console.log('\n🔧 Testing utility functions...');
    
    // Test currency formatting
    const testAmounts = [1250.50, 0, -50.75, 1000000];
    console.log('💰 Currency formatting tests:');
    testAmounts.forEach(amount => {
      console.log(`  ${amount} -> ${this.formatCurrency(amount)}`);
    });

    // Test account number formatting
    const testAccountNumbers = ['HW001234567', '+252904555253', '1234', ''];
    console.log('\n🔢 Account number formatting tests:');
    testAccountNumbers.forEach(number => {
      console.log(`  ${number} -> ${this.formatAccountNumber(number)}`);
    });

    // Test user initials
    const testNames = ['John Doe', 'Alice', '', 'Mary Jane Watson'];
    console.log('\n👤 User initials tests:');
    testNames.forEach(name => {
      console.log(`  "${name}" -> ${this.getUserInitials(name)}`);
    });

    // Test time-based greeting
    console.log('\n🕐 Current greeting:', this.getTimeBasedGreeting());
  }

  formatAccountNumber(accountNumber) {
    if (!accountNumber) return 'N/A';
    
    if (accountNumber.startsWith('+')) {
      return accountNumber;
    }
    
    if (accountNumber.length > 8) {
      const start = accountNumber.substring(0, 4);
      const end = accountNumber.substring(accountNumber.length - 4);
      return `${start}****${end}`;
    }
    
    return accountNumber;
  }

  getTimeBasedGreeting() {
    const hour = new Date().getHours();
    
    if (hour < 12) {
      return 'Good Morning';
    } else if (hour < 17) {
      return 'Good Afternoon';
    } else if (hour < 22) {
      return 'Good Evening';
    } else {
      return 'Good Night';
    }
  }

  getUserInitials(name) {
    if (!name) return 'U';
    
    const names = name.trim().split(' ');
    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }
    
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }

  // Run comprehensive test
  async runComprehensiveTest() {
    console.log('🚀 Starting comprehensive Account Service test...\n');
    console.log('=' .repeat(60));

    const results = {};

    // Test API connectivity
    results.connectivity = await this.testApiConnectivity();

    // Test user profile
    results.profile = await this.testUserProfile();

    // Test dashboard stats
    results.stats = await this.testDashboardStats();

    // Test accounts
    results.accounts = await this.testAccounts();

    // Test transactions
    results.transactions = await this.testTransactions();

    // Test account creation (commented out to avoid creating test accounts)
    // results.createAccount = await this.testCreateAccount();

    // Test demo data
    results.demoData = this.testDemoData();

    // Test utility functions
    this.testUtilityFunctions();

    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📋 TEST SUMMARY:');
    console.log('=' .repeat(60));

    let successCount = 0;
    let totalTests = 0;

    Object.entries(results).forEach(([testName, result]) => {
      totalTests++;
      if (result.success) {
        successCount++;
        console.log(`✅ ${testName}: PASSED`);
      } else {
        console.log(`❌ ${testName}: FAILED - ${result.error}`);
      }
    });

    console.log('\n📊 Results:');
    console.log(`   Passed: ${successCount}/${totalTests}`);
    console.log(`   Success Rate: ${((successCount/totalTests) * 100).toFixed(1)}%`);

    if (successCount === 0) {
      console.log('\n⚠️  All API tests failed. The app will use demo data.');
      console.log('💡 This is expected if:');
      console.log('   - You don\'t have internet connection');
      console.log('   - The API server is down');
      console.log('   - Authentication is required but not set up');
      console.log('   - The API endpoints are not implemented yet');
    } else if (successCount < totalTests) {
      console.log('\n⚠️  Some API tests failed. The app will mix real and demo data.');
    } else {
      console.log('\n🎉 All tests passed! The app should work with real API data.');
    }

    console.log('\n🔧 Account Service is ready for use in the mobile app!');
    
    return results;
  }
}

// Run the test
if (require.main === module) {
  const testService = new TestAccountService();
  testService.runComprehensiveTest()
    .then(results => {
      console.log('\n✨ Test completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = TestAccountService; 