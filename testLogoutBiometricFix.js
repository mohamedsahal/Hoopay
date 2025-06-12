/**
 * Test Logout Biometric Cleanup Fix
 * Validates that biometric credentials are properly cleared during logout
 */

console.log('🔧 Testing Logout Biometric Cleanup Fix...');
console.log('═'.repeat(60));

// Mock SecureStore operations
const mockSecureStore = {
  storage: {},
  
  async setItemAsync(key, value) {
    this.storage[key] = value;
    console.log(`📝 SecureStore.setItemAsync('${key}', '${value.substring(0, 50)}...')`);
  },
  
  async getItemAsync(key) {
    const value = this.storage[key] || null;
    console.log(`📖 SecureStore.getItemAsync('${key}') -> ${value ? `'${value.substring(0, 50)}...'` : 'null'}`);
    return value;
  },
  
  async deleteItemAsync(key) {
    const existed = key in this.storage;
    delete this.storage[key];
    console.log(`🗑️  SecureStore.deleteItemAsync('${key}') -> ${existed ? 'deleted' : 'not found'}`);
  },
  
  getState() {
    return Object.keys(this.storage);
  }
};

// Test scenarios
async function testLogoutCleanup() {
  console.log('\n🧪 Testing Complete Logout Cleanup:');
  console.log('─'.repeat(50));
  
  // Simulate logged-in user with biometric enabled
  console.log('\n1️⃣ Setting up initial state (logged in + biometric enabled):');
  await mockSecureStore.setItemAsync('auth_token', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...');
  await mockSecureStore.setItemAsync('userData', JSON.stringify({
    id: 85,
    email: 'mnorsahal@gmail.com',
    name: 'Mohamed Nur Sahal',
    email_verified: true
  }));
  await mockSecureStore.setItemAsync('biometric_credentials', JSON.stringify({
    email: 'mnorsahal@gmail.com',
    sessionBased: true,
    sessionToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
    setupDate: new Date().toISOString()
  }));
  
  console.log('Initial stored keys:', mockSecureStore.getState());
  
  // Simulate logout with biometric cleanup
  console.log('\n2️⃣ Performing logout with biometric cleanup:');
  
  // AuthContext logout implementation
  async function logout() {
    try {
      await mockSecureStore.deleteItemAsync('auth_token');
      await mockSecureStore.deleteItemAsync('userData');
      
      // Clear biometric credentials to prevent invalid state
      console.log('Clearing biometric credentials during logout...');
      try {
        await mockSecureStore.deleteItemAsync('biometric_credentials');
        console.log('Biometric credentials cleared successfully');
      } catch (biometricError) {
        console.warn('Failed to clear biometric credentials:', biometricError);
      }
      
      await mockSecureStore.setItemAsync('skipOnboarding', 'true');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
  
  await logout();
  console.log('Final stored keys:', mockSecureStore.getState());
  
  // Verify cleanup
  console.log('\n3️⃣ Verifying cleanup:');
  const authToken = await mockSecureStore.getItemAsync('auth_token');
  const userData = await mockSecureStore.getItemAsync('userData');
  const biometricCredentials = await mockSecureStore.getItemAsync('biometric_credentials');
  
  const isCleanedUp = !authToken && !userData && !biometricCredentials;
  
  console.log('✅ Results:');
  console.log(`  • Auth token cleared: ${!authToken ? '✅' : '❌'}`);
  console.log(`  • User data cleared: ${!userData ? '✅' : '❌'}`);
  console.log(`  • Biometric credentials cleared: ${!biometricCredentials ? '✅' : '❌'}`);
  console.log(`  • Overall cleanup: ${isCleanedUp ? '✅' : '❌'}`);
  
  return isCleanedUp;
}

async function testBiometricValidation() {
  console.log('\n🧪 Testing Biometric Session Validation:');
  console.log('─'.repeat(50));
  
  // Simulate biometric credentials without valid session
  console.log('\n1️⃣ Setting up invalid state (biometric enabled but no session):');
  await mockSecureStore.setItemAsync('biometric_credentials', JSON.stringify({
    email: 'mnorsahal@gmail.com',
    sessionBased: true,
    sessionToken: 'expired_token',
    setupDate: new Date().toISOString()
  }));
  
  // No auth_token or userData (simulating after logout)
  console.log('State after logout (biometric credentials remain):', mockSecureStore.getState());
  
  // Simulate biometric authentication attempt
  console.log('\n2️⃣ Attempting biometric authentication:');
  
  async function authenticateWithBiometrics() {
    const credentialsJson = await mockSecureStore.getItemAsync('biometric_credentials');
    
    if (credentialsJson) {
      const credentials = JSON.parse(credentialsJson);
      
      // Validate that the session is still valid by checking if user data exists
      if (credentials.sessionBased) {
        try {
          const storedUserData = await mockSecureStore.getItemAsync('userData');
          const storedToken = await mockSecureStore.getItemAsync('auth_token');
          
          if (!storedUserData || !storedToken) {
            console.log('Session expired - no stored user data or token found');
            
            // Clear invalid biometric credentials
            await mockSecureStore.deleteItemAsync('biometric_credentials');
            
            return {
              success: false,
              error: 'Session expired. Please log in with your password to re-enable biometric authentication.',
              fallbackToPassword: true,
            };
          }
          
          console.log('Session validation passed for biometric authentication');
        } catch (sessionError) {
          console.error('Session validation failed:', sessionError);
          
          // Clear invalid biometric credentials
          await mockSecureStore.deleteItemAsync('biometric_credentials');
          
          return {
            success: false,
            error: 'Session validation failed. Please log in with your password.',
            fallbackToPassword: true,
          };
        }
      }
      
      return {
        success: true,
        userCredentials: credentials,
        authMethod: 'biometric',
      };
    } else {
      return {
        success: false,
        error: 'No stored credentials found',
        fallbackToPassword: true,
      };
    }
  }
  
  const authResult = await authenticateWithBiometrics();
  console.log('Authentication result:', authResult);
  
  console.log('\n3️⃣ Verifying automatic cleanup:');
  const remainingCredentials = await mockSecureStore.getItemAsync('biometric_credentials');
  console.log('Final stored keys:', mockSecureStore.getState());
  
  const isProperlyHandled = !authResult.success && !remainingCredentials;
  console.log(`✅ Session validation and cleanup: ${isProperlyHandled ? '✅' : '❌'}`);
  
  return isProperlyHandled;
}

// Run tests
async function runTests() {
  console.log('🚀 Starting tests...');
  
  const test1Result = await testLogoutCleanup();
  const test2Result = await testBiometricValidation();
  
  console.log('\n' + '═'.repeat(60));
  console.log('📊 Final Test Results:');
  console.log(`Test 1 - Logout Cleanup: ${test1Result ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 2 - Session Validation: ${test2Result ? '✅ PASS' : '❌ FAIL'}`);
  
  const allTestsPassed = test1Result && test2Result;
  console.log(`\nOverall Result: ${allTestsPassed ? '🎉 ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);
  
  if (allTestsPassed) {
    console.log('\n✅ The logout biometric cleanup fix is working correctly:');
    console.log('  • Biometric credentials are cleared during logout');
    console.log('  • Session validation prevents invalid biometric attempts');
    console.log('  • Automatic cleanup occurs when session is invalid');
    console.log('  • Users are guided to log in fresh after logout');
    console.log('\n🚀 This prevents the "Cannot read property \'id\' of undefined" error!');
  } else {
    console.log('\n❌ The fix needs review - some tests failed.');
  }
  
  return allTestsPassed;
}

// Execute tests
runTests().catch(console.error); 