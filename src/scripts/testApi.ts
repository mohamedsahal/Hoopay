import { TEST_CONFIG } from '../config/testConfig';
import fetch from 'node-fetch';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

interface LoginResponse {
  success: boolean;
  data?: {
    token: string;
    user: {
      id: number;
      email: string;
      name: string;
      email_verified: boolean;
    };
  };
  message: string;
}

const API_CONFIGS = {
  development: 'https://hoopaywallet.com/api',  // Production URL
  production: 'https://hoopaywallet.com/api',  // Production URL
};

const testEndpoints = [
  {
    name: 'Health Check',
    endpoint: '/ping',
    method: 'GET'
  },
  {
    name: 'Login Test',
    endpoint: '/auth/login',
    method: 'POST',
    body: TEST_CONFIG.user
  }
];

async function testConnection(url: string): Promise<boolean> {
  try {
    const testUrl = `${url}/ping`;
    console.log(`\n🔍 Testing connection to: ${testUrl}`);
    const response = await fetch(testUrl);
    
    if (response.ok) {
      console.log('✅ Connection successful!');
      return true;
    } else {
      console.log(`❌ Connection failed with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Connection error:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

async function testLogin(baseUrl: string) {
  console.log('\n🔐 Testing Login...');
  try {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(TEST_CONFIG.user)
    });

    const data = await response.json() as LoginResponse;
    
    if (response.ok && data.success) {
      console.log('✅ Login Successful!');
      console.log('Response:', JSON.stringify(data, null, 2));
      return data.data?.token;
    } else {
      console.log('❌ Login Failed!');
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
      return null;
    }
  } catch (error) {
    console.log('❌ Login Error:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

async function testEndpoint(baseUrl: string, test: typeof testEndpoints[0], authToken?: string) {
  try {
    console.log(`\nTesting ${test.name}...`);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${baseUrl}${test.endpoint}`, {
      method: test.method,
      headers,
      body: test.body ? JSON.stringify(test.body) : undefined
    });

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (response.ok) {
      console.log('✅ Success!');
      console.log('Response:', typeof data === 'string' ? data : JSON.stringify(data, null, 2));
      return true;
    } else {
      console.log('❌ Failed!');
      console.log('Status:', response.status);
      console.log('Response:', typeof data === 'string' ? data : JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.log('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

async function runTests() {
  console.log('\n🚀 Starting API Tests through production...');
  
  for (const [platform, baseUrl] of Object.entries(API_CONFIGS)) {
    console.log(`\n📡 Testing ${platform.toUpperCase()} environment: ${baseUrl}`);
    console.log('----------------------------------------');

    // Test basic connectivity
    const isConnected = await testConnection(baseUrl);
    if (!isConnected) {
      console.log(`Skipping ${platform} - connection failed`);
      continue;
    }

    // Test login
    const authToken = await testLogin(baseUrl);

    // Test other endpoints
    for (const test of testEndpoints) {
      if (test.name === 'Login Test') continue; // Skip login test as we already did it
      await testEndpoint(baseUrl, test, authToken);
    }

    console.log('----------------------------------------');
  }
}

// Run the tests
console.log('Starting API Tests...');
runTests().catch(error => {
  console.error('Test execution error:', error instanceof Error ? error.message : 'Unknown error');
  process.exit(1);
}); 