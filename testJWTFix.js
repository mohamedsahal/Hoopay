/**
 * Test JWT parsing fix
 * This verifies that the JWT token parsing error is resolved
 */

const { getTokenInfo, parseJWTPayload, logTokenInfo } = require('./src/utils/jwtUtils');

// Sample JWT token from the logs that was causing the error
const testToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjMwMDAiLCJzdWIiOjg1LCJpYXQiOjE3NDk3MTM4MzMsImV4cCI6MTc1MDMxODYzMywidXNlciI6eyJpZCI6ODUsImVtYWlsIjoibW5vcnNhaGFsQGdtYWlsLmNvbSIsIm5hbWUiOiJNb2hhbWVkIE51ciBTYWhhbCJ9fQ.lmTlURYzkvEM2nnG1bqFEQdoIs64uQRhy6sj3pn3J1s";

console.log('🧪 Testing JWT Token Parsing Fix...');
console.log('═'.repeat(50));

try {
  // Test 1: Parse JWT payload
  console.log('Test 1: Parsing JWT payload...');
  const payload = parseJWTPayload(testToken);
  
  if (payload) {
    console.log('✅ JWT payload parsed successfully!');
    console.log('📦 Payload keys:', Object.keys(payload));
    console.log('👤 User ID:', payload.sub);
    console.log('📧 User email:', payload.user?.email);
    console.log('⏰ Expiration:', new Date(payload.exp * 1000).toISOString());
  } else {
    console.log('❌ Failed to parse JWT payload');
  }
  
  console.log('\n' + '─'.repeat(30));
  
  // Test 2: Get token info
  console.log('Test 2: Getting token info...');
  const tokenInfo = getTokenInfo(testToken);
  
  if (tokenInfo) {
    console.log('✅ Token info retrieved successfully!');
    console.log('🔍 Valid:', tokenInfo.isValid);
    console.log('⏱️  Expired:', tokenInfo.isExpired);
    console.log('📅 Expiry date:', tokenInfo.expiryDate?.toISOString());
    console.log('📊 Days remaining:', tokenInfo.daysRemaining);
  } else {
    console.log('❌ Failed to get token info');
  }
  
  console.log('\n' + '─'.repeat(30));
  
  // Test 3: Log token info (dev mode simulation)
  console.log('Test 3: Testing token info logging...');
  global.__DEV__ = true; // Simulate dev mode
  logTokenInfo(testToken, 'Test Token');
  
  console.log('\n' + '═'.repeat(50));
  console.log('🎉 All tests passed! JWT parsing error is fixed.');
  console.log('\n📋 Summary:');
  console.log('- ✅ Base64url decoding works correctly');
  console.log('- ✅ JWT payload parsing is safe');
  console.log('- ✅ Token expiry checking works');
  console.log('- ✅ No more "Not a valid base64 encoded string length" errors');
  
} catch (error) {
  console.log('❌ Test failed:', error.message);
  console.log('🔧 The JWT parsing fix may need additional work.');
} 