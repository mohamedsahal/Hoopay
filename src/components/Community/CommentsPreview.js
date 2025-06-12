import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import Colors from '../../constants/Colors';
import ThreeDotsMenu from './OptionsMenu';
import { BASE_URL, ENDPOINTS, getHeaders } from '../../config/apiConfig';
import * as SecureStore from 'expo-secure-store';

const CommentsPreview = ({ 
  postId, 
  initialComments = [], 
  currentUser,
  onCommentChange,
  maxComments = 2 
}) => {
  // Use fallback colors and theme if context is not available
  let colors;
  try {
    const theme = useTheme();
    colors = theme.colors;
  } catch (error) {
    console.warn('ThemeContext not available in CommentsPreview, using default colors');
    colors = Colors;
  }

  const [comments, setComments] = useState(initialComments.slice(0, maxComments));
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showAddComment, setShowAddComment] = useState(false);

  const getAuthToken = async () => {
    try {
      return await SecureStore.getItemAsync('auth_token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    try {
      setSubmittingComment(true);
      const token = await getAuthToken();
      const response = await fetch(`${BASE_URL}${ENDPOINTS.DISCUSSIONS.COMMENTS}${postId}/comments`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify({
          content: newComment,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Add new comment to the list
        const updatedComments = [...comments, data.data].slice(-maxComments);
        setComments(updatedComments);
        setNewComment('');
        setShowAddComment(false);
        
        // Notify parent component about the change
        if (onCommentChange) {
          onCommentChange('add', data.data);
        }
      } else {
        Alert.alert('Error', data.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const deleteComment = async (commentId) => {
    try {
      Alert.alert(
        'Delete Comment',
        'Are you sure you want to delete this comment?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              const token = await getAuthToken();
              const response = await fetch(`${BASE_URL}${ENDPOINTS.DISCUSSIONS.DELETE_COMMENT}${commentId}`, {
                method: 'DELETE',
                headers: getHeaders(token),
              });

              const data = await response.json();
              if (data.success) {
                setComments(prev => prev.filter(comment => comment.id !== commentId));
                if (onCommentChange) onCommentChange('delete', { id: commentId });
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error deleting comment:', error);
      Alert.alert('Error', 'Failed to delete comment: ' + error.message);
    }
  };

  const toggleLike = async (commentId) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${BASE_URL}${ENDPOINTS.DISCUSSIONS.LIKE}`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify({
          likeable_id: commentId,
          likeable_type: 'comment',
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update comment likes
        setComments(prev => prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, is_liked: data.data.is_liked, likes_count: data.data.likes_count }
            : comment
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  if (comments.length === 0 && !showAddComment) {
    return (
      <View style={styles.commentsContainer}>
        <TouchableOpacity 
          style={styles.addCommentTrigger}
          onPress={() => setShowAddComment(true)}
        >
          <Text style={[styles.addCommentTriggerText, { color: colors.textSecondary }]}>
            💬 Be the first to comment
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.commentsContainer}>
      {/* Show comments */}
      {comments.map((comment) => (
        <View key={comment.id} style={styles.commentItem}>
          <View style={styles.commentHeader}>
            <View style={styles.commentUserSection}>
              <Image 
                source={comment.user.photo_path ? { uri: comment.user.photo_path } : require('../../assets/images/profile.jpg')}
                style={styles.commentAvatar}
              />
              <View style={styles.commentContent}>
                <Text style={[styles.commentUserName, { color: colors.text }]}>
                  {comment.user.name}
                </Text>
                <Text style={[styles.commentText, { color: colors.textSecondary }]}>
                  {comment.content}
                </Text>
                <View style={styles.commentFooter}>
                  <Text style={[styles.commentTime, { color: colors.textSecondary }]}>
                    {comment.created_at}
                  </Text>
                  <TouchableOpacity 
                    style={styles.commentLikeButton}
                    onPress={() => toggleLike(comment.id)}
                  >
                    <Text style={[styles.commentLikeText, comment.is_liked && styles.likedText]}>
                      {comment.is_liked ? '❤️' : '🤍'} {comment.likes_count || 0}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            {/* Three dots menu for comment options */}
            <ThreeDotsMenu
              currentUser={currentUser}
              itemOwner={comment.user}
              options={[
                {
                  title: 'Delete Comment',
                  icon: 'delete',
                  destructive: true,
                  onPress: () => deleteComment(comment.id)
                }
              ]}
              size={16}
              color={colors.textSecondary}
            />
          </View>
        </View>
      ))}

      {/* Add comment section */}
      {showAddComment ? (
        <View style={styles.addCommentSection}>
          <TextInput
            style={[styles.commentInput, { backgroundColor: colors.surface, color: colors.text }]}
            placeholder="Add a comment..."
            placeholderTextColor={colors.textSecondary}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
            autoFocus
          />
          <View style={styles.commentActions}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => {
                setShowAddComment(false);
                setNewComment('');
              }}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.submitCommentButton, { backgroundColor: colors.primary }]}
              onPress={addComment}
              disabled={submittingComment || !newComment.trim()}
            >
              {submittingComment ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitCommentText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.addCommentTrigger}
          onPress={() => setShowAddComment(true)}
        >
          <Text style={[styles.addCommentTriggerText, { color: colors.textSecondary }]}>
            💬 Add a comment...
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = {
  commentsContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#e4e6ea',
  },
  commentItem: {
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  commentUserSection: {
    flexDirection: 'row',
    flex: 1,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  commentContent: {
    flex: 1,
  },
  commentUserName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  commentTime: {
    fontSize: 11,
    opacity: 0.7,
  },
  commentLikeButton: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  commentLikeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  likedText: {
    color: '#E74C3C',
  },
  addCommentSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#f0f0f0',
  },
  commentInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 80,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  submitCommentButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  submitCommentText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  addCommentTrigger: {
    paddingVertical: 8,
  },
  addCommentTriggerText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
};

export default CommentsPreview; 