/**
 * Debug SecureStore Serialization Error
 * This script helps identify exactly what's causing the serialization error
 */

console.log('🔍 Debugging SecureStore Serialization Error...');
console.log('═'.repeat(60));

// Test JSON.stringify with various data types
function testSerialization(data, label) {
  console.log(`\n🧪 Testing: ${label}`);
  console.log('─'.repeat(40));
  
  try {
    const serialized = JSON.stringify(data);
    console.log('✅ Serialization successful');
    console.log(`📦 Length: ${serialized.length} characters`);
    
    // Test parsing back
    const parsed = JSON.parse(serialized);
    console.log('✅ Parse back successful');
    console.log('🔍 Data type:', typeof data);
    console.log('🔍 Parsed type:', typeof parsed);
    
    return true;
  } catch (error) {
    console.log('❌ Serialization failed');
    console.log('💥 Error:', error.message);
    
    // Try to identify the problematic property
    if (typeof data === 'object' && data !== null) {
      console.log('🔍 Analyzing object properties...');
      for (const [key, value] of Object.entries(data)) {
        try {
          JSON.stringify(value);
          console.log(`  ✅ ${key}: ${typeof value}`);
        } catch (propError) {
          console.log(`  ❌ ${key}: ${typeof value} - ${propError.message}`);
        }
      }
    }
    
    return false;
  }
}

// Test various user data scenarios that might cause issues
const testCases = [
  {
    label: 'Simple User Object',
    data: {
      id: 85,
      name: 'Mohamed Nur Sahal',
      email: 'mnorsahal@gmail.com',
      email_verified: true
    }
  },
  {
    label: 'User with Date Object',
    data: {
      id: 85,
      name: 'Mohamed Nur Sahal', 
      email: 'mnorsahal@gmail.com',
      email_verified: true,
      created_at: new Date() // Date objects can be problematic
    }
  },
  {
    label: 'User with Function',
    data: {
      id: 85,
      name: 'Mohamed Nur Sahal',
      email: 'mnorsahal@gmail.com',
      email_verified: true,
      toString: function() { return this.name; } // Functions are not serializable
    }
  },
  {
    label: 'User with Undefined',
    data: {
      id: 85,
      name: 'Mohamed Nur Sahal',
      email: 'mnorsahal@gmail.com',
      email_verified: true,
      phone: undefined // undefined is not JSON serializable
    }
  },
  {
    label: 'User with Circular Reference',
    data: (() => {
      const user = {
        id: 85,
        name: 'Mohamed Nur Sahal',
        email: 'mnorsahal@gmail.com',
        email_verified: true
      };
      user.self = user; // Circular reference
      return user;
    })()
  },
  {
    label: 'Complex User Object (Real-world scenario)',
    data: {
      id: 85,
      name: 'Mohamed Nur Sahal',
      email: 'mnorsahal@gmail.com',
      email_verified: true,
      created_at: '2025-06-11T06:42:22.000000Z',
      wallet: {
        id: 64,
        user_id: 85,
        currency: 'USD',
        total_balance: 0,
        available_balance: 0
      },
      profile: null,
      phone: null,
      bio: null,
      is_verified: true,
      two_factor_enabled: false
    }
  },
  {
    label: 'User with Symbol (Non-serializable)',
    data: {
      id: 85,
      name: 'Mohamed Nur Sahal',
      email: 'mnorsahal@gmail.com',
      email_verified: true,
      [Symbol('id')]: 'symbol-value' // Symbols are not JSON serializable
    }
  },
  {
    label: 'User with BigInt',
    data: {
      id: 85,
      name: 'Mohamed Nur Sahal',
      email: 'mnorsahal@gmail.com',
      email_verified: true,
      bigNumber: BigInt(123456789012345678901234567890) // BigInt is not JSON serializable
    }
  }
];

// Run tests
console.log('🧪 Running serialization tests...');

let passed = 0;
let failed = 0;

testCases.forEach(testCase => {
  const success = testSerialization(testCase.data, testCase.label);
  if (success) {
    passed++;
  } else {
    failed++;
  }
});

console.log('\n' + '═'.repeat(60));
console.log('📊 Test Results:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);

// Test the sanitization function
console.log('\n🧹 Testing Data Sanitization:');
console.log('─'.repeat(40));

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

// Test sanitization on problematic data
const problematicData = testCases[4].data; // Circular reference case
console.log('🧪 Testing sanitization on circular reference data...');
const sanitized = sanitizeUserData(problematicData);
const sanitizationSuccess = testSerialization(sanitized, 'Sanitized Data');

if (sanitizationSuccess) {
  console.log('✅ Sanitization successfully fixed the issue!');
} else {
  console.log('❌ Sanitization did not fix the issue');
}

console.log('\n🎯 Summary:');
console.log('- Common causes of SecureStore errors:');
console.log('  • Date objects (use ISO strings instead)');
console.log('  • Functions or methods');
console.log('  • Circular references');
console.log('  • undefined values (use null instead)');
console.log('  • Symbols');
console.log('  • BigInt values');
console.log('- Solution: Use data sanitization before storing');
console.log('- The AuthContext now includes sanitization to prevent these errors'); 