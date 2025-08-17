import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

/**
 * Test script to debug image picker issues
 */
export const testImagePickerDebug = async () => {
  console.log('🔍 Starting image picker debug test...');
  
  try {
    // Step 1: Check permissions
    console.log('🔍 Step 1: Checking permissions...');
    
    const cameraPermission = await ImagePicker.getCameraPermissionsAsync();
    console.log('🔍 Camera permission status:', cameraPermission.status);
    
    const mediaLibraryPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
    console.log('🔍 Media library permission status:', mediaLibraryPermission.status);
    
    // Step 2: Request permissions if needed
    console.log('🔍 Step 2: Requesting permissions...');
    
    if (cameraPermission.status !== 'granted') {
      const newCameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      console.log('🔍 New camera permission status:', newCameraPermission.status);
    }
    
    if (mediaLibraryPermission.status !== 'granted') {
      const newMediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('🔍 New media library permission status:', newMediaLibraryPermission.status);
    }
    
    // Step 3: Test image picker
    console.log('🔍 Step 3: Testing image picker...');
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    
    console.log('🔍 Image picker result:', result);
    console.log('🔍 Result type:', typeof result);
    console.log('🔍 Result keys:', Object.keys(result || {}));
    
    if (result) {
      console.log('🔍 Result.canceled:', result.canceled);
      console.log('🔍 Result.assets:', result.assets);
      console.log('🔍 Result.uri:', result.uri);
    }
    
    return result;
    
  } catch (error) {
    console.error('🔍 Image picker debug error:', error);
    throw error;
  }
};

/**
 * Test camera functionality
 */
export const testCameraDebug = async () => {
  console.log('🔍 Starting camera debug test...');
  
  try {
    // Step 1: Check camera permission
    console.log('🔍 Step 1: Checking camera permission...');
    
    const cameraPermission = await ImagePicker.getCameraPermissionsAsync();
    console.log('🔍 Camera permission status:', cameraPermission.status);
    
    // Step 2: Request permission if needed
    if (cameraPermission.status !== 'granted') {
      console.log('🔍 Step 2: Requesting camera permission...');
      const newCameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      console.log('🔍 New camera permission status:', newCameraPermission.status);
    }
    
    // Step 3: Test camera
    console.log('🔍 Step 3: Testing camera...');
    
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });
    
    console.log('🔍 Camera result:', result);
    console.log('🔍 Result type:', typeof result);
    console.log('🔍 Result keys:', Object.keys(result || {}));
    
    if (result) {
      console.log('🔍 Result.canceled:', result.canceled);
      console.log('🔍 Result.assets:', result.assets);
      console.log('🔍 Result.uri:', result.uri);
    }
    
    return result;
    
  } catch (error) {
    console.error('🔍 Camera debug error:', error);
    throw error;
  }
};
