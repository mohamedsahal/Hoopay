import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Modal, 
  SafeAreaView, 
  ActivityIndicator 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import Colors from '../../constants/Colors';
import UserAvatar from './UserAvatar';
import { DotsLoading } from '../Loading';

// Main Search Modal Component
export const SearchModal = ({
  visible,
  onClose,
  searchQuery,
  setSearchQuery,
  searchType,
  setSearchType,
  onSearch,
  posts,
  users,
  followingUsers,
  onToggleFollow,
  onNavigate
}) => {
  // Use fallback colors and theme if context is not available
  let colors;
  try {
    const theme = useTheme();
    colors = theme.colors;
  } catch (error) {
    console.warn('ThemeContext not available in SearchModal, using default colors');
    colors = Colors;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { backgroundColor: colors.surface }]}>
          <TouchableOpacity onPress={() => {
            onClose();
            setSearchQuery('');
          }}>
            <Text style={[styles.modalCancelButton, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Search</Text>
          <TouchableOpacity onPress={() => {
            if (searchQuery.trim()) {
              onSearch();
              onClose();
            }
          }}>
            <Text style={[styles.modalPostButton, { color: colors.primary }]}>Search</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          {/* Search Input */}
          <View style={[styles.searchInputContainer, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="search" size={20} color={colors.textSecondary} style={styles.searchInputIcon} />
            <TextInput
              style={[styles.searchModalInput, { color: colors.text }]}
              placeholder="Discover posts and people..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => {
                if (searchQuery.trim()) {
                  onSearch();
                  onClose();
                }
              }}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <MaterialIcons name="clear" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Type Filter */}
          <View style={styles.searchFilterContainer}>
            <TouchableOpacity 
              style={[
                styles.filterButton, 
                { backgroundColor: searchType === 'all' ? colors.primary : colors.surface }
              ]}
              onPress={() => setSearchType('all')}
            >
              <Text style={[
                styles.filterButtonText, 
                { color: searchType === 'all' ? 'white' : colors.text }
              ]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.filterButton, 
                { backgroundColor: searchType === 'posts' ? colors.primary : colors.surface }
              ]}
              onPress={() => setSearchType('posts')}
            >
              <Text style={[
                styles.filterButtonText, 
                { color: searchType === 'posts' ? 'white' : colors.text }
              ]}>
                Posts
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.filterButton, 
                { backgroundColor: searchType === 'people' ? colors.primary : colors.surface }
              ]}
              onPress={() => setSearchType('people')}
            >
              <Text style={[
                styles.filterButtonText, 
                { color: searchType === 'people' ? 'white' : colors.text }
              ]}>
                People
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Search Results */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {searchQuery ? (
            <SearchResults 
              searchQuery={searchQuery}
              searchType={searchType}
              posts={posts}
              users={users}
              followingUsers={followingUsers}
              onToggleFollow={onToggleFollow}
              onNavigate={onNavigate}
              onCloseModal={onClose}
              colors={colors}
            />
          ) : (
            <SearchPlaceholder colors={colors} />
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// People Search Modal Component
export const PeopleSearchModal = ({
  visible,
  onClose,
  peopleSearchQuery,
  setPeopleSearchQuery,
  onSearch,
  filteredUsers,
  followingUsers,
  onToggleFollow
}) => {
  // Use fallback colors and theme if context is not available
  let colors;
  try {
    const theme = useTheme();
    colors = theme.colors;
  } catch (error) {
    console.warn('ThemeContext not available in PeopleSearchModal, using default colors');
    colors = Colors;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { backgroundColor: colors.surface }]}>
          <TouchableOpacity onPress={() => {
            onClose();
            setPeopleSearchQuery('');
          }}>
            <Text style={[styles.modalCancelButton, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Search People</Text>
          <TouchableOpacity onPress={() => {
            if (peopleSearchQuery.trim()) {
              onClose();
            }
          }}>
            <Text style={[styles.modalPostButton, { color: colors.primary }]}>Done</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          {/* Search Input */}
          <View style={[styles.searchInputContainer, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="search" size={20} color={colors.textSecondary} style={styles.searchInputIcon} />
            <TextInput
              style={[styles.searchModalInput, { color: colors.text }]}
              placeholder="Search people by name or email..."
              placeholderTextColor={colors.textSecondary}
              value={peopleSearchQuery}
              onChangeText={onSearch}
              autoFocus
            />
            {peopleSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => onSearch('')} style={styles.clearButton}>
                <MaterialIcons name="clear" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Search Results */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {peopleSearchQuery ? (
            <PeopleSearchResults 
              peopleSearchQuery={peopleSearchQuery}
              filteredUsers={filteredUsers}
              followingUsers={followingUsers}
              onToggleFollow={onToggleFollow}
              colors={colors}
            />
          ) : (
            <PeopleSearchPlaceholder colors={colors} />
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// Search Results Component
const SearchResults = ({ 
  searchQuery, 
  searchType, 
  posts, 
  users, 
  followingUsers, 
  onToggleFollow, 
  onNavigate, 
  onCloseModal,
  colors 
}) => {
  // Defensive check for followingUsers
  const safeFollowingUsers = followingUsers || new Set();
  return (
    <>
      {users.length > 0 && (searchType === 'all' || searchType === 'people') && (
        <View style={{ marginBottom: 20 }}>
          <Text style={[styles.searchSectionTitle, { color: colors.text }]}>People</Text>
          {users.map((user) => (
            <View key={`search-user-${user.id}`} style={[styles.userCard, { backgroundColor: colors.surface }]}>
              <UserAvatar 
                user={user}
                size={40}
                style={styles.avatar}
              />
              <View style={styles.userCardInfo}>
                <Text style={[styles.userCardName, { color: colors.text }]}>{user.name}</Text>
                <Text style={[styles.userCardEmail, { color: colors.textSecondary }]}>{user.email}</Text>
              </View>
              {!user.is_self && (
                <TouchableOpacity 
                  style={[
                    styles.userCardFollowButton, 
                    { borderColor: colors.primary },
                    user.is_following && { backgroundColor: colors.primary },
                    safeFollowingUsers.has(user.id) && { opacity: 0.7 }
                  ]}
                  onPress={() => onToggleFollow(user.id)}
                  disabled={safeFollowingUsers.has(user.id)}
                >
                  {safeFollowingUsers.has(user.id) ? (
                    <DotsLoading 
                      size={4} 
                      color={user.is_following ? 'white' : colors.primary}
                      spacing={2}
                    />
                  ) : (
                    <Text style={[
                      styles.followButtonText, 
                      { color: user.is_following ? 'white' : colors.primary }
                    ]}>
                      {user.is_following ? 'Following' : 'Follow'}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {posts.length > 0 && (searchType === 'all' || searchType === 'posts') && (
        <View>
          <Text style={[styles.searchSectionTitle, { color: colors.text }]}>Posts</Text>
          {posts.map((post) => (
            <View key={`search-post-${post.id}`} style={[styles.postCard, { backgroundColor: colors.surface }]}>
              <View style={styles.postHeader}>
                <View style={styles.userInfo}>
                  <UserAvatar 
                    user={post.user}
                    size={40}
                    style={styles.avatar}
                  />
                  <View>
                    <Text style={[styles.userName, { color: colors.text }]}>{post.user.name}</Text>
                    <Text style={[styles.postTime, { color: colors.textSecondary }]}>{post.created_at}</Text>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity onPress={() => {
                onCloseModal();
                onNavigate('PostDetail', { postId: post.id });
              }}>
                <Text style={[styles.postTitle, { color: colors.text }]} numberOfLines={2}>
                  {post.title}
                </Text>
                <Text style={[styles.postContent, { color: colors.textSecondary }]} numberOfLines={3}>
                  {post.content}
                </Text>
              </TouchableOpacity>
              
              <View style={[styles.postActions, { borderTopColor: colors.border }]}>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={[styles.actionText, post.is_liked && { color: colors.primary }]}>
                    {post.is_liked ? '❤️' : '🤍'} {post.likes_count}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={[styles.actionText, { color: colors.textSecondary }]}>
                    💬 {post.comments_count}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {searchQuery && users.length === 0 && posts.length === 0 && (
        <View style={styles.noResults}>
          <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
            No results found for "{searchQuery}"
          </Text>
        </View>
      )}
    </>
  );
};

// People Search Results Component
const PeopleSearchResults = ({ 
  peopleSearchQuery, 
  filteredUsers, 
  followingUsers, 
  onToggleFollow, 
  colors 
}) => {
  // Defensive check for followingUsers
  const safeFollowingUsers = followingUsers || new Set();
  return (
    <>
      {filteredUsers.length > 0 ? (
        <View>
          <Text style={[styles.searchSectionTitle, { color: colors.text }]}>
            Found {filteredUsers.length} people
          </Text>
          {filteredUsers.map((user) => (
            <View key={`search-user-${user.id}`} style={[styles.userCard, { backgroundColor: colors.surface }]}>
              <UserAvatar 
                user={user}
                size={40}
                style={styles.avatar}
              />
              <View style={styles.userCardInfo}>
                <Text style={[styles.userCardName, { color: colors.text }]}>{user.name}</Text>
                <Text style={[styles.userCardEmail, { color: colors.textSecondary }]}>{user.email}</Text>
              </View>
              {!user.is_self && (
                <TouchableOpacity 
                  style={[
                    styles.userCardFollowButton, 
                    { borderColor: colors.primary },
                    user.is_following && { backgroundColor: colors.primary },
                    safeFollowingUsers.has(user.id) && { opacity: 0.7 }
                  ]}
                  onPress={() => onToggleFollow(user.id)}
                  disabled={safeFollowingUsers.has(user.id)}
                >
                  {safeFollowingUsers.has(user.id) ? (
                    <DotsLoading 
                      size={4} 
                      color={user.is_following ? 'white' : colors.primary}
                      spacing={2}
                    />
                  ) : (
                    <Text style={[
                      styles.followButtonText, 
                      { color: user.is_following ? 'white' : colors.primary }
                    ]}>
                      {user.is_following ? 'Following' : 'Follow'}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.noResults}>
          <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
            No people found for "{peopleSearchQuery}"
          </Text>
        </View>
      )}
    </>
  );
};

// Search Placeholder Component
const SearchPlaceholder = ({ colors }) => (
  <View style={styles.searchPlaceholder}>
    <MaterialIcons name="search" size={48} color={colors.textSecondary} style={{ marginBottom: 16 }} />
    <Text style={[styles.searchPlaceholderText, { color: colors.textSecondary }]}>
      Discover posts and people
    </Text>
    <Text style={[styles.searchPlaceholderSubtext, { color: colors.textSecondary }]}>
      Find any post or person in the community
    </Text>
  </View>
);

// People Search Placeholder Component
const PeopleSearchPlaceholder = ({ colors }) => (
  <View style={styles.searchPlaceholder}>
    <MaterialIcons name="people-outline" size={48} color={colors.textSecondary} style={{ marginBottom: 16 }} />
    <Text style={[styles.searchPlaceholderText, { color: colors.textSecondary }]}>
      Search for people
    </Text>
    <Text style={[styles.searchPlaceholderSubtext, { color: colors.textSecondary }]}>
      Find people by name or email
    </Text>
  </View>
);

const styles = {
  // Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e4e6ea',
  },
  modalCancelButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalPostButton: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Search Modal Styles
  searchContainer: {
    padding: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInputIcon: {
    marginRight: 8,
  },
  searchModalInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  searchFilterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  searchPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  searchPlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  searchPlaceholderSubtext: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  noResults: {
    padding: 40,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    textAlign: 'center',
  },

  // User/Post Card Styles
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
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
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  postCard: {
    backgroundColor: 'white',
    marginVertical: 6,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderRadius: 12,
    marginBottom: 12,
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
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 0.5,
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
  },
};

// Combined SearchModals Component
export const SearchModals = (props) => {
  return (
    <>
      <SearchModal
        visible={props.showSearchModal}
        onClose={() => props.setShowSearchModal(false)}
        searchQuery={props.searchQuery}
        setSearchQuery={props.setSearchQuery}
        searchType={props.searchType}
        setSearchType={props.setSearchType}
        onSearch={props.handleSearch}
        posts={props.posts}
        users={props.users}
        followingUsers={props.followingUsers}
        onToggleFollow={props.toggleFollow}
        onNavigate={(screen, params) => props.navigation.navigate(screen, params)}
      />
      
      <PeopleSearchModal
        visible={props.showPeopleSearchModal}
        onClose={() => props.setShowPeopleSearchModal(false)}
        peopleSearchQuery={props.peopleSearchQuery}
        setPeopleSearchQuery={props.setPeopleSearchQuery}
        onSearch={props.searchPeople}
        filteredUsers={props.filteredUsers}
        followingUsers={props.followingUsers}
        onToggleFollow={props.toggleFollow}
      />
    </>
  );
};

// Export the default for backward compatibility
export default SearchModals; 