import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import Colors from '../../constants/Colors';
import UserAvatar from './UserAvatar';
import { formatNumber } from '../../utils/numberUtils';
import { DotsLoading } from '../Loading';
import VerificationBadge from '../VerificationBadge';
import kycService from '../../services/kycService';

const UserCard = ({ user, followingUsers, onToggleFollow }) => {
  // Use fallback colors and theme if context is not available
  let colors;
  try {
    const theme = useTheme();
    colors = theme.colors;
  } catch (error) {
    console.warn('ThemeContext not available in UserCard, using default colors');
    colors = Colors;
  }

  // Defensive check for followingUsers
  const safeFollowingUsers = followingUsers || new Set();

  return (
    <View style={[styles.userCard, { backgroundColor: colors.surface }]}>
      <View style={styles.userInfo}>
        <UserAvatar 
          user={user} 
          size={50}
          style={styles.avatar}
        />
        <View style={styles.userDetails}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
            <VerificationBadge
              level={kycService.getUserVerificationLevel(user)}
              status={kycService.getUserVerificationStatus(user)}
              size={16}
              showText={false}
              style={{ marginLeft: 4 }}
            />
          </View>
          <View style={styles.userStats}>
            <MaterialIcons name="people" size={14} color={colors.textSecondary} />
            <Text style={[styles.followersCount, { color: colors.textSecondary }]}>
              {formatNumber(user.followers_count)} followers
            </Text>
          </View>
        </View>
      </View>
          
      {!user.is_self && (
        <TouchableOpacity 
          style={[
            styles.followButton, 
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
  );
};

const styles = {
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
  userDetails: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followersCount: {
    fontSize: 13,
    marginLeft: 4,
    fontWeight: '500',
  },
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
};

export default UserCard; 