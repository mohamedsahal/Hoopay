import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  RefreshControl,
  ScrollView,
  Platform 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import Colors from '../../constants/Colors';
import UserCard from './UserCard';
import { UserCardSkeleton } from './SkeletonComponents';

const PeopleTab = ({
  loading,
  refreshing,
  onRefresh,
  userFilter,
  setUserFilter,
  triggerHaptic,
  peopleSearchQuery,
  filteredUsers,
  allUsers,
  users,
  followingUsers,
  onToggleFollow
}) => {
  // Use fallback colors and theme if context is not available
  let colors;
  try {
    const theme = useTheme();
    colors = theme.colors;
  } catch (error) {
    console.warn('ThemeContext not available in PeopleTab, using default colors');
    colors = Colors;
  }

  const renderUser = ({ item: user }) => (
    <UserCard 
      user={user}
      followingUsers={followingUsers}
      onToggleFollow={onToggleFollow}
    />
  );

  if (loading) {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {[...Array(8)].map((_, index) => (
          <UserCardSkeleton key={index} />
        ))}
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* People Header */}
      <View style={[styles.peopleHeader, { backgroundColor: colors.surface }]}>
        <Text style={[styles.peopleTitle, { color: colors.text }]}>Discover People</Text>
        <Text style={[styles.peopleSubtitle, { color: colors.textSecondary }]}>
          Connect with new people in the community
        </Text>
        
        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              { 
                backgroundColor: userFilter === 'all' ? colors.primary : colors.background,
                borderColor: colors.primary 
              }
            ]}
            onPress={() => {
              triggerHaptic();
              setUserFilter('all');
            }}
          >
            <Text style={[
              styles.filterButtonText, 
              { color: userFilter === 'all' ? 'white' : colors.primary }
            ]}>
              All
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              { 
                backgroundColor: userFilter === 'following' ? colors.primary : colors.background,
                borderColor: colors.primary 
              }
            ]}
            onPress={() => {
              triggerHaptic();
              setUserFilter('following');
            }}
          >
            <Text style={[
              styles.filterButtonText, 
              { color: userFilter === 'following' ? 'white' : colors.primary }
            ]}>
              Following
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              { 
                backgroundColor: userFilter === 'not_following' ? colors.primary : colors.background,
                borderColor: colors.primary 
              }
            ]}
            onPress={() => {
              triggerHaptic();
              setUserFilter('not_following');
            }}
          >
            <Text style={[
              styles.filterButtonText, 
              { color: userFilter === 'not_following' ? 'white' : colors.primary }
            ]}>
              Discover
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={peopleSearchQuery ? filteredUsers : (allUsers.length > 0 ? allUsers.filter(user => !user.is_self) : users.filter(user => !user.is_self))}
        renderItem={renderUser}
        keyExtractor={(item) => `user-${item.id}`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ 
          paddingBottom: Platform.OS === 'android' ? 120 : 100, 
          paddingHorizontal: 20 
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyPeopleContainer}>
            <MaterialIcons 
              name={peopleSearchQuery ? "search-off" : "people-outline"} 
              size={64} 
              color={colors.textSecondary} 
            />
            <Text style={[styles.emptyPeopleTitle, { color: colors.text }]}>
              {peopleSearchQuery ? `No results for "${peopleSearchQuery}"` : "No People Found"}
            </Text>
            <Text style={[styles.emptyPeopleText, { color: colors.textSecondary }]}>
              {peopleSearchQuery 
                ? "Try searching with different keywords or check the spelling." 
                : "No users found in the community. Try refreshing or check back later."
              }
            </Text>
            <TouchableOpacity 
              style={[styles.refreshButton, { backgroundColor: colors.primary }]}
              onPress={onRefresh}
            >
              <Text style={styles.refreshButtonText}>
                {peopleSearchQuery ? "Clear Search" : "Refresh"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        ListHeaderComponent={() => {
          if (peopleSearchQuery) {
            return filteredUsers.length > 0 ? (
              <View style={styles.peopleStats}>
                <Text style={[styles.peopleStatsText, { color: colors.textSecondary }]}>
                  🔍 Found {filteredUsers.length} people matching "{peopleSearchQuery}"
                </Text>
              </View>
            ) : null;
          }
          
          const availableUsers = allUsers.length > 0 ? allUsers.filter(user => !user.is_self) : users.filter(user => !user.is_self);
          const unfollowedUsers = availableUsers.filter(user => !user.is_following);
          
          return availableUsers.length > 0 ? (
            <View style={styles.peopleStats}>
              <Text style={[styles.peopleStatsText, { color: colors.textSecondary }]}>
                {availableUsers.length} people total • {unfollowedUsers.length} to discover
              </Text>
            </View>
          ) : null;
        }}
      />
    </View>
  );
};

const styles = {
  // People Screen Styles
  peopleHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e6ea',
  },
  peopleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  peopleSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  peopleStats: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  peopleStatsText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyPeopleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyPeopleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyPeopleText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  refreshButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
};

export default PeopleTab; 