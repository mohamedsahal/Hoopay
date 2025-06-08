import React from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import Colors from '../../constants/Colors';

const MyPosts = ({ 
  posts, 
  currentUser, 
  myPostsViewMode, 
  onViewModeChange, 
  onPostPress, 
  onLikePress,
  onImagePress,
  triggerHaptic 
}) => {
  // Use custom theme context with fallback
  let colors, isDarkMode;
  try {
    const theme = useTheme();
    colors = theme.colors;
    isDarkMode = theme.isDarkMode;
  } catch (error) {
    console.warn('ThemeContext not available in MyPosts, using default colors');
    colors = Colors;
    isDarkMode = false;
  }
  
  const userPosts = posts.filter(p => p.user?.id === currentUser.id);

  const renderCardView = () => (
    <View style={styles.myPostsList}>
      {userPosts.slice(0, 3).map((post) => (
        <TouchableOpacity 
          key={post.id}
          style={[styles.myPostCard, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={() => onPostPress()}
          activeOpacity={0.7}
        >
          {/* Post Image */}
          {post.image_path && (
            <View style={styles.myPostImageContainer}>
              <Image 
                source={{ uri: post.image_path }}
                style={styles.myPostImage}
                resizeMode="cover"
              />
              <TouchableOpacity 
                style={styles.myPostImageOverlay}
                onPress={() => onImagePress(post.image_path, post.title)}
              >
                <MaterialIcons name="zoom-in" size={20} color="white" />
              </TouchableOpacity>
            </View>
          )}
          
          {/* Post Content */}
          <View style={styles.myPostCardContent}>
            <Text style={[styles.myPostCardTitle, { color: colors.text }]} numberOfLines={2}>
              {post.title}
            </Text>
            
            {post.content && (
              <Text style={[styles.myPostCardDescription, { color: colors.textSecondary }]} numberOfLines={3}>
                {post.content}
              </Text>
            )}
            
            {/* Post Footer */}
            <View style={styles.myPostCardFooter}>
              <Text style={[styles.myPostCardDate, { color: colors.textSecondary }]}>
                {post.created_at}
              </Text>
              
              <View style={styles.myPostCardStats}>
                <View style={styles.myPostCardStat}>
                  <MaterialIcons 
                    name={post.is_liked ? "favorite" : "favorite-border"} 
                    size={16} 
                    color={post.is_liked ? "#FF6B6B" : colors.textSecondary} 
                  />
                  <Text style={[styles.myPostCardStatText, { color: colors.textSecondary }]}>
                    {post.likes_count || 0}
                  </Text>
                </View>
                
                <View style={styles.myPostCardStat}>
                  <MaterialIcons name="comment" size={16} color={colors.textSecondary} />
                  <Text style={[styles.myPostCardStatText, { color: colors.textSecondary }]}>
                    {post.comments_count || 0}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* Quick Actions */}
          <View style={[styles.myPostCardActions, { borderTopColor: colors.border }]}>
            <TouchableOpacity 
              style={styles.myPostActionButton}
              onPress={(e) => {
                e.stopPropagation();
                triggerHaptic();
                onLikePress(post.id, true);
              }}
            >
              <MaterialIcons 
                name={post.is_liked ? "favorite" : "favorite-border"} 
                size={20} 
                color={post.is_liked ? "#FF6B6B" : colors.textSecondary} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.myPostActionButton}
              onPress={(e) => {
                e.stopPropagation();
                triggerHaptic();
                Alert.alert('Comments', 'Comments feature coming soon!');
              }}
            >
              <MaterialIcons name="comment" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.myPostActionButton}
              onPress={(e) => {
                e.stopPropagation();
                triggerHaptic();
                Alert.alert('Share', 'Share feature coming soon!');
              }}
            >
              <MaterialIcons name="share" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderGridView = () => (
    <View style={styles.myPostsGrid}>
      {userPosts.slice(0, 6).map((post) => (
        <TouchableOpacity 
          key={post.id}
          style={[styles.myPostGridItem, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={() => onPostPress()}
          activeOpacity={0.7}
        >
          {post.image_path ? (
            <Image 
              source={{ uri: post.image_path }}
              style={styles.myPostGridImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.myPostGridPlaceholder, { backgroundColor: colors.primary + '20' }]}>
              <MaterialIcons name="article" size={32} color={colors.primary} />
            </View>
          )}
          
          <View style={styles.myPostGridOverlay}>
            <Text style={[styles.myPostGridTitle, { color: 'white' }]} numberOfLines={2}>
              {post.title}
            </Text>
            
            <View style={styles.myPostGridStats}>
              <View style={styles.myPostGridStat}>
                <MaterialIcons name="favorite" size={14} color="white" />
                <Text style={styles.myPostGridStatText}>{post.likes_count || 0}</Text>
              </View>
              <View style={styles.myPostGridStat}>
                <MaterialIcons name="comment" size={14} color="white" />
                <Text style={styles.myPostGridStatText}>{post.comments_count || 0}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (userPosts.length === 0) {
    return (
      <View style={[styles.myPostsCard, { backgroundColor: colors.surface }]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>My Posts</Text>
            <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
              0 posts
            </Text>
          </View>
        </View>
        
        <View style={styles.emptyMyPosts}>
          <MaterialIcons name="post-add" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyMyPostsTitle, { color: colors.text }]}>
            No posts yet
          </Text>
          <Text style={[styles.emptyMyPostsSubtitle, { color: colors.textSecondary }]}>
            Share your first post with the community
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.myPostsCard, { backgroundColor: colors.surface }]}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>My Posts</Text>
          <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
            {userPosts.length} posts
          </Text>
        </View>
        
        {/* View Mode Toggle */}
                          <View style={[styles.viewModeToggle, { backgroundColor: isDarkMode ? colors.border : '#f5f5f5' }]}>
          <TouchableOpacity 
            style={[
              styles.viewModeButton,
              myPostsViewMode === 'cards' && { backgroundColor: colors.primary + '20' }
            ]}
            onPress={() => {
              triggerHaptic();
              onViewModeChange('cards');
            }}
          >
            <MaterialIcons 
              name="view-agenda" 
              size={20} 
              color={myPostsViewMode === 'cards' ? colors.primary : colors.textSecondary} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.viewModeButton,
              myPostsViewMode === 'grid' && { backgroundColor: colors.primary + '20' }
            ]}
            onPress={() => {
              triggerHaptic();
              onViewModeChange('grid');
            }}
          >
            <MaterialIcons 
              name="grid-view" 
              size={20} 
              color={myPostsViewMode === 'grid' ? colors.primary : colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {myPostsViewMode === 'cards' ? renderCardView() : renderGridView()}
      
      {/* View All Button */}
      {userPosts.length > (myPostsViewMode === 'cards' ? 3 : 6) && (
        <TouchableOpacity 
          style={[styles.viewAllPostsButton, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]}
          onPress={() => {
            triggerHaptic();
            onPostPress();
          }}
        >
          <MaterialIcons name="grid-view" size={20} color={colors.primary} />
          <Text style={[styles.viewAllPostsText, { color: colors.primary }]}>
            View all {userPosts.length} posts
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = {
  myPostsCard: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  viewModeToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  viewModeButton: {
    padding: 8,
    borderRadius: 6,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myPostsList: {
    gap: 16,
  },
  myPostCard: {
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  myPostImageContainer: {
    position: 'relative',
    height: 150,
  },
  myPostImage: {
    width: '100%',
    height: '100%',
  },
  myPostImageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    padding: 6,
  },
  myPostCardContent: {
    padding: 16,
  },
  myPostCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 22,
  },
  myPostCardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  myPostCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  myPostCardDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  myPostCardStats: {
    flexDirection: 'row',
    gap: 16,
  },
  myPostCardStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  myPostCardStatText: {
    fontSize: 13,
    fontWeight: '600',
  },
  myPostCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  myPostActionButton: {
    padding: 8,
    borderRadius: 20,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myPostsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  myPostGridItem: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  myPostGridImage: {
    width: '100%',
    height: '100%',
  },
  myPostGridPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  myPostGridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
  },
  myPostGridTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 16,
  },
  myPostGridStats: {
    flexDirection: 'row',
    gap: 12,
  },
  myPostGridStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  myPostGridStatText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '500',
  },
  viewAllPostsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  viewAllPostsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyMyPosts: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyMyPostsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMyPostsSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
};

export default MyPosts; 