import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

/**
 * Photo picker that uses Android Photo Picker on Android
 * and regular image picker on iOS to avoid persistent media permissions
 */
export const pickImage = async (options = {}) => {
  const defaultOptions = {
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 0.8,
    allowsMultipleSelection: false,
    exif: false,
    base64: false,
    selectionLimit: 1,
    ...options
  };

  try {
    let result;

    if (Platform.OS === 'android') {
      // Use document picker on Android to avoid persistent permissions
      result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        return { canceled: true };
      }

      // Convert document picker result to image picker format
      const asset = {
        uri: result.assets[0].uri,
        width: 0, // Will be determined when image is loaded
        height: 0, // Will be determined when image is loaded
        type: result.assets[0].mimeType || 'image/jpeg',
        fileName: result.assets[0].name,
        fileSize: result.assets[0].size,
      };

      return {
        canceled: false,
        assets: [asset]
      };
    } else {
      // Use regular image picker on iOS
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        throw new Error('Permission to access media library was denied');
      }

      result = await ImagePicker.launchImageLibraryAsync(defaultOptions);
    }

    return result;
  } catch (error) {
    console.error('Error picking image:', error);
    throw error;
  }
};
