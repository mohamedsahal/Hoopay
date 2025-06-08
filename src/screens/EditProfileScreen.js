import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { LoadingIndicator } from '../components/Loading';
import { useTabBarSafeHeight } from '../constants/Layout';
import { useAuth } from '../contexts/AuthContext';
import Colors from '../constants/Colors';
import api from '../services/api'; // Import to get base URL
import profileService from '../services/profileService';
import kycService from '../services/kycService';

const EditProfileScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarSafeHeight();
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [kycStatus, setKycStatus] = useState(null);
  const [isNameEditable, setIsNameEditable] = useState(true);
  
  // Use fallback colors and theme if context is not available
  let colors, isDarkMode;
  try {
    const theme = useTheme();
    colors = theme.colors;
    isDarkMode = theme.isDarkMode;
  } catch (error) {
    console.warn('ThemeContext not available in EditProfileScreen, using default colors');
    colors = Colors;
    isDarkMode = false;
  }
  
  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('');
  const [avatar, setAvatar] = useState(null);
  
  useEffect(() => {
    fetchUserProfile();
    fetchKycStatus();
  }, []);
  
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const profile = await profileService.getUserProfile();
      
      // Handle different response formats
      let userInfo = profile;
      if (profile?.data?.user) {
        userInfo = profile.data.user;
      } else if (profile?.user) {
        userInfo = profile.user;
      }
      
      setUserData(userInfo);
      
      // Initialize form fields with user data
      setName(userInfo?.name || '');
      setPhone(userInfo?.phone || '');
      setBio(userInfo?.bio || '');
      setCountry(userInfo?.country || '');
      
      // If there's a photo_path, we could set it as the avatar
      if (userInfo?.avatar_url) {
        // Use the full URL if available (new format from backend)
        setAvatar({ uri: userInfo.avatar_url });
      } else if (userInfo?.photo_url) {
        // Alternative field name for full URL
        setAvatar({ uri: userInfo.photo_url });
      } else if (userInfo?.photo_path) {
        // Legacy: try to construct URL from relative path
        const photoUrl = userInfo.photo_path.startsWith('http') 
          ? userInfo.photo_path 
          : `${api.defaults.baseURL}/storage/${userInfo.photo_path}`;
        setAvatar({ uri: photoUrl });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const fetchKycStatus = async () => {
    try {
      const kycResponse = await kycService.getKycStatus();
      if (kycResponse.success) {
        setKycStatus(kycResponse.data);
        
        // Check if name is editable based on KYC status
        const nameEditable = kycService.isNameEditable(userData, kycResponse.data);
        setIsNameEditable(nameEditable);
      }
    } catch (error) {
      console.error('Failed to fetch KYC status:', error);
      // If KYC fetch fails, assume name is editable for better UX
      setIsNameEditable(true);
    }
  };
  
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'You need to grant access to your photos to change your profile picture.');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setAvatar(result.assets[0]);
    }
  };

  const handleAvatarPress = () => {
    const options = ['Choose from Gallery'];
    
    // Add delete option if user has an avatar
    if (avatar) {
      options.push('Delete Photo');
    }
    
    options.push('Cancel');
    
    Alert.alert(
      'Profile Photo',
      'What would you like to do?',
      options.map((option, index) => ({
        text: option,
        style: option === 'Cancel' ? 'cancel' : option === 'Delete Photo' ? 'destructive' : 'default',
        onPress: () => {
          if (option === 'Choose from Gallery') {
            pickImage();
          } else if (option === 'Delete Photo') {
            deletePhoto();
          }
        }
      }))
    );
  };

  const deletePhoto = async () => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await profileService.deleteAvatar();
              setAvatar(null);
              Alert.alert('Success', 'Profile photo deleted successfully');
            } catch (error) {
              console.error('Failed to delete photo:', error);
              Alert.alert('Error', 'Failed to delete profile photo');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };
  
  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Handle photo upload separately if there's a new photo
      if (avatar && avatar.uri && !avatar.uri.startsWith('http')) {
        console.log('Uploading new profile photo...');
        try {
          await profileService.uploadPhoto(avatar.uri);
          console.log('Photo uploaded successfully');
        } catch (photoError) {
          console.error('Photo upload failed:', photoError);
          Alert.alert('Warning', 'Profile photo upload failed, but text fields will still be updated.');
        }
      }
      
      // Update text fields (only include name if editable)
      const profileData = {
        phone,
        bio,
        country
      };
      
      // Only include name in update if it's editable
      if (isNameEditable) {
        profileData.name = name;
      }
      
      console.log('Updating profile text fields with:', profileData);
      
      const updatedProfile = await profileService.updateProfile(profileData);
      
      // Check if the backend provided auto-refresh data
      if (updatedProfile.profile_refreshed && updatedProfile.user) {
        console.log('Auto-refreshing profile data in AuthContext');
        await updateUser(updatedProfile.user);
      } else if (updatedProfile.success && updatedProfile.user) {
        // Fallback: update with returned user data
        console.log('Updating AuthContext with returned profile data');
        await updateUser(updatedProfile.user);
      }
      
      Alert.alert(
        'Success',
        'Profile updated successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && !userData) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <LoadingIndicator size={14} color={colors.primary} variant="bounce" />
      </View>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        style={isDarkMode ? "light" : "dark"} 
        backgroundColor={colors.background}
        translucent={false}
      />
      
      {/* Header */}
      <View style={[styles.header, { 
        paddingTop: insets.top || 30, 
        backgroundColor: colors.headerBackground, 
        borderBottomColor: colors.border 
      }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M19 12H5"
              stroke={colors.text}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M12 19l-7-7 7-7"
              stroke={colors.text}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView 
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.scrollViewContent,
          { paddingBottom: tabBarHeight + 40 } // Tab bar height + extra spacing
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Picture */}
        <View style={styles.profileImageContainer}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={handleAvatarPress}
          >
            {avatar ? (
              <Image 
                source={{ uri: avatar.uri }} 
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={[styles.avatarPlaceholderText, { color: colors.background }]}>
                  {name ? name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            )}
            <View style={[styles.editIconContainer, { 
              backgroundColor: colors.cardBackground, 
              borderColor: colors.border 
            }]}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                  stroke={colors.primary}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                  stroke={colors.primary}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
          </TouchableOpacity>
          <Text style={[styles.changePhotoText, { color: colors.primary }]}>Tap to change photo</Text>
        </View>
        
        {/* Form Fields */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Name</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: isNameEditable ? colors.cardBackground : colors.disabledBackground, 
                borderColor: colors.border, 
                color: isNameEditable ? colors.text : colors.textSecondary,
                opacity: isNameEditable ? 1 : 0.7
              }]}
              value={name}
              onChangeText={isNameEditable ? setName : undefined}
              placeholder="Your name"
              placeholderTextColor={colors.placeholder}
              editable={isNameEditable}
            />
            {!isNameEditable && (
              <Text style={[styles.inputNote, { color: colors.warning }]}>
                ⚠️ Name cannot be changed after KYC verification
              </Text>
            )}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Phone</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.cardBackground, 
                borderColor: colors.border, 
                color: colors.text 
              }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="Your phone number"
              placeholderTextColor={colors.placeholder}
              keyboardType="phone-pad"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea, { 
                backgroundColor: colors.cardBackground, 
                borderColor: colors.border, 
                color: colors.text 
              }]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself"
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Country</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.cardBackground, 
                borderColor: colors.border, 
                color: colors.text 
              }]}
              value={country}
              onChangeText={setCountry}
              placeholder="Your country"
              placeholderTextColor={colors.placeholder}
            />
          </View>
        </View>
        
        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <LoadingIndicator size={10} color={colors.background} style={{ padding: 0 }} variant="wave" />
          ) : (
            <Text style={[styles.saveButtonText, { color: colors.background }]}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 40,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'visible',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  changePhotoText: {
    marginTop: 8,
    fontSize: 14,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputNote: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  saveButton: {
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: 'rgba(57, 183, 71, 0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditProfileScreen;
