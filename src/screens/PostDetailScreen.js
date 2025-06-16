import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Keyboard,
  Animated,
  Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import Colors from '../constants/Colors';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { BASE_URL, ENDPOINTS, getHeaders } from '../config/apiConfig';
import ThreeDotsMenu from '../components/Community/OptionsMenu';
import CommentCard from '../components/Community/CommentCard';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const PostDetailScreen = ({ navigation, route }) => {
  const { postId } = route.params;
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);
  const textInputRef = useRef(null);
  const keyboardHeight = useRef(new Animated.Value(0)).current;
  const commentInputHeight = useRef(new Animated.Value(50)).current;
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);

  // Use AuthContext for current user
  const { user: currentUser, isAuthenticated } = useAuth();

  // Use fallback colors and theme if context is not available
  let colors, isDarkMode;
  try {
    const theme = useTheme();
    colors = theme.colors;
    isDarkMode = theme.isDarkMode;
  } catch (error) {
    console.warn('ThemeContext not available in PostDetailScreen, using default colors');
    colors = Colors;
    isDarkMode = false;
  }

  // State management
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    loadPost();
  }, [postId]);

  // Keyboard listeners for enhanced UX
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setIsKeyboardVisible(true);
        const keyboardHeightValue = e.endCoordinates.height;
        
        // Animate the keyboard height and input
        Animated.parallel([
          Animated.timing(keyboardHeight, {
            toValue: keyboardHeightValue,
            duration: Platform.OS === 'ios' ? e.duration : 250,
            useNativeDriver: false,
          }),
          Animated.timing(commentInputHeight, {
            toValue: Math.min(100, Math.max(50, textInputRef.current?.contentSize?.height || 50)),
            duration: Platform.OS === 'ios' ? e.duration : 250,
            useNativeDriver: false,
          })
        ]).start();

        // Auto-scroll to bottom when keyboard shows
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, Platform.OS === 'ios' ? e.duration : 300);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (e) => {
        setIsKeyboardVisible(false);
        
        // Animate keyboard hiding
        Animated.parallel([
          Animated.timing(keyboardHeight, {
            toValue: 0,
            duration: Platform.OS === 'ios' ? e.duration : 250,
            useNativeDriver: false,
          }),
          Animated.timing(commentInputHeight, {
            toValue: 50,
            duration: Platform.OS === 'ios' ? e.duration : 250,
            useNativeDriver: false,
          })
        ]).start();
      }
    );

    const dimensionListener = Dimensions.addEventListener('change', ({ window }) => {
      setScreenHeight(window.height);
    });

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
      dimensionListener?.remove();
    };
  }, [keyboardHeight, commentInputHeight]);

  const getAuthToken = async () => {
    try {
      return await SecureStore.getItemAsync('auth_token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const loadPost = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      if (!token) {
        Alert.alert('Error', 'Please login to view this post');
        navigation.goBack();
        return;
      }

      const response = await fetch(`${BASE_URL}${ENDPOINTS.DISCUSSIONS.GET}${postId}?token=${token}`, {
        headers: getHeaders(token),
      });

      const data = await response.json();

      if (data.success) {
        setPost(data.data);
      } else {
        Alert.alert('Error', data.error || 'Failed to load post');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading post:', error);
      Alert.alert('Error', 'Failed to load post');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (itemId, isPost = true) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${BASE_URL}${ENDPOINTS.DISCUSSIONS.LIKE}`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify({
          likeable_id: itemId,
          likeable_type: isPost ? 'post' : 'comment',
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (isPost) {
          setPost(prev => ({
            ...prev,
            is_liked: data.data.is_liked,
            likes_count: data.data.likes_count
          }));
        } else {
          setPost(prev => ({
            ...prev,
            comments: prev.comments.map(comment => 
              comment.id === itemId 
                ? { ...comment, is_liked: data.data.is_liked, likes_count: data.data.likes_count }
                : comment
            )
          }));
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Enhanced addComment function
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
        setPost(prev => ({
          ...prev,
          comments: [...(prev.comments || []), data.data],
          comments_count: prev.comments_count + 1
        }));
        setNewComment('');
        
        // Reset input height
        Animated.timing(commentInputHeight, {
          toValue: 50,
          duration: 200,
          useNativeDriver: false,
        }).start();
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

  const deletePost = async (postId) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getAuthToken();
              if (!token) {
                Alert.alert('Error', 'Please login to delete posts');
                return;
              }

              const deleteEndpoint = `${BASE_URL}/mobile/discussions/${postId}`;
              const response = await fetch(deleteEndpoint, {
                method: 'DELETE',
                headers: getHeaders(token),
              });

              const data = await response.json();

              if (response.ok && data.success) {
                Alert.alert('Success', data.message || 'Post deleted successfully!', [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack()
                  }
                ]);
              } else {
                Alert.alert('Error', data.error || 'Failed to delete post');
              }
            } catch (networkError) {
              console.error('Network error deleting post:', networkError);
              Alert.alert('Network Error', 'Could not connect to server. Please check your internet connection and try again.');
            }
          },
        },
      ]
    );
  };

  const deleteComment = async (commentId) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getAuthToken();
              const deleteEndpoint = `${BASE_URL}/mobile/discussions/comments/${commentId}`;
              const response = await fetch(deleteEndpoint, {
                method: 'DELETE',
                headers: getHeaders(token),
              });

              const data = await response.json();

              if (response.ok && data.success) {
                setPost(prev => ({
                  ...prev,
                  comments: prev.comments.filter(comment => comment.id !== commentId),
                  comments_count: Math.max(0, prev.comments_count - 1)
                }));
                Alert.alert('Success', data.message || 'Comment deleted successfully!');
              } else {
                Alert.alert('Error', data.error || 'Failed to delete comment');
              }
            } catch (networkError) {
              console.error('Network error deleting comment:', networkError);
              Alert.alert('Network Error', 'Could not connect to server. Please check your internet connection and try again.');
            }
          },
        },
      ]
    );
  };

  const toggleFollow = async (userId) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${BASE_URL}${ENDPOINTS.USERS.FOLLOW}${userId}/follow`, {
        method: 'POST',
        headers: getHeaders(token),
      });

      const data = await response.json();

      if (data.success) {
        setPost(prev => ({
          ...prev,
          user: {
            ...prev.user,
            is_following: data.data.is_following
          }
        }));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  // Handle input content size change for dynamic height
  const handleContentSizeChange = (event) => {
    const { height } = event.nativeEvent.contentSize;
    const newHeight = Math.min(100, Math.max(50, height + 10));
    
    Animated.timing(commentInputHeight, {
      toValue: newHeight,
      duration: 100,
      useNativeDriver: false,
    }).start();
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading post...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>Post not found</Text>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top || 30, backgroundColor: colors.headerBackground }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: colors.text }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Discussion</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Main Content with KeyboardAwareScrollView */}
      <KeyboardAwareScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        extraHeight={20}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
          {/* Post Content */}
          <View style={[styles.postCard, { backgroundColor: colors.cardBackground }]}>
            {post?.is_pinned && (
              <View style={styles.pinnedBadge}>
                <Text style={styles.pinnedText}>📌 Pinned</Text>
              </View>
            )}
            
            <View style={styles.postHeader}>
              <TouchableOpacity style={styles.userInfo}>
                <Image 
                  source={post?.user?.photo_path ? { uri: post.user.photo_path } : require('../assets/images/profile.jpg')}
                  style={styles.avatar}
                />
                <View>
                  <Text style={[styles.userName, { color: colors.text }]}>{post?.user?.name}</Text>
                  <Text style={[styles.postTime, { color: colors.textSecondary }]}>{post?.created_at}</Text>
                </View>
              </TouchableOpacity>
              
              <View style={styles.postHeaderActions}>
                {/* Three dots menu for post options */}
                <ThreeDotsMenu
                  currentUser={currentUser}
                  itemOwner={post?.user}
                  options={[
                    {
                      title: 'Delete Post',
                      icon: 'delete',
                      destructive: true,
                      onPress: () => deletePost(post?.id)
                    }
                  ]}
                  size={24}
                  color={colors.textSecondary}
                />
                
                {!post?.user?.is_self && (
                  <TouchableOpacity 
                    style={[styles.followButton, post?.user?.is_following && styles.followingButton]}
                    onPress={() => toggleFollow(post?.user?.id)}
                  >
                    <Text style={[styles.followButtonText, post?.user?.is_following && styles.followingButtonText]}>
                      {post?.user?.is_following ? 'Following' : 'Follow'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <Text style={[styles.postTitle, { color: colors.text }]}>{post?.title}</Text>
            <Text style={[styles.postContent, { color: colors.textSecondary }]}>{post?.content}</Text>
            
            {post?.image_path && (
              <Image source={{ uri: post.image_path }} style={styles.postImage} />
            )}

            <View style={styles.postActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => toggleLike(post?.id, true)}
              >
                <Text style={[styles.actionText, post?.is_liked && styles.likedText]}>
                  {post?.is_liked ? '❤️' : '🤍'} {post?.likes_count || 0}
                </Text>
              </TouchableOpacity>
              
              <Text style={[styles.actionText, { color: colors.textSecondary }]}>
                💬 {post?.comments_count || 0}
              </Text>
            </View>
          </View>

          {/* Comments Section */}
          <View style={[styles.commentsSection, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.commentsTitle, { color: colors.text }]}>
              Comments ({post?.comments?.length || 0})
            </Text>
            
            {post?.comments && post.comments.length > 0 ? (
              post.comments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  currentUser={currentUser}
                  onLike={toggleLike}
                  onDelete={async (commentId) => {
                    try {
                      const token = await getAuthToken();
                      const deleteEndpoint = `${BASE_URL}/mobile/discussions/comments/${commentId}`;
                      const response = await fetch(deleteEndpoint, {
                        method: 'DELETE',
                        headers: getHeaders(token),
                      });
                      
                      const data = await response.json();
                      
                      if (data.success) {
                        setPost(prev => ({
                          ...prev,
                          comments: prev.comments.filter(c => c.id !== commentId),
                          comments_count: prev.comments_count - 1
                        }));
                      } else {
                        Alert.alert('Error', data.message || data.error || 'Failed to delete comment');
                      }
                    } catch (error) {
                      console.error('Error deleting comment:', error);
                      Alert.alert('Error', 'Failed to delete comment');
                    }
                  }}
                />
              ))
            ) : (
              <Text style={[styles.noCommentsText, { color: colors.textSecondary }]}>
                No comments yet. Be the first to comment!
              </Text>
            )}
          </View>
        {/* Extra space at bottom for input */}
        <View style={{ height: 100 }} />
      </KeyboardAwareScrollView>

      {/* Facebook-style Comment Input - Fixed at bottom */}
      <View style={[styles.commentInputContainer, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.commentInputWrapper}>
          <Image 
            source={currentUser?.photo_path ? { uri: currentUser.photo_path } : require('../assets/images/profile.jpg')}
            style={styles.currentUserAvatar}
          />
          <Animated.View style={[styles.textInputContainer, { height: commentInputHeight }]}>
            <TextInput
              ref={textInputRef}
              style={[
                styles.commentTextInput, 
                { 
                  backgroundColor: colors.surface, 
                  color: colors.text
                }
              ]}
              placeholder="Add a comment..."
              placeholderTextColor={colors.textSecondary}
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={1000}
              textAlignVertical="center"
              onContentSizeChange={handleContentSizeChange}
              blurOnSubmit={false}
              returnKeyType={Platform.OS === 'ios' ? 'default' : 'send'}
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
              <MaterialIcons name="send" size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>
        </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerSpacer: {
    width: 50,
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pinnedBadge: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  pinnedText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '500',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  postTime: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.primary,
  },
  followingButton: {
    backgroundColor: '#E9ECEF',
  },
  followButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  followingButtonText: {
    color: Colors.textSecondary,
  },
  postTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: Colors.text,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textSecondary,
    marginBottom: 15,
  },
  postImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 15,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  actionButton: {
    marginRight: 20,
  },
  actionText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  likedText: {
    color: '#E74C3C',
  },
  commentsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: Colors.text,
  },
  noCommentsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  postHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  
  // Facebook-style comment input styles
  commentInputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
  },
  commentInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  currentUserAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
  },
  textInputContainer: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
  },
  commentTextInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    fontSize: 16,
    lineHeight: 20,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PostDetailScreen; 