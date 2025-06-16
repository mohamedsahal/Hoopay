import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
  Platform,
  Keyboard
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

  const textInputRef = useRef(null);
  const commentInputHeight = useRef(new Animated.Value(40)).current;
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const [comments, setComments] = useState(initialComments.slice(0, maxComments));
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showAddComment, setShowAddComment] = useState(false);

  // Enhanced keyboard handling
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setIsKeyboardVisible(true);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
        Animated.timing(commentInputHeight, {
          toValue: 40,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [commentInputHeight]);

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
        
        // Reset input height
        Animated.timing(commentInputHeight, {
          toValue: 40,
          duration: 250,
          useNativeDriver: false,
        }).start();
        
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
      const token = await getAuthToken();
      const response = await fetch(`${BASE_URL}${ENDPOINTS.DISCUSSIONS.COMMENTS}${commentId}`, {
        method: 'DELETE',
        headers: getHeaders(token),
      });

      const data = await response.json();

      if (data.success) {
        setComments(prev => prev.filter(comment => comment.id !== commentId));
        
        // Notify parent component about the change
        if (onCommentChange) {
          onCommentChange('delete', { id: commentId });
        }
      } else {
        Alert.alert('Error', data.error || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      Alert.alert('Error', 'Failed to delete comment');
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

  // Handle input content size change for dynamic height
  const handleContentSizeChange = (event) => {
    const { height } = event.nativeEvent.contentSize;
    const newHeight = Math.min(80, Math.max(40, height));
    
    Animated.timing(commentInputHeight, {
      toValue: newHeight,
      duration: 100,
      useNativeDriver: false,
    }).start();
  };

  const handleShowAddComment = () => {
    setShowAddComment(true);
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);
  };

  const handleCancelComment = () => {
    setShowAddComment(false);
    setNewComment('');
    Animated.timing(commentInputHeight, {
      toValue: 40,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  if (comments.length === 0 && !showAddComment) {
    return (
      <View style={styles.commentsContainer}>
        <TouchableOpacity 
          style={styles.addCommentTrigger}
          onPress={handleShowAddComment}
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

      {/* Enhanced Add comment section */}
      {showAddComment ? (
        <View style={styles.addCommentSection}>
          <View style={styles.commentInputWrapper}>
            <View style={styles.commentInputRow}>
              <Image 
                source={currentUser?.photo_path ? { uri: currentUser.photo_path } : require('../../assets/images/profile.jpg')}
                style={styles.currentUserAvatar}
              />
              <Animated.View style={[styles.textInputContainer, { height: commentInputHeight }]}>
                <TextInput
                  ref={textInputRef}
                  style={[
                    styles.commentInput, 
                    { 
                      backgroundColor: colors.surface, 
                      color: colors.text,
                      height: '100%'
                    }
                  ]}
                  placeholder="Add a comment..."
                  placeholderTextColor={colors.textSecondary}
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                  maxLength={500}
                  textAlignVertical="top"
                  onContentSizeChange={handleContentSizeChange}
                  blurOnSubmit={false}
                  onSubmitEditing={Platform.OS === 'ios' ? undefined : addComment}
                />
              </Animated.View>
              <TouchableOpacity 
                style={[
                  styles.sendButton, 
                  { 
                    backgroundColor: (newComment.trim() && !submittingComment) ? colors.primary : colors.textSecondary,
                    opacity: (newComment.trim() && !submittingComment) ? 1 : 0.5
                  }
                ]}
                onPress={addComment}
                disabled={submittingComment || !newComment.trim()}
              >
                {submittingComment ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.sendButtonText}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.commentActions}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancelComment}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.addCommentTrigger}
          onPress={handleShowAddComment}
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
  commentInputWrapper: {
    marginBottom: 8,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  currentUserAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
  },
  textInputContainer: {
    flex: 1,
    minHeight: 40,
    maxHeight: 80,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  commentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '500',
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