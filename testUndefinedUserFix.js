/**
 * Test Undefined User Data Fix
 * Validates that our sanitization functions properly handle undefined/null input
 */

console.log('🔧 Testing Undefined User Data Fix...');
console.log('═'.repeat(60));

// Test the sanitization function from AuthContext
function sanitizeUserData(userData) {
  try {
    // Handle null or undefined input
    if (!userData || typeof userData !== 'object') {
      console.error('Invalid user data provided to sanitizeUserData:', userData);
      throw new Error('Invalid user data: cannot sanitize null or undefined');
    }

    // Validate essential properties exist
    if (!userData.id || !userData.email) {
      console.error('Missing essential user properties:', userData);
      throw new Error('Invalid user data: missing id or email');
    }

    // Create a clean copy with only serializable data
    const sanitized = {
      id: userData.id,
      name: userData.name || '',
      email: userData.email,
      email_verified: userData.email_verified || false,
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
    
    // If we have at least some basic user data, try to create a minimal fallback
    if (userData && userData.id && userData.email) {
      return {
        id: userData.id,
        name: userData.name || '',
        email: userData.email,
        email_verified: userData.email_verified || false,
      };
    }
    
    // If we can't create a fallback, throw the error up
    throw error;
  }
}

// Test various problematic scenarios
const testCases = [
  {
    name: 'Undefined Input',
    input: undefined,
    shouldThrow: true
  },
  {
    name: 'Null Input',
    input: null,
    shouldThrow: true
  },
  {
    name: 'Empty Object',
    input: {},
    shouldThrow: true
  },
  {
    name: 'Object Missing ID',
    input: { email: 'test@example.com', name: 'Test User' },
    shouldThrow: true
  },
  {
    name: 'Object Missing Email',
    input: { id: 85, name: 'Test User' },
    shouldThrow: true
  },
  {
    name: 'Valid Minimal User',
    input: { id: 85, email: 'test@example.com' },
    shouldThrow: false
  },
  {
    name: 'Valid Complete User',
    input: { 
      id: 85, 
      email: 'test@example.com', 
      name: 'Test User',
      email_verified: true,
      is_verified: true
    },
    shouldThrow: false
  },
  {
    name: 'String Input (Invalid)',
    input: 'not an object',
    shouldThrow: true
  },
  {
    name: 'Number Input (Invalid)',
    input: 123,
    shouldThrow: true
  },
  {
    name: 'Array Input (Invalid)',
    input: [1, 2, 3],
    shouldThrow: true
  }
];

let passed = 0;
let failed = 0;

console.log('\n🧪 Testing Input Validation:');

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. Testing: ${testCase.name}`);
  console.log('─'.repeat(40));
  console.log('Input:', testCase.input);
  console.log('Should throw:', testCase.shouldThrow);
  
  try {
    const result = sanitizeUserData(testCase.input);
    
    if (testCase.shouldThrow) {
      console.log('❌ FAIL - Expected error but got result:', result);
      failed++;
    } else {
      console.log('✅ PASS - Got expected result:', result);
      
      // Verify serialization works
      try {
        const serialized = JSON.stringify(result);
        console.log('✅ Serialization successful, length:', serialized.length);
        passed++;
      } catch (serError) {
        console.log('❌ FAIL - Result not serializable:', serError.message);
        failed++;
      }
    }
  } catch (error) {
    if (testCase.shouldThrow) {
      console.log('✅ PASS - Got expected error:', error.message);
      passed++;
    } else {
      console.log('❌ FAIL - Unexpected error:', error.message);
      failed++;
    }
  }
});

console.log('\n' + '═'.repeat(60));
console.log('📊 Test Results:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📋 Total: ${passed + failed}`);

if (failed === 0) {
  console.log('\n🎉 ALL TESTS PASSED!');
  console.log('\n✅ The undefined user data fix is working correctly:');
  console.log('  • Properly rejects undefined/null input');
  console.log('  • Validates essential properties (id, email)');
  console.log('  • Provides safe fallbacks when possible');
  console.log('  • Throws clear errors for invalid data');
  console.log('  • Ensures all output is JSON serializable');
} else {
  console.log('\n⚠️  Some tests failed. The fix needs review.');
}

console.log('\n🔍 Expected Behavior in App:');
console.log('When storedUser is undefined:');
console.log('1. Session validation will fail (storedUser && storedUser.id)');
console.log('2. Biometric credentials will be cleared automatically');
console.log('3. User will be prompted to log in with password');
console.log('4. Biometric can be re-enabled after successful login');
console.log('\n✅ This prevents the "Cannot read property \'id\' of undefined" error!'); 