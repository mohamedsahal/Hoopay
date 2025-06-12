/**
 * JWT Utility Functions
 * 
 * Provides safe JWT token parsing with proper base64url decoding
 * to prevent "Not a valid base64 encoded string length" errors
 */

export interface JWTPayload {
  iss?: string;  // Issuer
  sub?: string;  // Subject (usually user ID)
  aud?: string;  // Audience
  exp?: number;  // Expiration time
  iat?: number;  // Issued at
  nbf?: number;  // Not before
  user?: any;    // User data
  [key: string]: any; // Allow other properties
}

export interface TokenInfo {
  payload: JWTPayload;
  isValid: boolean;
  isExpired: boolean;
  expiryDate?: Date;
  daysRemaining?: number;
}

/**
 * Decodes base64url string to base64 string
 * JWT tokens use base64url encoding, not standard base64
 */
export const base64urlDecode = (base64url: string): string => {
  try {
    // Convert base64url to base64
    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if necessary (base64url doesn't use padding)
    const padding = base64.length % 4;
    if (padding) {
      base64 += '='.repeat(4 - padding);
    }
    
    return atob(base64);
  } catch (error) {
    throw new Error('Invalid base64url string');
  }
};

/**
 * Safely parses a JWT token and returns its payload
 */
export const parseJWTPayload = (token: string): JWTPayload | null => {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token format');
    }

    // Decode the payload (middle part)
    const payloadBase64url = parts[1];
    const payloadJson = base64urlDecode(payloadBase64url);
    const payload = JSON.parse(payloadJson);

    return payload;
  } catch (error) {
    console.error('JWT parsing error:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
};

/**
 * Gets comprehensive information about a JWT token
 */
export const getTokenInfo = (token: string): TokenInfo | null => {
  try {
    const payload = parseJWTPayload(token);
    if (!payload) {
      return null;
    }

    const now = new Date();
    let isExpired = false;
    let expiryDate: Date | undefined;
    let daysRemaining: number | undefined;

    if (payload.exp) {
      expiryDate = new Date(payload.exp * 1000);
      isExpired = expiryDate < now;
      daysRemaining = Math.round((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    return {
      payload,
      isValid: !isExpired,
      isExpired,
      expiryDate,
      daysRemaining: daysRemaining ? Math.max(0, daysRemaining) : undefined
    };
  } catch (error) {
    console.error('Token info error:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
};

/**
 * Checks if a JWT token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = parseJWTPayload(token);
    if (!payload || !payload.exp) {
      return true; // Consider tokens without expiry as expired for safety
    }

    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    return payload.exp < now;
  } catch (error) {
    console.error('Token expiry check error:', error instanceof Error ? error.message : 'Unknown error');
    return true; // Consider invalid tokens as expired
  }
};

/**
 * Gets the expiry date of a JWT token
 */
export const getTokenExpiryDate = (token: string): Date | null => {
  try {
    const payload = parseJWTPayload(token);
    if (!payload || !payload.exp) {
      return null;
    }

    return new Date(payload.exp * 1000);
  } catch (error) {
    console.error('Token expiry date error:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
};

/**
 * Gets the remaining time until token expiry
 */
export const getTokenTimeRemaining = (token: string): { 
  days: number; 
  hours: number; 
  minutes: number; 
  seconds: number; 
  totalSeconds: number;
} | null => {
  try {
    const expiryDate = getTokenExpiryDate(token);
    if (!expiryDate) {
      return null;
    }

    const now = new Date();
    const totalSeconds = Math.max(0, Math.floor((expiryDate.getTime() - now.getTime()) / 1000));
    
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;

    return {
      days,
      hours,
      minutes,
      seconds,
      totalSeconds
    };
  } catch (error) {
    console.error('Token time remaining error:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
};

/**
 * Validates JWT token format (doesn't verify signature)
 */
export const isValidJWTFormat = (token: string): boolean => {
  try {
    if (!token || typeof token !== 'string') {
      return false;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    // Try to decode each part
    base64urlDecode(parts[0]); // Header
    base64urlDecode(parts[1]); // Payload
    // Signature is not base64url decoded for validation

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Safe wrapper for console logging token information (dev mode only)
 */
export const logTokenInfo = (token: string, label: string = 'JWT Token'): void => {
  if (typeof __DEV__ !== 'undefined' && !__DEV__) {
    return; // Only log in development mode
  }

  try {
    const tokenInfo = getTokenInfo(token);
    if (tokenInfo) {
      console.log(`${label} Info:`, {
        isValid: tokenInfo.isValid,
        isExpired: tokenInfo.isExpired,
        expiryDate: tokenInfo.expiryDate?.toISOString(),
        daysRemaining: tokenInfo.daysRemaining,
        payloadKeys: Object.keys(tokenInfo.payload),
        userId: tokenInfo.payload.sub,
        userEmail: tokenInfo.payload.user?.email
      });
    } else {
      console.log(`${label}: Invalid or unparseable`);
    }
  } catch (error) {
    console.log(`${label} logging error:`, error instanceof Error ? error.message : 'Unknown error');
  }
}; 