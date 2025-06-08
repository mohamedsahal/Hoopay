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

const FollowingModal = ({ 
  visible, 
  onClose, 
  followingList, 
  loadingFollowing, 
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
    console.warn('ThemeContext not available in FollowingModal, using default colors');
    colors = Colors;
    isDarkMode = false;
  }

  const renderFollowingItem = ({ item: following }) => (
    <View style={[styles.followingItem, { borderBottomColor: colors.border }]}>
      <View style={styles.followingInfo}>
        <Image
          source={{ 
            uri: following.profile_photo_path || following.avatar || 
            'https://via.placeholder.com/50x50/cccccc/666666?text=User' 
          }}
          style={styles.followingAvatar}
        />
        <View style={styles.followingDetails}>
          <Text style={[styles.followingName, { color: colors.text }]}>
            {following.name}
          </Text>
          {following.bio && (
            <Text style={[styles.followingBio, { color: colors.textSecondary }]} numberOfLines={1}>
              {following.bio}
            </Text>
          )}
        </View>
      </View>
      
      <TouchableOpacity
        style={[
          styles.unfollowButton, 
          { 
            backgroundColor: isDarkMode ? colors.surface : colors.textSecondary,
            borderColor: colors.border 
          }
        ]}
        onPress={() => {
          triggerHaptic();
          onFollowToggle(following.id, false);
        }}
      >
        <Text style={[styles.unfollowButtonText, { color: isDarkMode ? colors.text : 'white' }]}>
          Following
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
          <Text style={[styles.modalTitle, { color: colors.text }]}>Following</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loadingFollowing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading following...
            </Text>
          </View>
        ) : followingList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="person-add-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Not following anyone yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Discover and follow interesting people
            </Text>
          </View>
        ) : (
          <FlatList
            data={followingList}
            renderItem={renderFollowingItem}
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
  followingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  followingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  followingAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  followingDetails: {
    flex: 1,
  },
  followingName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  followingBio: {
    fontSize: 14,
  },
  unfollowButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unfollowButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
};

export default FollowingModal; 