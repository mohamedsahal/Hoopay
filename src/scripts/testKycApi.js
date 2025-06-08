// KYC API Test Script
// Run this in your mobile app console or as a standalone test

import kycService from '../services/kycService';

export const testKycApi = async () => {
  console.log('🧪 Testing KYC API Endpoints...\n');

  try {
    // Test 1: Get KYC Status
    console.log('1️⃣ Testing KYC Status...');
    const statusResponse = await kycService.getKycStatus();
    console.log('✅ KYC Status Response:', statusResponse);
    console.log('');

    // Test 2: Get Verification Limits
    console.log('2️⃣ Testing Verification Limits...');
    const limitsResponse = await kycService.getVerificationLimits('basic');
    console.log('✅ Verification Limits Response:', limitsResponse);
    console.log('');

    // Test 3: Submit Personal Info (with test data)
    console.log('3️⃣ Testing Personal Info Submission...');
    const personalInfoData = {
      full_name: 'Test User',
      document_type: 'national_id',
      document_number: 'TEST123456',
      date_of_birth: '1990-01-01',
      nationality: 'Test Country',
      address: '123 Test Street',
      city: 'Test City',
      postal_code: '12345',
      country: 'Test Country',
      verification_level: 'basic'
    };

    const personalInfoResponse = await kycService.submitPersonalInfo(personalInfoData);
    console.log('✅ Personal Info Response:', personalInfoResponse);
    console.log('');

    // Test 4: Check Transaction Limit
    console.log('4️⃣ Testing Transaction Limit Check...');
    const limitCheckResponse = await kycService.checkTransactionLimit(500, 'withdrawal');
    console.log('✅ Transaction Limit Check Response:', limitCheckResponse);
    console.log('');

    console.log('🎉 All KYC API tests completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ KYC API Test Failed:', error);
    return false;
  }
};

// Individual test functions for specific endpoints
export const testKycStatus = async () => {
  try {
    const response = await kycService.getKycStatus();
    console.log('KYC Status Test Result:', response);
    return response;
  } catch (error) {
    console.error('KYC Status Test Error:', error);
    throw error;
  }
};

export const testVerificationLimits = async (level = 'basic') => {
  try {
    const response = await kycService.getVerificationLimits(level);
    console.log(`Verification Limits Test Result (${level}):`, response);
    return response;
  } catch (error) {
    console.error('Verification Limits Test Error:', error);
    throw error;
  }
};

export const testPersonalInfoSubmission = async (testData) => {
  try {
    const response = await kycService.submitPersonalInfo(testData);
    console.log('Personal Info Submission Test Result:', response);
    return response;
  } catch (error) {
    console.error('Personal Info Submission Test Error:', error);
    throw error;
  }
};

export const testTransactionLimitCheck = async (amount, type = 'withdrawal') => {
  try {
    const response = await kycService.checkTransactionLimit(amount, type);
    console.log(`Transaction Limit Check Test Result (${amount} ${type}):`, response);
    return response;
  } catch (error) {
    console.error('Transaction Limit Check Test Error:', error);
    throw error;
  }
};

// Usage examples:
// 
// // Run all tests
// testKycApi();
// 
// // Run individual tests
// testKycStatus();
// testVerificationLimits('intermediate');
// testTransactionLimitCheck(1000, 'deposit');

export default {
  testKycApi,
  testKycStatus,
  testVerificationLimits,
  testPersonalInfoSubmission,
  testTransactionLimitCheck
}; 