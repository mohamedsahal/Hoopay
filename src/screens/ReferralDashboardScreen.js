import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Share,
  Clipboard,
  FlatList,
  Dimensions,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import referralService from '../services/referralService';
import DotsLoading from '../components/DotsLoading';

const { width, height } = Dimensions.get('window');

const ReferralDashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [referralData, setReferralData] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalReferrals: 0,
    completedReferrals: 0,
    pendingReferrals: 0,
    totalEarnings: 0,
    withdrawableEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    eligibleForWithdrawal: false,
    minimumWithdrawal: 50,
    // Master user data
    isMasterUser: false,
    masterUserData: null
  });

  useEffect(() => {
    checkOptInStatusAndFetchData();
  }, []);

  const checkOptInStatusAndFetchData = async () => {
    try {
      setIsLoading(true);
      
      // First check if user is opted in
      const referralInfo = await referralService.getReferralInfo();
      
      if (!referralInfo.success || !referralInfo.data || !referralInfo.data.isOptedIn) {
        // User not opted in, redirect to onboarding
        navigation.replace('ReferralOnboarding');
        return;
      }
      
      // User is opted in, proceed with loading data
      await loadReferralData();
    } catch (error) {
      console.error('Error checking opt-in status:', error);
      // If there's an error, assume user is not opted in
      navigation.replace('ReferralOnboarding');
    }
  };

  const loadReferralData = async () => {
    try {
      setIsLoading(true);
      
      // Load referral info and stats
      const infoResult = await referralService.getReferralInfo();
      if (infoResult.success) {
        setReferralData(infoResult.data);
        setStats(referralService.calculateStats(infoResult.data));
      }

      // Load referrals list
      const referralsResult = await referralService.getReferrals(1, 10);
      if (referralsResult.success) {
        setReferrals(referralsResult.data.data || []);
      } else {
        setReferrals([]);
      }

      // Load commissions
      const commissionsResult = await referralService.getCommissions(1, 15);
      if (commissionsResult.success) {
        const commissionData = commissionsResult.data.data || [];
        setCommissions(commissionData);
      } else {
        setCommissions([]);
      }

      // Load withdrawals
      const withdrawalsResult = await referralService.getWithdrawals(1, 15);
      if (withdrawalsResult.success) {
        const withdrawalData = withdrawalsResult.data.data || [];
        setWithdrawals(withdrawalData);
      } else {
        setWithdrawals([]);
      }

    } catch (error) {
      console.error('Error loading referral data:', error);
      Alert.alert('Error', 'Failed to load referral data. Please try again.');
      // Set empty arrays on error to prevent undefined issues
      setCommissions([]);
      setWithdrawals([]);
      setReferrals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadReferralData();
    setIsRefreshing(false);
  }, []);

  const copyReferralCode = async () => {
    if (referralData?.referral_code) {
      Clipboard.setString(referralData.referral_code);
      Alert.alert('Copied!', 'Referral code copied to clipboard');
    }
  };

  const shareReferralCode = async () => {
    if (referralData?.referral_code) {
      const shareText = `Join me on Hoopay using my referral code: ${referralData.referral_code}`;
      
      try {
        await Share.share({
          message: shareText,
          title: 'Join me on Hoopay!'
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const handleWithdrawal = () => {
    if (!stats.eligibleForWithdrawal || stats.withdrawableEarnings < stats.minimumWithdrawal) {
      Alert.alert(
        'Minimum Withdrawal Not Met',
        `You need at least $${stats.minimumWithdrawal.toFixed(2)} to request a withdrawal.`,
        [{ text: 'OK' }]
      );
      return;
    }

    const withdrawalAmount = stats.withdrawableEarnings;
    const feeAmount = withdrawalAmount * 0.02; // 2% fee
    const netAmount = withdrawalAmount - feeAmount;

    Alert.alert(
      'Request Withdrawal',
      `Are you sure you want to withdraw ${referralService.formatCurrency(withdrawalAmount)}?\n\nA 2% processing fee (${referralService.formatCurrency(feeAmount)}) will be deducted.\n\nYou will receive: ${referralService.formatCurrency(netAmount)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Withdraw',
          onPress: processWithdrawal
        }
      ]
    );
  };

  const processWithdrawal = async () => {
    try {
      setIsLoading(true);
      const result = await referralService.requestWithdrawal(stats.withdrawableEarnings, 'wallet');
      
      if (result.success) {
        Alert.alert(
          'Withdrawal Completed',
          'The money is now available in your wallet.',
          [{ text: 'OK', onPress: loadReferralData }]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to process withdrawal');
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      Alert.alert('Error', 'Failed to process withdrawal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  const renderStatsCard = () => (
    <Animatable.View animation="fadeInUp" duration={800} style={styles.statsCard}>
      <LinearGradient
        colors={['#10B981', '#059669']}
        style={styles.statsGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.statsHeader}>
          <Text style={styles.statsTitle}>Your Referral Stats</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalReferrals}</Text>
            <Text style={styles.statLabel}>Total Referrals</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.completedReferrals}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{referralService.formatCurrency(stats.totalEarnings)}</Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{referralService.formatCurrency(stats.withdrawableEarnings)}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{referralService.formatCurrency(stats.pendingEarnings)}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{referralService.formatCurrency(stats.paidEarnings)}</Text>
            <Text style={styles.statLabel}>Paid Out</Text>
          </View>
        </View>

        {stats.eligibleForWithdrawal && (
          <TouchableOpacity
            style={styles.withdrawButton}
            onPress={handleWithdrawal}
          >
            <Ionicons name="cash-outline" size={18} color="#10B981" />
            <Text style={styles.withdrawButtonText}>
              Withdraw {referralService.formatCurrency(stats.withdrawableEarnings)}
            </Text>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </Animatable.View>
  );

  const renderReferralCode = () => (
    <Animatable.View animation="fadeInUp" delay={200} duration={800} style={[styles.codeCard, { backgroundColor: theme.cardBackground }]}>
      <Text style={[styles.codeTitle, { color: theme.text }]}>Your Referral Code</Text>
      <View style={[styles.codeContainer, { backgroundColor: theme.surface }]}>
        <Text style={[styles.codeText, { color: theme.primary }]}>{referralData?.referral_code || 'Loading...'}</Text>
        <View style={styles.codeActions}>
          <TouchableOpacity style={[styles.copyButton, { backgroundColor: theme.primary + '20' }]} onPress={copyReferralCode}>
            <Ionicons name="copy-outline" size={18} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.shareButton, { backgroundColor: theme.primary + '20' }]} onPress={shareReferralCode}>
            <Ionicons name="share-outline" size={18} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={[styles.codeInfo, { color: theme.textSecondary }]}>Share this code with friends to earn rewards</Text>
    </Animatable.View>
  );

  const renderTabBar = () => (
    <View style={[styles.tabBar, { backgroundColor: theme.cardBackground }]}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'overview' && { ...styles.activeTab, backgroundColor: theme.primary }]}
        onPress={() => setActiveTab('overview')}
      >
        <Text style={[styles.tabText, { color: activeTab === 'overview' ? 'white' : theme.textSecondary }]}>
          Overview
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'commissions' && { ...styles.activeTab, backgroundColor: theme.primary }]}
        onPress={() => setActiveTab('commissions')}
      >
        <Text style={[styles.tabText, { color: activeTab === 'commissions' ? 'white' : theme.textSecondary }]}>
          Commissions
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'withdrawals' && { ...styles.activeTab, backgroundColor: theme.primary }]}
        onPress={() => setActiveTab('withdrawals')}
      >
        <Text style={[styles.tabText, { color: activeTab === 'withdrawals' ? 'white' : theme.textSecondary }]}>
          Withdrawals
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderReferralItem = ({ item, key }) => (
    <View key={key || item.id} style={[styles.listItem, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <View style={[styles.itemIcon, { backgroundColor: theme.primary + '20' }]}>
        <Ionicons name="person-outline" size={20} color={theme.primary} />
      </View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, { color: theme.text }]}>{item.referred?.name || 'Anonymous User'}</Text>
        <Text style={[styles.itemSubtitle, { color: theme.textSecondary }]}>
          Joined {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      <View style={[
        styles.statusBadge,
        { backgroundColor: item.status === 'completed' ? '#10B981' : '#F59E0B' }
      ]}>
        <Text style={styles.statusText}>
          {item.status === 'completed' ? 'Active' : 'Pending'}
        </Text>
      </View>
    </View>
  );

  const renderCommissionItem = ({ item, key }) => {
    if (!item) return null;
    
    return (
      <View key={key || item.id} style={[styles.listItem, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <View style={[styles.itemIcon, { backgroundColor: theme.primary + '20' }]}>
          <Ionicons name="cash-outline" size={20} color={theme.primary} />
        </View>
        <View style={styles.itemContent}>
          <Text style={[styles.itemTitle, { color: theme.text }]}>
            {referralService.formatCurrency(item.commission_amount || 0)}
          </Text>
          <Text style={[styles.itemSubtitle, { color: theme.textSecondary }]}>
            Earned on {item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'Unknown date'}
          </Text>
          {item.transaction?.amount && (
            <Text style={[styles.itemSubtitle, { color: theme.textSecondary, fontSize: 12, marginTop: 2 }]}>
              From transaction: {referralService.formatCurrency(item.transaction.amount)}
            </Text>
          )}
          {item.paid_at && (
            <Text style={[styles.itemSubtitle, { color: theme.textSecondary, fontSize: 12, marginTop: 2 }]}>
              Paid on {new Date(item.paid_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric'
              })}
            </Text>
          )}
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'paid' ? '#10B981' : item.status === 'approved' ? '#3B82F6' : '#F59E0B' }
        ]}>
          <Text style={styles.statusText}>
            {item.status === 'paid' ? 'Paid' : item.status === 'approved' ? 'Available' : 'Pending'}
          </Text>
        </View>
      </View>
    );
  };

  const renderWithdrawalItem = ({ item, key }) => {
    if (!item) return null;
    
    return (
      <View key={key || item.id} style={[styles.listItem, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <View style={[styles.itemIcon, { backgroundColor: theme.primary + '20' }]}>
          <Ionicons name="wallet-outline" size={20} color={theme.primary} />
        </View>
        <View style={styles.itemContent}>
          <Text style={[styles.itemTitle, { color: theme.text }]}>
            {referralService.formatCurrency(item.amount || 0)}
          </Text>
          <Text style={[styles.itemSubtitle, { color: theme.textSecondary }]}>
            Withdrawn on {item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'Unknown date'}
          </Text>
          {item.fee && (
            <Text style={[styles.itemSubtitle, { color: theme.textSecondary, fontSize: 12, marginTop: 2 }]}>
              Fee: {referralService.formatCurrency(item.fee)} • Net: {referralService.formatCurrency(item.net_amount || (item.amount - item.fee))}
            </Text>
          )}
          {item.processed_at && item.status === 'completed' && (
            <Text style={[styles.itemSubtitle, { color: theme.textSecondary, fontSize: 12, marginTop: 2 }]}>
              Processed on {new Date(item.processed_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric'
              })}
            </Text>
          )}
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'completed' ? '#10B981' : item.status === 'processing' ? '#F59E0B' : '#EF4444' }
        ]}>
          <Text style={styles.statusText}>
            {item.status === 'completed' ? 'Completed' : item.status === 'processing' ? 'Processing' : 'Failed'}
          </Text>
        </View>
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'commissions':
        return (
          <View style={styles.list}>
            {isLoading ? (
              <View style={[styles.loadingState, { backgroundColor: theme.cardBackground }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading commissions...</Text>
              </View>
            ) : commissions && commissions.length > 0 ? (
              <>
                <View style={[styles.listHeader, { backgroundColor: theme.cardBackground }]}>
                  <Text style={[styles.listHeaderText, { color: theme.text }]}>
                    Commission History ({commissions.length} {commissions.length === 1 ? 'entry' : 'entries'})
                  </Text>
                  <Text style={[styles.listHeaderSubtext, { color: theme.textSecondary }]}>
                    User details excluded for privacy
                  </Text>
                </View>
                {commissions.map((item, index) => renderCommissionItem({ item, key: item.id || index }))}
              </>
            ) : (
              <View style={[styles.emptyState, { backgroundColor: theme.cardBackground }]}>
                <Ionicons name="cash-outline" size={48} color={theme.textTertiary} />
                <Text style={[styles.emptyText, { color: theme.text }]}>No commission history</Text>
                <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>Commission history will appear here when your referrals make transactions. User details are excluded for privacy.</Text>
              </View>
            )}
          </View>
        );
      case 'withdrawals':
        return (
          <View style={styles.list}>
            {isLoading ? (
              <View style={[styles.loadingState, { backgroundColor: theme.cardBackground }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading withdrawals...</Text>
              </View>
            ) : withdrawals && withdrawals.length > 0 ? (
              <>
                <View style={[styles.listHeader, { backgroundColor: theme.cardBackground }]}>
                  <Text style={[styles.listHeaderText, { color: theme.text }]}>
                    Withdrawal History ({withdrawals.length} {withdrawals.length === 1 ? 'entry' : 'entries'})
                  </Text>
                  <Text style={[styles.listHeaderSubtext, { color: theme.textSecondary }]}>
                    All withdrawal transactions
                  </Text>
                </View>
                {withdrawals.map((item, index) => renderWithdrawalItem({ item, key: item.id || index }))}
              </>
            ) : (
              <View style={[styles.emptyState, { backgroundColor: theme.cardBackground }]}>
                <Ionicons name="wallet-outline" size={48} color={theme.textTertiary} />
                <Text style={[styles.emptyText, { color: theme.text }]}>No withdrawal history</Text>
                <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>Withdrawal history will appear here when your commission earnings are withdrawn</Text>
              </View>
            )}
          </View>
        );
      default:
        return (
          <View style={styles.overviewContent}>
            <View style={styles.quickActions}>
              {/* Master Dashboard Button - Only visible to master users */}
              {stats.isMasterUser && (
                <TouchableOpacity 
                  style={styles.fullWidthActionButton} 
                  onPress={() => navigation.navigate('MasterDashboard')}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={styles.actionGradient}
                  >
                    <Ionicons name="analytics" size={24} color="white" />
                    <Text style={styles.actionText}>Access Master Dashboard</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              
              {/* Regular action buttons for non-master users */}
              {!stats.isMasterUser && (
                <>
                  <TouchableOpacity style={styles.actionButton} onPress={shareReferralCode}>
                    <LinearGradient
                      colors={['#3B82F6', '#2563EB']}
                      style={styles.actionGradient}
                    >
                      <Ionicons name="share-outline" size={24} color="white" />
                      <Text style={styles.actionText}>Share Code</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.actionButton} onPress={copyReferralCode}>
                    <LinearGradient
                      colors={['#8B5CF6', '#7C3AED']}
                      style={styles.actionGradient}
                    >
                      <Ionicons name="copy-outline" size={24} color="white" />
                      <Text style={styles.actionText}>Copy Code</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <View style={[styles.infoCard, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.infoTitle, { color: theme.text }]}>How to Earn More</Text>
              <View style={styles.tipsList}>
                <View style={styles.tip}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={[styles.tipText, { color: theme.textSecondary }]}>Share on social media</Text>
                </View>
                <View style={styles.tip}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={[styles.tipText, { color: theme.textSecondary }]}>Tell friends and family</Text>
                </View>
                <View style={styles.tip}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={[styles.tipText, { color: theme.textSecondary }]}>Join community groups</Text>
                </View>
                <View style={styles.tip}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={[styles.tipText, { color: theme.textSecondary }]}>Post in social media groups</Text>
                </View>
                <View style={styles.tip}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={[styles.tipText, { color: theme.textSecondary }]}>Share with work colleagues</Text>
                </View>
              </View>
            </View>
          </View>
        );
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + 10, paddingBottom: insets.bottom }]}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <View style={styles.loadingContainer}>
          <DotsLoading size={12} color={theme.primary} spacing={8} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading your referral dashboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + 10, paddingBottom: insets.bottom }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Referral Dashboard</Text>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 80, 100) }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderStatsCard()}
        {renderReferralCode()}
        {renderTabBar()}
        {renderTabContent()}
      </ScrollView>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statsCard: {
    marginVertical: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statsGradient: {
    padding: 20,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  withdrawButtonText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  codeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  codeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  codeText: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  codeActions: {
    flexDirection: 'row',
  },
  copyButton: {
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
  },
  shareButton: {
    borderRadius: 8,
    padding: 8,
  },
  codeInfo: {
    fontSize: 14,
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    marginVertical: 4,
    marginHorizontal: 4,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: 'white',
  },
  overviewContent: {
    marginBottom: 20,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fullWidthActionButton: {
    width: '100%',
    marginVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  actionGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  tipsList: {
    marginTop: 8,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  list: {
    marginBottom: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6FFFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    borderRadius: 12,
    marginVertical: 8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#D1D5DB',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 40,
    borderRadius: 12,
    marginVertical: 8,
  },
  listHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  listHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  listHeaderSubtext: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default ReferralDashboardScreen; 