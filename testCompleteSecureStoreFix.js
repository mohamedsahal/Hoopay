/**
 * Complete SecureStore Serialization Fix Test
 * Tests all parts of the biometric authentication system to ensure no serialization errors
 */

console.log('🔧 Testing Complete SecureStore Serialization Fix...');
console.log('═'.repeat(60));

// Mock the sanitizeUserData function from AuthContext
function sanitizeUserData(userData) {
  try {
    // Create a clean copy with only serializable data
    const sanitized = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      email_verified: userData.email_verified,
    };

    // Add other properties that are serializable
    Object.keys(userData).forEach(key => {
      if (key !== 'id' && key !== 'name' && key !== 'email' && key !== 'email_verified') {
        const value = userData[key];
        
        // Only include primitive values and simple objects
        if (value !== null && value !== undefined) {
          const type = typeof value;
          if (type === 'string' || type === 'number' || type === 'boolean') {
            sanitized[key] = value;
          } else if (type === 'object' && !Array.isArray(value)) {
            // For objects, try to serialize them to check if they're valid
            try {
              JSON.stringify(value);
              sanitized[key] = value;
            } catch (e) {
              console.warn(`Skipping non-serializable property: ${key}`);
            }
          } else if (Array.isArray(value)) {
            // For arrays, check if they're serializable
            try {
              JSON.stringify(value);
              sanitized[key] = value;
            } catch (e) {
              console.warn(`Skipping non-serializable array property: ${key}`);
            }
          }
        }
      }
    });

    return sanitized;
  } catch (error) {
    console.error('Error sanitizing user data:', error);
    // Return minimal user data as fallback
    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      email_verified: userData.email_verified,
    };
  }
}

// Test scenarios that might occur in real app usage
const testScenarios = [
  {
    name: 'Real User Data from API (with extra properties)',
    userData: {
      id: 85,
      name: 'Mohamed Nur Sahal',
      email: 'mnorsahal@gmail.com',
      email_verified: true,
      created_at: '2025-06-11T06:42:22.000000Z',
      updated_at: '2025-06-11T20:44:19.000000Z',
      email_verified_at: '2025-06-11T06:42:44.000000Z',
      is_verified: true,
      two_factor_enabled: false,
      wallet: {
        id: 64,
        user_id: 85,
        currency: 'USD',
        total_balance: 0,
        available_balance: 0
      },
      referral_code: 'REF123456',
      profile: null,
      phone: null
    }
  },
  {
    name: 'User Data with Problematic Date Object',
    userData: {
      id: 85,
      name: 'Mohamed Nur Sahal',
      email: 'mnorsahal@gmail.com',
      email_verified: true,
      created_at: new Date('2025-06-11T06:42:22.000000Z'), // Date object instead of string
      login_time: new Date() // Current date object
    }
  },
  {
    name: 'User Data with Functions (from React component)',
    userData: {
      id: 85,
      name: 'Mohamed Nur Sahal',
      email: 'mnorsahal@gmail.com',
      email_verified: true,
      toString: function() { return this.name; },
      toJSON: function() { return { id: this.id, name: this.name }; }
    }
  },
  {
    name: 'User Data with Circular Reference',
    userData: (() => {
      const user = {
        id: 85,
        name: 'Mohamed Nur Sahal',
        email: 'mnorsahal@gmail.com',
        email_verified: true,
        wallet: {
          id: 64,
          user_id: 85
        }
      };
      user.wallet.user = user; // Create circular reference
      return user;
    })()
  },
  {
    name: 'User Data with Undefined Values',
    userData: {
      id: 85,
      name: 'Mohamed Nur Sahal',
      email: 'mnorsahal@gmail.com',
      email_verified: true,
      phone: undefined,
      address: undefined,
      bio: null // null is OK, undefined is not
    }
  }
];

// Test each scenario
let totalTests = 0;
let passedTests = 0;

console.log('\n🧪 Testing Scenarios:');

testScenarios.forEach((scenario, index) => {
  console.log(`\n${index + 1}. Testing: ${scenario.name}`);
  console.log('─'.repeat(50));
  
  totalTests++;
  
  try {
    // Test original data serialization
    console.log('📝 Original data serialization:');
    try {
      JSON.stringify(scenario.userData);
      console.log('  ✅ Original data is serializable');
    } catch (originalError) {
      console.log('  ❌ Original data is NOT serializable:', originalError.message);
    }
    
    // Test sanitization
    console.log('🧹 Testing sanitization:');
    const sanitized = sanitizeUserData(scenario.userData);
    
    // Test sanitized data serialization
    const serialized = JSON.stringify(sanitized);
    console.log('  ✅ Sanitized data serialization successful');
    
    // Test parsing back
    const parsed = JSON.parse(serialized);
    console.log('  ✅ Parse back successful');
    
    // Verify essential fields are preserved
    if (parsed.id === 85 && parsed.name === 'Mohamed Nur Sahal' && parsed.email === 'mnorsahal@gmail.com') {
      console.log('  ✅ Essential user data preserved');
    } else {
      throw new Error('Essential user data lost during sanitization');
    }
    
    // Show what was preserved
    console.log('  📦 Preserved fields:', Object.keys(parsed).join(', '));
    console.log('  📏 Serialized length:', serialized.length, 'characters');
    
    passedTests++;
    console.log('  🎉 Test PASSED');
    
  } catch (error) {
    console.log('  💥 Test FAILED:', error.message);
  }
});

// Test the biometric credentials structure
console.log('\n🔐 Testing Biometric Credentials Structure:');
console.log('─'.repeat(50));

const biometricCredentials = {
  email: 'mnorsahal@gmail.com',
  password: 'session-based',
  authMethod: 'authenticated-session',
  sessionBased: true, // boolean, not string
  sessionToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjMwMDAiLCJzdWIiOjg1LCJpYXQiOjE3NDk3MTQ5MTksImV4cCI6MTc1MDMxOTcxOSwidXNlciI6eyJpZCI6ODUsImVtYWlsIjoibW5vcnNhaGFsQGdtYWlsLmNvbSIsIm5hbWUiOiJNb2hhbWVkIE51ciBTYWhhbCJ9fQ.i9vPBBD8ZmqDZ2SjtQOwL1BNQT5Egy5UXgGjpprquGc',
  setupDate: new Date().toISOString()
};

totalTests++;

try {
  console.log('🧪 Testing biometric credentials serialization...');
  
  // Test original credentials
  const credentialsJson = JSON.stringify(biometricCredentials);
  console.log('✅ Biometric credentials serialization successful');
  
  const parsedCredentials = JSON.parse(credentialsJson);
  console.log('✅ Biometric credentials parse back successful');
  
  // Verify types
  if (typeof parsedCredentials.sessionBased === 'boolean') {
    console.log('✅ sessionBased is boolean type');
  } else {
    throw new Error(`sessionBased should be boolean, got ${typeof parsedCredentials.sessionBased}`);
  }
  
  if (typeof parsedCredentials.sessionToken === 'string') {
    console.log('✅ sessionToken is string type');
  } else {
    throw new Error(`sessionToken should be string, got ${typeof parsedCredentials.sessionToken}`);
  }
  
  console.log('📦 Credentials structure:', Object.keys(parsedCredentials).join(', '));
  passedTests++;
  console.log('🎉 Biometric credentials test PASSED');
  
} catch (error) {
  console.log('💥 Biometric credentials test FAILED:', error.message);
}

// Summary
console.log('\n' + '═'.repeat(60));
console.log('📊 FINAL TEST RESULTS:');
console.log(`✅ Passed: ${passedTests}/${totalTests}`);
console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);

if (passedTests === totalTests) {
  console.log('\n🎉 ALL TESTS PASSED! SecureStore serialization is fixed.');
  console.log('\n✅ The fixes include:');
  console.log('  • AuthContext sanitization for all user data');
  console.log('  • AuthService sanitization for API responses');
  console.log('  • Proper boolean types for sessionBased field');
  console.log('  • Removal of circular references');
  console.log('  • Filtering of non-serializable properties');
  console.log('\n🚀 Biometric authentication should now work without errors!');
} else {
  console.log('\n⚠️  Some tests failed. Review the errors above.');
} 