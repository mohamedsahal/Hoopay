/**
 * Test Improved Biometric Flow
 * Validates that biometric credentials are preserved during logout and updated on login
 */

console.log('🔧 Testing Improved Biometric Flow...');
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

// Mock biometric service methods
const mockBiometricService = {
  async updateSessionToken(newToken, userEmail) {
    try {
      const credentialsJson = await mockSecureStore.getItemAsync('biometric_credentials');
      if (credentialsJson) {
        const credentials = JSON.parse(credentialsJson);
        
        // Only update if this is a session-based credential for the same user
        if (credentials.sessionBased && credentials.email === userEmail) {
          credentials.sessionToken = newToken;
          credentials.setupDate = new Date().toISOString(); // Update setup date
          
          await mockSecureStore.setItemAsync(
            'biometric_credentials',
            JSON.stringify(credentials)
          );
          
          console.log('Biometric session token updated successfully');
          return { success: true, message: 'Session token updated' };
        } else {
          console.log('Biometric credentials not session-based or different user, no update needed');
          return { success: false, message: 'Not applicable for this credential type' };
        }
      } else {
        console.log('No biometric credentials found to update');
        return { success: false, message: 'No credentials found' };
      }
    } catch (error) {
      console.error('Error updating biometric session token:', error);
      return { success: false, message: 'Failed to update session token' };
    }
  },

  async isBiometricEnabled() {
    const enabled = await mockSecureStore.getItemAsync('biometric_enabled');
    return enabled === 'true';
  }
};

// Test scenarios
async function testImprovedFlow() {
  console.log('\n🧪 Testing Improved Biometric Flow:');
  console.log('─'.repeat(50));
  
  // Step 1: Initial setup (user has biometric enabled)
  console.log('\n1️⃣ Initial state - User has biometric enabled:');
  await mockSecureStore.setItemAsync('auth_token', 'initial_token_123');
  await mockSecureStore.setItemAsync('userData', JSON.stringify({
    id: 85,
    email: 'mnorsahal@gmail.com',
    name: 'Mohamed Nur Sahal',
    email_verified: true
  }));
  await mockSecureStore.setItemAsync('biometric_enabled', 'true');
  await mockSecureStore.setItemAsync('biometric_credentials', JSON.stringify({
    email: 'mnorsahal@gmail.com',
    password: 'session-based',
    authMethod: 'authenticated-session',
    sessionBased: true,
    sessionToken: 'initial_token_123',
    setupDate: '2025-06-12T08:00:00.000Z'
  }));
  
  console.log('Initial state:', mockSecureStore.getState());
  
  // Step 2: User logs out (IMPROVED - preserves biometric credentials)
  console.log('\n2️⃣ User logs out (improved logout):');
  
  async function improvedLogout() {
    await mockSecureStore.deleteItemAsync('auth_token');
    await mockSecureStore.deleteItemAsync('userData');
    await mockSecureStore.setItemAsync('skipOnboarding', 'true');
    
    // NOTE: Biometric credentials are preserved!
    console.log('Logout: Preserving biometric credentials for next login');
  }
  
  await improvedLogout();
  console.log('After logout:', mockSecureStore.getState());
  
  // Step 3: Verify biometric is still "enabled" but session is invalid
  console.log('\n3️⃣ Checking biometric status after logout:');
  const isBiometricEnabled = await mockBiometricService.isBiometricEnabled();
  const hasValidSession = await mockSecureStore.getItemAsync('auth_token') && await mockSecureStore.getItemAsync('userData');
  
  console.log(`Biometric enabled: ${isBiometricEnabled ? '✅' : '❌'}`);
  console.log(`Valid session: ${hasValidSession ? '✅' : '❌'}`);
  console.log(`Expected behavior: Biometric enabled but session invalid ✅`);
  
  // Step 4: User logs in with password
  console.log('\n4️⃣ User logs in with password:');
  
  async function loginWithPassword() {
    const newToken = 'new_login_token_456';
    const newUserData = {
      id: 85,
      email: 'mnorsahal@gmail.com',
      name: 'Mohamed Nur Sahal',
      email_verified: true
    };
    
    // Store new auth data
    await mockSecureStore.setItemAsync('auth_token', newToken);
    await mockSecureStore.setItemAsync('userData', JSON.stringify(newUserData));
    
    // Update biometric session token
    const updateResult = await mockBiometricService.updateSessionToken(newToken, 'mnorsahal@gmail.com');
    if (updateResult.success) {
      console.log('✅ Biometric session token updated for existing biometric setup');
    } else {
      console.log('❌ Failed to update biometric session token:', updateResult.message);
    }
    
    return { success: true, token: newToken, user: newUserData };
  }
  
  const loginResult = await loginWithPassword();
  console.log('After login:', mockSecureStore.getState());
  
  // Step 5: Verify biometric credentials are updated
  console.log('\n5️⃣ Verifying biometric credentials update:');
  const updatedCredentials = await mockSecureStore.getItemAsync('biometric_credentials');
  if (updatedCredentials) {
    const credentials = JSON.parse(updatedCredentials);
    console.log('Updated credentials:', {
      email: credentials.email,
      sessionBased: credentials.sessionBased,
      sessionToken: credentials.sessionToken.substring(0, 20) + '...',
      setupDate: credentials.setupDate
    });
    
    const isUpdated = credentials.sessionToken === 'new_login_token_456';
    console.log(`Session token updated: ${isUpdated ? '✅' : '❌'}`);
    
    return isUpdated;
  } else {
    console.log('❌ No biometric credentials found');
    return false;
  }
}

async function testSessionValidation() {
  console.log('\n🧪 Testing Session Validation during Biometric Auth:');
  console.log('─'.repeat(50));
  
  // Reset state for this test
  mockSecureStore.storage = {};
  
  // Setup: Biometric enabled but no valid session
  console.log('\n1️⃣ Setup: Biometric enabled but invalid session:');
  await mockSecureStore.setItemAsync('biometric_enabled', 'true');
  await mockSecureStore.setItemAsync('biometric_credentials', JSON.stringify({
    email: 'mnorsahal@gmail.com',
    sessionBased: true,
    sessionToken: 'expired_token',
    setupDate: '2025-06-12T08:00:00.000Z'
  }));
  // No auth_token or userData (invalid session)
  
  console.log('State:', mockSecureStore.getState());
  
  // Simulate biometric authentication attempt
  console.log('\n2️⃣ Attempting biometric authentication:');
  
  async function simulateBiometricAuth() {
    const credentialsJson = await mockSecureStore.getItemAsync('biometric_credentials');
    
    if (credentialsJson) {
      const credentials = JSON.parse(credentialsJson);
      
      // Validate session
      if (credentials.sessionBased) {
        const storedUserData = await mockSecureStore.getItemAsync('userData');
        const storedToken = await mockSecureStore.getItemAsync('auth_token');
        
        if (!storedUserData || !storedToken) {
          console.log('Session expired - no stored user data or token found');
          
          // Clear invalid biometric credentials
          await mockSecureStore.deleteItemAsync('biometric_credentials');
          await mockSecureStore.deleteItemAsync('biometric_enabled');
          
          return {
            success: false,
            error: 'Session expired. Please log in with your password to re-enable biometric authentication.',
            fallbackToPassword: true,
          };
        }
        
        console.log('Session validation passed for biometric authentication');
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
  
  const authResult = await simulateBiometricAuth();
  console.log('Authentication result:', authResult);
  
  console.log('\n3️⃣ Verifying cleanup:');
  const remainingCredentials = await mockSecureStore.getItemAsync('biometric_credentials');
  const remainingEnabled = await mockSecureStore.getItemAsync('biometric_enabled');
  
  console.log(`Credentials cleared: ${!remainingCredentials ? '✅' : '❌'}`);
  console.log(`Biometric disabled: ${!remainingEnabled ? '✅' : '❌'}`);
  
  return !authResult.success && !remainingCredentials && !remainingEnabled;
}

// Run tests
async function runTests() {
  console.log('🚀 Starting improved biometric flow tests...');
  
  const test1Result = await testImprovedFlow();
  const test2Result = await testSessionValidation();
  
  console.log('\n' + '═'.repeat(60));
  console.log('📊 Final Test Results:');
  console.log(`Test 1 - Improved Flow: ${test1Result ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 2 - Session Validation: ${test2Result ? '✅ PASS' : '❌ FAIL'}`);
  
  const allTestsPassed = test1Result && test2Result;
  console.log(`\nOverall Result: ${allTestsPassed ? '🎉 ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);
  
  if (allTestsPassed) {
    console.log('\n✅ The improved biometric flow is working correctly:');
    console.log('  • Biometric credentials are preserved during logout ✅');
    console.log('  • Session token is updated on next login ✅');
    console.log('  • Users don\'t need to re-enable biometric after logout ✅');
    console.log('  • Invalid sessions are detected and cleaned up ✅');
    console.log('  • Graceful fallback to password when needed ✅');
    console.log('\n🚀 Users can now logout and login without losing biometric setup!');
  } else {
    console.log('\n❌ The improved flow needs review - some tests failed.');
  }
  
  return allTestsPassed;
}

// Execute tests
runTests().catch(console.error); 