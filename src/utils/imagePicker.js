import * as ImagePicker from 'expo-image-picker';
import { Platform, Alert } from 'react-native';

/**
 * Request permissions for camera only (no media library permissions for Google Play compliance)
 */
const requestPermissions = async () => {
  try {
    console.log('📱 Requesting camera permissions only...');
    
    // Request camera permission only
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    console.log('📱 Camera permission status:', cameraPermission.status);
    
    return {
      camera: cameraPermission.status === 'granted',
      mediaLibrary: false // No media library permissions for Google Play compliance
    };
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return { camera: false, mediaLibrary: false };
  }
};

/**
 * Enhanced photo picker with better error handling
 */
export const pickImage = async (options = {}) => {
  try {
    console.log('📱 Starting image picker with options:', options);
    
    // For Google Play compliance, we use the system photo picker
    // which doesn't require READ_MEDIA_IMAGES permission
    console.log('📱 Using system photo picker for Google Play compliance');
    
    // Use minimal options with Android photo picker for Google Play compliance
    const pickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: options.allowsEditing || false,
      quality: options.quality || 0.8,
      // Force use of Android photo picker on Android 13+ for Google Play compliance
      presentationStyle: 'pageSheet',
    };

    console.log('📱 Launching image library with options:', pickerOptions);
    
    // Try the image picker with multiple fallback approaches
    let result = null;
    
    // First attempt: Standard image picker
    try {
      result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
      console.log('📱 First attempt result:', result);
    } catch (error) {
      console.log('📱 First attempt failed:', error);
    }
    
    // If first attempt failed or returned undefined, try fallback
    if (!result || result === undefined) {
      console.log('📱 First attempt failed, trying fallback...');
      try {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.8,
        });
        console.log('📱 Fallback attempt result:', result);
      } catch (fallbackError) {
        console.log('📱 Fallback attempt failed:', fallbackError);
      }
    }
    
    // If still no result, try with minimal options
    if (!result || result === undefined) {
      console.log('📱 Both attempts failed, trying minimal options...');
      try {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
        });
        console.log('📱 Minimal options result:', result);
      } catch (minimalError) {
        console.log('📱 Minimal options failed:', minimalError);
      }
    }
    
    console.log('📱 Final image picker result:', result);
    
    // Handle undefined or null result
    if (!result || result === undefined) {
      console.log('📱 Image picker returned null/undefined, returning canceled result');
      return { canceled: true };
    }
    
    // Validate the result structure
    if (typeof result !== 'object') {
      console.log('📱 Image picker returned invalid result type:', typeof result);
      return { canceled: true };
    }
    
    // Check if the result has the expected structure
    if (result.canceled === true) {
      console.log('📱 User canceled image picker');
      return { canceled: true };
    }
    
    // Check for assets array (newer expo-image-picker format)
    if (result.assets && Array.isArray(result.assets) && result.assets.length > 0) {
      console.log('📱 Image picker success with assets:', result.assets[0]);
    return result;
    }
    
    // Check for legacy format (uri directly on result)
    if (result.uri) {
      console.log('📱 Image picker success with legacy format:', result.uri);
      return {
        canceled: false,
        assets: [{
          uri: result.uri,
          width: result.width,
          height: result.height,
          type: result.type || 'image/jpeg',
          fileName: result.fileName || `image_${Date.now()}.jpg`
        }]
      };
    }
    
    console.log('📱 Image picker result missing expected properties, returning canceled');
    return { canceled: true };
    
  } catch (error) {
    console.error('Error picking image:', error);
    
    // Try one more fallback with error handling
    try {
      console.log('📱 Trying final fallback approach');
      const fallbackResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      
      console.log('📱 Final fallback result:', fallbackResult);
      
      if (fallbackResult && !fallbackResult.canceled && fallbackResult.uri) {
        return {
          canceled: false,
          assets: [{
            uri: fallbackResult.uri,
            width: fallbackResult.width,
            height: fallbackResult.height,
            type: fallbackResult.type || 'image/jpeg',
            fileName: fallbackResult.fileName || `image_${Date.now()}.jpg`
          }]
        };
      }
      
      return { canceled: true };
    } catch (fallbackError) {
      console.error('Final fallback also failed:', fallbackError);
    }
    
    Alert.alert('Error', 'Unable to access photo library. Please check your permissions and try again.');
    return { canceled: true };
  }
};

/**
 * Enhanced camera picker with better error handling
 */
export const takePhoto = async (options = {}) => {
  try {
    console.log('📱 Starting camera picker with options:', options);
    
    // Request permissions first
    const permissions = await requestPermissions();
    if (!permissions.camera) {
      Alert.alert(
        'Permission Required',
        'Please grant camera access to take photos.',
        [{ text: 'OK' }]
      );
      return { canceled: true };
    }
    
  // Use minimal options to ensure compatibility
  const pickerOptions = {
    allowsEditing: options.allowsEditing || false,
    quality: options.quality || 0.8,
    };

    console.log('📱 Launching camera with options:', pickerOptions);
    
    // Try the camera picker with multiple fallback approaches
    let result = null;
    
    // First attempt: Standard camera picker
    try {
      result = await ImagePicker.launchCameraAsync(pickerOptions);
      console.log('📱 First camera attempt result:', result);
    } catch (error) {
      console.log('📱 First camera attempt failed:', error);
    }
    
    // If first attempt failed or returned undefined, try fallback
    if (!result || result === undefined) {
      console.log('📱 First camera attempt failed, trying fallback...');
      try {
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: false,
          quality: 0.8,
        });
        console.log('📱 Camera fallback attempt result:', result);
      } catch (fallbackError) {
        console.log('📱 Camera fallback attempt failed:', fallbackError);
      }
    }
    
    // If still no result, try with minimal options
    if (!result || result === undefined) {
      console.log('📱 Both camera attempts failed, trying minimal options...');
      try {
        result = await ImagePicker.launchCameraAsync({});
        console.log('📱 Camera minimal options result:', result);
      } catch (minimalError) {
        console.log('📱 Camera minimal options failed:', minimalError);
      }
    }
    
    console.log('📱 Final camera result:', result);
    
    // Handle undefined or null result
    if (!result || result === undefined) {
      console.log('📱 Camera picker returned null/undefined, returning canceled result');
      return { canceled: true };
    }
    
    // Validate the result structure
    if (typeof result !== 'object') {
      console.log('📱 Camera picker returned invalid result type:', typeof result);
      return { canceled: true };
    }
    
    // Check if the result has the expected structure
    if (result.canceled === true) {
      console.log('📱 User canceled camera picker');
      return { canceled: true };
    }
    
    // Check for assets array (newer expo-image-picker format)
    if (result.assets && Array.isArray(result.assets) && result.assets.length > 0) {
      console.log('📱 Camera picker success with assets:', result.assets[0]);
    return result;
    }
    
    // Check for legacy format (uri directly on result)
    if (result.uri) {
      console.log('📱 Camera picker success with legacy format:', result.uri);
      return {
        canceled: false,
        assets: [{
          uri: result.uri,
          width: result.width,
          height: result.height,
          type: result.type || 'image/jpeg',
          fileName: result.fileName || `photo_${Date.now()}.jpg`
        }]
      };
    }
    
    console.log('📱 Camera picker result missing expected properties, returning canceled');
    return { canceled: true };
    
  } catch (error) {
    console.error('Error taking photo:', error);
    
    // Try one more fallback with error handling
    try {
      console.log('📱 Trying final camera fallback approach');
      const fallbackResult = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });
      
      console.log('📱 Final camera fallback result:', fallbackResult);
      
      if (fallbackResult && !fallbackResult.canceled && fallbackResult.uri) {
        return {
          canceled: false,
          assets: [{
            uri: fallbackResult.uri,
            width: fallbackResult.width,
            height: fallbackResult.height,
            type: fallbackResult.type || 'image/jpeg',
            fileName: fallbackResult.fileName || `photo_${Date.now()}.jpg`
          }]
        };
      }
      
      return { canceled: true };
    } catch (fallbackError) {
      console.error('Final camera fallback also failed:', fallbackError);
    }
    
    Alert.alert('Error', 'Unable to access camera. Please check your permissions and try again.');
    return { canceled: true };
  }
};
