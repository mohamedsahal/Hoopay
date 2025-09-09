import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Linking,
  Platform,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { getStoreUrl } from '../config/versionConfig';

interface ForceUpdateModalProps {
  visible: boolean;
  currentVersion: string;
  latestVersion: string;
  onUpdate: () => void;
  isForceUpdate: boolean;
}

const { width, height } = Dimensions.get('window');

const ForceUpdateModal: React.FC<ForceUpdateModalProps> = ({
  visible,
  currentVersion,
  latestVersion,
  onUpdate,
  isForceUpdate,
}) => {
  const { colors, isDarkMode } = useTheme();

  const handleUpdate = () => {
    const storeUrl = getStoreUrl();

    Linking.openURL(storeUrl).catch(() => {
      Alert.alert(
        'Unable to Open Store',
        'Please manually open the app store and search for "Hoopay Wallet" to update.',
        [{ text: 'OK' }]
      );
    });
  };

  const getUpdateMessage = () => {
    if (isForceUpdate) {
      return 'A critical update is required to continue using Hoopay Wallet. Please update to the latest version.';
    }
    return 'A new version of Hoopay Wallet is available. Update now for the best experience.';
  };

  const getButtonText = () => {
    return isForceUpdate ? 'Update Now' : 'Update';
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
          <LinearGradient
            colors={[colors.primary, colors.primary + '80']}
            style={styles.headerGradient}
          >
            <View style={styles.iconContainer}>
              <MaterialIcons 
                name={isForceUpdate ? "warning" : "system-update"} 
                size={40} 
                color="white" 
              />
            </View>
          </LinearGradient>

          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]}>
              {isForceUpdate ? 'Update Required' : 'Update Available'}
            </Text>
            
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {getUpdateMessage()}
            </Text>

            <View style={[styles.versionContainer, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.versionRow}>
                <Text style={[styles.versionLabel, { color: colors.textSecondary }]}>
                  Current Version:
                </Text>
                <Text style={[styles.versionValue, { color: colors.text }]}>
                  {currentVersion}
                </Text>
              </View>
              <View style={styles.versionRow}>
                <Text style={[styles.versionLabel, { color: colors.textSecondary }]}>
                  Latest Version:
                </Text>
                <Text style={[styles.versionValue, { color: colors.success }]}>
                  {latestVersion}
                </Text>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              {!isForceUpdate && (
                <TouchableOpacity
                  style={[styles.skipButton, { borderColor: colors.border }]}
                  onPress={() => {/* Handle skip - you might want to store this preference */}}
                >
                  <Text style={[styles.skipButtonText, { color: colors.textSecondary }]}>
                    Skip
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.updateButton, { backgroundColor: colors.primary }]}
                onPress={handleUpdate}
              >
                <MaterialIcons name="download" size={20} color="white" />
                <Text style={styles.updateButtonText}>
                  {getButtonText()}
                </Text>
              </TouchableOpacity>
            </View>

            {isForceUpdate && (
              <Text style={[styles.forceUpdateNote, { color: colors.error }]}>
                This update is mandatory. The app cannot be used until updated.
              </Text>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerGradient: {
    padding: 30,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  versionContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  versionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  versionValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  updateButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forceUpdateNote: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});

export default ForceUpdateModal;
