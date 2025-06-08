 import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import Colors from '../../constants/Colors';
import UserAvatar from './UserAvatar';
import { formatNumber } from '../../utils/numberUtils';
import VerificationBadge from '../VerificationBadge';
import kycService from '../../services/kycService';

const PostCard = ({ 
  post, 
  expandedPosts, 
  onToggleExpansion, 
  onLike, 
  onImagePress, 
  onNavigate,
  onUserPress 
}) => {
  // Use fallback colors and theme if context is not available
  let colors;
  try {
    const theme = useTheme();
    colors = theme.colors;
  } catch (error) {
    console.warn('ThemeContext not available in PostCard, using default colors');
    colors = Colors;
  }

  const renderExpandableText = (text, postId, isTitle = false) => {
    const isExpanded = expandedPosts.has(postId);
    const maxLength = isTitle ? 80 : 150; // Shorter limit for titles
    const shouldTruncate = text.length > maxLength;
    
    const textStyle = isTitle 
      ? [styles.postTitle, { color: colors.text }]
      : [styles.postContent, { color: colors.textSecondary }];
    
    if (!shouldTruncate) {
      return <Text style={textStyle}>{text}</Text>;
    }

    return (
      <View>
        <Text style={textStyle}>
          {isExpanded ? text : `${text.substring(0, maxLength)}...`}
        </Text>
        <TouchableOpacity 
          onPress={() => onToggleExpansion(postId)}
          style={styles.seeMoreButton}
        >
          <Text style={[styles.seeMoreText, { color: colors.primary }]}>
            {isExpanded ? 'See less' : 'See more'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.postCard, { backgroundColor: colors.cardBackground }]}>
      {post.is_pinned && (
        <View style={styles.pinnedBadge}>
          <Text style={styles.pinnedText}>📌 Pinned</Text>
        </View>
      )}
      
      <View style={styles.postHeader}>
        <TouchableOpacity 
          style={styles.userInfo} 
          onPress={() => onUserPress && onUserPress(post.user.id)}
          activeOpacity={onUserPress ? 0.7 : 1}
        >
          <UserAvatar 
            user={post.user}
            size={40}
            style={styles.avatar}
          />
          <View style={styles.userDetails}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.userName, { color: colors.text }]}>{post.user.name}</Text>
              <VerificationBadge
                level={kycService.getUserVerificationLevel(post.user)}
                status={kycService.getUserVerificationStatus(post.user)}
                size={14}
                showText={false}
                style={{ marginLeft: 4 }}
              />
            </View>
            <Text style={[styles.postTime, { color: colors.textSecondary }]}>{post.created_at}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {renderExpandableText(post.title, post.id, true)}
      {renderExpandableText(post.content, post.id)}
      
      {post.image_path && (
        <TouchableOpacity 
          style={styles.postImageContainer}
          onPress={() => onImagePress(post.image_path, post.title)}
        >
          <Image 
            source={{ uri: post.image_path }} 
            style={styles.postImage}
            resizeMode="cover"
            onError={(error) => {
              console.error('Failed to load post image:', error);
            }}
          />
          <View style={styles.imageOverlay}>
            <MaterialIcons name="zoom-in" size={24} color="white" />
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onLike(post.id, true)}
        >
          <Text style={[styles.actionText, post.is_liked && styles.likedText]}>
            {post.is_liked ? '❤️' : '🤍'} {formatNumber(post.likes_count)}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onNavigate('PostDetail', { postId: post.id })}
        >
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>
            💬 {formatNumber(post.comments_count)}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = {
  postCard: {
    backgroundColor: 'white',
    marginVertical: 6,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderRadius: 0,
  },
  pinnedBadge: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  pinnedText: {
    fontSize: 12,
    color: '#ff6b35',
    fontWeight: '600',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 2,
  },
  postTime: {
    fontSize: 12,
    lineHeight: 14,
    opacity: 0.7,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 8,
    lineHeight: 22,
    textAlign: 'left',
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 12,
    textAlign: 'left',
  },
  postImageContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: 12,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  postImage: {
    width: '100%',
    height: 250, // Increased height for better visibility
    minHeight: 150,
    maxHeight: 400, // Maximum height to prevent very tall images
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#e4e6ea',
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'white',
  },
  likedText: {
    color: 'white',
  },
  seeMoreButton: {
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  seeMoreText: {
    fontSize: 13,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
};

export default PostCard; 