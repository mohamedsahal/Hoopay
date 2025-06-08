import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import Colors from '../../constants/Colors';
import UserAvatar from './UserAvatar';
import VerificationBadge from '../VerificationBadge';
import kycService from '../../services/kycService';

const TrendingCard = React.memo(({ post, onImagePress, onNavigate, onUserPress, triggerHaptic }) => {
  // Use fallback colors and theme if context is not available
  let colors;
  try {
    const theme = useTheme();
    colors = theme.colors;
  } catch (error) {
    console.warn('ThemeContext not available in TrendingCard, using default colors');
    colors = Colors;
  }

  return (
    <View style={[styles.trendingCard, { backgroundColor: colors.cardBackground }]}>
      {/* User Info Header */}
      <View style={styles.trendingUserInfo}>
        <TouchableOpacity 
          style={styles.userSection}
          onPress={() => {
            triggerHaptic();
            if (onUserPress) {
              onUserPress(post.user.id);
            }
          }}
          activeOpacity={onUserPress ? 0.7 : 1}
        >
          <UserAvatar 
            user={post.user}
            size={24}
            style={styles.trendingAvatar}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.trendingUserName, { color: colors.text }]} numberOfLines={1}>
              {post.user.name}
            </Text>
            <VerificationBadge
              verificationLevel={kycService.getUserVerificationLevel(post.user)}
              verificationStatus={kycService.getUserVerificationStatus(post.user)}
              size={12}
              style={{ marginLeft: 2 }}
            />
          </View>
        </TouchableOpacity>
        <View style={[styles.trendingBadge, { backgroundColor: colors.primary + '20' }]}>
          <Text style={styles.trendingBadgeText}>🔥</Text>
        </View>
      </View>

      {/* Post Image or Placeholder - Tap to view full image */}
      {post.image_path ? (
        <TouchableOpacity 
          onPress={() => onImagePress(post.image_path, post.title)}
          style={styles.trendingImageContainer}
        >
                      <Image 
              source={{ uri: post.image_path }} 
              style={styles.trendingImage}
              resizeMode="cover"
              onError={(error) => {
                console.error('Failed to load trending image:', error);
              }}
            />
          <View style={styles.trendingImageOverlay}>
            <MaterialIcons name="zoom-in" size={16} color="white" />
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={[styles.trendingPlaceholder, { backgroundColor: colors.primary + '15' }]}
          onPress={() => {
            triggerHaptic();
            onNavigate('PostDetail', { postId: post.id });
          }}
        >
          <Text style={[styles.trendingPlaceholderText, { color: colors.primary }]}>
            {post.title.charAt(0).toUpperCase()}
          </Text>
        </TouchableOpacity>
      )}
      
      {/* Post Content - Tap to view post details */}
      <TouchableOpacity 
        style={styles.trendingContent}
        onPress={() => {
          triggerHaptic();
          onNavigate('PostDetail', { postId: post.id });
        }}
      >
        <Text style={[styles.trendingTitle, { color: colors.text }]} numberOfLines={2}>
          {post.title}
        </Text>
        <Text style={[styles.trendingStats, { color: colors.textSecondary }]}>
          ❤️ {post.likes_count} • 💬 {post.comments_count}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = {
  trendingCard: {
    width: 160,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trendingUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    paddingBottom: 6,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 4,
  },
  trendingAvatar: {
    marginRight: 6,
  },
  trendingUserName: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    marginRight: 4,
  },
  trendingBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  trendingBadgeText: {
    fontSize: 12,
    textAlign: 'center',
  },
  trendingImageContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: 8,
  },
  trendingImage: {
    width: '100%',
    height: 90,
  },
  trendingImageOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  trendingPlaceholder: {
    width: '100%',
    height: 90,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendingPlaceholderText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  trendingContent: {
    padding: 8,
    paddingTop: 0,
  },
  trendingTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 16,
  },
  trendingStats: {
    fontSize: 10,
    opacity: 0.8,
  },
};

export default TrendingCard; 