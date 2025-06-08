import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from '../components/Community/UserAvatar';
import PostCard from '../components/Community/PostCard';
import { LoadingSkeleton } from '../components/Loading';
import VerificationBadge from '../components/VerificationBadge';
import kycService from '../services/kycService';
import api from '../services/api';

const UserProfileScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const insets = useSafeAreaInsets();
  const { colors, isDarkMode } = useTheme();
  const { authUser } = useAuth();
  
  const [userProfile, setUserProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [expandedPosts, setExpandedPosts] = useState(new Set());

  useEffect(() => {
    fetchUserProfile();
    fetchUserPosts();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      // Try to get user profile from the mobile users endpoint
      const response = await api.get('/mobile/users', {
        params: { filter: 'all' }
      });
      
      if (response.data.success) {
        const users = response.data.data;
        const userProfile = users.find(user => user.id === userId);
        
        if (userProfile) {
          setUserProfile({
            ...userProfile,
            bio: userProfile.bio || 'No bio available',
            joined_date: userProfile.created_at || 'Recently'
          });
          setFollowing(userProfile.is_following || false);
          setFollowerCount(userProfile.followers_count || 0);
          setFollowingCount(userProfile.following_count || 0);
          setPostsCount(0); // Will be updated when posts are loaded
        } else {
          // If user not found in the list, create a minimal profile
          setUserProfile({
            id: userId,
            name: 'User',
            email: '',
            photo_path: null,
            bio: 'No bio available',
            joined_date: 'Recently',
            followers_count: 0,
            following_count: 0,
            is_following: false
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Create a fallback profile
      setUserProfile({
        id: userId,
        name: 'User',
        email: '',
        photo_path: null,
        bio: 'Profile temporarily unavailable',
        joined_date: 'Recently',
        followers_count: 0,
        following_count: 0,
        is_following: false
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      setPostsLoading(true);
      
      // Get all posts from the feed and filter by user ID
      const response = await api.get('/mobile/discussions/feed');
      
      if (response.data.success) {
        const feedData = response.data.data || {};
        const allPosts = feedData.posts || [];
        const pinnedPosts = feedData.pinnedPosts || [];
        
        // Combine regular posts and pinned posts
        const combinedPosts = [...pinnedPosts, ...allPosts];
        
        // Filter posts by the specific user ID
        const userSpecificPosts = combinedPosts.filter(post => post.user && post.user.id === userId);
        setUserPosts(userSpecificPosts);
        setPostsCount(userSpecificPosts.length);
        
        // Update the user profile with the actual posts count
        setUserProfile(prev => prev ? { ...prev, posts_count: userSpecificPosts.length } : null);
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
      // Set empty posts array on error
      setUserPosts([]);
      setPostsCount(0);
    } finally {
      setPostsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUserProfile(), fetchUserPosts()]);
    setRefreshing(false);
  };

  const toggleFollow = async () => {
    try {
      const response = await api.post(`/mobile/users/${userId}/follow`);
      
      if (response.data.success) {
        setFollowing(!following);
        setFollowerCount(prev => following ? prev - 1 : prev + 1);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const togglePostExpansion = (postId) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleLike = async (postId) => {
    try {
      // Optimistic update for instant feedback
      setUserPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            const newIsLiked = !post.is_liked;
            const newLikesCount = newIsLiked ? post.likes_count + 1 : post.likes_count - 1;
            return {
              ...post,
              is_liked: newIsLiked,
              likes_count: Math.max(0, newLikesCount)
            };
          }
          return post;
        })
      );

      const response = await api.post('/mobile/discussions/like', {
        likeable_id: postId,
        likeable_type: 'post'
      });
      
      if (response.data.success) {
        // Update with server response
        setUserPosts(prevPosts => 
          prevPosts.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                is_liked: response.data.data.is_liked,
                likes_count: response.data.data.likes_count
              };
            }
            return post;
          })
        );
      } else {
        // Revert optimistic update on failure
        setUserPosts(prevPosts => 
          prevPosts.map(post => {
            if (post.id === postId) {
              const revertIsLiked = !post.is_liked;
              const revertLikesCount = revertIsLiked ? post.likes_count + 1 : post.likes_count - 1;
              return {
                ...post,
                is_liked: revertIsLiked,
                likes_count: Math.max(0, revertLikesCount)
              };
            }
            return post;
          })
        );
      }
    } catch (error) {
      console.error('Error liking post:', error);
      // Revert optimistic update on error
      setUserPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            const revertIsLiked = !post.is_liked;
            const revertLikesCount = revertIsLiked ? post.likes_count + 1 : post.likes_count - 1;
            return {
              ...post,
              is_liked: revertIsLiked,
              likes_count: Math.max(0, revertLikesCount)
            };
          }
          return post;
        })
      );
    }
  };

  const handleImagePress = (imageUrl, title) => {
    // Navigate to image viewer or implement image viewing logic
    console.log('Image pressed:', imageUrl);
  };

  const handlePostPress = (postId) => {
    navigation.navigate('PostDetail', { postId });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Loading Skeleton */}
        <ScrollView style={styles.content}>
          <View style={[styles.profileSection, { backgroundColor: colors.surface }]}>
            <LoadingSkeleton width={100} height={100} borderRadius={50} />
            <LoadingSkeleton width={150} height={24} borderRadius={4} style={{ marginTop: 16 }} />
            <LoadingSkeleton width={200} height={16} borderRadius={4} style={{ marginTop: 8 }} />
            
            <View style={styles.statsContainer}>
              {[1, 2, 3].map(i => (
                <View key={i} style={styles.statItem}>
                  <LoadingSkeleton width={40} height={20} borderRadius={4} />
                  <LoadingSkeleton width={60} height={14} borderRadius={4} style={{ marginTop: 4 }} />
                </View>
              ))}
            </View>
            
            <LoadingSkeleton width={120} height={40} borderRadius={20} style={{ marginTop: 20 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {userProfile.name || 'Profile'}
        </Text>
        <TouchableOpacity style={styles.moreButton}>
          <MaterialIcons name="more-vert" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Profile Section */}
        <View style={[styles.profileSection, { backgroundColor: colors.surface }]}>
          <UserAvatar 
            user={userProfile}
            size={100}
            style={styles.profileAvatar}
          />
          
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {userProfile.name}
            </Text>
            <VerificationBadge
              verificationLevel={kycService.getUserVerificationLevel(userProfile)}
              verificationStatus={kycService.getUserVerificationStatus(userProfile)}
              size={20}
              style={{ marginLeft: 6 }}
            />
          </View>
          
          {userProfile.bio && (
            <Text style={[styles.profileBio, { color: colors.textSecondary }]}>
              {userProfile.bio}
            </Text>
          )}
          
          {userProfile.joined_date && (
            <Text style={[styles.joinedDate, { color: colors.textSecondary }]}>
              Joined {userProfile.joined_date}
            </Text>
          )}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{postsCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{followerCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{followingCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Following</Text>
            </View>
          </View>

          {/* Follow Button */}
          {authUser?.id !== userId && (
            <TouchableOpacity 
              style={[
                styles.followButton, 
                { 
                  backgroundColor: following ? colors.surface : colors.primary,
                  borderColor: colors.primary,
                  borderWidth: following ? 1 : 0
                }
              ]}
              onPress={toggleFollow}
            >
              <Text style={[
                styles.followButtonText, 
                { color: following ? colors.primary : 'white' }
              ]}>
                {following ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Posts Section */}
        <View style={styles.postsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Posts</Text>
          
          {postsLoading ? (
            <View style={styles.postsLoading}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading posts...</Text>
            </View>
          ) : userPosts.length > 0 ? (
            userPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                expandedPosts={expandedPosts}
                onToggleExpansion={togglePostExpansion}
                onLike={handleLike}
                onImagePress={handleImagePress}
                onNavigate={(screen, params) => navigation.navigate(screen, params)}
                onUserPress={() => {}} // Disable user press since we're already on user profile
              />
            ))
          ) : (
            <View style={styles.emptyPosts}>
              <Feather name="edit-3" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Posts Yet</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {userProfile.name} hasn't shared any posts yet.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 8,
  },
  profileAvatar: {
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  profileBio: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  joinedDate: {
    fontSize: 14,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  followButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    minWidth: 120,
  },
  followButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  postsSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  postsLoading: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyPosts: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '500',
  },
});

export default UserProfileScreen; 