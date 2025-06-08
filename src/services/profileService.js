import api from './api';
import { ENDPOINTS } from '../config/apiConfig';
import * as SecureStore from 'expo-secure-store';

const profileService = {
  // Get user profile
  getUserProfile: async () => {
    let profileData = null;
    
    // First check if we have a valid auth token
    const token = await SecureStore.getItemAsync('auth_token');
    if (!token) {
      console.log('No auth token found - user is not logged in');
      // Return a basic profile with login required message
      return {
        isDefaultProfile: true,
        loginRequired: true,
        name: 'Guest User',
        message: 'Please login to view your profile'
      };
    }
    
    // Try to fetch from API using the special mobile endpoint that doesn't require auth middleware
    try {
      console.log('Attempting to fetch profile from mobile profile endpoint');
      
      // Use the special mobile endpoint created specifically for the React Native app
      // The path doesn't need /api prefix as the interceptor will add it
      const authUserResponse = await api.get('/auth/mobile/profile', {
        // Don't add custom headers as they will be added by the request interceptor
        timeout: 10000 // Add shorter timeout to avoid long waits
      });
      
      if (authUserResponse.data && authUserResponse.data.data) {
        // Handle Laravel API Resource format
        const userData = authUserResponse.data.data;
        console.log('Successfully fetched user data (resource format)');
        await SecureStore.setItemAsync('userData', JSON.stringify(userData));
        return userData;
      } else if (authUserResponse.data && authUserResponse.data.user) {
        // Handle {success: true, user: {...}} format
        const userData = authUserResponse.data.user;
        console.log('Successfully fetched user data (user object format)');
        await SecureStore.setItemAsync('userData', JSON.stringify(userData));
        return userData;
      } else if (authUserResponse.data && typeof authUserResponse.data === 'object') {
        // Direct user object in response
        console.log('Successfully fetched user data (direct format)');
        await SecureStore.setItemAsync('userData', JSON.stringify(authUserResponse.data));
        return authUserResponse.data;
      }
    } catch (authUserError) {
      console.log('Failed to fetch from auth/user endpoint:', authUserError.message);
      
      if (authUserError.response) {
        console.log('Error status:', authUserError.response.status);
        console.log('Error details:', authUserError.response.data);
      }
      
      // The direct profile and debug profile endpoints are no longer available
      console.log('Direct and debug profile endpoints are no longer available');
      
      // Try the profile endpoint with explicit headers as a fallback
      try {
        console.log('Attempting to fetch profile from profile endpoint');
        // Use the new structured endpoint format
        const profileEndpoint = ENDPOINTS.PROFILE.GET;
        
        console.log('Profile endpoint:', profileEndpoint);
        
        const profileResponse = await api.get(profileEndpoint, {
          // Don't add custom headers as they will be added by the request interceptor
          // Add shorter timeout to avoid long waits
          timeout: 8000
        });
        
        if (profileResponse.data) {
          let userData;
          // Handle possible response formats from our updated Laravel backend
          if (profileResponse.data.success && profileResponse.data.profile) {
            // New format we added in Laravel controller
            userData = profileResponse.data.profile;
          } else if (profileResponse.data.data) {
            // Standard Laravel API Resource format
            userData = profileResponse.data.data;
          } else if (profileResponse.data.user) {
            // Format with user property
            userData = profileResponse.data.user;
          } else if (typeof profileResponse.data === 'object') {
            // Direct user object
            userData = profileResponse.data;
          }
          
          if (userData) {
            console.log('Successfully fetched user data from profile endpoint');
            await SecureStore.setItemAsync('userData', JSON.stringify(userData));
            return userData;
          }
        }
      } catch (profileError) {
        console.log('Failed to fetch from profile endpoint:', profileError.message);
        if (profileError.response) {
          console.log('Profile error status:', profileError.response.status);
          console.log('Profile error details:', profileError.response.data);
        }
      }
    }
    
    // If API calls failed, try to get data from local storage
    try {
      const storedUserData = await SecureStore.getItemAsync('userData');
      if (storedUserData) {
        try {
          profileData = JSON.parse(storedUserData);
          console.log('Successfully loaded profile from local storage');
          
          // If we have complete profile data, return it
          if (profileData && (profileData.email || profileData.id)) {
            return profileData;
          }
        } catch (parseError) {
          console.error('Error parsing stored userData:', parseError);
        }
      }
    } catch (storageError) {
      console.error('Error accessing secure storage:', storageError);
    }
    
    // Try to get user data from JWT token
    try {
      // We already have the token from earlier check
      if (token) {
        try {
          // Properly decode the base64 payload
          const parts = token.split('.');
          if (parts.length === 3) {
            // Handle base64url format properly
            const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
            
            // Decode and parse
            const decoded = atob(padded);
            const payload = JSON.parse(decoded);
            
            console.log('JWT payload structure:', Object.keys(payload));
            
            // Extract user info - handle different JWT formats
            let tokenUserData = null;
            if (payload.user) {
              tokenUserData = payload.user;
            } else if (payload.sub) {
              // Some JWTs store user ID in 'sub' claim
              const userId = payload.sub;
              tokenUserData = { id: userId };
              
              // Add any other claims that might be user properties
              ['email', 'name', 'exp', 'iat'].forEach(prop => {
                if (payload[prop]) tokenUserData[prop] = payload[prop];
              });
            }
            
            if (tokenUserData) {
              console.log('Successfully extracted user data from JWT token');
              profileData = tokenUserData;
              
              // Store the token data
              await SecureStore.setItemAsync('userData', JSON.stringify(profileData));
              return profileData;
            }
          }
        } catch (decodeError) {
          console.error('Error decoding JWT token:', decodeError);
        }
      }
    } catch (tokenError) {
      console.error('Error accessing auth token:', tokenError);
    }
    
    // Otherwise, create a minimal profile from the stored email
    try {
      const email = await SecureStore.getItemAsync('userEmail');
      if (email) {
        console.log('Creating minimal profile from stored email:', email);
        const minimalProfile = {
          email: email,
          name: email.split('@')[0],
          isMinimalProfile: true
        };
        
        // Store this minimal profile so we at least have something
        await SecureStore.setItemAsync('userData', JSON.stringify(minimalProfile));
        return minimalProfile;
      }
    } catch (emailError) {
      console.error('Error getting stored email:', emailError);
    }
    
    // Final fallback: Create a default profile to ensure UI doesn't break
    console.log('Creating default profile as last resort');
    const defaultProfile = {
      name: 'User',
      email: 'user@example.com',
      isDefaultProfile: true,
      wallet: {
        currency: 'USD',
        available_balance: 0
      },
      referral_code: 'NEWUSER',
      created_at: new Date().toISOString()
    };
    
    // Even store this default profile
    await SecureStore.setItemAsync('userData', JSON.stringify(defaultProfile));
    return defaultProfile;
  },

  // Check if token is expired and refresh if needed
  refreshTokenIfNeeded: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return false;

      // Decode token to check expiration
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
          const payload = JSON.parse(atob(padded));
          
          // Check if token is expired or about to expire (within 5 minutes)
          const expiryTime = payload.exp * 1000; // Convert to milliseconds
          const currentTime = Date.now();
          const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
          
          if (expiryTime - currentTime < fiveMinutes) {
            console.log('Token is about to expire, refreshing...');
            
            // Try to get a new token using the refresh endpoint
            try {
              const refreshResponse = await api.post('/api/auth/refresh', {}, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              
              if (refreshResponse.data && refreshResponse.data.token) {
                await SecureStore.setItemAsync('auth_token', refreshResponse.data.token);
                console.log('Token refreshed successfully');
                return true;
              }
            } catch (refreshError) {
              console.log('Failed to refresh token:', refreshError.message);
              // Continue with the current token
            }
          }
        }
      } catch (e) {
        console.log('Error checking token expiry:', e.message);
      }
      
      return true; // Token exists and isn't expired (or we couldn't check)
    } catch (error) {
      console.error('Error in refreshTokenIfNeeded:', error);
      return false;
    }
  },
  
  // Update user profile
  updateProfile: async (profileData) => {
    try {
      // Refresh token if needed before updating profile
      await profileService.refreshTokenIfNeeded();
      
      const formData = new FormData();
      
      // Add basic profile fields
      if (profileData.name) formData.append('name', profileData.name);
      if (profileData.phone) formData.append('phone', profileData.phone);
      if (profileData.address) formData.append('address', profileData.address);
      if (profileData.bio) formData.append('bio', profileData.bio);
      if (profileData.country) formData.append('country', profileData.country);
      
      // Note: Avatar uploads should use the dedicated uploadPhoto method
      // This update method handles only text fields

      console.log('Updating profile with data:', profileData);
      
      // Use the dedicated mobile profile update endpoint for text fields
      // This endpoint handles only text fields, not photos
      console.log('ENDPOINTS object keys:', Object.keys(ENDPOINTS));
      console.log('ENDPOINTS.PROFILE:', ENDPOINTS.PROFILE);
      console.log('ENDPOINTS.PROFILE keys:', ENDPOINTS.PROFILE ? Object.keys(ENDPOINTS.PROFILE) : 'undefined');
      console.log('ENDPOINTS.PROFILE.UPDATE_FIELDS:', ENDPOINTS.PROFILE?.UPDATE_FIELDS);
      // Force use of correct endpoint (cache busting)
      const mobileProfileUpdateEndpoint = '/mobile/profile/update'; // Hardcoded to ensure correct endpoint
      console.log('Using mobile profile update endpoint (hardcoded):', mobileProfileUpdateEndpoint);
      console.log('ENDPOINTS.PROFILE.UPDATE_FIELDS was:', ENDPOINTS.PROFILE?.UPDATE_FIELDS);
      
      const response = await api.put(mobileProfileUpdateEndpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 10000 // Standard timeout for text updates
      });

      // Save updated data to secure storage to keep local data in sync
      if (response.data && (response.data.success || response.data.data)) {
        const responseData = response.data.data || response.data;
        
        // If the backend signals auto-refresh, save the updated user data
        if (responseData.auto_refresh && responseData.user) {
          console.log('Backend signaled auto-refresh, updating local profile data');
          await SecureStore.setItemAsync('userData', JSON.stringify(responseData.user));
          
          // Log what fields were updated
          if (responseData.updated_fields && responseData.updated_fields.length > 0) {
            console.log('Updated profile fields:', responseData.updated_fields);
          }
          
          return {
            ...responseData,
            profile_refreshed: true,
            message: 'Profile updated and refreshed successfully'
          };
        } else {
          // Fallback: manually refresh profile data to ensure consistency
          console.log('Manually refreshing profile data after update...');
          try {
            const refreshedProfile = await profileService.refreshProfile();
            return {
              success: true,
              user: refreshedProfile,
              profile_refreshed: true,
              message: 'Profile updated and refreshed successfully'
            };
          } catch (refreshError) {
            console.error('Failed to refresh profile after update:', refreshError);
            // Still save what we got from the update response
            const userData = responseData.user || responseData;
            await SecureStore.setItemAsync('userData', JSON.stringify(userData));
            return responseData;
          }
        }
      }

      return response.data;
    } catch (error) {
      console.error('Profile update error:', error);
      
      // If we get a 401 error, try refreshing the token and retry once
      if (error.response?.status === 401) {
        console.log('Got 401 error, attempting token refresh and retry...');
        try {
          // Force token refresh
          const refreshSuccess = await profileService.refreshTokenIfNeeded();
          if (refreshSuccess) {
            // Retry the request with the new token
            console.log('Retrying profile update with refreshed token...');
            
            const retryFormData = new FormData();
            if (profileData.name) retryFormData.append('name', profileData.name);
            if (profileData.phone) retryFormData.append('phone', profileData.phone);
            if (profileData.address) retryFormData.append('address', profileData.address);
            if (profileData.bio) retryFormData.append('bio', profileData.bio);
            if (profileData.country) retryFormData.append('country', profileData.country);
            
            // Note: This retry also only handles text fields, not photos
            
            const retryResponse = await api.put(ENDPOINTS.PROFILE.UPDATE_FIELDS, retryFormData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
              timeout: 10000
            });
            
            if (retryResponse.data && (retryResponse.data.success || retryResponse.data.data)) {
              const retryResponseData = retryResponse.data.data || retryResponse.data;
              
              // Apply the same auto-refresh logic for retry
              if (retryResponseData.auto_refresh && retryResponseData.user) {
                console.log('Retry successful with auto-refresh signal');
                await SecureStore.setItemAsync('userData', JSON.stringify(retryResponseData.user));
                return {
                  ...retryResponseData,
                  profile_refreshed: true,
                  message: 'Profile updated and refreshed successfully (retry)'
                };
              } else {
                // Fallback refresh for retry
                try {
                  const refreshedProfile = await profileService.refreshProfile();
                  return {
                    success: true,
                    user: refreshedProfile,
                    profile_refreshed: true,
                    message: 'Profile updated and refreshed successfully (retry)'
                  };
                } catch (refreshError) {
                  console.error('Failed to refresh profile after retry:', refreshError);
                  const userData = retryResponseData.user || retryResponseData;
                  await SecureStore.setItemAsync('userData', JSON.stringify(userData));
                  return retryResponseData;
                }
              }
            }
            
            return retryResponse.data;
          }
        } catch (retryError) {
          console.error('Profile update retry failed:', retryError);
        }
      }
      
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  },
  
  // Update notification preferences
  updateNotificationPreferences: async (preferences) => {
    try {
      // Refresh token if needed before updating preferences
      await profileService.refreshTokenIfNeeded();
      
      console.log('Updating notification preferences with endpoint:', ENDPOINTS.PROFILE.NOTIFICATIONS);
      const response = await api.put(ENDPOINTS.PROFILE.NOTIFICATIONS, preferences);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Notification preferences update error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update notification preferences');
    }
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      // Refresh token if needed before changing password
      await profileService.refreshTokenIfNeeded();
      
      console.log('Changing password with endpoint:', ENDPOINTS.PROFILE.CHANGE_PASSWORD);
      const response = await api.post(ENDPOINTS.PROFILE.CHANGE_PASSWORD, {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPassword,
      });
      return response.data.success;
    } catch (error) {
      console.error('Password change error:', error);
      throw new Error(error.response?.data?.message || 'Failed to change password');
    }
  },

  // Upload profile photo
  uploadPhoto: async (photoUri) => {
    try {
      // Refresh token if needed before uploading photo
      await profileService.refreshTokenIfNeeded();
      
      const formData = new FormData();
      formData.append('photo', {
        uri: photoUri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      });

      console.log('ENDPOINTS object keys:', Object.keys(ENDPOINTS));
      console.log('ENDPOINTS.PROFILE:', ENDPOINTS.PROFILE);
      console.log('ENDPOINTS.PROFILE keys:', ENDPOINTS.PROFILE ? Object.keys(ENDPOINTS.PROFILE) : 'undefined');
      console.log('ENDPOINTS.PROFILE.UPLOAD_PHOTO:', ENDPOINTS.PROFILE?.UPLOAD_PHOTO);
      
      // Force use of correct endpoint (cache busting)
      const uploadEndpoint = '/mobile/profile/photo'; // Hardcoded to ensure correct endpoint
      console.log('Final upload endpoint to use (hardcoded):', uploadEndpoint);
      console.log('ENDPOINTS.PROFILE.UPLOAD_PHOTO was:', ENDPOINTS.PROFILE?.UPLOAD_PHOTO);
      
      const response = await api.post(uploadEndpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000 // 30 seconds for photo uploads
      });

      // Update local user data if successful
      if (response.data && response.data.success && response.data.data.user) {
        await SecureStore.setItemAsync('userData', JSON.stringify(response.data.data.user));
      }

      return response.data;
    } catch (error) {
      console.error('Photo upload error:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload photo');
    }
  },

  // Delete avatar
  deleteAvatar: async () => {
    try {
      // Refresh token if needed before deleting avatar
      await profileService.refreshTokenIfNeeded();
      
      // Force use of correct endpoint (cache busting)
      const deleteEndpoint = '/mobile/profile/photo'; // Hardcoded to ensure correct endpoint
      console.log('Deleting avatar with hardcoded endpoint:', deleteEndpoint);
      console.log('ENDPOINTS.PROFILE.DELETE_AVATAR was:', ENDPOINTS.PROFILE?.DELETE_AVATAR);
      const response = await api.delete(deleteEndpoint);
      
      // Update local user data if successful
      if (response.data && response.data.success && response.data.data.user) {
        await SecureStore.setItemAsync('userData', JSON.stringify(response.data.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error('Avatar deletion error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete avatar');
    }
  },
  
  // Force refresh user profile from API
  refreshProfile: async () => {
    try {
      // Refresh token first
      const tokenValid = await profileService.refreshTokenIfNeeded();
      if (!tokenValid) {
        throw new Error('No valid authentication token');
      }
      
      // Use the getUserProfile method but bypass cache
      const token = await SecureStore.getItemAsync('auth_token');
      
      // Try main mobile profile endpoint with fresh request
      const authUserResponse = await api.get(ENDPOINTS.PROFILE.GET, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      let userData = null;
      
      if (authUserResponse.data?.data) {
        userData = authUserResponse.data.data;
      } else if (authUserResponse.data?.user) {
        userData = authUserResponse.data.user;
      } else if (typeof authUserResponse.data === 'object') {
        userData = authUserResponse.data;
      }
      
      if (userData) {
        // Save fresh data
        await SecureStore.setItemAsync('userData', JSON.stringify(userData));
        return userData;
      }
      
      throw new Error('Could not refresh profile data');
    } catch (error) {
      console.error('Profile refresh error:', error);
      throw error;
    }
  },

  // Helper method to update AuthContext after profile changes
  updateAuthContextProfile: async (updatedUserData) => {
    try {
      // This method can be called from screens/components that have access to the AuthContext
      // It's a helper that other parts of the app can use
      await SecureStore.setItemAsync('userData', JSON.stringify(updatedUserData));
      console.log('Profile data updated in SecureStore for AuthContext sync');
      return true;
    } catch (error) {
      console.error('Error updating profile in SecureStore:', error);
      return false;
    }
  },
};

export default profileService; 