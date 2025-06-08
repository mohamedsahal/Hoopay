import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  FlatList, 
  RefreshControl,
  Image,
  ActivityIndicator,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import Colors from '../../constants/Colors';
import { FeedSkeleton } from './SkeletonComponents';
import UserAvatar from './UserAvatar';
import TrendingCard from './TrendingCard';
import { PostSkeleton } from './SkeletonComponents';
import { DotsLoading } from '../Loading';

const FeedTab = ({ 
  loading,
  searchQuery,
  posts,
  pinnedPosts,
  trendingPosts,
  currentUser,
  refreshing,
  onRefresh,
  onLoadMore,
  loadingMore,
  expandedPosts,
  onTogglePostExpansion,
  onToggleLike,
  onImagePress,
  onCreatePost,
  onClearSearch,
  onSearchPress,
  onUserPress,
  navigation,
  triggerHaptic,
  tabBarHeight = 0,
  renderPost,
  styles
}) => {
  // Use fallback colors and theme if context is not available
  let colors;
  try {
    const theme = useTheme();
    colors = theme.colors;
  } catch (error) {
    colors = Colors;
  }

  const renderExpandableText = (text, postId, isTitle = false) => {
    const isExpanded = expandedPosts.has(postId);
    const maxLength = isTitle ? 80 : 150;
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
          onPress={() => onTogglePostExpansion(postId)}
          style={styles.seeMoreButton}
        >
          <Text style={[styles.seeMoreText, { color: colors.primary }]}>
            {isExpanded ? 'See less' : 'See more'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return <PostSkeleton />;
  }

  const ListHeaderComponent = () => (
    <View>
      {/* Search indicator */}
      {searchQuery ? (
        <View style={[styles.searchIndicator, { backgroundColor: colors.surface }]}>
          <Text style={[styles.searchIndicatorText, { color: colors.text }]}>
            🔍 Search results for "{searchQuery}"
          </Text>
          <TouchableOpacity onPress={onClearSearch} style={styles.clearSearchButton}>
            <Text style={[styles.clearSearchText, { color: colors.primary }]}>Clear</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* What's on your mind */}
          <TouchableOpacity 
            style={[styles.fbCreatePost, { backgroundColor: colors.surface }]}
            onPress={onCreatePost}
          >
            {currentUser && (
              <UserAvatar 
                user={currentUser}
                size={40}
                style={styles.fbCreateAvatar}
              />
            )}
            <Text style={[styles.fbCreateText, { color: colors.textSecondary }]}>
              What's on your mind?
            </Text>
            <TouchableOpacity style={[styles.fbPhotoButton, { backgroundColor: colors.background }]}>
              <Text style={styles.fbPhotoIcon}>📷</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Trending Posts Section - Scrollable */}
          <View style={[styles.topTrendingSection, { backgroundColor: colors.surface }]}>
            <View style={styles.topTrendingHeader}>
              <Text style={[styles.topTrendingTitle, { color: colors.text }]}>
                🔥 Trending This Week
              </Text>
              <Text style={[styles.topTrendingSubtitle, { color: colors.textSecondary }]}>
                {trendingPosts.length > 0 ? 'Most liked posts in the last 7 days' : 'No trending posts this week'}
              </Text>
            </View>
            {trendingPosts.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.topTrendingContainer}
              >
                {trendingPosts.map((post) => (
                  <TrendingCard 
                    key={`trending-${post.id}`} 
                    post={post} 
                    onImagePress={onImagePress}
                    onNavigate={(screen, params) => navigation.navigate(screen, params)}
                    onUserPress={onUserPress}
                    navigation={navigation}
                    triggerHaptic={triggerHaptic}
                  />
                ))}
              </ScrollView>
            ) : (
              <View style={styles.noTrendingContainer}>
                <Text style={[styles.noTrendingText, { color: colors.textSecondary }]}>
                  🌟 Be the first to create trending content this week!
                </Text>
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );

  const ListFooterComponent = () => {
    if (loadingMore) {
      return (
        <View style={styles.loadingMore}>
          <DotsLoading size={8} color={colors.primary} spacing={4} />
          <Text style={[styles.loadingMoreText, { color: colors.textSecondary }]}>
            Loading more posts...
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.feedEnd}>
        <Text style={[styles.feedEndText, { color: colors.textSecondary }]}>
          🎉 You're all caught up!
        </Text>
      </View>
    );
  };

  const ListEmptyComponent = () => {
    if (searchQuery) {
      return (
        <View style={styles.emptySearchContainer}>
          <MaterialIcons name="search-off" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptySearchTitle, { color: colors.text }]}>
            No Results Found
          </Text>
          <Text style={[styles.emptySearchText, { color: colors.textSecondary }]}>
            Try searching with different keywords or check the spelling.
          </Text>
          <TouchableOpacity 
            style={[styles.newSearchButton, { backgroundColor: colors.primary }]}
            onPress={onSearchPress}
          >
            <Text style={styles.newSearchButtonText}>New Search</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  return (
    <FlatList
      data={[...pinnedPosts, ...posts]}
      renderItem={renderPost}
      keyExtractor={(item) => `post-${item.id}`}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.3}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
      contentContainerStyle={{ 
        paddingBottom: Platform.OS === 'android' ? 120 : 100 
      }}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={true}
      initialNumToRender={5}
      maxToRenderPerBatch={10}
      windowSize={10}
      getItemLayout={undefined}
      keyboardShouldPersistTaps="handled"
    />
  );
};

const styles = {
  // Facebook-like Create Post
  fbCreatePost: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 6,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderRadius: 0,
  },
  fbCreateAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  fbCreateText: {
    flex: 1,
    fontSize: 15,
    color: '#8e8e93',
  },
  fbPhotoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  fbPhotoIcon: {
    fontSize: 16,
  },

  // Top Trending Section
  topTrendingSection: {
    paddingVertical: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  topTrendingHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  topTrendingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  topTrendingSubtitle: {
    fontSize: 13,
    opacity: 0.8,
  },
  topTrendingContainer: {
    paddingLeft: 16,
    paddingRight: 8,
    paddingBottom: 14,
  },
  noTrendingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  noTrendingText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Trending Cards
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
    padding: 8,
    paddingBottom: 6,
  },
  trendingAvatar: {
    marginRight: 6,
  },
  trendingUserName: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  trendingBadge: {
    marginLeft: 4,
  },
  trendingBadgeText: {
    fontSize: 10,
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

  // Search indicator
  searchIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  searchIndicatorText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  clearSearchButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearSearchText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Posts
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
  postImageContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  postImage: {
    width: '100%',
    height: 250,
    minHeight: 150,
    maxHeight: 400,
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

  // Empty states
  emptySearchContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptySearchTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySearchText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  newSearchButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  newSearchButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

};

export default FeedTab; 