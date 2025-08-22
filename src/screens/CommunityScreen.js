import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  FlatList,
  Animated,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Image,
  TextInput,
  Dimensions,
  Platform,
  Modal,
  Linking,
  KeyboardAvoidingView,
  PanResponder,
  Share,
  BackHandler
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pickImage } from '../utils/imagePicker';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as SecureStore from 'expo-secure-store';
import Colors from '../constants/Colors';
import { useTabBarSafeHeight } from '../constants/Layout';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { BASE_URL, ENDPOINTS, getHeaders, getMultipartHeaders } from '../config/apiConfig';
import { MaterialIcons, Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import kycService from '../services/kycService';
import { LoadingSkeleton, CommunityDotsLoading, DotsLoading } from '../components/Loading';
import { useCommunityApi } from '../hooks/useCommunityApi';
import styles from '../components/Community/CommunityScreenStyles';
// import { queueImagesForPreload } from '../utils/imageCache'; // Temporarily disabled
import { 
  ProfileHeader, 
  QuickActions, 
  MyPosts, 
  FollowersModal, 
  FollowingModal,
  CommunityHeader,
  BottomNavigation,
  UserAvatar,
  TrendingCard,
  PostCard,
  UserCard,
  PeopleTab,
  ImageViewer,
  CreatePostModal,
  SearchModals,
  FeedSkeleton,
  PostSkeleton,
  ProfileLoadingSkeleton,
  ExpandableText,
  FeedTab
} from '../components/Community';

// API imports validated

const CommunityScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarSafeHeight();

  // Use existing auth context instead of separate user management
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();

  // Use fallback colors and theme if context is not available
  let colors, isDarkMode;
  try {
    const theme = useTheme();
    colors = theme.colors;
    isDarkMode = theme.isDarkMode;
  } catch (error) {
    console.warn('ThemeContext not available in CommunityScreen, using default colors');
    colors = Colors;
    isDarkMode = false;
  }

  // State management
  const [posts, setPosts] = useState([]);
  const [pinnedPosts, setPinnedPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  // Remove separate currentUser state - use authUser from context
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState(new Set());
  const [activeTab, setActiveTab] = useState('feed');
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showPeopleSearchModal, setShowPeopleSearchModal] = useState(false);
  const [peopleSearchQuery, setPeopleSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userFilter, setUserFilter] = useState('all'); // 'all', 'following', 'not_following'
  const [followingUsers, setFollowingUsers] = useState(new Set()); // Track users being followed/unfollowed
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [viewerImageUrl, setViewerImageUrl] = useState('');
  const [viewerImageTitle, setViewerImageTitle] = useState('');
  const [downloadingImage, setDownloadingImage] = useState(false);
  const [sharingImage, setSharingImage] = useState(false);
  const [profileStats, setProfileStats] = useState({
    followers_count: 0,
    following_count: 0,
    total_likes: 0
  });
  const [loadingProfileStats, setLoadingProfileStats] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [myPostsViewMode, setMyPostsViewMode] = useState('cards'); // 'cards' or 'grid'
  const [kycStatus, setKycStatus] = useState(null);
  
  // Animation refs
  const tabAnimation = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;

  // Initialize component
  useEffect(() => {
    // Start with page 1 and load initial batch
    setPage(1);
    setPagination({}); // Reset pagination state
    loadFeed(1, false); // Load first page with smaller batch
    loadAllUsers(userFilter);
    loadKycStatus();
  }, []);

  // Reload users when filter changes
  useEffect(() => {
    if (activeTab === 'people') {
      loadAllUsers(userFilter);
    }
  }, [userFilter]);

  // Load profile stats when user or posts change
  useEffect(() => {
    if (authUser && activeTab === 'profile') {
      loadProfileStats();
    }
  }, [authUser, posts, activeTab]);

  // Load KYC status
  const loadKycStatus = async () => {
    try {
      const kycResponse = await kycService.getKycStatus();
      if (kycResponse.success) {
        setKycStatus(kycResponse.data);
      }
    } catch (error) {
      console.error('Error loading KYC status:', error);
    }
  };



  // Note: User management is now handled by AuthContext
  // No need for separate user initialization functions

  const getAuthToken = async () => {
    try {
      return await SecureStore.getItemAsync('auth_token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  // Simple image prefetch for critical images only
  const preloadCriticalImages = async (posts) => {
    try {
      for (const post of posts) {
        // Only prefetch post images (not avatars to avoid overhead)
        if (post.image_path) {
          Image.prefetch(post.image_path)
            .catch(() => {}); // Silently handle prefetch failures
        }
      }
    } catch (error) {
      console.warn('Error prefetching images:', error);
    }
  };

  const loadFeed = async (pageNum = 1, isRefresh = false) => {
    try {

      
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const token = await getAuthToken();

      
      if (!token) {
        console.log('No auth token found');
        Alert.alert('Error', 'Please login to view discussions');
        return;
      }

      // Optimized pagination parameters for better infinite scrolling
      const perPageCount = pageNum === 1 ? '5' : '10'; // Start with fewer posts on first load
      const params = new URLSearchParams({
        page: pageNum.toString(),
        perPage: perPageCount,
        ...(searchQuery && { search: searchQuery, searchType, discovery: 'true' })
      });

      const feedEndpoint = ENDPOINTS?.DISCUSSIONS?.FEED || '/mobile/discussions/feed';
      const fullUrl = `${BASE_URL}${feedEndpoint}?${params}`;
      console.log('Full URL:', fullUrl);
      console.log('Headers:', getHeaders(token));

      const response = await fetch(fullUrl, {
        headers: getHeaders(token),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {

        console.log('Posts count:', data.data?.posts?.length || 0);
        console.log('Pinned posts count:', data.data?.pinnedPosts?.length || 0);
        console.log('Users count:', data.data?.users?.length || 0);
        console.log('Pagination info:', data.data?.pagination);
        
        const newPosts = data.data.posts || [];
        
        if (pageNum === 1 || isRefresh) {
          setPosts(newPosts);
          // Load pinned posts from ALL users using discovery search
          loadPinnedPostsFromAllUsers();
          // Set users from API response
          setUsers(data.data.users || []);
          // Load trending posts with the fresh posts data
          loadTrendingPosts();
          
          // Simple image prefetch for visible posts only (first 3 posts)
          preloadCriticalImages(newPosts.slice(0, 3));
        } else {
          // Append new posts to existing ones for pagination
          const updatedPosts = [...posts, ...newPosts];
          setPosts(updatedPosts);
          console.log('Total posts after pagination:', updatedPosts.length);
          
          // Simple prefetch for new posts only (first 2 new posts)
          preloadCriticalImages(newPosts.slice(0, 2));
        }
        
        // Update pagination state from server response
        const paginationData = data.data.pagination || {};
        setPagination({
          current_page: paginationData.current_page || pageNum,
          last_page: paginationData.last_page || 1,
          per_page: paginationData.per_page || parseInt(perPageCount),
          total: paginationData.total || newPosts.length,
          has_next_page: paginationData.has_next_page || (paginationData.current_page < paginationData.last_page),
          has_prev_page: paginationData.has_prev_page || (paginationData.current_page > 1)
        });
        
        setPage(pageNum);
        console.log('Updated pagination state:', {
          current_page: pageNum,
          has_next_page: paginationData.has_next_page || (paginationData.current_page < paginationData.last_page),
          total_posts: (pageNum === 1 || isRefresh) ? newPosts.length : posts.length + newPosts.length
        });
      } else {
        console.log('Feed load failed:', data.error);
        Alert.alert('Error', data.error || 'Failed to load discussions');
      }
    } catch (error) {
      console.error('Error loading feed:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      Alert.alert('Error', 'Failed to load discussions: ' + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Load trending posts using the new dedicated backend endpoint
  const loadTrendingPosts = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        setTrendingPosts([]);
        return;
      }

      console.log('🔥 TRENDING: Using dedicated backend endpoint for global trending posts...');

      // Use the new dedicated trending endpoint that fetches from ALL users
      const trendingEndpoint = '/mobile/discussions/trending';
      const trendingUrl = `${BASE_URL}${trendingEndpoint}`;

      const response = await fetch(trendingUrl, {
        headers: getHeaders(token),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data?.trending_posts) {
          const trendingPosts = data.data.trending_posts;
          
          // Verify we have posts from multiple users
          const uniqueUsers = [...new Set(trendingPosts.map(p => p.user?.name || p.user?.id).filter(Boolean))];
          console.log(`🔥 TRENDING: Backend returned ${trendingPosts.length} trending posts from ${uniqueUsers.length} different users:`, uniqueUsers);

          // Log the trending posts details
          console.log('🔥 TRENDING: Final trending posts from backend:', 
            trendingPosts.map(p => ({
              id: p.id,
              title: p.title?.substring(0, 40) + '...',
              user: p.user?.name,
              likes: p.likes_count,
              date: p.created_at
            }))
          );

          setTrendingPosts(trendingPosts);
        } else {
          console.log('🔥 TRENDING: Backend returned no trending posts');
          setTrendingPosts([]);
        }
      } else {
        console.error('🔥 TRENDING: Backend trending endpoint failed with status:', response.status);
        setTrendingPosts([]);
      }

    } catch (error) {
      console.error('🔥 TRENDING: Error loading trending posts from backend:', error);
      setTrendingPosts([]);
    }
  };

  // Load pinned posts from ALL users using the new dedicated backend endpoint
  const loadPinnedPostsFromAllUsers = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        setPinnedPosts([]);
        return;
      }

      console.log('🔥 PINNED: Using dedicated backend endpoint for global pinned posts...');

      // Use the new dedicated global pinned posts endpoint
      const pinnedEndpoint = '/mobile/discussions/pinned/all';
      const pinnedUrl = `${BASE_URL}${pinnedEndpoint}`;

      const response = await fetch(pinnedUrl, {
        headers: getHeaders(token),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data) {
          const pinnedPosts = Array.isArray(data.data) ? data.data : [];
          
          // Verify we have posts from multiple users
          const uniqueUsers = [...new Set(pinnedPosts.map(p => p.user?.name || p.user?.id).filter(Boolean))];
          console.log(`🔥 PINNED: Backend returned ${pinnedPosts.length} pinned posts from ${uniqueUsers.length} different users:`, uniqueUsers);

          // Log the pinned posts details
          console.log('🔥 PINNED: Final pinned posts from backend:', 
            pinnedPosts.map(p => ({
              id: p.id,
              title: p.title?.substring(0, 40) + '...',
              user: p.user?.name,
              is_pinned: p.is_pinned || p.pinned
            }))
          );

          setPinnedPosts(pinnedPosts);
        } else {
          console.log('🔥 PINNED: Backend returned no pinned posts');
          setPinnedPosts([]);
        }
      } else {
        console.error('🔥 PINNED: Backend pinned endpoint failed with status:', response.status);
        setPinnedPosts([]);
      }

    } catch (error) {
      console.error('🔥 PINNED: Error loading pinned posts from backend:', error);
      setPinnedPosts([]);
    }
  };

  const loadAllUsers = async (filter = 'all') => {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.log('No auth token found');
        return;
      }

      console.log('=== LOADING ALL USERS WITH FOLLOWERS ===');
      console.log('Filter:', filter);

      // Primary method: Use dedicated users endpoint with filter
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
    
            console.log('Filter applied:', usersData.filter);
            console.log('User stats:', usersData.stats);
            console.log('Sample user data:', usersList[0]);
            setAllUsers(usersList);
            return;
          }
        } else {
          console.log('Users endpoint failed with status:', usersResponse.status);
          const errorText = await usersResponse.text();
          console.log('Error response:', errorText);
        }
      } catch (error) {
        console.error('Users endpoint error:', error);
      }

      // Fallback: Try to get users from feed endpoint 
      try {
        console.log('Fallback: trying to get users from feed endpoint...');
        const feedResponse = await fetch(`${BASE_URL}${ENDPOINTS.DISCUSSIONS.FEED}?per_page=100`, {
          headers: getHeaders(token),
        });
        
        if (feedResponse.ok) {
          const feedData = await feedResponse.json();
          console.log('Feed response for users fallback:', feedData);
          
          if (feedData.success && feedData.data && feedData.data.users) {
            console.log('Got users from feed endpoint:', feedData.data.users.length);
            setAllUsers(feedData.data.users);
            return;
          }
        }
      } catch (error) {
        console.error('Feed fallback error:', error);
      }

      // Final fallback: Use existing users from feed if available
      console.log('Using existing users from feed as fallback');
      setAllUsers(users);
      
    } catch (error) {
      console.error('Error loading all users:', error);
      setAllUsers([]);
    }
  };

  const onRefresh = useCallback(async () => {
    console.log('=== REFRESH TRIGGERED ===');
    setRefreshing(true);
    setPage(1);
    setPagination({}); // Reset pagination state on refresh
    
    if (searchQuery) {
      // If searching, use discovery search
      await handleSearch();
      // For search, use current posts state for trending
      await loadTrendingPosts();
    } else {
      // Regular feed - reset to first page (trending will be loaded in loadFeed)
      await loadFeed(1, true);
    }
    await loadAllUsers(userFilter);
  }, [searchQuery, searchType, userFilter]);

  const loadMorePosts = () => {
    console.log('=== LOAD MORE POSTS TRIGGERED ===');
    console.log('Current pagination state:', pagination);
    console.log('Current page:', page);
    console.log('Loading more:', loadingMore);
    console.log('Has next page:', pagination.has_next_page);
    console.log('Current posts count:', posts.length);
    
    // Prevent multiple simultaneous requests
    if (loadingMore) {
      console.log('Already loading more posts, skipping...');
      return;
    }
    
    // Check if there are more pages to load
    if (!pagination.has_next_page) {
      console.log('No more pages to load');
      return;
    }
    
    // Additional safety check for page numbers
    if (pagination.current_page && pagination.last_page && pagination.current_page >= pagination.last_page) {
      console.log('Reached last page:', pagination.current_page, '>=', pagination.last_page);
      return;
    }
    
    const nextPage = page + 1;
    console.log('Loading next page:', nextPage);
    loadFeed(nextPage);
  };

  // Discovery search - search ALL posts and ALL people
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      clearSearch();
      return;
    }

    try {
      const token = await getAuthToken();
      if (!token) {
        Alert.alert('Error', 'Please login to search');
        return;
      }

      setLoading(true);

      // Try to use existing feed endpoint with search parameters for posts
      if (searchType === 'all' || searchType === 'posts') {
        try {
          const params = new URLSearchParams({
            search: searchQuery,
            searchType: 'posts',
            discovery: 'true',
            perPage: '50',
            page: '1'
          });

          const feedEndpoint = ENDPOINTS?.DISCUSSIONS?.FEED || '/mobile/discussions/feed';
          const postsUrl = `${BASE_URL}${feedEndpoint}?${params}`;


          const postsResponse = await fetch(postsUrl, {
            headers: getHeaders(token),
          });

          const postsData = await postsResponse.json();

          if (postsData.success && postsData.data?.posts) {
            setPosts(postsData.data.posts);
          } else {
            setPosts([]);
          }
        } catch (error) {
          setPosts([]);
        }
      }

      // Try to get all users for people search
      if (searchType === 'all' || searchType === 'people') {
        try {
          const params = new URLSearchParams({
            search: searchQuery,
            filter: 'all'
          });

          const usersEndpoint = ENDPOINTS?.USERS?.LIST || '/mobile/users';
          const usersUrl = `${BASE_URL}${usersEndpoint}?${params}`;


          const usersResponse = await fetch(usersUrl, {
            headers: getHeaders(token),
          });

          console.log('Users search response status:', usersResponse.status);
          const usersData = await usersResponse.json();
          console.log('Users search response:', usersData);

          if (usersResponse.ok && usersData.success) {
            const usersList = Array.isArray(usersData.data) ? usersData.data : usersData.data?.users || [];
            console.log('Users found:', usersList.length);
            
            // Filter users by search query on frontend if backend doesn't support search
            const filteredUsers = usersList.filter(user =>
              user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              user.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
            console.log('Filtered users:', filteredUsers.length);
            setUsers(filteredUsers);
          } else {
            console.log('No users found or response failed');
            setUsers([]);
          }
        } catch (error) {
          console.log('Users search error:', error);
          setUsers([]);
        }
      }

      console.log('=== SEARCH COMPLETED ===');

    } catch (error) {
      console.error('Error in discovery search:', error);
      Alert.alert('Error', 'Failed to search: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = async () => {
    setSearchQuery('');
    setSearchType('all');
    setPage(1);
    // Restore users to the allUsers data (since search results use users state)
    setUsers(allUsers);
    // Reload normal feed posts (trending will be loaded in loadFeed)
    await loadFeed(1, true);
    // Reload users for People tab based on current filter
    await loadAllUsers(userFilter);
  };

  // Search people in People tab - always search ALL users
  const searchPeople = async (query) => {
    setPeopleSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredUsers([]);
      return;
    }

    try {
      const token = await getAuthToken();
      if (!token) {
        console.log('No auth token for people search');
        return;
      }

      // Always load ALL users for search, regardless of current filter
      const params = new URLSearchParams({
        filter: 'all', // Always search all users
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
          
          // Filter users by search query on frontend as backup
          const searchResults = usersList
            .filter(user => !user.is_self) // Exclude self
            .filter(user => 
              user.name.toLowerCase().includes(query.toLowerCase()) ||
              user.email.toLowerCase().includes(query.toLowerCase())
            );
          
          console.log('People search results:', searchResults.length);
          setFilteredUsers(searchResults);
        } else {
          setFilteredUsers([]);
        }
      } else {
        // Fallback: use local data if API fails
        console.log('API failed, using local data for search');
        const allUsersData = allUsers.length > 0 ? allUsers : users;
        const searchResults = allUsersData
          .filter(user => !user.is_self) // Exclude self
          .filter(user => 
            user.name.toLowerCase().includes(query.toLowerCase()) ||
            user.email.toLowerCase().includes(query.toLowerCase())
          );
        
        console.log('People search results (fallback):', searchResults.length);
        setFilteredUsers(searchResults);
      }
    } catch (error) {
      console.error('Error in people search:', error);
      // Fallback: use local data
      const allUsersData = allUsers.length > 0 ? allUsers : users;
      const searchResults = allUsersData
        .filter(user => !user.is_self) // Exclude self
        .filter(user => 
          user.name.toLowerCase().includes(query.toLowerCase()) ||
          user.email.toLowerCase().includes(query.toLowerCase())
        );
      
      console.log('People search results (error fallback):', searchResults.length);
      setFilteredUsers(searchResults);
    }
  };

  const createPost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      Alert.alert('Error', 'Please fill in both title and content');
      return;
    }

    // Validate minimum content length
    if (newPostContent.trim().length < 10) {
      Alert.alert('Error', 'Content must be at least 10 characters long');
      return;
    }

    // Set loading state
    setIsCreatingPost(true);
    
    // Show upload progress alert for images
    if (selectedImage) {
      Alert.alert('Uploading...', 'Please wait while your image is being uploaded', [], { cancelable: false });
    }

    try {
      const token = await getAuthToken();
      
      const formData = new FormData();
      
      formData.append('title', newPostTitle);
      formData.append('content', newPostContent);
      
      if (selectedImage) {


        // Handle platform-specific file URI and MIME type issues
        const imageUri = selectedImage.uri;
        const mimeType = selectedImage.mimeType || selectedImage.type || 'image/jpeg';
        const fileName = selectedImage.fileName || selectedImage.name || `image_${Date.now()}.jpg`;
        
        // Check file size for warnings  
        if (selectedImage.fileSize && selectedImage.fileSize > 10 * 1024 * 1024) { // 10MB
          Alert.alert('Large Image', 'Image is over 10MB - upload may take longer or fail');
        }
        
        // Create a more robust file object for Android/iOS compatibility
        const imageFile = {
          uri: imageUri,
          type: mimeType,
          name: fileName,
        };


        formData.append('image', imageFile);
      }

      const createEndpoint = ENDPOINTS?.DISCUSSIONS?.CREATE || '/mobile/discussions';
      const createUrl = `${BASE_URL}${createEndpoint}`;

      // Add timeout for better error handling (increased for image uploads)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000); // 60 second timeout for image uploads


      
      // Create headers directly as workaround for import issue
      const multipartHeaders = {
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        // Content-Type is automatically set by fetch for FormData
      };
      
      const response = await fetch(createUrl, {
        method: 'POST',
        headers: multipartHeaders,
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeout);

      const data = await response.json();

      if (data.success) {

        setShowCreatePost(false);
        setNewPostTitle('');
        setNewPostContent('');
        setSelectedImage(null);
        await onRefresh();
        Alert.alert('Success', 'Post created successfully!');
      } else {

        // Handle validation errors
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat();
          Alert.alert('Validation Error', errorMessages.join('\n'));
        } else {
          Alert.alert('Error', data.error || 'Failed to create post');
        }
      }
    } catch (error) {
      console.error('Error creating post:', error);
      console.error('Error details:', error.message);
      
      let errorMessage = 'Failed to create post';
      if (error.name === 'AbortError') {
        errorMessage = selectedImage 
          ? 'Image upload timeout (60s) - please try with a smaller image or check your connection'
          : 'Request timeout - please check your connection and try again';
      } else if (error.message.includes('Network request failed')) {
        errorMessage = 'Network error - please check your internet connection';
      } else if (error.message.includes('JSON')) {
        errorMessage = 'Server response error - please try again';
      } else {
        errorMessage = 'Failed to create post: ' + error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      // Always clear loading state
      setIsCreatingPost(false);
      
      // Dismiss any upload progress alerts
      if (selectedImage) {
        // Small delay to ensure the loading alert is dismissed
        setTimeout(() => {
          // The Alert will be automatically dismissed when the next alert shows
        }, 100);
      }
    }
  };

  // Add haptic feedback with error handling
  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Silently fail if haptics are not available
      console.log('Haptics not available:', error);
    }
  };

  // Delete post with confirmation
  const handleDeletePost = async (postId) => {
    try {
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
              triggerHaptic();
              
              const token = await getAuthToken();
              if (!token) {
                Alert.alert('Error', 'Please login to delete posts');
                return;
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
                // Remove post from state
                setPosts(prev => prev.filter(post => post.id !== postId));
                setPinnedPosts(prev => prev.filter(post => post.id !== postId));
                setTrendingPosts(prev => prev.filter(post => post.id !== postId));
                Alert.alert('Success', 'Post deleted successfully!');
              } else {
                Alert.alert('Error', data.error || 'Failed to delete post');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error deleting post:', error);
      Alert.alert('Error', 'Failed to delete post: ' + error.message);
    }
  };

  // Delete comment with confirmation
  const handleDeleteComment = async (commentId) => {
    try {
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
            onPress: async () => {
              triggerHaptic();
              
              const token = await getAuthToken();
              if (!token) {
                Alert.alert('Error', 'Please login to delete comments');
                return;
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
                // You might want to refresh the post or remove the comment from local state
                // For now, we'll just show success message
              } else {
                Alert.alert('Error', data.error || 'Failed to delete comment');
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

  const toggleLike = async (postId, isPost = true) => {
    try {
      // Haptic feedback for instant response
      triggerHaptic();
      
      // Optimistic update for instant feedback
      const updatePosts = (prev) => prev.map(post => {
        if (post.id === postId) {
          const newIsLiked = !post.is_liked;
          const newLikesCount = newIsLiked ? post.likes_count + 1 : post.likes_count - 1;
          return { ...post, is_liked: newIsLiked, likes_count: Math.max(0, newLikesCount) };
        }
        return post;
      });
      
      setPosts(updatePosts);
      setPinnedPosts(updatePosts);
      
      const token = await getAuthToken();
      
      const likeEndpoint = ENDPOINTS?.DISCUSSIONS?.LIKE || '/mobile/discussions/like';
      const likeUrl = `${BASE_URL}${likeEndpoint}`;
      
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
        // Update with server response
        const serverUpdate = (prev) => prev.map(post => 
          post.id === postId 
            ? { ...post, is_liked: data.data.is_liked, likes_count: data.data.likes_count }
            : post
        );
        setPosts(serverUpdate);
        setPinnedPosts(serverUpdate);
      } else {
        // Revert optimistic update on failure
        const revertUpdate = (prev) => prev.map(post => {
          if (post.id === postId) {
            const revertIsLiked = !post.is_liked;
            const revertLikesCount = revertIsLiked ? post.likes_count + 1 : post.likes_count - 1;
            return { ...post, is_liked: revertIsLiked, likes_count: Math.max(0, revertLikesCount) };
          }
          return post;
        });
        setPosts(revertUpdate);
        setPinnedPosts(revertUpdate);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update on error
      const revertUpdate = (prev) => prev.map(post => {
        if (post.id === postId) {
          const revertIsLiked = !post.is_liked;
          const revertLikesCount = revertIsLiked ? post.likes_count + 1 : post.likes_count - 1;
          return { ...post, is_liked: revertIsLiked, likes_count: Math.max(0, revertLikesCount) };
        }
        return post;
      });
      setPosts(revertUpdate);
      setPinnedPosts(revertUpdate);
    }
  };

  const toggleFollow = async (userId) => {
    try {
      const token = await getAuthToken();
      
      if (!token) {
        Alert.alert('Error', 'Please login to follow users');
        return;
      }

      // Haptic feedback
      triggerHaptic();

      // Add user to loading state
      setFollowingUsers(prev => new Set([...prev, userId]));

      const followEndpoint = ENDPOINTS?.USERS?.FOLLOW || '/mobile/users/';
      const followUrl = `${BASE_URL}${followEndpoint}${userId}/follow`;
      console.log('Toggle follow URL:', followUrl);

      // Find current follow status for optimistic update
      let currentlyFollowing = false;
      const userInAllUsers = allUsers.find(u => u.id === userId);
      const userInUsers = users.find(u => u.id === userId);
      
      if (userInAllUsers) {
        currentlyFollowing = userInAllUsers.is_following;
      } else if (userInUsers) {
        currentlyFollowing = userInUsers.is_following;
      }

      const newFollowingStatus = !currentlyFollowing;
      console.log('Current following status:', currentlyFollowing);
      console.log('New following status:', newFollowingStatus);

      // Optimistic update - update UI immediately for instant feedback
      const updateUserInList = (prev) => prev.map(user => 
        user.id === userId 
          ? { 
              ...user, 
              is_following: newFollowingStatus,
              followers_count: newFollowingStatus 
                ? (user.followers_count || 0) + 1 
                : Math.max((user.followers_count || 1) - 1, 0)
            }
          : user
      );

      const updateUserInPosts = (prev) => prev.map(post => 
        post.user.id === userId 
          ? { 
              ...post, 
              user: { 
                ...post.user, 
                is_following: newFollowingStatus,
                followers_count: newFollowingStatus 
                  ? (post.user.followers_count || 0) + 1 
                  : Math.max((post.user.followers_count || 1) - 1, 0)
              }
            }
          : post
      );

      // Apply optimistic updates
      setAllUsers(updateUserInList);
      setUsers(updateUserInList);
      setPosts(updateUserInPosts);
      setPinnedPosts(updateUserInPosts);

      // Make API call
      const response = await fetch(followUrl, {
        method: 'POST',
        headers: getHeaders(token),
      });

      console.log('Follow API response status:', response.status);
      const data = await response.json();
      console.log('Follow API response data:', data);

      if (data.success) {

        
        // Update with server response (this ensures we have the correct follower count from server)
        const serverUpdateUserInList = (prev) => prev.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                is_following: data.data.is_following,
                followers_count: data.data.followers_count || user.followers_count
              }
            : user
        );

        const serverUpdateUserInPosts = (prev) => prev.map(post => 
          post.user.id === userId 
            ? { 
                ...post, 
                user: { 
                  ...post.user, 
                  is_following: data.data.is_following,
                  followers_count: data.data.followers_count || post.user.followers_count
                }
              }
            : post
        );

        // Apply server updates
        setAllUsers(serverUpdateUserInList);
        setUsers(serverUpdateUserInList);
        setPosts(serverUpdateUserInPosts);
        setPinnedPosts(serverUpdateUserInPosts);

        // Handle filter-specific updates - remove user from filtered view if needed
        if (userFilter === 'following' && !data.data.is_following) {
          // User was unfollowed and we're viewing "following" - remove from list
          setAllUsers(prev => prev.filter(user => user.id !== userId));
        } else if (userFilter === 'not_following' && data.data.is_following) {
          // User was followed and we're viewing "not following" - remove from list
          setAllUsers(prev => prev.filter(user => user.id !== userId));
        }

        // Show success feedback
        const actionText = data.data.is_following ? 'followed' : 'unfollowed';


        // Remove user from loading state
        setFollowingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
        
      } else {
        console.error('Follow API failed:', data.error || data.message);
        
        // Revert optimistic updates on failure
        const revertUserInList = (prev) => prev.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                is_following: currentlyFollowing,
                followers_count: currentlyFollowing 
                  ? (user.followers_count || 1) - 1 
                  : (user.followers_count || 0) + 1
              }
            : user
        );

        const revertUserInPosts = (prev) => prev.map(post => 
          post.user.id === userId 
            ? { 
                ...post, 
                user: { 
                  ...post.user, 
                  is_following: currentlyFollowing,
                  followers_count: currentlyFollowing 
                    ? (post.user.followers_count || 1) - 1 
                    : (post.user.followers_count || 0) + 1
                }
              }
            : post
        );

        // Revert the optimistic updates
        setAllUsers(revertUserInList);
        setUsers(revertUserInList);
        setPosts(revertUserInPosts);
        setPinnedPosts(revertUserInPosts);

        Alert.alert('Error', data.error || data.message || 'Failed to update follow status');

        // Remove user from loading state
        setFollowingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      
      // Revert optimistic updates on error
      const currentlyFollowing = allUsers.find(u => u.id === userId)?.is_following || 
                                users.find(u => u.id === userId)?.is_following || false;
      
      const revertUserInList = (prev) => prev.map(user => 
        user.id === userId 
          ? { 
              ...user, 
              is_following: currentlyFollowing,
              followers_count: currentlyFollowing 
                ? (user.followers_count || 1) - 1 
                : (user.followers_count || 0) + 1
            }
          : user
      );

      const revertUserInPosts = (prev) => prev.map(post => 
        post.user.id === userId 
          ? { 
              ...post, 
              user: { 
                ...post.user, 
                is_following: currentlyFollowing,
                followers_count: currentlyFollowing 
                  ? (post.user.followers_count || 1) - 1 
                  : (post.user.followers_count || 0) + 1
              }
            }
          : post
      );

      setAllUsers(revertUserInList);
      setUsers(revertUserInList);
      setPosts(revertUserInPosts);
      setPinnedPosts(revertUserInPosts);
      
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
      
      // Remove user from loading state
      setFollowingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handlePickImage = async () => {
    // Show size recommendation alert first
    Alert.alert(
      'Image Recommendations',
      '📸 For best quality:\n• Max size: 5MB\n• Recommended: 1080x1080px (square) or 1920x1080px (landscape)\n• Supported: JPG, PNG, GIF, WebP, BMP, TIFF\n• Any orientation supported',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Choose Image', 
          onPress: async () => {
            try {
              const result = await pickImage({
                allowsEditing: false, // Allow original aspect ratio
                quality: 0.8,
                allowsMultipleSelection: false,
                exif: false, // Don't include EXIF data for privacy
                base64: false, // Don't include base64 for performance
                selectionLimit: 1,
              });

              console.log('Image picker result:', result);

              if (result && !result.canceled && result.assets && Array.isArray(result.assets) && result.assets.length > 0) {
                const asset = result.assets[0];
                
                // Check file size (5MB limit)
                if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
                  Alert.alert(
                    'File Too Large',
                    'Please choose an image smaller than 5MB for better upload performance.',
                    [{ text: 'OK' }]
                  );
                  return;
                }
                
                console.log('Selected image:', {
                  width: asset.width,
                  height: asset.height,
                  size: asset.fileSize,
                  type: asset.type
                });
                
                setSelectedImage(asset);
              }
            } catch (error) {
              console.error('Error picking image:', error);
              Alert.alert('Error', 'Failed to pick image. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleTabPress = (tab) => {
    // Haptic feedback for tab changes
    triggerHaptic();
    
    if (tab === 'create') {
      setShowCreatePost(true);
      return;
    }
    
    if (tab === 'hoopay') {
      navigation.navigate('Home');
      return;
    }
    
    setActiveTab(tab);
    
    // Animate tab change
    Animated.timing(tabAnimation, {
      toValue: tab === 'feed' ? 0 : tab === 'people' ? 1 : 2,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleCreatePost = () => {
    setIsCreatingPost(false); // Ensure loading state is reset
    setShowCreatePost(true);
  };

  const openImageViewer = (imageUrl, title = '') => {
    setViewerImageUrl(imageUrl);
    setViewerImageTitle(title);
    setImageViewerVisible(true);
    triggerHaptic();
  };

  const closeImageViewer = () => {
    setImageViewerVisible(false);
    setViewerImageUrl('');
    setViewerImageTitle('');
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

  const downloadImage = async () => {
    if (!viewerImageUrl || downloadingImage) {
      return;
    }

    try {
      setDownloadingImage(true);
      triggerHaptic();

      // Generate filename
      const timestamp = new Date().getTime();
      const imageExtension = viewerImageUrl.split('.').pop()?.toLowerCase() || 'jpg';
      const filename = `hoopay_image_${timestamp}.${imageExtension}`;

      // Download the image
      const fileUri = FileSystem.documentDirectory + filename;
      const downloadResult = await FileSystem.downloadAsync(viewerImageUrl, fileUri);

      if (downloadResult.status === 200) {
        // Share the image instead of saving to media library
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: `image/${imageExtension}`,
            dialogTitle: 'Save Hoopay Image'
          });
        } else {
          Alert.alert(
            'Sharing Not Available',
            'Sharing is not available on this device. The image has been downloaded to your app\'s documents folder.',
            [{ text: 'OK' }]
          );
        }
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Error downloading image:', error);
      Alert.alert(
        'Download Failed ❌',
        'Failed to download image. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setDownloadingImage(false);
    }
  };

  // Load user profile stats
  const loadProfileStats = async () => {
    if (!authUser || !authUser.id) {
      console.log('No current user or user ID for stats loading');
      return;
    }
    
    try {
      setLoadingProfileStats(true);
      const token = await getAuthToken();
      if (!token) {
        console.log('No auth token for stats loading');
        setLoadingProfileStats(false);
        return;
      }

      console.log('Loading stats for user ID:', authUser.id);
      
      // Get user stats from backend
              const statsResponse = await fetch(`${BASE_URL}/mobile/users/${authUser.id}/stats`, {
        headers: getHeaders(token),
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setProfileStats({
            followers_count: statsData.data.followers_count || 0,
            following_count: statsData.data.following_count || 0,
            total_likes: statsData.data.total_likes || 0
          });
          return;
        }
      }

      // Fallback: Calculate from current data
      const userPosts = posts.filter(p => p.user?.id === authUser.id);
      const totalLikes = userPosts.reduce((sum, post) => sum + (post.likes_count || 0), 0);
      
      setProfileStats({
        followers_count: authUser.followers_count || 0,
        following_count: authUser.following_count || 0,
        total_likes: totalLikes
      });

    } catch (error) {
      console.error('Error loading profile stats:', error);
      // Use fallback data
      const userPosts = posts.filter(p => p.user?.id === authUser.id);
      const totalLikes = userPosts.reduce((sum, post) => sum + (post.likes_count || 0), 0);
      
      setProfileStats({
        followers_count: authUser?.followers_count || 0,
        following_count: authUser?.following_count || 0,
        total_likes: totalLikes
      });
    } finally {
      setLoadingProfileStats(false);
    }
  };

  // Load followers list
  const loadFollowers = async () => {
    if (!authUser || !authUser.id) {
      Alert.alert('Error', 'User information not available');
      return;
    }
    
    try {
      const token = await getAuthToken();
      if (!token) {
        Alert.alert('Error', 'Please login to view followers');
        return;
      }

      console.log('Loading followers for user ID:', authUser.id);
      
      const response = await fetch(`${BASE_URL}/mobile/users/${authUser.id}/followers`, {
        headers: getHeaders(token),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFollowersList(data.data.followers || []);
          setShowFollowersModal(true);
          return;
        }
      }

      // Fallback: show message
      Alert.alert('Coming Soon', 'Followers list will be available soon!');
    } catch (error) {
      console.error('Error loading followers:', error);
      Alert.alert('Error', 'Failed to load followers list');
    }
  };

  // Load following list
  const loadFollowing = async () => {
    if (!authUser || !authUser.id) {
      Alert.alert('Error', 'User information not available');
      return;
    }
    
    try {
      const token = await getAuthToken();
      if (!token) {
        Alert.alert('Error', 'Please login to view following list');
        return;
      }

      console.log('Loading following for user ID:', authUser.id);
      
      const response = await fetch(`${BASE_URL}/mobile/users/${authUser.id}/following`, {
        headers: getHeaders(token),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFollowingList(data.data.following || []);
          setShowFollowingModal(true);
          return;
        }
      }

      // Fallback: show message
      Alert.alert('Coming Soon', 'Following list will be available soon!');
    } catch (error) {
      console.error('Error loading following:', error);
      Alert.alert('Error', 'Failed to load following list');
    }
  };

  // Show user's posts in main feed
  const showMyPosts = () => {
    if (!authUser || !authUser.id) {
      Alert.alert('Error', 'User information not available');
      return;
    }
    
    setActiveTab('home');
    // Filter to show only current user's posts
    const userPosts = posts.filter(p => p.user?.id === authUser.id);
    if (userPosts.length === 0) {
      Alert.alert('No Posts', 'You haven\'t created any posts yet. Create your first post!', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Create Post', onPress: () => setShowCreatePost(true) }
      ]);
    }
  };

  const shareImage = async () => {
    if (!viewerImageUrl || sharingImage) {
      return;
    }

    try {
      setSharingImage(true);
      triggerHaptic();

      // Check if sharing is available
      if (!(await Sharing.isAvailableAsync())) {
        // Fallback to built-in Share API
        const shareMessage = viewerImageTitle 
          ? `Check out this image: "${viewerImageTitle}" from Hoopay Community\n\n${viewerImageUrl}`
          : `Check out this image from Hoopay Community\n\n${viewerImageUrl}`;

        await Share.share({
          message: shareMessage,
          url: Platform.OS === 'ios' ? viewerImageUrl : undefined,
        });
        return;
      }

      // Download image temporarily for sharing
      const timestamp = new Date().getTime();
      const imageExtension = viewerImageUrl.split('.').pop()?.toLowerCase() || 'jpg';
      const filename = `hoopay_share_${timestamp}.${imageExtension}`;
      const fileUri = FileSystem.cacheDirectory + filename;

      const downloadResult = await FileSystem.downloadAsync(viewerImageUrl, fileUri);

      if (downloadResult.status === 200) {
        // Share the downloaded image
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: `image/${imageExtension}`,
          dialogTitle: viewerImageTitle || 'Share Image from Hoopay',
        });

        // Clean up temporary file after a delay
        setTimeout(async () => {
          try {
            await FileSystem.deleteAsync(downloadResult.uri);
          } catch (cleanupError) {
            console.log('Cleanup error (non-critical):', cleanupError);
          }
        }, 5000);
      } else {
        throw new Error('Failed to prepare image for sharing');
      }
    } catch (error) {
      console.error('Error sharing image:', error);
      
      // Fallback to URL sharing
      try {
        const shareMessage = viewerImageTitle 
          ? `Check out this image: "${viewerImageTitle}" from Hoopay Community\n\n${viewerImageUrl}`
          : `Check out this image from Hoopay Community\n\n${viewerImageUrl}`;

        await Share.share({
          message: shareMessage,
          url: Platform.OS === 'ios' ? viewerImageUrl : undefined,
        });
      } catch (fallbackError) {
        Alert.alert(
          'Share Failed ❌',
          'Failed to share image. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setSharingImage(false);
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

  // Navigate to user profile
  const navigateToUserProfile = (userId) => {
    console.log('=== NAVIGATING TO USER PROFILE ===');
    console.log('User ID:', userId);
    console.log('Current user ID:', authUser?.id);
    
    // Add haptic feedback
    triggerHaptic();
    
    if (userId === authUser?.id) {
      // If it's the current user, switch to profile tab
      console.log('Navigating to own profile - switching to profile tab');
      setActiveTab('profile');
      
      // Animate tab change
      Animated.timing(tabAnimation, {
        toValue: 2,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else {
      // Navigate to other user's profile screen
      console.log('Navigating to other user profile screen');
      navigation.navigate('UserProfile', { userId });
    }
  };

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
          onPress={() => togglePostExpansion(postId)}
          style={styles.seeMoreButton}
        >
          <Text style={[styles.seeMoreText, { color: colors.primary }]}>
            {isExpanded ? 'See less' : 'See more'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render functions for components
  // Handle comment changes in post cards
  const handleCommentChange = (action, comment) => {
    // Update post comments count in state
    if (action === 'add') {
      setPosts(prev => prev.map(post => 
        post.id === comment.post_id 
          ? { ...post, comments_count: post.comments_count + 1 }
          : post
      ));
    } else if (action === 'delete') {
      setPosts(prev => prev.map(post => 
        post.comments && post.comments.some(c => c.id === comment.id)
          ? { ...post, comments_count: Math.max(0, post.comments_count - 1) }
          : post
      ));
    }
  };

  const renderPost = ({ item: post }) => (
    <PostCard
      post={post}
      currentUser={authUser}
      expandedPosts={expandedPosts}
      onToggleExpansion={togglePostExpansion}
      onLike={toggleLike}
      onImagePress={openImageViewer}
      onNavigate={(screen, params) => navigation.navigate(screen, params)}
      onUserPress={navigateToUserProfile}
      onCommentPress={() => navigation.navigate('PostDetail', { postId: post.id })}
      onDelete={handleDeletePost}
      onCommentChange={handleCommentChange}
      triggerHaptic={triggerHaptic}
    />
  );

  const renderUser = ({ item: user }) => (
    <UserCard
          user={user} 
      followingUsers={followingUsers || new Set()}
      onToggleFollow={toggleFollow}
      triggerHaptic={triggerHaptic}
    />
  );

  if (loading) {
  return (
      <SafeAreaView 
        style={[
          styles.container, 
          { 
            backgroundColor: colors.background,
            paddingTop: Platform.OS === 'android' ? insets.top : 0
          }
        ]}
      >
      <StatusBar style={isDarkMode ? "light" : "dark"} />
        <CommunityDotsLoading 
          message="Loading community..." 
          size="large"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView 
      style={[
        styles.container, 
        { 
          backgroundColor: colors.background,
          paddingTop: Platform.OS === 'android' ? insets.top : 0
        }
      ]}
    >
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      {/* Facebook-like Header */}
      <Animated.View style={[
        styles.fbHeader, 
        { 
          backgroundColor: colors.surface,
          paddingTop: Platform.OS === 'android' ? 10 : (insets.top || 20),
          opacity: headerOpacity
        }
      ]}>
        <View style={styles.fbHeaderContent}>
          <Text style={[styles.fbLogo, { color: colors.primary }]}>hoopay</Text>
          <View style={styles.fbHeaderIcons}>
            <TouchableOpacity 
              style={[styles.fbIconButton, { backgroundColor: colors.background }]}
              onPress={() => {
                if (activeTab === 'people') {
                  setShowPeopleSearchModal(true);
                  // Ensure we have all users loaded for search
                  loadAllUsers('all');
                } else {
                  setShowSearchModal(true);
                }
              }}
            >
              <MaterialIcons name="search" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

            {/* Content based on active tab */}
      {activeTab === 'feed' && (
        <FeedTab
          loading={loading}
          searchQuery={searchQuery}
          posts={posts}
          pinnedPosts={pinnedPosts}
          trendingPosts={trendingPosts}
          currentUser={authUser}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onLoadMore={loadMorePosts}
          loadingMore={loadingMore}
          expandedPosts={expandedPosts}
          onTogglePostExpansion={togglePostExpansion}
          onToggleLike={toggleLike}
          onImagePress={openImageViewer}
          onCreatePost={handleCreatePost}
          onClearSearch={clearSearch}
          onSearchPress={() => setShowSearchModal(true)}
          onUserPress={navigateToUserProfile}
          navigation={navigation}
          triggerHaptic={triggerHaptic}
          renderPost={renderPost}
          styles={styles}
        />
      )}

      {activeTab === 'people' && (
        <PeopleTab
          loading={loading}
          userFilter={userFilter}
          setUserFilter={setUserFilter}
          peopleSearchQuery={peopleSearchQuery}
          filteredUsers={filteredUsers}
          allUsers={allUsers}
          users={users}
          refreshing={refreshing}
          onRefresh={onRefresh}
          searchPeople={searchPeople}
          renderUser={renderUser}
          triggerHaptic={triggerHaptic}
          followingUsers={followingUsers}
          onToggleFollow={toggleFollow}
        />
      )}

      {activeTab === 'profile' && (
        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ 
            paddingBottom: Platform.OS === 'android' ? 120 : 100 
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >

          
          {authUser ? (
            <>
              {/* Profile Header Component */}
              <ProfileHeader
                currentUser={authUser}
                profileStats={profileStats}
                loadingProfileStats={loadingProfileStats}
                kycStatus={kycStatus}
                onStatsPress={(type) => {
                  if (type === 'posts') showMyPosts();
                  else if (type === 'followers') loadFollowers();
                  else if (type === 'following') loadFollowing();
                }}
              />
              
              {/* Quick Actions Component */}
              <QuickActions
                onCreatePost={() => setShowCreatePost(true)}
                onFindFriends={() => handleTabPress('people')}
                onDiscover={() => setShowSearchModal(true)}
              />
              
              {/* My Posts Component */}
              <MyPosts
                posts={posts}
                currentUser={authUser}
                myPostsViewMode={myPostsViewMode}
                onViewModeChange={setMyPostsViewMode}
                onPostPress={showMyPosts}
                onLikePress={toggleLike}
                onImagePress={openImageViewer}
                triggerHaptic={triggerHaptic}
              />
            </>
          ) : (
            <View style={styles.profileLoadingContainer}>
              
              {/* Profile Info Skeleton */}
              <View style={styles.profileLoadingSkeleton}>
                <LoadingSkeleton width={120} height={120} borderRadius={60} style={{ alignSelf: 'center', marginBottom: 16, marginTop: 20 }} />
                <LoadingSkeleton width={180} height={24} borderRadius={4} style={{ alignSelf: 'center', marginBottom: 8 }} />
                <LoadingSkeleton width={220} height={16} borderRadius={4} style={{ alignSelf: 'center', marginBottom: 8 }} />
                <LoadingSkeleton width={150} height={14} borderRadius={4} style={{ alignSelf: 'center', marginBottom: 20 }} />
                
                {/* Actions Skeleton */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
                  <LoadingSkeleton width={120} height={40} borderRadius={20} />
                  <LoadingSkeleton width={40} height={40} borderRadius={20} />
                </View>
                
                {/* Stats Skeleton */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 }}>
                  {[1, 2, 3, 4].map(i => (
                    <View key={i} style={{ alignItems: 'center' }}>
                      <LoadingSkeleton width={40} height={20} borderRadius={4} style={{ marginBottom: 4 }} />
                      <LoadingSkeleton width={60} height={14} borderRadius={4} />
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        visible={showCreatePost}
        onClose={() => {
              setShowCreatePost(false);
              setIsCreatingPost(false);
        }}
        newPostTitle={newPostTitle}
        setNewPostTitle={setNewPostTitle}
        newPostContent={newPostContent}
        setNewPostContent={setNewPostContent}
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
        isCreatingPost={isCreatingPost}
        onSubmit={createPost}
        onPickImage={handlePickImage}
      />

      {/* Search Modals */}
      <SearchModals
        // Main Search Modal
        showSearchModal={showSearchModal}
        setShowSearchModal={setShowSearchModal}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchType={searchType}
        setSearchType={setSearchType}
        handleSearch={handleSearch}
        users={users}
        posts={posts}
        followingUsers={followingUsers}
        toggleFollow={toggleFollow}
        toggleLike={toggleLike}
        navigation={navigation}
        
        // People Search Modal
        showPeopleSearchModal={showPeopleSearchModal}
        setShowPeopleSearchModal={setShowPeopleSearchModal}
        peopleSearchQuery={peopleSearchQuery}
        searchPeople={searchPeople}
        filteredUsers={filteredUsers}
      />

      {/* Image Viewer Modal */}
      <ImageViewer
        visible={imageViewerVisible}
        imageUrl={viewerImageUrl}
        title={viewerImageTitle}
        onClose={closeImageViewer}
        onDownload={downloadImage}
        onShare={shareImage}
        downloadingImage={downloadingImage}
        sharingImage={sharingImage}
        insets={insets}
      />

      {/* Followers Modal Component */}
      <FollowersModal
        visible={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        followersList={followersList}
        loadingFollowers={false}
        onFollowToggle={toggleFollow}
        triggerHaptic={triggerHaptic}
      />

      {/* Following Modal Component */}
      <FollowingModal
        visible={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        followingList={followingList}
        loadingFollowing={false}
        onFollowToggle={toggleFollow}
        triggerHaptic={triggerHaptic}
      />

      {/* Community Bottom Navigation Bar */}
      <View style={[
        styles.bottomNavBar, 
        { 
          backgroundColor: colors.surface,
          paddingBottom: Platform.OS === 'android' 
            ? Math.max(insets.bottom || 0, 10) + 5
            : insets.bottom || 10
        }
      ]}>
        <TouchableOpacity 
          style={styles.bottomNavItem}
          onPress={() => handleTabPress('feed')}
        >
          <View style={[
            styles.bottomNavIcon,
            activeTab === 'feed' && { backgroundColor: colors.primary + '20' }
          ]}>
            <MaterialIcons 
              name="dynamic-feed" 
              size={24} 
              color={activeTab === 'feed' ? colors.primary : colors.textSecondary}
            />
          </View>
          <Text style={[
            styles.bottomNavLabel,
            { color: activeTab === 'feed' ? colors.primary : colors.textSecondary }
          ]}>
            Feed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.bottomNavItem}
          onPress={() => handleTabPress('people')}
        >
          <View style={[
            styles.bottomNavIcon,
            activeTab === 'people' && { backgroundColor: colors.primary + '20' }
          ]}>
            <MaterialIcons 
              name="groups" 
              size={24} 
              color={activeTab === 'people' ? colors.primary : colors.textSecondary}
            />
          </View>
          <Text style={[
            styles.bottomNavLabel,
            { color: activeTab === 'people' ? colors.primary : colors.textSecondary }
          ]}>
            People
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.bottomNavItem}
          onPress={() => handleTabPress('create')}
        >
          <View style={[styles.bottomNavCreateButton, { backgroundColor: colors.primary }]}>
            <MaterialIcons name="add" size={28} color="white" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.bottomNavItem}
          onPress={() => handleTabPress('profile')}
        >
          <View style={[
            styles.bottomNavIcon,
            activeTab === 'profile' && { backgroundColor: colors.primary + '20' }
          ]}>
            <Ionicons 
              name="person" 
              size={24} 
              color={activeTab === 'profile' ? colors.primary : colors.textSecondary}
            />
          </View>
          <Text style={[
            styles.bottomNavLabel,
            { color: activeTab === 'profile' ? colors.primary : colors.textSecondary }
          ]}>
            Profile
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.bottomNavItem}
          onPress={() => handleTabPress('hoopay')}
        >
          <View style={[styles.bottomNavHoopayButton, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="wallet" size={20} color="white" />
          </View>
          <Text style={[
            styles.bottomNavLabel,
            { color: colors.primary }
          ]}>
            Hoopay
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CommunityScreen;