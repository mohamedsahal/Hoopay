import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Account, AccountStatus } from '../../types/account';

interface AccountCardProps {
  account: Account;
  onPress?: (account: Account) => void;
}

interface StatusColors {
  backgroundColor: string;
  textColor: string;
}

const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
};

const formatAccountNumber = (number: string): string => {
  if (!number) return '';
  const last4 = number.slice(-4);
  return `•••• ${last4}`;
};

const AccountCard: React.FC<AccountCardProps> = ({ account, onPress }) => {
  const getStatusColor = (status: AccountStatus): StatusColors => {
    switch (status?.toLowerCase() as AccountStatus) {
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
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(account)}
    >
      <View style={styles.leftContent}>
        <View style={styles.iconContainer}>
          <MaterialIcons
            name={account.account_type === 'crypto' ? 'currency-bitcoin' : 'account-balance'}
            size={24}
            color="#0066FF"
          />
        </View>
        <View style={styles.accountInfo}>
          <Text style={styles.accountType}>
            {account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)}
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 102, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountInfo: {
    justifyContent: 'center',
  },
  accountType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
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