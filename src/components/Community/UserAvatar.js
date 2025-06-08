import React, { useState } from 'react';
import { View, Text, Image } from 'react-native';
import { BASE_URL } from '../../config/apiConfig';

const UserAvatar = ({ user, size = 40, style = {} }) => {
  const [imageError, setImageError] = useState(false);
  
  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.trim().split(' ');
    if (names.length === 1) {
      return names[0][0]?.toUpperCase() || '?';
    }
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  // Function to normalize URL - handle relative paths and add base URL if needed
  const normalizeImageUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    
    // Clean the URL
    const cleanUrl = url.trim();
    
    // If it's already a complete URL, return as is
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      return cleanUrl;
    }
    
    // Get the base domain from BASE_URL (remove /api part)
    const baseDomain = BASE_URL.replace('/api', '');
    
    // For profile-photos/ paths, construct the full URL
    if (cleanUrl.startsWith('profile-photos/')) {
      const fullUrl = `${baseDomain}/storage/${cleanUrl}`;
      return fullUrl;
    }
    
    // If it's a relative path starting with /, add base URL
    if (cleanUrl.startsWith('/')) {
      const fullUrl = `${baseDomain}${cleanUrl}`;
      return fullUrl;
    }
    
    // If it doesn't start with / or http, it might be a filename only or relative path
    if (!cleanUrl.includes('/')) {
      // Assume it's in a storage/images directory
      const fullUrl = `${baseDomain}/storage/images/${cleanUrl}`;
      return fullUrl;
    }
    
    // For other relative paths, add base domain
    const fullUrl = `${baseDomain}/storage/${cleanUrl}`;
    return fullUrl;
  };

  // Enhanced image property checking with more comprehensive support
  const getImageUrl = () => {
    if (!user) {
      return null;
    }

    // Check multiple possible image property names in order of preference
    const imageProperties = [
      'photo_path',
      'profile_photo_path', 
      'avatar',
      'profile_image',
      'image',
      'photo',
      'profile_pic',
      'picture'
    ];

    for (const prop of imageProperties) {
      const rawUrl = user[prop];
      if (rawUrl && typeof rawUrl === 'string' && rawUrl.trim()) {
        const normalizedUrl = normalizeImageUrl(rawUrl);
        if (normalizedUrl) {
          return normalizedUrl;
        }
      }
    }
    return null;
  };

  const imageUrl = getImageUrl();
  
  // Show image if available and no error occurred
  if (imageUrl && !imageError) {
    return (
      <Image 
        source={{ uri: imageUrl }}
        style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
        onError={(error) => {
          console.log('UserAvatar: Failed to load user image:', imageUrl);
          console.log('UserAvatar: Error details:', error.nativeEvent?.error);
          setImageError(true);
        }}

      />
    );
  }

  // Fallback to initials
  return (
    <View style={[
      {
        width: size, 
        height: size, 
        borderRadius: size / 2,
        backgroundColor: '#4CAF50', // Green background
        justifyContent: 'center',
        alignItems: 'center'
      }, 
      style
    ]}>
      <Text style={{
        color: 'white',
        fontSize: size * 0.4,
        fontWeight: 'bold'
      }}>
        {getInitials(user?.name)}
      </Text>
    </View>
  );
};

export default UserAvatar; 