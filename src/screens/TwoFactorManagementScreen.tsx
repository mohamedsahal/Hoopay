import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  TextInput,
  Modal,
  Dimensions,
  Clipboard,
  Share,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import twoFactorService from '../services/twoFactorService';
import { useTheme } from '../contexts/ThemeContext';
import Colors from '../constants/Colors';
import { RootStackScreenProps } from '../types/navigation';

const { width, height } = Dimensions.get('window');

type TwoFactorManagementScreenProps = RootStackScreenProps<'TwoFactorManagement'>;

const TwoFactorManagementScreen: React.FC<TwoFactorManagementScreenProps> = ({ navigation }) => {
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [password, setPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const insets = useSafeAreaInsets();

  // Theme support
  let colors, isDarkMode;
  try {
    const theme = useTheme();
    colors = theme.colors;
    isDarkMode = theme.isDarkMode;
  } catch (error) {
    console.warn('ThemeContext not available, using default colors');
    colors = Colors;
    isDarkMode = false;
  }

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const response = await (twoFactorService as any).getStatus();
      if (response.success) {
        setStatus(response.data);
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load 2FA status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnable2FA = () => {
    navigation.navigate('TwoFactorSetup');
  };

  const handleDisable2FA = async () => {
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setActionLoading(true);
    try {
      const response = await (twoFactorService as any).disable(password);
      if (response.success) {
        Alert.alert('Success', response.message, [
          {
            text: 'OK',
            onPress: () => {
              setShowDisableModal(false);
              setPassword('');
              loadStatus();
            },
          },
        ]);
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to disable 2FA');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewRecoveryCodes = async () => {
    setActionLoading(true);
    try {
      const response = await (twoFactorService as any).getRecoveryCodes();
      if (response.success) {
        setRecoveryCodes(response.data.recovery_codes);
        setShowRecoveryCodes(true);
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to get recovery codes');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegenerateRecoveryCodes = async () => {
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setActionLoading(true);
    try {
      const response = await (twoFactorService as any).regenerateRecoveryCodes(password);
      if (response.success) {
        setRecoveryCodes(response.data.recovery_codes);
        setShowRegenModal(false);
        setPassword('');
        setShowRecoveryCodes(true);
        Alert.alert('Success', response.message);
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to regenerate recovery codes');
    } finally {
      setActionLoading(false);
    }
  };

  const copyRecoveryCodes = async () => {
    const codes = recoveryCodes.join('\n');
    try {
      await require('react-native').Clipboard.setString(codes);
      Alert.alert('Copied', 'Recovery codes copied to clipboard');
    } catch (error) {
      console.error('Error copying codes:', error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading 2FA status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 20),
            paddingBottom: Math.max(insets.bottom + 100, 120), // Extra padding for tab bar
            paddingLeft: Math.max(insets.left, 20),
            paddingRight: Math.max(insets.right, 20),
          }
        ]}
        style={{ backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <Animatable.View animation="fadeInDown" duration={1000} style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
              <Ionicons 
                name={status?.enabled ? "shield-checkmark" : "shield-outline"} 
                size={60} 
                color={colors.primary} 
              />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Two-Factor Authentication</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {status?.enabled 
                ? 'Your account is protected with 2FA' 
                : 'Add an extra layer of security to your account'
              }
            </Text>
          </Animatable.View>

          {/* Status Card */}
          <Animatable.View animation="fadeInUp" delay={300} duration={1000} style={[styles.statusCard, { backgroundColor: colors.surface }]}>
            <View style={styles.statusHeader}>
              <View style={styles.statusIndicator}>
                <Ionicons 
                  name={status?.enabled ? "checkmark-circle" : "alert-circle"} 
                  size={24} 
                  color={status?.enabled ? "#4CAF50" : "#FF9800"} 
                />
                <Text style={[styles.statusText, { color: colors.text }]}>
                  {status?.enabled ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>

            {status?.enabled ? (
              <View style={styles.enabledContent}>
                <Text style={[styles.enabledDescription, { color: colors.textSecondary }]}>
                  Two-factor authentication is protecting your account. You'll need to enter a code from your authenticator app when signing in.
                </Text>

                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={[styles.viewCodesButton, { backgroundColor: colors.secondary || colors.primary }]} 
                    onPress={handleViewRecoveryCodes}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color={colors.background} />
                    ) : (
                      <>
                        <Ionicons name="key-outline" size={20} color={colors.background} />
                        <Text style={[styles.buttonText, { color: colors.background }]}>View Recovery Codes</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.regenButton, { backgroundColor: colors.warning || '#FF9800' }]} 
                    onPress={() => setShowRegenModal(true)}
                  >
                    <Ionicons name="refresh-outline" size={20} color={colors.background} />
                    <Text style={[styles.buttonText, { color: colors.background }]}>New Recovery Codes</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.disableButton, { backgroundColor: colors.error || '#FF6B6B' }]} 
                    onPress={() => setShowDisableModal(true)}
                  >
                    <Ionicons name="shield-outline" size={20} color={colors.background} />
                    <Text style={[styles.buttonText, { color: colors.background }]}>Disable 2FA</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.disabledContent}>
                <Text style={[styles.disabledDescription, { color: colors.textSecondary }]}>
                  Two-factor authentication is not enabled. Enable it now to add an extra layer of security to your account.
                </Text>

                <TouchableOpacity style={[styles.enableButton, { backgroundColor: colors.primary }]} onPress={handleEnable2FA}>
                  <Ionicons name="shield-checkmark" size={20} color={colors.background} />
                  <Text style={[styles.buttonText, { color: colors.background }]}>Enable 2FA</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animatable.View>

          {/* Security Tips */}
          <Animatable.View animation="fadeInUp" delay={600} duration={1000} style={[styles.tipsCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.tipsTitle, { color: colors.text }]}>Security Tips</Text>
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <Ionicons name="phone-portrait-outline" size={20} color={colors.primary} />
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>Use Google Authenticator, Microsoft Authenticator, or Authy</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="save-outline" size={20} color={colors.primary} />
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>Save your recovery codes in a secure location</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="shield-outline" size={20} color={colors.primary} />
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>Don't share your codes with anyone</Text>
              </View>
            </View>
          </Animatable.View>
        </View>
      </ScrollView>

      {/* Recovery Codes Modal */}
      <Modal
        visible={showRecoveryCodes}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRecoveryCodes(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Recovery Codes</Text>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setShowRecoveryCodes(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
              Save these codes in a secure location. Each code can only be used once.
            </Text>

            <ScrollView style={styles.codesContainer}>
              <View style={styles.codesGrid}>
                {recoveryCodes.map((code, index) => (
                  <View key={index} style={[styles.codeItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.codeText, { color: colors.text }]}>{code}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity style={[styles.copyCodesButton, { backgroundColor: colors.primary }]} onPress={copyRecoveryCodes}>
              <Ionicons name="copy-outline" size={20} color={colors.background} />
              <Text style={[styles.copyCodesText, { color: colors.background }]}>Copy All Codes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Disable 2FA Modal */}
      <Modal
        visible={showDisableModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDisableModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Disable Two-Factor Authentication</Text>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setShowDisableModal(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
              This will make your account less secure. Please enter your password to confirm.
            </Text>

            <TextInput
              style={[styles.passwordInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.cancelButton, { backgroundColor: colors.textSecondary }]} 
                onPress={() => {
                  setShowDisableModal(false);
                  setPassword('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.confirmButton, { backgroundColor: colors.error || '#FF6B6B' }, actionLoading && styles.buttonDisabled]} 
                onPress={handleDisable2FA}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>Disable 2FA</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Regenerate Recovery Codes Modal */}
      <Modal
        visible={showRegenModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRegenModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Generate New Recovery Codes</Text>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setShowRegenModal(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
              This will invalidate your current recovery codes. Please enter your password to confirm.
            </Text>

            <TextInput
              style={[styles.passwordInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.cancelButton, { backgroundColor: colors.textSecondary }]} 
                onPress={() => {
                  setShowRegenModal(false);
                  setPassword('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.confirmButton, { backgroundColor: colors.error || '#FF6B6B' }, actionLoading && styles.buttonDisabled]} 
                onPress={handleRegenerateRecoveryCodes}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>Generate New Codes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flexGrow: 1,
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  statusHeader: {
    marginBottom: 15,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  enabledContent: {},
  enabledDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    lineHeight: 20,
    marginBottom: 20,
  },
  disabledContent: {},
  disabledDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    lineHeight: 20,
    marginBottom: 20,
  },
  actionButtons: {
    gap: 10,
  },
  enableButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewCodesButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  regenButton: {
    backgroundColor: '#FF9800',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disableButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  tipsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  tipsList: {},
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginLeft: 10,
    flex: 1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  modalDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  codesContainer: {
    maxHeight: 300,
    marginBottom: 20,
  },
  codesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  codeItem: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  codeText: {
    color: Colors.text,
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 'bold',
  },
  copyCodesButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyCodesText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  passwordInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cancelButton: {
    backgroundColor: Colors.textSecondary,
    borderRadius: 12,
    padding: 15,
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    padding: 15,
    flex: 1,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default TwoFactorManagementScreen; 