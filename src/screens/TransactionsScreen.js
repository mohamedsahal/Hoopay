import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Image,
  ScrollView
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';

// Sample transaction data - updated for swap transactions only
const transactionData = [
  {
    id: '1',
    type: 'sahal_to_premier',
    title: 'Sahal to Premier',
    fromAmount: '100.00 USD',
    toAmount: '89.50 EUR',
    date: 'Today, 10:45 AM',
    status: 'Completed',
    rate: '1 USD = 0.895 EUR'
  },
  {
    id: '2',
    type: 'premier_to_sahal',
    title: 'Premier to Sahal',
    fromAmount: '75.00 EUR',
    toAmount: '83.75 USD',
    date: 'Today, 08:20 AM',
    status: 'Completed',
    rate: '1 EUR = 1.117 USD'
  },
  {
    id: '3',
    type: 'sahal_to_premier',
    title: 'Sahal to Premier',
    fromAmount: '250.00 USD',
    toAmount: '223.75 EUR',
    date: 'Yesterday, 5:30 PM',
    status: 'Completed',
    rate: '1 USD = 0.895 EUR'
  },
  {
    id: '4',
    type: 'premier_to_sahal',
    title: 'Premier to Sahal',
    fromAmount: '120.00 EUR',
    toAmount: '134.04 USD',
    date: 'Yesterday, 2:15 PM',
    status: 'Completed',
    rate: '1 EUR = 1.117 USD'
  },
  {
    id: '5',
    type: 'sahal_to_premier',
    title: 'Sahal to Premier',
    fromAmount: '50.00 USD',
    toAmount: '44.75 EUR',
    date: 'Mar 15, 11:30 AM',
    status: 'Completed',
    rate: '1 USD = 0.895 EUR'
  },
  {
    id: '6',
    type: 'premier_to_sahal',
    title: 'Premier to Sahal',
    fromAmount: '200.00 EUR',
    toAmount: '223.40 USD',
    date: 'Mar 15, 9:00 AM',
    status: 'Completed',
    rate: '1 EUR = 1.117 USD'
  },
  {
    id: '7',
    type: 'sahal_to_premier',
    title: 'Sahal to Premier',
    fromAmount: '75.00 USD',
    toAmount: '67.13 EUR',
    date: 'Mar 14, 3:20 PM',
    status: 'Completed',
    rate: '1 USD = 0.895 EUR'
  },
  {
    id: '8',
    type: 'premier_to_sahal',
    title: 'Premier to Sahal',
    fromAmount: '30.00 EUR',
    toAmount: '33.51 USD',
    date: 'Mar 13, 7:45 PM',
    status: 'Completed',
    rate: '1 EUR = 1.117 USD'
  }
];

// Filter categories - updated for swap transactions
const filterOptions = [
  { id: 'all', label: 'All Swaps' },
  { id: 'sahal_to_premier', label: 'Sahal → Premier' },
  { id: 'premier_to_sahal', label: 'Premier → Sahal' }
];

const TransactionItem = ({ transaction }) => {
  // Icon based on transaction type
  const getSwapIcon = (type) => {
    if (type === 'sahal_to_premier') {
      return (
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <Path
            d="M17 8l4 4-4 4M3 12h18"
            stroke="#4E7A51"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    } else {
      return (
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <Path
            d="M7 16l-4-4 4-4M21 12H3"
            stroke="#4E7A51"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    }
  };

  // Get account images based on transaction type
  const fromAccountImage = transaction.type === 'sahal_to_premier' 
    ? require('../assets/images/sahal.png') 
    : require('../assets/images/wallet.png');
    
  const toAccountImage = transaction.type === 'sahal_to_premier' 
    ? require('../assets/images/wallet.png') 
    : require('../assets/images/sahal.png');

  return (
    <TouchableOpacity style={styles.transactionItem}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionIconContainer}>
          {getSwapIcon(transaction.type)}
        </View>
        <View style={styles.transactionHeaderContent}>
          <Text style={styles.transactionTitle}>{transaction.title}</Text>
          <Text style={styles.transactionDate}>{transaction.date}</Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{transaction.status}</Text>
        </View>
      </View>
      
      <View style={styles.transactionDetails}>
        <View style={styles.accountContainer}>
          <Image source={fromAccountImage} style={styles.accountIcon} />
          <Text style={styles.fromAmount}>{transaction.fromAmount}</Text>
        </View>
        
        <View style={styles.exchangeRateContainer}>
          <Text style={styles.exchangeRate}>{transaction.rate}</Text>
        </View>
        
        <View style={styles.accountContainer}>
          <Image source={toAccountImage} style={styles.accountIcon} />
          <Text style={styles.toAmount}>{transaction.toAmount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const TransactionsScreen = () => {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredTransactions = transactionData.filter(transaction => {
    if (activeFilter === 'all') return true;
    return transaction.type === activeFilter;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top || 20 }]}>
        <Text style={styles.headerTitle}>Swap History</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path
              d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
              stroke="#333333"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M21 21L16.65 16.65"
              stroke="#333333"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* Filter section */}
      <View style={styles.filterContainer}>
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
                activeFilter === option.id && styles.activeFilterOption
              ]}
              onPress={() => setActiveFilter(option.id)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === option.id && styles.activeFilterText
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Transactions List */}
      <FlatList
        data={filteredTransactions}
        renderItem={({ item }) => <TransactionItem transaction={item} />}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.transactionsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No swap transactions found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  searchButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EAF7EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterContainer: {
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  filtersScrollContent: {
    paddingHorizontal: 10,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EAF7EB',
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(200, 230, 200, 0.7)',
  },
  activeFilterOption: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4E7A51',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  transactionsList: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  transactionItem: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(230, 230, 230, 0.5)',
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EAF7EB',
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
    color: '#333',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 13,
    color: '#95a5a6',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 122, 81, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4E7A51',
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#4E7A51',
    fontWeight: '500',
  },
  transactionDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(230, 230, 230, 0.5)',
  },
  accountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
  fromAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E74C3C',
  },
  toAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4E7A51',
  },
  exchangeRateContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  exchangeRate: {
    fontSize: 12,
    color: '#95a5a6',
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#95a5a6',
  },
});

export default TransactionsScreen; 