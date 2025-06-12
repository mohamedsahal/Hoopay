import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL, ENDPOINTS, getHeaders } from '../config/apiConfig';

export const useCommunityApi = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Get auth token
  const getAuthToken = async () => {
    try {
      return await SecureStore.getItemAsync('auth_token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  // Initialize user
  const initializeUser = async () => {
    try {
      const userData = await SecureStore.getItemAsync('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        console.log('Loaded user data from storage:', parsedUser);
        setCurrentUser(parsedUser);
        
        if (!parsedUser.id) {
          console.log('User missing ID, fetching from API...');
          await fetchCurrentUserFromAPI();
        }
      } else {
        console.log('No user data in storage, fetching from API...');
        await fetchCurrentUserFromAPI();
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      await fetchCurrentUserFromAPI();
    }
  };

  // Fetch current user from API
  const fetchCurrentUserFromAPI = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.log('No auth token available for user fetch');
        return;
      }

      console.log('Fetching current user from API...');
      const response = await fetch(`${BASE_URL}/mobile/user`, {
        headers: getHeaders(token),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.user) {
          console.log('User fetched from API:', data.data.user);
          setCurrentUser(data.data.user);
          await SecureStore.setItemAsync('userData', JSON.stringify(data.data.user));
        }
      } else {
        console.log('Failed to fetch user from API, status:', response.status);
      }
    } catch (error) {
      console.error('Error fetching user from API:', error);
    }
  };

  // Load feed
  const loadFeed = async (pageNum = 1, isRefresh = false, searchQuery = '', searchType = 'all') => {
    try {
      console.log('=== DISCUSSION FEED DEBUG ===');
      console.log('BASE_URL:', BASE_URL);
      console.log('ENDPOINTS:', ENDPOINTS);
      
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const token = await getAuthToken();
      console.log('Auth token exists:', !!token);
      
      if (!token) {
        console.log('No auth token found');
        Alert.alert('Error', 'Please login to view discussions');
        return { success: false };
      }

      const params = new URLSearchParams({
        page: pageNum.toString(),
        perPage: '10',
        ...(searchQuery && { search: searchQuery, searchType, discovery: 'true' })
      });

      const feedEndpoint = ENDPOINTS?.DISCUSSIONS?.FEED || '/mobile/discussions/feed';
      const fullUrl = `${BASE_URL}${feedEndpoint}?${params}`;
      console.log('Full URL:', fullUrl);

      const response = await fetch(fullUrl, {
        headers: getHeaders(token),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        console.log('Feed loaded successfully');
        return {
          success: true,
          posts: data.data.posts || [],
          pinnedPosts: data.data.pinnedPosts || [],
          users: data.data.users || [],
          pagination: data.data.pagination || {}
        };
      } else {
        console.log('Feed load failed:', data.error);
        Alert.alert('Error', data.error || 'Failed to load discussions');
        return { success: false };
      }
    } catch (error) {
      console.error('Error loading feed:', error);
      Alert.alert('Error', 'Failed to load discussions: ' + error.message);
      return { success: false };
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Load trending posts
  const loadTrendingPosts = async (feedPosts = null) => {
    try {
      const token = await getAuthToken();
      if (!token) return [];

      // Try to get trending posts from backend
      try {
        const trendingEndpoint = ENDPOINTS?.DISCUSSIONS?.TRENDING || '/mobile/discussions/trending';
        const trendingUrl = `${BASE_URL}${trendingEndpoint}`;
        console.log('Attempting to fetch trending from:', trendingUrl);
        
        const response = await fetch(trendingUrl, {
          headers: getHeaders(token),
        });

        console.log('Trending API response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Trending API response data:', data);

          if (data.success) {
            const now = new Date();
            const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            
            const trendingFiltered = (data.data.trending_posts || [])
              .filter(post => {
                if (!post.created_at) return false;
                
                try {
                  const postDate = parseHumanDate(post.created_at);
                  if (!postDate) return false;
                  return postDate >= sevenDaysAgo && post.likes_count > 0;
                } catch (error) {
                  console.log('Error parsing date for trending post:', post.id, error.message);
                  return false;
                }
              })
              .sort((a, b) => b.likes_count - a.likes_count)
              .slice(0, 5);
            
            console.log('Backend trending posts found:', trendingFiltered.length);
            return trendingFiltered;
          }
        }
      } catch (error) {
        console.log('Trending endpoint error:', error.message);
      }

      // Fallback: Use provided posts to create trending
      const postsToUse = feedPosts || [];
      console.log('Using fallback trending logic with posts count:', postsToUse.length);
      
      if (postsToUse.length === 0) {
        console.log('No posts available for trending, returning empty array');
        return [];
      }
      
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      
      let trendingFromFeed = postsToUse
        .filter(post => {
          if (!post.created_at) return false;
          
          try {
            const postDate = parseHumanDate(post.created_at);
            if (!postDate) return false;
            
            const isRecent = postDate >= sevenDaysAgo;
            const hasLikes = post.likes_count > 0;
            return isRecent && hasLikes;
          } catch (error) {
            console.log(`Post ${post.id}: Date parsing error for "${post.created_at}":`, error.message);
            return false;
          }
        })
        .sort((a, b) => b.likes_count - a.likes_count)
        .slice(0, 5);
      
      console.log('7-day trending posts found:', trendingFromFeed.length);
      
      // If no posts in last 7 days, show top liked posts regardless of date
      if (trendingFromFeed.length === 0) {
        trendingFromFeed = postsToUse
          .filter(post => post.likes_count > 0)
          .sort((a, b) => b.likes_count - a.likes_count)
          .slice(0, 5);
        console.log('Top liked posts found:', trendingFromFeed.length);
      }
      
      // If still no posts with likes, show recent posts
      if (trendingFromFeed.length === 0) {
        trendingFromFeed = postsToUse.slice(0, 3);
        console.log('Recent posts as trending:', trendingFromFeed.length);
      }
      
      console.log('Final trending posts count:', trendingFromFeed.length);
      return trendingFromFeed;
      
    } catch (error) {
      console.error('Error loading trending posts:', error.message);
      return [];
    }
  };

  // Load all users
  const loadAllUsers = async (filter = 'all') => {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.log('No auth token found');
        return [];
      }

      console.log('=== LOADING ALL USERS WITH FOLLOWERS ===');
      console.log('Filter:', filter);

      try {
        console.log('Fetching users from main users endpoint with filter...');
        const usersEndpoint = ENDPOINTS?.USERS?.LIST || '/mobile/users';
        const url = `${BASE_URL}${usersEndpoint}?filter=${filter}`;
        console.log('Request URL:', url);
        
        const usersResponse = await fetch(url, {
          headers: getHeaders(token),
        });
        
        console.log('Users API response status:', usersResponse.status);
        
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          console.log('Users API response:', usersData);
          
          if (usersData.success && usersData.data) {
            const usersList = Array.isArray(usersData.data) ? usersData.data : usersData.data.users || [];
            console.log('Successfully loaded users from API:', usersList.length);
            return usersList;
          }
        }
      } catch (error) {
        console.error('Users endpoint error:', error);
      }

      return [];
      
    } catch (error) {
      console.error('Error loading all users:', error);
      return [];
    }
  };

  // Search people
  const searchPeople = async (query) => {
    if (!query.trim()) {
      return [];
    }

    try {
      const token = await getAuthToken();
      if (!token) {
        console.log('No auth token for people search');
        return [];
      }

      const params = new URLSearchParams({
        filter: 'all',
        search: query
      });

      const usersEndpoint = ENDPOINTS?.USERS?.LIST || '/mobile/users';
      const usersUrl = `${BASE_URL}${usersEndpoint}?${params}`;
      console.log('People search URL:', usersUrl);

      const usersResponse = await fetch(usersUrl, {
        headers: getHeaders(token),
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('People search API response:', usersData);

        if (usersData.success) {
          const usersList = Array.isArray(usersData.data) ? usersData.data : usersData.data?.users || [];
          
          const searchResults = usersList
            .filter(user => !user.is_self)
            .filter(user => 
              user.name.toLowerCase().includes(query.toLowerCase()) ||
              user.email.toLowerCase().includes(query.toLowerCase())
            );
          
          console.log('People search results:', searchResults.length);
          return searchResults;
        }
      }

      return [];
    } catch (error) {
      console.error('Error in people search:', error);
      return [];
    }
  };

  // Create post
  const createPost = async (title, content, selectedImage) => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Please fill in both title and content');
      return { success: false };
    }

    if (content.trim().length < 10) {
      Alert.alert('Error', 'Content must be at least 10 characters long');
      return { success: false };
    }

    try {
      console.log('=== CREATE POST DEBUG ===');
      
      const token = await getAuthToken();
      console.log('Token for create post:', !!token);
      
      const formData = new FormData();
      
      formData.append('title', title);
      formData.append('content', content);
      
      if (selectedImage) {
        formData.append('image', {
          uri: selectedImage.uri,
          type: selectedImage.type || 'image/jpeg',
          name: selectedImage.fileName || 'image.jpg',
        });
      }

      const createEndpoint = ENDPOINTS?.DISCUSSIONS?.CREATE || '/mobile/discussions';
      const createUrl = `${BASE_URL}${createEndpoint}`;
      console.log('Create post URL:', createUrl);

      const response = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('Create post response status:', response.status);
      const data = await response.json();
      console.log('Create post response data:', data);

      if (data.success) {
        console.log('Post created successfully');
        Alert.alert('Success', 'Post created successfully!');
        return { success: true };
      } else {
        console.log('Create post failed:', data.error);
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat();
          Alert.alert('Validation Error', errorMessages.join('\n'));
        } else {
          Alert.alert('Error', data.error || 'Failed to create post');
        }
        return { success: false };
      }
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post: ' + error.message);
      return { success: false };
    }
  };

  // Delete post
  const deletePost = async (postId) => {
    try {
      console.log('=== DELETE POST DEBUG ===');
      const token = await getAuthToken();
      console.log('Token for delete post:', !!token);
      
      if (!token) {
        Alert.alert('Error', 'Please login to delete posts');
        return { success: false };
      }
      
      // Use direct URL construction matching the backend routes
      const deleteUrl = `${BASE_URL}/mobile/discussions/${postId}`;
      console.log('Delete post URL:', deleteUrl);
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: getHeaders(token),
      });

      const data = await response.json();
      console.log('Delete post response:', data);

      if (data.success) {
        Alert.alert('Success', 'Post deleted successfully!');
        return { success: true };
      } else {
        Alert.alert('Error', data.error || 'Failed to delete post');
        return { success: false };
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      Alert.alert('Error', 'Failed to delete post: ' + error.message);
      return { success: false };
    }
  };

  // Delete comment
  const deleteComment = async (commentId) => {
    try {
      console.log('=== DELETE COMMENT DEBUG ===');
      const token = await getAuthToken();
      console.log('Token for delete comment:', !!token);
      
      if (!token) {
        Alert.alert('Error', 'Please login to delete comments');
        return { success: false };
      }
      
      // Use direct URL construction matching the backend routes
      const deleteUrl = `${BASE_URL}/mobile/discussions/comments/${commentId}`;
      console.log('Delete comment URL:', deleteUrl);
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: getHeaders(token),
      });

      const data = await response.json();
      console.log('Delete comment response:', data);

      if (data.success) {
        Alert.alert('Success', 'Comment deleted successfully!');
        return { success: true };
      } else {
        Alert.alert('Error', data.error || 'Failed to delete comment');
        return { success: false };
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      Alert.alert('Error', 'Failed to delete comment: ' + error.message);
      return { success: false };
    }
  };

  // Toggle like
  const toggleLike = async (postId, isPost = true) => {
    try {
      console.log('=== TOGGLE LIKE DEBUG ===');
      const token = await getAuthToken();
      console.log('Token for toggle like:', !!token);
      
      const likeEndpoint = ENDPOINTS?.DISCUSSIONS?.LIKE || '/mobile/discussions/like';
      const likeUrl = `${BASE_URL}${likeEndpoint}`;
      console.log('Toggle like URL:', likeUrl);
      
      const response = await fetch(likeUrl, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify({
          likeable_id: postId,
          likeable_type: isPost ? 'post' : 'comment',
        }),
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          is_liked: data.data.is_liked,
          likes_count: data.data.likes_count
        };
      }
      
      return { success: false };
    } catch (error) {
      console.error('Error toggling like:', error);
      return { success: false };
    }
  };

  // Toggle follow
  const toggleFollow = async (userId) => {
    try {
      console.log('=== TOGGLE FOLLOW DEBUG ===');
      const token = await getAuthToken();
      console.log('Token for toggle follow:', !!token);
      
      if (!token) {
        Alert.alert('Error', 'Please login to follow users');
        return { success: false };
      }

      const followEndpoint = ENDPOINTS?.USERS?.FOLLOW || '/mobile/users/';
      const followUrl = `${BASE_URL}${followEndpoint}${userId}/follow`;
      console.log('Toggle follow URL:', followUrl);

      const response = await fetch(followUrl, {
        method: 'POST',
        headers: getHeaders(token),
      });

      console.log('Follow API response status:', response.status);
      const data = await response.json();
      console.log('Follow API response data:', data);

      if (data.success) {
        console.log('Follow action successful:', data.data);
        return {
          success: true,
          is_following: data.data.is_following,
          followers_count: data.data.followers_count
        };
      } else {
        console.error('Follow API failed:', data.error || data.message);
        Alert.alert('Error', data.error || data.message || 'Failed to update follow status');
        return { success: false };
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
      return { success: false };
    }
  };

  // Load profile stats
  const loadProfileStats = async (userId) => {
    if (!userId) {
      console.log('No user ID for stats loading');
      return null;
    }
    
    try {
      const token = await getAuthToken();
      if (!token) {
        console.log('No auth token for stats loading');
        return null;
      }

      console.log('Loading stats for user ID:', userId);
      
      const statsResponse = await fetch(`${BASE_URL}/mobile/users/${userId}/stats`, {
        headers: getHeaders(token),
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          return {
            followers_count: statsData.data.followers_count || 0,
            following_count: statsData.data.following_count || 0,
            posts_count: statsData.data.posts_count || 0,
            total_likes: statsData.data.total_likes || 0
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error loading profile stats:', error);
      return null;
    }
  };

  return {
    // State
    currentUser,
    loading,
    refreshing,
    loadingMore,
    setLoading,
    setRefreshing,
    setLoadingMore,
    
    // User functions
    initializeUser,
    fetchCurrentUserFromAPI,
    getAuthToken,
    
    // Feed functions
    loadFeed,
    loadTrendingPosts,
    loadAllUsers,
    searchPeople,
    
    // Post functions
    createPost,
    deletePost,
    deleteComment,
    toggleLike,
    toggleFollow,
    loadProfileStats,
  };
};

// Parse human-readable dates like "1 hour ago", "6 hours ago", "1 week ago"
const parseHumanDate = (dateString) => {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  // First try parsing as ISO date
  const isoDate = new Date(dateString);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  // Parse human-readable formats
  const now = new Date();
  const lowercaseDate = dateString.toLowerCase().trim();

  // Handle "X ago" formats
  if (lowercaseDate.includes('ago')) {
    const parts = lowercaseDate.replace(' ago', '').split(' ');
    if (parts.length >= 2) {
      const amount = parseInt(parts[0]);
      const unit = parts[1];

      if (!isNaN(amount)) {
        switch (unit) {
          case 'second':
          case 'seconds':
            return new Date(now.getTime() - (amount * 1000));
          case 'minute':
          case 'minutes':
            return new Date(now.getTime() - (amount * 60 * 1000));
          case 'hour':
          case 'hours':
            return new Date(now.getTime() - (amount * 60 * 60 * 1000));
          case 'day':
          case 'days':
            return new Date(now.getTime() - (amount * 24 * 60 * 60 * 1000));
          case 'week':
          case 'weeks':
            return new Date(now.getTime() - (amount * 7 * 24 * 60 * 60 * 1000));
          case 'month':
          case 'months':
            return new Date(now.getTime() - (amount * 30 * 24 * 60 * 60 * 1000));
          case 'year':
          case 'years':
            return new Date(now.getTime() - (amount * 365 * 24 * 60 * 60 * 1000));
        }
      }
    }
  }

  // Handle special cases
  if (lowercaseDate === 'just now' || lowercaseDate === 'now') {
    return now;
  }
  if (lowercaseDate === 'yesterday') {
    return new Date(now.getTime() - (24 * 60 * 60 * 1000));
  }

  return null;
}; 