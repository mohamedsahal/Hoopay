import { TEST_CONFIG } from '../config/testConfig';
import fetch from 'node-fetch';

// Mock AsyncStorage for Node.js environment
const mockStorage = new Map<string, string>();
const AsyncStorage = {
  setItem: async (key: string, value: string) => mockStorage.set(key, value),
  getItem: async (key: string) => mockStorage.get(key),
  removeItem: async (key: string) => mockStorage.delete(key),
  multiRemove: async (keys: string[]) => keys.forEach(key => mockStorage.delete(key)),
  clear: async () => mockStorage.clear()
};

class AuthTestService {
  private token: string | null = null;

  async login(credentials: { email: string; password: string }) {
    try {
      console.log('Attempting login with:', credentials.email);
      const response = await fetch(`${TEST_CONFIG.apiUrls.default}/auth/login`, {
        method: 'POST',
        headers: TEST_CONFIG.headers,
        body: JSON.stringify(credentials)
      });

      const data = await response.json();
      console.log('Server response:', JSON.stringify(data, null, 2));

      if (data.success && data.data?.token) {
        await this.setToken(data.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.data.user));
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred during login'
      };
    }
  }

  async getToken(): Promise<string | null> {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('token') || null;
    }
    return this.token;
  }

  private async setToken(token: string): Promise<void> {
    this.token = token;
    await AsyncStorage.setItem('token', token);
  }

  async logout(): Promise<void> {
    try {
      if (this.token) {
        const response = await fetch(`${TEST_CONFIG.apiUrls.default}/auth/logout`, {
          method: 'POST',
          headers: {
            ...TEST_CONFIG.headers,
            'Authorization': `Bearer ${this.token}`
          }
        });
        const data = await response.json();
        console.log('Logout response:', data);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.token = null;
      await AsyncStorage.multiRemove(['token', 'user']);
    }
  }

  async getCurrentUser() {
    try {
      const userStr = await AsyncStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }
}

const authTestService = new AuthTestService();

async function testLoginFlow() {
  console.log('\n🔐 Testing Login Flow...');
  console.log('----------------------------------------');

  // Clear any existing data
  await AsyncStorage.clear();

  // Test invalid credentials
  console.log('\n1. Testing Invalid Credentials:');
  try {
    const invalidResponse = await authTestService.login({
      email: 'invalid@example.com',
      password: 'wrongpassword'
    });
    
    if (!invalidResponse.success) {
      console.log('✅ Invalid credentials test passed');
    } else {
      console.log('❌ Invalid credentials test failed - login succeeded unexpectedly');
    }
  } catch (error) {
    console.log('✅ Invalid credentials test passed (error caught):', error.message);
  }

  console.log('----------------------------------------');

  // Test valid credentials
  console.log('\n2. Testing Valid Credentials:');
  try {
    const validResponse = await authTestService.login(TEST_CONFIG.user);
    
    if (validResponse.success && validResponse.data?.token) {
      console.log('✅ Valid credentials test passed');
      
      // Test token storage
      const storedToken = await authTestService.getToken();
      if (storedToken === validResponse.data.token) {
        console.log('✅ Token storage test passed');
      } else {
        console.log('❌ Token storage test failed');
      }

      // Test getting current user
      const currentUser = await authTestService.getCurrentUser();
      if (currentUser && currentUser.email === TEST_CONFIG.user.email) {
        console.log('✅ Get current user test passed');
      } else {
        console.log('❌ Get current user test failed');
      }

      // Test authentication check
      const isAuthenticated = await authTestService.isAuthenticated();
      if (isAuthenticated) {
        console.log('✅ Authentication check test passed');
      } else {
        console.log('❌ Authentication check test failed');
      }

      // Test logout
      console.log('\n3. Testing Logout:');
      await authTestService.logout();
      const afterLogoutToken = await authTestService.getToken();
      const afterLogoutUser = await authTestService.getCurrentUser();
      const afterLogoutAuth = await authTestService.isAuthenticated();

      if (!afterLogoutToken && !afterLogoutUser && !afterLogoutAuth) {
        console.log('✅ Logout test passed');
      } else {
        console.log('❌ Logout test failed');
      }
    } else {
      console.log('❌ Valid credentials test failed');
    }
  } catch (error) {
    console.log('❌ Valid credentials test failed:', error.message);
  }

  console.log('----------------------------------------');
}

// Run the tests
console.log('Starting Login Flow Tests...');
testLoginFlow().catch(console.error); 