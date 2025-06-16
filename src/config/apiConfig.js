// API Configuration
export const API_CONFIG = {
  baseURL: 'https://hoopaywallet.com/api', // Production
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
};

// Base URL for API calls
export const BASE_URL = API_CONFIG.baseURL;

console.log('=== API CONFIG LOADED ===');
console.log('__DEV__:', __DEV__);
console.log('BASE_URL:', BASE_URL);

// API Endpoints
export const ENDPOINTS = {
  // Authentication - Using the working endpoints
  LOGIN: '/auth/login',
  REGISTER: '/api/mobile/register',  // Use the working mobile register endpoint
  LOGOUT: '/mobile/logout',
  USER: '/mobile/user',
  PASSWORD_RESET: '/auth/reset-password', // Legacy endpoint
  
  // Comprehensive password reset endpoints
  FORGOT_PASSWORD: {
    REQUEST: '/mobile/password/reset/request',
    VERIFY: '/mobile/password/reset/verify', 
    COMPLETE: '/mobile/password/reset/complete',
    RESEND: '/mobile/password/reset/resend',
    STATUS: '/mobile/password/reset/status'
  },
  
  // Email Verification endpoints - using new dedicated mobile endpoints
  VERIFY_EMAIL: '/api/mobile/verify-email',
  RESEND_VERIFICATION: '/api/mobile/resend-verification',
  VERIFICATION_STATUS: '/api/mobile/verification-status',
  
  // Profile Management - Using the working mobile endpoints
  PROFILE: {
    GET: '/mobile/profile',
    UPDATE: '/mobile/profile',
    UPDATE_FIELDS: '/mobile/profile/update', // For text fields only
    UPDATE_ALT: '/auth/mobile/profile', // Alternative endpoint
    CHANGE_PASSWORD: '/mobile/profile/password',
    NOTIFICATIONS: '/mobile/profile/notifications',
    UPLOAD_PHOTO: '/mobile/profile/photo', // For photo uploads
    DELETE_AVATAR: '/mobile/profile/photo' // For photo deletion
  },
  
  // Account Management - Using the working mobile endpoints
  ACCOUNTS: {
    GET: '/mobile/accounts',
    CREATE: '/mobile/accounts',
    DETAIL: '/mobile/accounts/', // Append account ID to this endpoint
    UPDATE: '/mobile/accounts/', // Append account ID to this endpoint
    DELETE: '/mobile/accounts/' // Append account ID to this endpoint
  },
  
  // Wallet Management - Using the working mobile endpoints
  WALLETS: '/mobile/wallets',
  TRANSACTIONS: '/mobile/transactions',
  TRANSFER: '/mobile/transactions/transfer',
  
  // Transfer Management - Multi-stage process similar to web
  TRANSFER_MANAGEMENT: {
    LOOKUP_USER: '/mobile/users/wallet/', // Append wallet ID
    INITIATE: '/mobile/transactions/transfer/initiate',
    CONFIRM: '/mobile/transactions/transfer/confirm',
    CANCEL: '/mobile/transactions/transfer/cancel',
    SIMPLE: '/mobile/transactions/transfer'
  },

  // KYC Verification endpoints
  KYC: {
    STATUS: '/mobile/kyc/status',
    SUBMIT_PERSONAL_INFO: '/mobile/kyc/personal-info',
    UPLOAD_DOCUMENT: '/mobile/kyc/upload-document',
    SUBMIT_FOR_REVIEW: '/mobile/kyc/submit-for-review',
    VERIFICATION_LIMITS: '/mobile/kyc/verification-limits',
    CHECK_TRANSACTION_LIMIT: '/mobile/kyc/check-transaction-limit'
  },
  
  // Deposit Management - Using the working mobile endpoints
  DEPOSITS: {
    ACCOUNTS: '/mobile/deposits/accounts',
    INSTRUCTIONS: '/mobile/deposits/instructions',
    VERIFY: '/mobile/deposits/verify',
    STATUS: '/mobile/transactions/', // Append transaction ID and '/status'
    RECEIPT: '/mobile/transactions/', // Append transaction ID and '/receipt'
  },
  
  // Referrals - Using the working mobile endpoints
  REFERRALS: '/mobile/referrals',
  REFERRAL_HISTORY: '/mobile/referrals/history',
  APPLY_REFERRAL: '/mobile/referrals/apply',
  
  // Discussion Management - Using the new mobile discussion endpoints
  DISCUSSIONS: {
    FEED: '/mobile/discussions/feed',
    CREATE: '/mobile/discussions',
    GET: '/mobile/discussions/', // Append post ID
    DELETE: '/mobile/discussions/', // Append post ID
    COMMENTS: '/mobile/discussions/', // Append post ID and '/comments'
    DELETE_COMMENT: '/mobile/discussions/comments/', // Append comment ID
    LIKE: '/mobile/discussions/like',
    TRENDING: '/mobile/discussions/trending'
  },
  
  // User Management - Using the new mobile user endpoints
  USERS: {
    LIST: '/mobile/users',
    FOLLOW: '/mobile/users/', // Append user ID and '/follow'
    SEARCH: '/mobile/users/search',
  }
};

// API Headers
export const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': token ? `Bearer ${token}` : '',
});

// Headers for multipart/form-data uploads (don't set Content-Type)
export const getMultipartHeaders = (token) => ({
  'Accept': 'application/json',
  'Authorization': token ? `Bearer ${token}` : '',
  // Content-Type is automatically set by fetch for FormData
}); 

console.log('=== ENDPOINTS OBJECT DEBUG ===');
console.log('ENDPOINTS defined:', typeof ENDPOINTS);
console.log('ENDPOINTS.PROFILE full object:', JSON.stringify(ENDPOINTS?.PROFILE, null, 2));
console.log('ENDPOINTS.PROFILE.UPLOAD_PHOTO:', ENDPOINTS?.PROFILE?.UPLOAD_PHOTO);
console.log('ENDPOINTS.PROFILE.UPDATE_FIELDS:', ENDPOINTS?.PROFILE?.UPDATE_FIELDS);
console.log('ENDPOINTS.PROFILE.DELETE_AVATAR:', ENDPOINTS?.PROFILE?.DELETE_AVATAR);
console.log('ENDPOINTS.KYC full object:', JSON.stringify(ENDPOINTS?.KYC, null, 2));
console.log('All ENDPOINTS keys:', Object.keys(ENDPOINTS));