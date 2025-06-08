import { StyleSheet, Dimensions } from 'react-native';

// Get screen dimensions
const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Facebook-like Header
  fbHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fbHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fbLogo: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  fbHeaderIcons: {
    flexDirection: 'row',
    gap: 10,
  },
  fbIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  fbIcon: {
    fontSize: 18,
    fontWeight: '600',
  },

  // Bottom Navigation Bar
  bottomNavBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    borderTopWidth: 1,
    borderTopColor: '#e4e6ea',
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  bottomNavIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  bottomNavLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  bottomNavCreateButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomNavHoopayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

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
    marginBottom: 8,
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
  
  // Trending Section
  trendingSection: {
    marginVertical: 8,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  trendingSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  trendingContainer: {
    paddingLeft: 16,
  },
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
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1877f2',
  },
  followButtonText: {
    color: '#1877f2',
    fontSize: 12,
    fontWeight: '600',
  },
  followingButton: {
    backgroundColor: '#1877f2',
  },
  followingButtonText: {
    color: 'white',
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
  likedButton: {
    color: '#1877f2',
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

  // Users
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userCardName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userCardEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  userCardFollowButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },

  // Loading
  loadingMore: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMoreText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  feedEnd: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedEndText: {
    fontSize: 14,
    fontWeight: '500',
    fontStyle: 'italic',
  },

  // Profile Loading
  profileLoadingContainer: {
    backgroundColor: 'transparent',
  },
  profileLoadingSkeleton: {
    padding: 20,
    backgroundColor: 'white',
    marginHorizontal: 12,
    borderRadius: 16,
    marginTop: -60,
  },

  // Image Viewer Styles
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  imageViewerBackground: {
    flex: 1,
  },
  imageViewerContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  imageViewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 1,
  },
  imageViewerCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  imageViewerTitle: {
    flex: 1,
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  imageViewerImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  imageViewerImage: {
    width: '100%',
    height: '100%',
    maxWidth: screenWidth,
    maxHeight: '80%',
  },
  imageViewerPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  imageViewerPlaceholderText: {
    color: 'white',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  imageViewerFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 40,
  },
  imageViewerActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 80,
  },
  imageViewerActionButtonLoading: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    opacity: 0.7,
  },
  imageViewerActionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});

export default styles; 