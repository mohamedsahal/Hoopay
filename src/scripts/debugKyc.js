// KYC Debug Script
// Use this to troubleshoot KYC configuration issues

import { ENDPOINTS } from '../config/apiConfig';
import kycService from '../services/kycService';

export const debugKycConfig = () => {
  console.log('🔍 KYC Configuration Debug\n');
  
  // Check if ENDPOINTS is loaded correctly
  console.log('1. ENDPOINTS object check:');
  console.log('ENDPOINTS exists:', !!ENDPOINTS);
  console.log('ENDPOINTS type:', typeof ENDPOINTS);
  
  // Check KYC endpoints specifically
  console.log('\n2. KYC endpoints check:');
  console.log('ENDPOINTS.KYC exists:', !!ENDPOINTS?.KYC);
  console.log('ENDPOINTS.KYC:', ENDPOINTS?.KYC);
  
  // List all available endpoints
  console.log('\n3. All available endpoints:');
  if (ENDPOINTS) {
    Object.keys(ENDPOINTS).forEach(key => {
      console.log(`- ${key}:`, typeof ENDPOINTS[key] === 'object' ? '[object]' : ENDPOINTS[key]);
    });
  }
  
  // Check KYC service
  console.log('\n4. KYC Service check:');
  console.log('kycService exists:', !!kycService);
  console.log('kycService methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(kycService)));
  
  // Test endpoint resolution
  console.log('\n5. Endpoint resolution test:');
  try {
    const statusEndpoint = kycService.getEndpoint('STATUS');
    const personalInfoEndpoint = kycService.getEndpoint('SUBMIT_PERSONAL_INFO');
    const uploadEndpoint = kycService.getEndpoint('UPLOAD_DOCUMENT');
    
    console.log('STATUS endpoint:', statusEndpoint);
    console.log('SUBMIT_PERSONAL_INFO endpoint:', personalInfoEndpoint);
    console.log('UPLOAD_DOCUMENT endpoint:', uploadEndpoint);
  } catch (error) {
    console.error('Error testing endpoint resolution:', error);
  }
  
  console.log('\n✅ KYC Configuration Debug Complete');
};

export const testKycServiceBasic = async () => {
  console.log('🧪 Basic KYC Service Test\n');
  
  try {
    // Test endpoint resolution without making API calls
    console.log('Testing endpoint resolution...');
    const endpoints = [
      'STATUS',
      'SUBMIT_PERSONAL_INFO', 
      'UPLOAD_DOCUMENT',
      'SUBMIT_FOR_REVIEW',
      'VERIFICATION_LIMITS',
      'CHECK_TRANSACTION_LIMIT'
    ];
    
    endpoints.forEach(endpoint => {
      try {
        const url = kycService.getEndpoint(endpoint);
        console.log(`✅ ${endpoint}: ${url}`);
      } catch (error) {
        console.error(`❌ ${endpoint}: ${error.message}`);
      }
    });
    
    // Test verification levels (local function)
    console.log('\nTesting verification levels...');
    const levels = kycService.getVerificationLevels();
    console.log(`✅ Found ${levels.length} verification levels`);
    levels.forEach(level => {
      console.log(`- ${level.name} (${level.level})`);
    });
    
    console.log('\n🎉 Basic KYC Service Test Complete');
    return true;
    
  } catch (error) {
    console.error('❌ Basic KYC Service Test Failed:', error);
    return false;
  }
};

// Quick test function you can run in the app
export const quickKycTest = () => {
  console.log('🚀 Quick KYC Test');
  debugKycConfig();
  testKycServiceBasic();
};

export default {
  debugKycConfig,
  testKycServiceBasic,
  quickKycTest
}; 