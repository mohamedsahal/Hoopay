#!/usr/bin/env node

/**
 * Detailed SMTP Connection Test for mail.hoopaywallet.com
 * Tests the exact SMTP configuration provided by user
 * Usage: node testSMTPConnection.js
 */

const https = require('https');

// Configuration - User's exact credentials
const BASE_URL = 'https://9e98-102-217-123-227.ngrok-free.app';
const API_BASE = `${BASE_URL}/api`;

const userCredentials = {
  MAIL_MAILER: 'smtp',
  MAIL_HOST: 'mail.hoopaywallet.com',
  MAIL_PORT: 465,
  MAIL_USERNAME: 'support@hoopaywallet.com',
  MAIL_PASSWORD: 'Hooyo123?',
  MAIL_ENCRYPTION: 'ssl',
  MAIL_FROM_ADDRESS: 'support@hoopaywallet.com',
  MAIL_FROM_NAME: 'Hoopay Wallet'
};

// Helper function to make HTTPS requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Hoopay-SMTP-Connection-Test/1.0',
        'ngrok-skip-browser-warning': 'true',
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
            rawData: data,
          });
        } catch (error) {
          resolve({
            success: false,
            status: res.statusCode,
            error: 'Failed to parse JSON response',
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

// Test SMTP connection specifically
async function testSMTPConnection() {
  console.log('🔧 SMTP Connection Test - mail.hoopaywallet.com');
  console.log('='.repeat(60));
  console.log('📧 Testing User Credentials:');
  console.log(`   Host: ${userCredentials.MAIL_HOST}`);
  console.log(`   Port: ${userCredentials.MAIL_PORT}`);
  console.log(`   Username: ${userCredentials.MAIL_USERNAME}`);
  console.log(`   Encryption: ${userCredentials.MAIL_ENCRYPTION}`);
  console.log(`   From: ${userCredentials.MAIL_FROM_ADDRESS}`);
  console.log('');
  
  // Test 1: Basic email endpoint
  console.log('📝 Test 1: Email System Availability...');
  
  const basicTest = await makeRequest(`${API_BASE}/test-verification-email`, {
    method: 'POST',
    body: JSON.stringify({
      email: 'test@example.com'
    }),
  });
  
  console.log(`   Status: ${basicTest.status}`);
  
  if (basicTest.success && basicTest.data.success) {
    console.log('   ✅ Email endpoint is working');
    
    const result = basicTest.data.data.verification_result;
    console.log('');
    console.log('📊 Current Email Configuration Status:');
    console.log(`   📧 Email Sent: ${result.email_sent || 'NO'}`);
    console.log(`   🔧 Method Used: ${result.email_method || 'Unknown'}`);
    console.log(`   ❌ Error: ${result.email_error || 'None reported'}`);
    
    if (result.debug_info) {
      console.log('');
      console.log('🔍 Debug Information:');
      Object.entries(result.debug_info).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
    }
  } else {
    console.log('   ❌ Email endpoint failed');
    console.log(`   Error: ${basicTest.data?.message || basicTest.error}`);
    return;
  }
  
  // Test 2: Mobile registration (which triggers email)
  console.log('');
  console.log('📝 Test 2: Mobile Registration Flow...');
  
  const testEmail = `smtp-diagnosis-${Date.now()}@hoopaywallet.com`;
  
  const regResult = await makeRequest(`${API_BASE}/mobile/register`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'SMTP Test User',
      email: testEmail,
      password: 'TestPassword123!',
      password_confirmation: 'TestPassword123!',
    }),
  });
  
  console.log(`   Registration Status: ${regResult.status}`);
  
  if (regResult.success && regResult.data.success) {
    console.log('   ✅ Registration successful');
    console.log('   📧 Verification email should have been triggered');
    
    // Wait a moment and test resend to see more details
    console.log('');
    console.log('📝 Test 3: Resend Verification (for SMTP details)...');
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    
    const resendResult = await makeRequest(`${API_BASE}/mobile/resend-verification`, {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail
      }),
    });
    
    console.log(`   Resend Status: ${resendResult.status}`);
    
    if (resendResult.status === 200) {
      console.log('   ✅ Resend endpoint working');
      console.log(`   Message: ${resendResult.data.message}`);
    } else {
      console.log('   ⚠️  Resend had issues');
      console.log(`   Message: ${resendResult.data?.message}`);
    }
    
  } else {
    console.log('   ❌ Registration failed');
    console.log(`   Error: ${regResult.data?.message || regResult.error}`);
  }
  
  console.log('');
  console.log('='.repeat(60));
  console.log('🔍 SMTP Diagnosis Summary');
  console.log('='.repeat(60));
  
  console.log('');
  console.log('📋 Your Configuration (should be in app/.env):');
  Object.entries(userCredentials).forEach(([key, value]) => {
    if (key === 'MAIL_PASSWORD') {
      console.log(`   ${key}=******`);
    } else {
      console.log(`   ${key}=${value}`);
    }
  });
  
  console.log('');
  console.log('🎯 Possible Issues & Solutions:');
  console.log('');
  console.log('1. 🔧 Environment File (.env):');
  console.log('   ❓ Are these settings in your app/.env file?');
  console.log('   ❓ Did you restart Laravel server after adding them?');
  console.log('');
  console.log('2. 🌐 SMTP Server (mail.hoopaywallet.com):');
  console.log('   ❓ Is mail.hoopaywallet.com accessible from your server?');
  console.log('   ❓ Is port 465 open for outbound connections?');
  console.log('   ❓ Are the credentials still valid?');
  console.log('');
  console.log('3. 🔐 Authentication:');
  console.log('   ❓ Username: support@hoopaywallet.com');
  console.log('   ❓ Password: (verify it\'s still correct)');
  console.log('   ❓ Does the email account exist and is active?');
  console.log('');
  console.log('4. 🔥 Firewall/Network:');
  console.log('   ❓ Are outbound SMTP connections allowed?');
  console.log('   ❓ Try alternative port 587 with TLS?');
  console.log('');
  console.log('💡 Next Steps:');
  console.log('1. ✅ Add exact credentials to app/.env file');
  console.log('2. ✅ Restart Laravel server');
  console.log('3. ✅ Run this test again');
  console.log('4. ✅ Check Laravel logs: tail -f app/storage/logs/laravel.log');
  console.log('5. ✅ Contact hosting provider if SMTP is blocked');
  
  console.log('');
  console.log('🎉 Test Complete!');
}

// Run the test
testSMTPConnection()
  .then(() => {
    console.log('');
    console.log('='.repeat(60));
    console.log('📞 Need Help?');
    console.log('- Check your hosting provider\'s SMTP documentation');
    console.log('- Verify mail.hoopaywallet.com DNS and MX records');
    console.log('- Test with alternative ports (587/TLS)');
    console.log('- Contact support@hoopaywallet.com for server issues');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  }); 