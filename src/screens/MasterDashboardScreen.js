import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  Dimensions,
  TextInput,
  Modal,
  Share
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import referralService from '../services/referralService';
import DotsLoading from '../components/DotsLoading';

const { width, height } = Dimensions.get('window');

const MasterDashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [masterData, setMasterData] = useState(null);
  const [recentCommissions, setRecentCommissions] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [withdrawalModalVisible, setWithdrawalModalVisible] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Green theme colors
  const greenTheme = {
    primary: '#10B981',
    primaryDark: '#059669',
    primaryLight: '#34D399',
    accent: '#6EE7B7',
    success: '#22C55E',
    background: isDarkMode ? '#0F1419' : '#F0FDF4',
    cardBackground: isDarkMode ? '#1A2B23' : '#FFFFFF',
    textPrimary: isDarkMode ? '#FFFFFF' : '#064E3B',
    textSecondary: isDarkMode ? '#A7F3D0' : '#047857',
    border: isDarkMode ? '#2D5A3D' : '#BBF7D0',
    chartColors: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5']
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    try {
      setIsLoading(true);
      
      console.log('Loading master user data...');
      const infoResult = await referralService.getReferralInfo();
      if (infoResult.success && infoResult.data.master_user_data) {
        const masterUserData = infoResult.data.master_user_data;
        
        if (!masterUserData.is_master_user) {
          Alert.alert(
            'Access Denied',
            'You do not have access to the Master Dashboard.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
          return;
        }
        
        setMasterData(masterUserData.master_info);
        setRecentCommissions(masterUserData.master_info.recent_commissions || []);
        console.log('Master data loaded successfully');
      } else {
        Alert.alert(
          'Access Denied',
          'You do not have access to the Master Dashboard.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Error loading master data:', error);
      Alert.alert('Error', 'Failed to load master data. Please try again.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadMasterData();
    setIsRefreshing(false);
  }, []);

  const handleWithdrawal = () => {
    if (!masterData?.statistics) return;
    
    const availableAmount = masterData.statistics.approved_amount;
    
    // Check minimum withdrawal amount ($50)
    if (availableAmount < 50.00) {
      Alert.alert(
        'Minimum Amount Required',
        `Master users need at least $50.00 to withdraw. You currently have $${availableAmount.toFixed(2)} available.\n\nKeep earning commissions to reach the minimum withdrawal amount!`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (availableAmount <= 0) {
      Alert.alert(
        'No Funds Available',
        'You have no approved commissions available for withdrawal.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Master users must withdraw all available funds
    setWithdrawalAmount(availableAmount.toString());
    setWithdrawalModalVisible(true);
  };

  const processWithdrawal = async () => {
    if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid withdrawal amount.');
      return;
    }

    const amount = parseFloat(withdrawalAmount);
    const availableAmount = masterData?.statistics?.approved_amount || 0;

    // Validate minimum amount
    if (availableAmount < 50.00) {
      Alert.alert('Minimum Amount Required', `Master users need at least $50.00 to withdraw. Available: $${availableAmount.toFixed(2)}`);
      return;
    }

    // Must withdraw all available funds
    if (amount !== availableAmount) {
      Alert.alert('Full Withdrawal Required', `Master users must withdraw all approved commission funds at once.\n\nAvailable: $${availableAmount.toFixed(2)}`);
      return;
    }

    // Calculate fee (2%)
    const feeAmount = amount * 0.02;
    const netAmount = amount - feeAmount;

    // Show confirmation with fee breakdown
    Alert.alert(
      'Confirm Withdrawal',
      `Withdrawal Details:\n\nGross Amount: $${amount.toFixed(2)}\nProcessing Fee (2%): $${feeAmount.toFixed(2)}\nNet Amount: $${netAmount.toFixed(2)}\n\nThe net amount will be added to your wallet.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm Withdrawal',
          onPress: async () => {
            try {
              setIsWithdrawing(true);
              
              const result = await referralService.requestWithdrawal(amount, 'master_wallet');
              
              if (result.success) {
                Alert.alert(
                  'Withdrawal Successful! 🎉',
                  `Your withdrawal has been processed successfully.\n\nGross: $${amount.toFixed(2)}\nFee: $${feeAmount.toFixed(2)}\nNet: $${netAmount.toFixed(2)}\n\nThe net amount has been added to your wallet.`,
                  [{ 
                    text: 'OK', 
                    onPress: () => {
                      setWithdrawalModalVisible(false);
                      setWithdrawalAmount('');
                      loadMasterData(); // Refresh data
                    }
                  }]
                );
              } else {
                Alert.alert('Withdrawal Failed', result.message || 'Failed to process withdrawal');
              }
            } catch (error) {
              console.error('Withdrawal error:', error);
              Alert.alert('Error', 'Failed to process withdrawal. Please try again.');
            } finally {
              setIsWithdrawing(false);
            }
          }
        }
      ]
    );
  };

  const shareStats = async () => {
    if (!masterData) return;
    
    const stats = masterData.statistics;
    const shareText = `🏆 Master User Performance 🏆\n\n💰 Total Earned: $${stats.total_earned.toFixed(2)}\n✅ Approved: $${stats.approved_amount.toFixed(2)}\n💵 Paid Out: $${stats.paid_amount.toFixed(2)}\n📊 Commission Rate: ${(masterData.commission_rate * 100).toFixed(1)}%\n\n#MasterUser #HoopaySuccess`;
    
    try {
      await Share.share({
        message: shareText,
        title: 'My Master User Stats'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const renderMasterHeader = () => (
    <Animatable.View animation="fadeInDown" duration={800} style={styles.headerCard}>
      <LinearGradient
        colors={[greenTheme.primary, greenTheme.primaryDark]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <MaterialIcons name="diamond" size={32} color="#FFF" />
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>Master Dashboard</Text>
                <Text style={styles.headerSubtitle}>
                  Rate: {masterData ? (masterData.commission_rate * 100).toFixed(1) : '0'}%
                </Text>
              </View>
            </View>
            
            <TouchableOpacity onPress={shareStats} style={styles.shareButton}>
              <Ionicons name="share-outline" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.statusRow}>
            <View style={styles.statusBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#FFF" />
              <Text style={styles.statusText}>Active Master</Text>
            </View>
            <Text style={styles.activeSince}>
              Since: {masterData?.activated_at ? new Date(masterData.activated_at).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Animatable.View>
  );

  const renderStatsGrid = () => {
    if (!masterData?.statistics) return null;
    
    const stats = masterData.statistics;
    const statItems = [
      {
        title: 'Total Earned',
        value: `$${stats.total_earned?.toFixed(2) || '0.00'}`,
      },
      {
        title: 'Approved',
        value: `$${stats.approved_amount?.toFixed(2) || '0.00'}`,
      },
      {
        title: 'Pending',
        value: `$${stats.pending_amount?.toFixed(2) || '0.00'}`,
      },
      {
        title: 'Paid Out',
        value: `$${stats.paid_amount?.toFixed(2) || '0.00'}`,
      },
      {
        title: 'Commissions',
        value: stats.total_commissions_count?.toString() || '0',
      },
      {
        title: 'Available',
        value: `$${(stats.approved_amount - stats.paid_amount)?.toFixed(2) || '0.00'}`,
      }
    ];

    return (
      <Animatable.View animation="fadeInUp" delay={200} duration={800} style={styles.statsCard}>
        <LinearGradient
          colors={[greenTheme.primary, greenTheme.primaryDark]}
          style={styles.statsGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.statsHeader}>
            <Text style={styles.statsTitle}>Performance Overview</Text>
            <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
              <Ionicons name="refresh-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.statsGrid}>
            {statItems.map((item, index) => (
              <Animatable.View
                key={item.title}
                animation="fadeInUp"
                delay={300 + (index * 100)}
                style={styles.statItem}
              >
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.title}</Text>
              </Animatable.View>
            ))}
          </View>
        </LinearGradient>
      </Animatable.View>
    );
  };

  const renderQuickActions = () => (
    <Animatable.View animation="fadeInUp" delay={400} duration={800} style={[styles.actionsContainer, { backgroundColor: greenTheme.cardBackground }]}>
      <Text style={[styles.sectionTitle, { color: greenTheme.textPrimary }]}>Quick Actions</Text>
      
      <TouchableOpacity
        style={[styles.fullWidthActionButton, { backgroundColor: greenTheme.primary }]}
        onPress={handleWithdrawal}
      >
        <LinearGradient
          colors={[greenTheme.primary, greenTheme.primaryDark]}
          style={styles.fullWidthActionGradient}
        >
          <FontAwesome5 name="money-bill-wave" size={24} color="#FFF" />
          <Text style={styles.fullWidthActionText}>Withdraw Funds</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animatable.View>
  );

  const renderRecentCommissions = () => {
    if (!recentCommissions || recentCommissions.length === 0) {
      return (
        <Animatable.View animation="fadeInUp" delay={600} duration={800} style={[styles.commissionsContainer, { backgroundColor: greenTheme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: greenTheme.textPrimary }]}>Recent Commissions</Text>
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={greenTheme.textSecondary} />
            <Text style={[styles.emptyText, { color: greenTheme.textSecondary }]}>No commissions yet</Text>
          </View>
        </Animatable.View>
      );
    }

    return (
      <Animatable.View animation="fadeInUp" delay={600} duration={800} style={[styles.commissionsContainer, { backgroundColor: greenTheme.cardBackground }]}>
        <View style={styles.commissionsHeader}>
          <Text style={[styles.sectionTitle, { color: greenTheme.textPrimary }]}>Recent Commissions</Text>
          <TouchableOpacity onPress={() => setActiveTab('commissions')}>
            <Text style={[styles.viewAllText, { color: greenTheme.primary }]}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {recentCommissions.slice(0, 5).map((commission, index) => (
          <Animatable.View
            key={commission.id}
            animation="fadeInRight"
            delay={700 + (index * 100)}
            style={[styles.commissionItem, { borderBottomColor: greenTheme.border }]}
          >
            <View style={styles.commissionLeft}>
              <View style={[styles.commissionIcon, { backgroundColor: getStatusColor(commission.status) + '20' }]}>
                <Ionicons 
                  name={getStatusIcon(commission.status)} 
                  size={16} 
                  color={getStatusColor(commission.status)} 
                />
              </View>
              <View style={styles.commissionDetails}>
                <Text style={[styles.commissionAmount, { color: greenTheme.textPrimary }]}>
                  ${commission.commission_amount?.toFixed(2) || '0.00'}
                </Text>
                <Text style={[styles.commissionDate, { color: greenTheme.textSecondary }]}>
                  {commission.created_at ? new Date(commission.created_at).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadgeSmall, { backgroundColor: getStatusColor(commission.status) + '20' }]}>
              <Text style={[styles.statusTextSmall, { color: getStatusColor(commission.status) }]}>
                {commission.status}
              </Text>
            </View>
          </Animatable.View>
        ))}
      </Animatable.View>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return greenTheme.success;
      case 'approved': return greenTheme.primary;
      case 'pending': return '#F59E0B';
      default: return greenTheme.textSecondary;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return 'checkmark-circle';
      case 'approved': return 'checkmark';
      case 'pending': return 'time';
      default: return 'help-circle';
    }
  };

  const renderWithdrawalModal = () => (
    <Modal
      visible={withdrawalModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setWithdrawalModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <Animatable.View animation="zoomIn" duration={300} style={[styles.modalContent, { backgroundColor: greenTheme.cardBackground }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: greenTheme.textPrimary }]}>Withdraw Funds</Text>
            <TouchableOpacity
              onPress={() => setWithdrawalModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={greenTheme.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            <Text style={[styles.availableText, { color: greenTheme.textSecondary }]}>
              Available: ${masterData?.statistics?.approved_amount?.toFixed(2) || '0.00'}
            </Text>
            
            <View style={[styles.infoBox, { backgroundColor: greenTheme.primary + '20', borderColor: greenTheme.primary + '40' }]}>
              <Text style={[styles.infoText, { color: greenTheme.textPrimary }]}>
                ℹ️ Master User Withdrawal Rules:{'\n'}
                • Minimum withdrawal: $50.00{'\n'}
                • Must withdraw all approved funds{'\n'}
                • 2% processing fee applies{'\n'}
                • Net amount goes to your wallet
              </Text>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: greenTheme.textPrimary }]}>Withdrawal Amount (All Available)</Text>
              <TextInput
                style={[styles.amountInput, { 
                  borderColor: greenTheme.border, 
                  color: greenTheme.textPrimary,
                  backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB'
                }]}
                value={withdrawalAmount}
                onChangeText={setWithdrawalAmount}
                placeholder="Enter amount"
                placeholderTextColor={greenTheme.textSecondary}
                keyboardType="decimal-pad"
                editable={false} // Master users can't edit amount
              />
            </View>
            
            {withdrawalAmount && parseFloat(withdrawalAmount) > 0 && (
              <View style={[styles.feeBreakdown, { backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB' }]}>
                <Text style={[styles.feeTitle, { color: greenTheme.textPrimary }]}>Fee Breakdown:</Text>
                <View style={styles.feeRow}>
                  <Text style={[styles.feeLabel, { color: greenTheme.textSecondary }]}>Gross Amount:</Text>
                  <Text style={[styles.feeValue, { color: greenTheme.textPrimary }]}>${parseFloat(withdrawalAmount).toFixed(2)}</Text>
                </View>
                <View style={styles.feeRow}>
                  <Text style={[styles.feeLabel, { color: greenTheme.textSecondary }]}>Processing Fee (2%):</Text>
                  <Text style={[styles.feeValue, { color: '#F59E0B' }]}>-${(parseFloat(withdrawalAmount) * 0.02).toFixed(2)}</Text>
                </View>
                <View style={[styles.feeRow, styles.feeRowTotal]}>
                  <Text style={[styles.feeLabel, { color: greenTheme.textPrimary, fontWeight: 'bold' }]}>Net Amount:</Text>
                  <Text style={[styles.feeValue, { color: greenTheme.success, fontWeight: 'bold' }]}>${(parseFloat(withdrawalAmount) * 0.98).toFixed(2)}</Text>
                </View>
              </View>
            )}
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setWithdrawalModalVisible(false)}
                disabled={isWithdrawing}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: greenTheme.primary }]}
                onPress={processWithdrawal}
                disabled={isWithdrawing}
              >
                {isWithdrawing ? (
                  <DotsLoading size={6} color="#FFF" spacing={4} />
                ) : (
                  <Text style={styles.confirmButtonText}>Withdraw</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animatable.View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: greenTheme.background, paddingTop: insets.top + 10 }]}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <View style={styles.loadingContainer}>
          <DotsLoading size={12} color={greenTheme.primary} spacing={8} />
          <Text style={[styles.loadingText, { color: greenTheme.textSecondary }]}>Loading Master Dashboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: greenTheme.background, paddingTop: insets.top + 10 }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: greenTheme.cardBackground, borderBottomColor: greenTheme.border }]}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={greenTheme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitleText, { color: greenTheme.textPrimary }]}>Master Dashboard</Text>
        <TouchableOpacity
          style={styles.refreshHeaderButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh-outline" size={24} color={greenTheme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 20, 40) }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[greenTheme.primary]}
            tintColor={greenTheme.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderMasterHeader()}
        {renderStatsGrid()}
        {renderQuickActions()}
        {renderRecentCommissions()}
      </ScrollView>
      
      {renderWithdrawalModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerBackButton: {
    padding: 8,
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  refreshHeaderButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerCard: {
    marginVertical: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  headerGradient: {
    padding: 24,
  },
  headerContent: {
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTextContainer: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  shareButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  activeSince: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  statsCard: {
    marginVertical: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  statsGradient: {
    padding: 20,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  refreshButton: {
    padding: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statItem: {
    width: '31%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  actionsContainer: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  fullWidthActionButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  fullWidthActionGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  fullWidthActionText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  commissionsContainer: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  commissionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  commissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  commissionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  commissionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commissionDetails: {
    gap: 2,
  },
  commissionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  commissionDate: {
    fontSize: 12,
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusTextSmall: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
    gap: 20,
  },
  availableText: {
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  amountInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    marginVertical: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  feeBreakdown: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  feeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  feeRowTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
    paddingTop: 12,
  },
  feeLabel: {
    fontSize: 14,
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MasterDashboardScreen; 