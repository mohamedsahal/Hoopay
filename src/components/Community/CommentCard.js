import React from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import Colors from '../../constants/Colors';
import ThreeDotsMenu from './OptionsMenu';

const CommentCard = ({ 
  comment, 
  currentUser,
  onLike,
  onDelete,
  style = {}
}) => {
  // Use fallback colors and theme if context is not available
  let colors;
  try {
    const theme = useTheme();
    colors = theme.colors;
  } catch (error) {
    colors = Colors;
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (onDelete) {
              onDelete(comment.id);
            }
          },
        },
      ]
    );
  };

  // Proper ownership validation
  const isOwner = currentUser && comment.user && 
    (currentUser.id === comment.user.id || 
     String(currentUser.id) === String(comment.user.id));

  // Debug log for ownership validation
  if (__DEV__) {
    console.log('CommentCard Ownership Debug:', {
      commentId: comment.id,
      commentAuthor: comment.user?.name,
      commentUserId: comment.user?.id,
      currentUserName: currentUser?.name,
      currentUserId: currentUser?.id,
      isOwner,
      bothExist: !!(currentUser && comment.user)
    });
  }

  return (
    <View style={[styles.commentItem, style]}>
      <View style={styles.commentHeader}>
        <View style={styles.commentUserSection}>
          <Image 
            source={comment.user.photo_path ? { uri: comment.user.photo_path } : require('../../assets/images/profile.jpg')}
            style={styles.commentAvatar}
          />
          <View style={styles.commentUserInfo}>
            <Text style={[styles.commentUserName, { color: colors.text }]}>
              {comment.user.name}
            </Text>
            <Text style={[styles.commentTime, { color: colors.textSecondary }]}>
              {comment.created_at}
            </Text>
          </View>
        </View>
        
        {/* Show 3-dots menu only for comment owner */}
        {isOwner && (
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={handleDelete}
          >
            <MaterialIcons name="more-vert" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={[styles.commentContent, { color: colors.textSecondary }]}>
        {comment.content}
      </Text>
      
      <TouchableOpacity 
        style={styles.commentLikeButton}
        onPress={() => onLike && onLike(comment.id, false)}
      >
        <Text style={[styles.commentLikeText, comment.is_liked && styles.likedText]}>
          {comment.is_liked ? '❤️' : '🤍'} {comment.likes_count || 0}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = {
  commentItem: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  commentUserSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  commentAvatar: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    marginRight: 10,
  },
  commentUserInfo: {
    flex: 1,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  commentTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  commentContent: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 8,
    paddingLeft: 45, // Align with user info
  },
  commentLikeButton: {
    alignSelf: 'flex-start',
    paddingLeft: 45, // Align with user info
    paddingVertical: 4,
  },
  commentLikeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  likedText: {
    color: '#E74C3C',
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
};

export default CommentCard; 