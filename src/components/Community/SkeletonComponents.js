import React from 'react';
import { View, ScrollView } from 'react-native';
import { LoadingSkeleton } from '../Loading';
import { useTheme } from '../../contexts/ThemeContext';
import Colors from '../../constants/Colors';

// Post Skeleton Component
const PostSkeleton = ({ hasImage = Math.random() > 0.6 }) => {
  let colors;
  try {
    const theme = useTheme();
    colors = theme.colors;
  } catch (error) {
    colors = Colors;
  }

  return (
    <View style={[styles.postCard, { backgroundColor: colors.cardBackground }]}>
      {/* Post Header Skeleton */}
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <LoadingSkeleton 
            width={40} 
            height={40} 
            borderRadius={20} 
            style={styles.avatar}
          />
          <View>
            <LoadingSkeleton 
              width={120} 
              height={16} 
              borderRadius={4} 
              style={{ marginBottom: 4 }}
            />
            <LoadingSkeleton 
              width={80} 
              height={12} 
              borderRadius={4}
            />
          </View>
        </View>
        <LoadingSkeleton 
          width={60} 
          height={24} 
          borderRadius={12}
        />
      </View>
      
      {/* Post Content Skeleton */}
      <LoadingSkeleton 
        width="90%" 
        height={18} 
        borderRadius={4} 
        style={{ marginBottom: 8 }}
      />
      <LoadingSkeleton 
        width="100%" 
        height={14} 
        borderRadius={4} 
        style={{ marginBottom: 6 }}
      />
      <LoadingSkeleton 
        width="75%" 
        height={14} 
        borderRadius={4} 
        style={{ marginBottom: 15 }}
      />

      {/* Image Skeleton (sometimes) */}
      {hasImage && (
        <LoadingSkeleton 
          width="100%" 
          height={150} 
          borderRadius={12} 
          style={{ marginBottom: 15 }}
        />
      )}

      {/* Actions Skeleton */}
      <View style={[styles.postActions, { borderTopColor: colors.border }]}>
        <LoadingSkeleton 
          width={50} 
          height={16} 
          borderRadius={4} 
          style={{ marginRight: 20 }}
        />
        <LoadingSkeleton 
          width={40} 
          height={16} 
          borderRadius={4}
        />
      </View>
    </View>
  );
};

// Create Post Skeleton Component
const CreatePostSkeleton = () => {
  let colors;
  try {
    const theme = useTheme();
    colors = theme.colors;
  } catch (error) {
    colors = Colors;
  }

  return (
    <View style={[styles.createPostButton, { backgroundColor: colors.surface }]}>
      <LoadingSkeleton 
        width={40} 
        height={40} 
        borderRadius={20} 
        style={{ marginRight: 15 }}
      />
      <LoadingSkeleton 
        width={180} 
        height={16} 
        borderRadius={4}
      />
    </View>
  );
};

// Trending Card Skeleton Component
const TrendingCardSkeleton = () => (
  <View style={styles.trendingCard}>
    <LoadingSkeleton 
      width={100} 
      height={120} 
      borderRadius={12} 
      style={{ marginBottom: 8 }}
    />
    <LoadingSkeleton 
      width={80} 
      height={12} 
      borderRadius={4} 
      style={{ marginBottom: 4 }}
    />
    <LoadingSkeleton 
      width={60} 
      height={10} 
      borderRadius={4}
    />
  </View>
);

// Feed Skeleton Component
const FeedSkeleton = ({ showCreatePost = true, tabBarHeight = 0 }) => {
  return (
    <ScrollView 
      style={styles.scrollContainer}
      contentContainerStyle={[
        styles.scrollContentContainer,
        { paddingBottom: tabBarHeight + 20 }
      ]}
    >
      {showCreatePost && <CreatePostSkeleton />}
      
      {/* Trending Section Skeleton */}
      <View style={styles.trendingSection}>
        <LoadingSkeleton width={100} height={16} borderRadius={4} style={{ marginBottom: 12 }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[...Array(3)].map((_, index) => (
            <TrendingCardSkeleton key={index} />
          ))}
        </ScrollView>
      </View>
      
      {[...Array(5)].map((_, index) => (
        <PostSkeleton key={index} hasImage={index % 3 === 0} />
      ))}
    </ScrollView>
  );
};

// Profile Loading Skeleton Component
const ProfileLoadingSkeleton = () => {
  let colors;
  try {
    const theme = useTheme();
    colors = theme.colors;
  } catch (error) {
    colors = Colors;
  }

  return (
    <View style={styles.profileLoadingContainer}>
      {/* Profile Info Skeleton */}
      <View style={[styles.profileLoadingSkeleton, { backgroundColor: colors.surface }]}>
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
  );
};

// User Card Skeleton Component
const UserCardSkeleton = () => {
  let colors;
  try {
    const theme = useTheme();
    colors = theme.colors;
  } catch (error) {
    colors = Colors;
  }

  return (
    <View style={[styles.userCard, { backgroundColor: colors.surface }]}>
      <LoadingSkeleton width={50} height={50} borderRadius={25} />
      <View style={styles.userCardInfo}>
        <LoadingSkeleton width={120} height={16} borderRadius={4} style={{ marginBottom: 6 }} />
        <LoadingSkeleton width={80} height={12} borderRadius={4} />
      </View>
      <LoadingSkeleton width={70} height={30} borderRadius={15} />
    </View>
  );
};

// Header Loading Skeleton Component
const HeaderLoadingSkeleton = ({ insets }) => {
  let colors;
  try {
    const theme = useTheme();
    colors = theme.colors;
  } catch (error) {
    colors = Colors;
  }

  return (
    <View style={[styles.header, { paddingTop: insets.top || 30, backgroundColor: colors.headerBackground }]}>
      <View style={styles.headerContent}>
        <LoadingSkeleton 
          width={150} 
          height={24} 
          borderRadius={6}
        />
      </View>
      
      {/* Search Bar Skeleton */}
      <View style={styles.searchContainer}>
        <LoadingSkeleton 
          width="85%" 
          height={40} 
          borderRadius={20}
        />
        <LoadingSkeleton 
          width={40} 
          height={40} 
          borderRadius={20}
        />
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
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 0.5,
    gap: 20,
  },
  createPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderRadius: 0,
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
  trendingSection: {
    marginVertical: 8,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  profileLoadingContainer: {
    backgroundColor: 'transparent',
  },
  profileLoadingSkeleton: {
    padding: 20,
    marginHorizontal: 12,
    borderRadius: 16,
    marginTop: -60,
  },
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
  header: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
};

export {
  PostSkeleton,
  CreatePostSkeleton,
  TrendingCardSkeleton,
  FeedSkeleton,
  ProfileLoadingSkeleton,
  UserCardSkeleton,
  HeaderLoadingSkeleton
}; 