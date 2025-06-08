import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  Platform
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useTabBarSafeHeight } from '../constants/Layout';
import LoadingIndicator from '../components/LoadingIndicator';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';
import Colors from '../constants/Colors';
import { LoadingSkeleton } from '../components/Loading';
import DateTimePicker from '@react-native-community/datetimepicker';

// Filter categories for financial transactions
const filterOptions = [
  { id: 'all', label: 'All Transactions' },
  { id: 'deposit', label: 'Deposits' },
  { id: 'withdrawal', label: 'Withdrawals' },
  { id: 'transfer', label: 'Transfers' }
];

const TransactionItem = ({ transaction, onPress }) => {
  const { colors } = useTheme();
  
  // Determine if it's a credit transaction (money coming in)
  const isCredit = transaction.type === 'credit' || transaction.type === 'deposit';
  
  // Get status color
  let statusColor = colors.textSecondary;
  if (transaction.status === 'completed') statusColor = colors.success;
  if (transaction.status === 'pending') statusColor = colors.warning;
  if (transaction.status === 'failed') statusColor = colors.error;
  
  // Get transaction icon based on type
  const getTransactionIcon = (type) => {
    if (type === 'deposit' || type === 'credit') {
      return (
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <Path
            d="M16 3h5v5M14 10l7-7M8 21H3v-5M10 14l-7 7"
            stroke={colors.success}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    } else if (type === 'withdrawal') {
      return (
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 16v-5M9 16v-2M15 16v-4"
            stroke={colors.secondary}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            stroke={colors.secondary}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    } else { // transfer
      return (
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <Path
            d="M7 17L17 7M17 7H7M17 7V17"
            stroke="#4A90E2"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    }
  };

  // Get background color for icon
  const getIconBackgroundColor = (type) => {
    if (type === 'deposit' || type === 'credit') {
      return 'rgba(57, 183, 71, 0.1)';
    } else if (type === 'withdrawal') {
      return 'rgba(255, 140, 0, 0.1)';
    } else {
      return 'rgba(74, 144, 226, 0.1)';
    }
  };

  // Format title
  const getTitle = () => {
    if (transaction.type === 'deposit') return 'Deposit';
    if (transaction.type === 'withdrawal') return 'Withdrawal';
    if (transaction.type === 'credit') return 'Received';
    if (transaction.type === 'transfer') return `Transfer${transaction.recipient ? ' to ' + transaction.recipient : ''}`;
    return transaction.description || 'Transaction';
  };

  return (
    <TouchableOpacity style={[styles.transactionItem, { backgroundColor: colors.cardBackground }]} onPress={() => onPress && onPress(transaction)}>
      <View style={styles.transactionHeader}>
        <View style={[styles.transactionIconContainer, {
          backgroundColor: getIconBackgroundColor(transaction.type)
        }]}>
          {getTransactionIcon(transaction.type)}
        </View>
        <View style={styles.transactionHeaderContent}>
          <Text style={[styles.transactionTitle, { color: colors.text }]}>{getTitle()}</Text>
          <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>{transaction.date}</Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={[styles.transactionAmount, {
            color: isCredit ? colors.success : colors.text 
          }]}>
            {isCredit ? '+' : '-'}${transaction.amount}
          </Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>
      
      {transaction.description && (
        <View style={[styles.transactionDescription, { borderTopColor: colors.border }]}>
          <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>{transaction.description}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Transactions Screen Skeleton Components
const TransactionItemSkeleton = ({ colors }) => (
  <View style={[styles.transactionItem, { backgroundColor: colors.cardBackground }]}>
    <View style={styles.transactionHeader}>
      <LoadingSkeleton width={48} height={48} borderRadius={24} />
      <View style={styles.transactionHeaderContent}>
        <LoadingSkeleton width={120} height={16} borderRadius={4} />
        <LoadingSkeleton width={80} height={13} borderRadius={4} style={{ marginTop: 4 }} />
      </View>
      <View style={styles.amountContainer}>
        <LoadingSkeleton width={80} height={16} borderRadius={4} />
        <View style={styles.statusContainer}>
          <LoadingSkeleton width={6} height={6} borderRadius={3} />
          <LoadingSkeleton width={60} height={12} borderRadius={4} style={{ marginLeft: 4 }} />
        </View>
      </View>
    </View>
  </View>
);

const TransactionsScreenSkeleton = ({ colors }) => (
  <View style={styles.transactionsList}>
    {[...Array(8)].map((_, index) => (
      <TransactionItemSkeleton key={index} colors={colors} />
    ))}
  </View>
);

// Date Filter Modal Component
const DateFilterModal = ({ visible, onClose, onApply, initialFromDate, initialToDate, colors }) => {
  const [fromDate, setFromDate] = useState(initialFromDate || new Date());
  const [toDate, setToDate] = useState(initialToDate || new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleApply = () => {
    if (fromDate > toDate) {
      Alert.alert('Invalid Date Range', 'From date cannot be later than To date');
      return;
    }
    onApply(fromDate, toDate);
    onClose();
  };

  const handleReset = () => {
    setFromDate(new Date());
    setToDate(new Date());
    onApply(null, null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Filter by Date</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={[styles.resetText, { color: colors.primary }]}>Reset</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dateFiltersContainer}>
            <View style={styles.dateFilterRow}>
              <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>From Date:</Text>
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                onPress={() => setShowFromPicker(true)}
              >
                <MaterialIcons name="calendar-today" size={20} color={colors.primary} />
                <Text style={[styles.dateButtonText, { color: colors.text }]}>
                  {formatDate(fromDate)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dateFilterRow}>
              <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>To Date:</Text>
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                onPress={() => setShowToPicker(true)}
              >
                <MaterialIcons name="calendar-today" size={20} color={colors.primary} />
                <Text style={[styles.dateButtonText, { color: colors.text }]}>
                  {formatDate(toDate)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={handleApply}
            >
              <Text style={[styles.modalButtonText, { color: 'white' }]}>Apply Filter</Text>
            </TouchableOpacity>
          </View>

          {/* Date Pickers */}
          {showFromPicker && (
            <DateTimePicker
              value={fromDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowFromPicker(false);
                if (selectedDate) {
                  setFromDate(selectedDate);
                }
              }}
              maximumDate={new Date()}
            />
          )}

          {showToPicker && (
            <DateTimePicker
              value={toDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowToPicker(false);
                if (selectedDate) {
                  setToDate(selectedDate);
                }
              }}
              maximumDate={new Date()}
              minimumDate={fromDate}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const TransactionsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarSafeHeight();
  const { authToken } = useAuth();
  
  // Use fallback colors and theme if context is not available
  let colors, isDarkMode;
  try {
    const theme = useTheme();
    colors = theme.colors;
    isDarkMode = theme.isDarkMode;
  } catch (error) {
    console.warn('ThemeContext not available in TransactionsScreen, using default colors');
    colors = Colors;
    isDarkMode = false;
  }
  
  // State management
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    has_more: false,
    total: 0
  });
  const [error, setError] = useState(null);
  const [dateFilterVisible, setDateFilterVisible] = useState(false);
  const [dateFilterFromDate, setDateFilterFromDate] = useState(null);
  const [dateFilterToDate, setDateFilterToDate] = useState(null);

  // Fetch transactions from API
  const fetchTransactions = async (page = 1, isRefresh = false, isLoadMore = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (isLoadMore) {
        setLoadingMore(true);
      } else if (page === 1) {
        setLoading(true);
      }

      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '20',
      });

      if (activeFilter !== 'all') {
        params.append('type', activeFilter);
      }

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      if (dateFilterFromDate && dateFilterToDate) {
        params.append('from_date', dateFilterFromDate.toISOString().split('T')[0]);
        params.append('to_date', dateFilterToDate.toISOString().split('T')[0]);
      }

      console.log('Fetching transactions:', `/mobile/transactions/history?${params.toString()}`);
      
      const response = await api.get(`/mobile/transactions/history?${params.toString()}`);

      if (response.data && response.data.success) {
        const newTransactions = response.data.data.transactions || [];
        const newPagination = response.data.data.pagination || {};

        if (isRefresh || page === 1) {
          setTransactions(newTransactions);
        } else {
          setTransactions(prev => [...prev, ...newTransactions]);
        }

        setPagination(newPagination);
        setError(null);
        
        console.log('Transactions fetched successfully:', newTransactions.length, 'items');
      } else {
        throw new Error(response.data?.message || 'Failed to fetch transactions');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError(error.message || 'Failed to load transactions');
      
      if (page === 1) {
        setTransactions([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchTransactions(1);
  }, [activeFilter, searchQuery, dateFilterFromDate, dateFilterToDate]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (transactions.length > 0) {
        fetchTransactions(1, true);
      }
    }, [activeFilter, searchQuery, dateFilterFromDate, dateFilterToDate])
  );

  // Pull to refresh handler
  const onRefresh = useCallback(() => {
    fetchTransactions(1, true);
  }, [activeFilter, searchQuery, dateFilterFromDate, dateFilterToDate]);

  // Load more data for infinite scroll
  const loadMore = useCallback(() => {
    if (!loadingMore && pagination.has_more && pagination.current_page < pagination.total_pages) {
      fetchTransactions(pagination.current_page + 1, false, true);
    }
  }, [loadingMore, pagination, activeFilter, searchQuery, dateFilterFromDate, dateFilterToDate]);

  // Handle filter change
  const handleFilterChange = (filterId) => {
    if (filterId !== activeFilter) {
      setActiveFilter(filterId);
      setSearchQuery(''); // Clear search when changing filter
    }
  };

  // Handle search
  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  // Toggle search visibility
  const toggleSearch = () => {
    setSearchVisible(!searchVisible);
    if (searchVisible) {
      setSearchQuery('');
    }
  };

  // Handle transaction press (for future detail view)
  const handleTransactionPress = (transaction) => {
    console.log('Transaction pressed:', transaction.id);
    // TODO: Navigate to transaction detail screen
  };

  // Handle date filter
  const handleDateFilter = (fromDate, toDate) => {
    setDateFilterFromDate(fromDate);
    setDateFilterToDate(toDate);
    setDateFilterVisible(false);
  };

  // Render footer for FlatList
  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Loading more...</Text>
        </View>
      );
    }
    
    if (transactions.length > 0 && !pagination.has_more) {
      return (
        <View style={styles.footerEnd}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>No more transactions</Text>
        </View>
      );
    }
    
    return null;
  };

  // Render empty state
  const renderEmptyState = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Feather name="activity" size={64} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {searchQuery ? 'No matching transactions' : 'No transactions yet'}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {searchQuery 
            ? 'Try adjusting your search or filter criteria'
            : 'Your transaction history will appear here'
          }
        </Text>
        {searchQuery && (
          <TouchableOpacity 
            style={[styles.clearSearchButton, { backgroundColor: colors.primary }]} 
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearSearchText}>Clear Search</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        style={isDarkMode ? "light" : "dark"} 
        backgroundColor={colors.background}
        translucent={false}
      />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Transactions</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.searchButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={toggleSearch}
          >
            <Feather name="search" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setDateFilterVisible(true)}
          >
            <Feather name="filter" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input */}
      {searchVisible && (
        <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.searchInputContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Feather name="search" size={16} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search transactions..."
              placeholderTextColor={colors.placeholder}
              value={searchQuery}
              onChangeText={handleSearch}
              returnKeyType="search"
              autoFocus={searchVisible}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Feather name="x" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Filter section */}
      <View style={[styles.filterContainer, { backgroundColor: colors.background }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScrollContent}
        >
          {filterOptions.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.filterOption,
                { backgroundColor: colors.surface, borderColor: colors.border },
                activeFilter === option.id && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
              onPress={() => handleFilterChange(option.id)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: colors.textSecondary },
                  activeFilter === option.id && { color: '#FFFFFF' }
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Date Filter Indicator */}
      {(dateFilterFromDate && dateFilterToDate) && (
        <View style={[styles.dateFilterIndicator, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Feather name="calendar" size={16} color={colors.primary} />
          <Text style={[styles.dateFilterText, { color: colors.text }]}>
            {dateFilterFromDate.toLocaleDateString()} - {dateFilterToDate.toLocaleDateString()}
          </Text>
          <TouchableOpacity 
            onPress={() => handleDateFilter(null, null)}
            style={styles.clearDateFilter}
          >
            <Feather name="x" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: colors.errorBackground }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.error }]} 
            onPress={() => fetchTransactions(1)}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading Skeleton for Initial Load */}
      {loading && transactions.length === 0 && (
        <TransactionsScreenSkeleton colors={colors} />
      )}

      {/* Transactions List */}
      <FlatList
        data={transactions}
        renderItem={({ item, index }) => (
          <TransactionItem 
            transaction={item} 
            onPress={handleTransactionPress}
          />
        )}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={[
          styles.transactionsList,
          { paddingBottom: tabBarHeight + 20 }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyState}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
      />

      {/* Date Filter Modal */}
      <DateFilterModal
        visible={dateFilterVisible}
        onClose={() => setDateFilterVisible(false)}
        onApply={handleDateFilter}
        initialFromDate={dateFilterFromDate}
        initialToDate={dateFilterToDate}
        colors={colors}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  filtersScrollContent: {
    paddingRight: 20,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateFilterIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateFilterText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  clearDateFilter: {
    padding: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  transactionsList: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  transactionItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionHeaderContent: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  transactionDescription: {
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  clearSearchButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearSearchText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  resetText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateFiltersContainer: {
    marginBottom: 20,
  },
  dateFilterRow: {
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateButtonText: {
    marginLeft: 8,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerEnd: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    marginLeft: 8,
  },
});

export default TransactionsScreen; 