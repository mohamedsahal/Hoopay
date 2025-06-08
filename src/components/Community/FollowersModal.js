import React from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  ActivityIndicator 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import Colors from '../../constants/Colors';

const FollowersModal = ({ 
  visible, 
  onClose, 
  followersList, 
  loadingFollowers, 
  onFollowToggle,
  triggerHaptic 
}) => {
  // Use custom theme context with fallback
  let colors, isDarkMode;
  try {
    const theme = useTheme();
    colors = theme.colors;
    isDarkMode = theme.isDarkMode;
  } catch (error) {
    console.warn('ThemeContext not available in FollowersModal, using default colors');
    colors = Colors;
    isDarkMode = false;
  }

  const renderFollowerItem = ({ item: follower }) => (
    <View style={[styles.followerItem, { borderBottomColor: colors.border }]}>
      <View style={styles.followerInfo}>
        <Image
          source={{ 
            uri: follower.profile_photo_path || follower.avatar || 
            'https://via.placeholder.com/50x50/cccccc/666666?text=User' 
          }}
          style={styles.followerAvatar}
        />
        <View style={styles.followerDetails}>
          <Text style={[styles.followerName, { color: colors.text }]}>
            {follower.name}
          </Text>
          {follower.bio && (
            <Text style={[styles.followerBio, { color: colors.textSecondary }]} numberOfLines={1}>
              {follower.bio}
            </Text>
          )}
        </View>
      </View>
      
      <TouchableOpacity
        style={[
          styles.followButton,
          follower.is_following ? 
            { 
              backgroundColor: isDarkMode ? colors.surface : colors.textSecondary,
              borderColor: colors.border,
              borderWidth: 1
            } : 
            { 
              backgroundColor: colors.primary,
              borderColor: colors.primary,
              borderWidth: 1
            }
        ]}
        onPress={() => {
          triggerHaptic();
          onFollowToggle(follower.id, !follower.is_following);
        }}
      >
        <Text style={[
          styles.followButtonText,
          { 
            color: follower.is_following ? 
              (isDarkMode ? colors.text : 'white') : 
              'white' 
          }
        ]}>
          {follower.is_following ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Followers</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loadingFollowers ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading followers...
            </Text>
          </View>
        ) : followersList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="people-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No followers yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Share interesting content to attract followers
            </Text>
          </View>
        ) : (
          <FlatList
            data={followersList}
            renderItem={renderFollowerItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = {
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContainer: {
    padding: 16,
  },
  followerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  followerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  followerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  followerDetails: {
    flex: 1,
  },
  followerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  followerBio: {
    fontSize: 14,
  },
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
};

export default FollowersModal; 