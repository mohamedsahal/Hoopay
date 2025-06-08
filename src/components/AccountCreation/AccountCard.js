import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';

const formatCurrency = (amount, currency) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
};

const getWalletIcon = (account) => {
  // If logo_url is available from API, use it
  if (account.logo_url) {
    return (
      <Image 
        source={{ uri: account.logo_url }} 
        style={styles.logoImage} 
        onError={() => console.log('Error loading logo:', account.logo_url)}
      />
    );
  }
  
  // Fallback to default icons
  const walletType = (account.account_type || account.wallet_type || '').toLowerCase();
  
  if (walletType.includes('saving') || walletType === 'savings') {
    return <FontAwesome name="piggy-bank" size={28} color="#4E7A51" />;
  } else if (walletType.includes('check') || walletType === 'checking') {
    return <FontAwesome name="credit-card" size={28} color="#4E7A51" />;
  } else if (walletType.includes('wallet') || walletType === 'wallet') {
    return <MaterialIcons name="account-balance-wallet" size={28} color="#4E7A51" />;
  } else if (walletType.includes('sahal') || walletType === 'sahal') {
    return <FontAwesome name="money" size={28} color="#4E7A51" />;
  } else if (walletType.includes('crypto') || walletType === 'crypto') {
    return <MaterialIcons name="currency-bitcoin" size={28} color="#4E7A51" />;
  } else {
    return <FontAwesome name="bank" size={28} color="#4E7A51" />;
  }
};

const formatAccountNumber = (number) => {
  if (!number) return '';
  const last4 = number.slice(-4);
  return `•••• ${last4}`;
};

const AccountCard = ({ account, onPress }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return {
          backgroundColor: 'rgba(78, 122, 81, 0.15)',
          textColor: '#4E7A51',
        };
      case 'inactive':
        return {
          backgroundColor: 'rgba(255, 107, 107, 0.15)',
          textColor: '#FF6B6B',
        };
      case 'suspended':
        return {
          backgroundColor: 'rgba(255, 189, 61, 0.15)',
          textColor: '#FFBD3D',
        };
      case 'closed':
        return {
          backgroundColor: 'rgba(151, 165, 166, 0.15)',
          textColor: '#95a5a6',
        };
      default:
        return {
          backgroundColor: 'rgba(151, 165, 166, 0.15)',
          textColor: '#95a5a6',
        };
    }
  };

  const statusColors = getStatusColor(account.status);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.leftContent}>
        <View style={styles.iconContainer}>
          {getWalletIcon(account)}
        </View>
        <View style={styles.accountInfo}>
          <Text style={styles.accountType}>
            {(account.account_type || account.wallet_type || 'Standard').charAt(0).toUpperCase() + (account.account_type || account.wallet_type || 'Standard').slice(1)}
          </Text>
          <Text style={styles.accountNumber}>
            {formatAccountNumber(account.account_number)}
          </Text>
        </View>
      </View>
      
      <View style={styles.rightContent}>
        <Text style={styles.balance}>
          {formatCurrency(account.balance, account.currency)}
        </Text>
        <View style={[styles.statusPill, { backgroundColor: statusColors.backgroundColor }]}>
          <Text style={[styles.statusText, { color: statusColors.textColor }]}>
            {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(78, 122, 81, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  logoImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    resizeMode: 'cover',
  },
  accountInfo: {
    justifyContent: 'center',
  },
  accountType: {
    fontSize: 17,
    fontWeight: '600',
    color: '#4E7A51', 
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 14,
    color: '#6C757D',
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  balance: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default AccountCard; 