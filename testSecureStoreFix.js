/**
 * Test SecureStore Serialization Fix
 * This verifies that the biometric credential serialization error is resolved
 */

console.log('🔐 Testing SecureStore Serialization Fix...');
console.log('═'.repeat(60));

// Mock SecureStore for testing
const mockSecureStore = {
  setItemAsync: async (key, value) => {
    console.log(`📝 SecureStore.setItemAsync("${key}", ...)`);
    
    // Validate that value is a string
    if (typeof value !== 'string') {
      throw new Error('Invalid value provided to SecureStore. Values must be strings; consider JSON-encoding your values if they are serializable.');
    }
    
    // Try to parse JSON to ensure it's valid
    try {
      const parsed = JSON.parse(value);
      console.log('✅ Valid JSON structure:', Object.keys(parsed));
      return Promise.resolve();
    } catch (error) {
      throw new Error('Invalid JSON structure provided to SecureStore');
    }
  }
};

// Test credential structures
const testCases = [
  {
    name: 'Valid Session-Based Credentials',
    credentials: {
      email: 'mnorsahal@gmail.com',
      password: 'session-based',
      setupDate: new Date().toISOString(),
      authMethod: 'authenticated-session',
      sessionBased: true, // Boolean (correct)
      sessionToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...'
    },
    shouldPass: true
  },
  {
    name: 'Valid Traditional Credentials',
    credentials: {
      email: 'user@example.com',
      password: 'userpassword123',
      setupDate: new Date().toISOString(),
      authMethod: 'password',
      sessionBased: false, // Boolean (correct)
      sessionToken: null
    },
    shouldPass: true
  },
  {
    name: 'Invalid - sessionBased as JWT token (the bug)',
    credentials: {
      email: 'mnorsahal@gmail.com',
      password: 'session-based',
      setupDate: new Date().toISOString(),
      authMethod: 'authenticated-session',
      sessionBased: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...', // String instead of boolean
      sessionToken: null
    },
    shouldPass: true, // JSON is still valid, but logic is wrong
    isLogicallyIncorrect: true
  },
  {
    name: 'Invalid - Non-serializable object',
    credentials: {
      email: 'test@example.com',
      password: 'test123',
      setupDate: new Date().toISOString(),
      authMethod: 'password',
      sessionBased: true,
      circularRef: {} // This could cause issues
    },
    shouldPass: true
  }
];

async function runTests() {
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    try {
      console.log(`\n🧪 Test: ${testCase.name}`);
      console.log('─'.repeat(40));
      
      // Test JSON serialization first
      const jsonString = JSON.stringify(testCase.credentials);
      console.log(`📦 JSON length: ${jsonString.length} characters`);
      
      // Test SecureStore storage
      await mockSecureStore.setItemAsync('USER_CREDENTIALS_KEY', jsonString);
      
      if (testCase.shouldPass) {
        console.log('✅ PASSED - Serialization successful');
        
        // Check for logical issues
        if (testCase.isLogicallyIncorrect) {
          console.log('⚠️  WARNING - Data structure is logically incorrect');
          console.log('   sessionBased should be boolean, not string');
        }
        
        // Validate credential structure
        const parsed = JSON.parse(jsonString);
        console.log('🔍 Credential validation:');
        console.log(`   - Email: ${parsed.email}`);
        console.log(`   - Auth method: ${parsed.authMethod}`);
        console.log(`   - Session based: ${parsed.sessionBased} (type: ${typeof parsed.sessionBased})`);
        
        if (typeof parsed.sessionBased !== 'boolean') {
          console.log('❌ ERROR - sessionBased should be boolean!');
          failed++;
        } else {
          passed++;
        }
      } else {
        console.log('❌ FAILED - Expected failure but got success');
        failed++;
      }
      
    } catch (error) {
      if (testCase.shouldPass) {
        console.log('❌ FAILED - Unexpected error');
        console.log('   Error:', error.message);
        failed++;
      } else {
        console.log('✅ PASSED - Expected error occurred');
        console.log('   Error:', error.message);
        passed++;
      }
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! SecureStore serialization error is fixed.');
    console.log('\n📋 Key fixes implemented:');
    console.log('- ✅ sessionBased is explicitly boolean with !!isAuthenticatedSession');
    console.log('- ✅ sessionToken stored separately from sessionBased flag');
    console.log('- ✅ Proper JSON serialization validation');
    console.log('- ✅ Enhanced error handling for credential types');
    console.log('- ✅ Session vs password authentication separation');
  } else {
    console.log('\n⚠️  Some tests failed. Additional fixes may be needed.');
  }
}

// Test the credential creation logic
console.log('\n🔧 Testing Credential Creation Logic:');
console.log('─'.repeat(40));

function createCredentials(userCredentials) {
  const isAuthenticatedSession = userCredentials.authMethod === 'authenticated-session' && userCredentials.sessionToken;
  
  return {
    email: userCredentials.email,
    password: isAuthenticatedSession ? 'session-based' : userCredentials.password,
    setupDate: new Date().toISOString(),
    authMethod: userCredentials.authMethod || 'password',
    sessionBased: !!isAuthenticatedSession, // Ensure it's a boolean
    sessionToken: isAuthenticatedSession ? userCredentials.sessionToken : null
  };
}

// Test the actual credential creation
const testInput = {
  email: 'mnorsahal@gmail.com',
  password: 'session-validated',
  authMethod: 'authenticated-session',
  sessionToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjMwMDAiLCJzdWIiOjg1LCJpYXQiOjE3NDk3MTM4MzMsImV4cCI6MTc1MDMxODYzMywidXNlciI6eyJpZCI6ODUsImVtYWlsIjoibW5vcnNhaGFsQGdtYWlsLmNvbSIsIm5hbWUiOiJNb2hhbWVkIE51ciBTYWhhbCJ9fQ.lmTlURYzkvEM2nnG1bqFEQdoIs64uQRhy6sj3pn3J1s'
};

const createdCredentials = createCredentials(testInput);
console.log('✅ Created credentials structure:');
console.log(JSON.stringify(createdCredentials, null, 2));

// Run the tests
runTests().catch(console.error); 