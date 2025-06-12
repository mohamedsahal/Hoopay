const PROD_API_URL = 'https://hoopaywallet.com'; // Production API URL

export const API_URL = PROD_API_URL;
export const BASE_URL = `${API_URL}/api`;

console.log('=== API CONFIG TS LOADED ===');
console.log('__DEV__:', __DEV__);
console.log('API_URL:', API_URL);
console.log('BASE_URL:', BASE_URL);

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/mobile/login',
    REGISTER: '/mobile/register',
    LOGOUT: '/mobile/logout',
    MOBILE_LOGOUT: '/mobile/logout',
    VERIFY_EMAIL: '/api/auth/verify-email',
    RESEND_VERIFICATION: '/api/auth/resend-verification',
    VERIFICATION_STATUS: '/api/auth/verification-status',
    FORGOT_PASSWORD: '/mobile/password/reset',
    RESET_PASSWORD: '/mobile/password/reset',
    USER: '/mobile/user',
  },
  PROFILE: {
    GET: '/mobile/profile',
    UPDATE: '/mobile/profile',
    CHANGE_PASSWORD: '/mobile/profile/password',
    NOTIFICATIONS: '/mobile/profile/notifications',
    UPLOAD_PHOTO: '/mobile/profile/photo',
    DELETE_AVATAR: '/mobile/profile/photo',
  },
  ACCOUNT: {
    DETAILS: '/mobile/accounts',
    UPDATE: '/mobile/accounts',
  },
  
  // Discussion Management - Using the new mobile discussion endpoints
  DISCUSSIONS: {
    FEED: '/mobile/discussions/feed',
    CREATE: '/mobile/discussions',
    GET: '/mobile/discussions/', // Append post ID
    COMMENTS: '/mobile/discussions/', // Append post ID and '/comments'
    LIKE: '/mobile/discussions/like',
    TRENDING: '/mobile/discussions/trending'
  },
  
  // User Management - Using the new mobile user endpoints
  USERS: {
    FOLLOW: '/mobile/users/', // Append user ID and '/follow'
  },
};

// API Headers function
export const getHeaders = (token?: string) => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': token ? `Bearer ${token}` : '',
});

console.log('=== ENDPOINTS TS OBJECT ===');
console.log('ENDPOINTS defined:', typeof ENDPOINTS);
console.log('ENDPOINTS.DISCUSSIONS:', ENDPOINTS?.DISCUSSIONS);
console.log('ENDPOINTS.DISCUSSIONS.FEED:', ENDPOINTS?.DISCUSSIONS?.FEED);

export default {
  API_URL,
  BASE_URL,
  ENDPOINTS,
  getHeaders,
}; 