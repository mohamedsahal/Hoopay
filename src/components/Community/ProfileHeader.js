import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import Colors from '../../constants/Colors';
import { formatNumber } from '../../utils/numberUtils';
import UserAvatar from './UserAvatar';
import VerificationBadge from '../VerificationBadge';
import kycService from '../../services/kycService';

const ProfileHeader = ({ 
  currentUser, 
  profileStats, 
  loadingProfileStats, 
  onStatsPress,
  kycStatus = null
}) => {
  // Use custom theme context with fallback
  let colors, isDarkMode;
  try {
    const theme = useTheme();
    colors = theme.colors;
    isDarkMode = theme.isDarkMode;
  } catch (error) {
    console.warn('ThemeContext not available in ProfileHeader, using default colors');
    colors = Colors;
    isDarkMode = false;
  }

  return (
    <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
      {/* Profile Info Section */}
      <View style={styles.profileInfo}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatarWrapper, { borderColor: 'white' }]}>
            <UserAvatar 
              user={currentUser}
              size={120}
              style={styles.avatar}
            />
          </View>
        </View>

        <View style={styles.userInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {currentUser.name || 'User Name'}
            </Text>
            <VerificationBadge
              level={kycService.getUserVerificationLevel(currentUser, kycStatus)}
              status={kycService.getUserVerificationStatus(currentUser, kycStatus)}
              size={20}
              showText={false}
              style={{ marginLeft: 6 }}
            />
          </View>
          
          <View style={styles.userMeta}>
            <MaterialIcons name="calendar-today" size={16} color={colors.textSecondary} />
            <Text style={[styles.joinDate, { color: colors.textSecondary }]}>
              Joined {currentUser.created_at ? new Date(currentUser.created_at).getFullYear() : 'Recently'}
            </Text>
          </View>
        </View>
      </View>

      {/* Stats Section */}
      <View style={[styles.statsCard, { backgroundColor: colors.background }]}>
        {loadingProfileStats ? (
          <View style={styles.statsLoading}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.statsLoadingText, { color: colors.textSecondary }]}>
              Loading stats...
            </Text>
          </View>
        ) : (
          <View style={styles.statsContainer}>
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => onStatsPress('followers')}
            >
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {formatNumber(profileStats.followers_count)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Followers</Text>
            </TouchableOpacity>

            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => onStatsPress('following')}
            >
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {formatNumber(profileStats.following_count)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Following</Text>
            </TouchableOpacity>

            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {formatNumber(profileStats.total_likes)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Likes</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = {
  profileCard: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },

  profileInfo: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarWrapper: {
    borderWidth: 4,
    borderRadius: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },

  userInfo: {
    marginTop: 8,
    alignItems: 'center',
  },
  userName: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  userBio: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
  joinDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  statsLoadingText: {
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 8,
  },

};

export default ProfileHeader; 