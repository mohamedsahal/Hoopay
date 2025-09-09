/**
 * Utility functions for handling and parsing error messages
 */

/**
 * Parses database errors and converts them to user-friendly messages
 * @param {string} errorMessage - The raw error message from the API
 * @returns {string} - User-friendly error message
 */
export const parseAccountError = (errorMessage) => {
  if (!errorMessage) return 'An unexpected error occurred';

  // Handle duplicate account number error
  if (errorMessage.includes('Duplicate entry') && errorMessage.includes('accounts_account_number_unique')) {
    return 'This account number is already in use. Please use a different account number.';
  }

  // Handle other integrity constraint violations
  if (errorMessage.includes('Integrity constraint violation')) {
    if (errorMessage.includes('duplicate')) {
      return 'This information is already registered. Please check your details and try again.';
    }
    return 'The information provided conflicts with existing data. Please verify your details.';
  }

  // Handle SQL state errors
  if (errorMessage.includes('SQLSTATE')) {
    if (errorMessage.includes('23000')) {
      return 'This information is already in use. Please use different details.';
    }
    return 'There was a problem with the data you provided. Please check your information.';
  }

  // Handle connection errors
  if (errorMessage.includes('Connection: mysql') || errorMessage.includes('Connection failed')) {
    return 'Unable to connect to our servers. Please check your internet connection and try again.';
  }

  // Handle validation errors
  if (errorMessage.includes('validation') || errorMessage.includes('required')) {
    return 'Please fill in all required fields correctly.';
  }

  // Handle authentication errors
  if (errorMessage.includes('unauthorized') || errorMessage.includes('authentication')) {
    return 'Your session has expired. Please log in again.';
  }

  // Handle network errors
  if (errorMessage.includes('Network Error') || errorMessage.includes('timeout')) {
    return 'Network connection failed. Please check your internet connection and try again.';
  }

  // Handle server errors
  if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
    return 'Our servers are experiencing issues. Please try again later.';
  }

  // Handle not found errors
  if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
    return 'The requested information could not be found.';
  }

  // Handle forbidden errors
  if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
    return 'You do not have permission to perform this action.';
  }

  // If it's a simple, clean error message, return it as is
  if (errorMessage.length < 100 && !errorMessage.includes('SQLSTATE') && !errorMessage.includes('Connection:')) {
    return errorMessage;
  }

  // Default fallback for complex technical errors
  return 'Something went wrong. Please try again or contact support if the problem persists.';
};

/**
 * Parses API response errors and extracts meaningful messages
 * @param {Object} error - The error object from API call
 * @returns {string} - User-friendly error message
 */
export const parseApiError = (error) => {
  if (!error) return 'An unexpected error occurred';

  // Check for response data message first
  if (error.response?.data?.message) {
    return parseAccountError(error.response.data.message);
  }

  // Check for response status text
  if (error.response?.statusText) {
    return parseAccountError(error.response.statusText);
  }

  // Check for error message
  if (error.message) {
    return parseAccountError(error.message);
  }

  // Fallback
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Gets appropriate error icon based on error type
 * @param {string} errorMessage - The error message
 * @returns {string} - Icon name for MaterialIcons
 */
export const getErrorIcon = (errorMessage) => {
  if (!errorMessage) return 'error';

  if (errorMessage.includes('already in use') || errorMessage.includes('duplicate')) {
    return 'warning';
  }

  if (errorMessage.includes('connection') || errorMessage.includes('network')) {
    return 'wifi-off';
  }

  if (errorMessage.includes('session') || errorMessage.includes('authentication')) {
    return 'lock';
  }

  if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
    return 'block';
  }

  return 'error';
};

/**
 * Gets appropriate error color based on error type
 * @param {string} errorMessage - The error message
 * @param {Object} colors - Theme colors object
 * @returns {string} - Color value
 */
export const getErrorColor = (errorMessage, colors) => {
  if (!errorMessage) return colors.error;

  if (errorMessage.includes('already in use') || errorMessage.includes('duplicate')) {
    return colors.warning || '#FF9800';
  }

  if (errorMessage.includes('connection') || errorMessage.includes('network')) {
    return colors.warning || '#FF9800';
  }

  if (errorMessage.includes('session') || errorMessage.includes('authentication')) {
    return colors.error;
  }

  return colors.error;
};
