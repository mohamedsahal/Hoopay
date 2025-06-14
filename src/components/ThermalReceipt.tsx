import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface PerforatedEdgeProps {
  isTop?: boolean;
  theme: any;
}

// Perforated Edge Component for Receipt
const PerforatedEdge: React.FC<PerforatedEdgeProps> = ({ isTop = true, theme }) => {
  const dots = [];
  const receiptWidth = Dimensions.get('window').width - 40;
  const numDots = Math.floor(receiptWidth / 15); // More dots for thermal receipt effect
  
  for (let i = 0; i < numDots; i++) {
    dots.push(
      <View key={i} style={getStyles(theme).perforationDot} />
    );
  }
  
  return (
    <View style={[getStyles(theme).perforatedContainer, isTop ? getStyles(theme).perforatedTop : getStyles(theme).perforatedBottom]}>
      {dots}
    </View>
  );
};

interface ThermalReceiptProps {
  transactionType: 'deposit' | 'transfer' | 'withdrawal';
  transactionId: string;
  amount: string | number;
  status: string;
  date?: string;
  recipientInfo?: {
    name?: string;
    method?: string;
    account?: string;
  };
  senderInfo?: {
    name?: string;
  };
  feeAmount?: string | number;
  netAmount?: string | number;
  additionalInfo?: Array<{
    label: string;
    value: string;
  }>;
  children?: React.ReactNode; // For custom content
}

const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
  transactionType,
  transactionId,
  amount,
  status,
  date,
  recipientInfo,
  senderInfo,
  feeAmount,
  netAmount,
  additionalInfo = [],
  children
}) => {
  const { theme } = useTheme();

  const getStatusColor = () => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('verified') || lowerStatus.includes('completed') || lowerStatus.includes('success')) {
      return theme.success;
    } else if (lowerStatus.includes('pending') || lowerStatus.includes('processing')) {
      return theme.warning;
    } else if (lowerStatus.includes('failed') || lowerStatus.includes('rejected')) {
      return theme.error;
    }
    return theme.textSecondary;
  };

  const getTransactionTitle = () => {
    switch (transactionType) {
      case 'deposit': return 'DEPOSIT RECEIPT';
      case 'transfer': return 'TRANSFER RECEIPT';
      case 'withdrawal': return 'WITHDRAWAL RECEIPT';
      default: return 'TRANSACTION RECEIPT';
    }
  };

  const formatAmount = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const formatDate = () => {
    if (date) return date;
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusText = () => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('verified') || lowerStatus.includes('completed')) {
      return 'VERIFIED ✓';
    } else if (lowerStatus.includes('success')) {
      return 'SUCCESS ✓';
    } else if (lowerStatus.includes('pending')) {
      return 'PENDING';
    } else if (lowerStatus.includes('processing')) {
      return 'PROCESSING';
    }
    return status.toUpperCase();
  };

  return (
    <View style={getStyles(theme).receiptContainer}>
      <PerforatedEdge isTop={true} theme={theme} />
      
      {/* Thermal Receipt Content */}
      <View style={getStyles(theme).receiptContent}>
        {/* Receipt Header with Thermal Style */}
        <View style={getStyles(theme).receiptHeader}>
          <Text style={getStyles(theme).thermalReceiptTitle}>HOOPAY WALLET</Text>
          <Text style={getStyles(theme).thermalReceiptSubtitle}>{getTransactionTitle()}</Text>
          <View style={getStyles(theme).thermalDivider} />
          <Text style={getStyles(theme).receiptDate}>{formatDate()}</Text>
        </View>

        {/* Transaction Details in Thermal Style */}
        <View style={getStyles(theme).receiptSection}>
          <View style={getStyles(theme).thermalRow}>
            <Text style={getStyles(theme).thermalLabel}>TXN ID:</Text>
            <Text style={getStyles(theme).thermalValue}>{transactionId}</Text>
          </View>
          
          <View style={getStyles(theme).thermalRow}>
            <Text style={getStyles(theme).thermalLabel}>AMOUNT:</Text>
            <Text style={getStyles(theme).thermalAmountValue}>${formatAmount(amount)}</Text>
          </View>
          
          {/* Sender Info for transfers */}
          {senderInfo?.name && (
            <View style={getStyles(theme).thermalRow}>
              <Text style={getStyles(theme).thermalLabel}>FROM:</Text>
              <Text style={getStyles(theme).thermalValue}>{senderInfo.name}</Text>
            </View>
          )}
          
          {/* Recipient Info */}
          {recipientInfo?.name && (
            <View style={getStyles(theme).thermalRow}>
              <Text style={getStyles(theme).thermalLabel}>TO:</Text>
              <Text style={getStyles(theme).thermalValue}>{recipientInfo.name}</Text>
            </View>
          )}
          
          {recipientInfo?.method && (
            <View style={getStyles(theme).thermalRow}>
              <Text style={getStyles(theme).thermalLabel}>METHOD:</Text>
              <Text style={getStyles(theme).thermalValue}>{recipientInfo.method}</Text>
            </View>
          )}
          
          {recipientInfo?.account && (
            <View style={getStyles(theme).thermalRow}>
              <Text style={getStyles(theme).thermalLabel}>ACCOUNT:</Text>
              <Text style={getStyles(theme).thermalValue}>{recipientInfo.account}</Text>
            </View>
          )}
          
          {/* Fee Information */}
          {feeAmount !== undefined && (
            <View style={getStyles(theme).thermalRow}>
              <Text style={getStyles(theme).thermalLabel}>FEE:</Text>
              <Text style={getStyles(theme).thermalValue}>${formatAmount(feeAmount)}</Text>
            </View>
          )}
          
          {/* Additional Info */}
          {additionalInfo.map((info, index) => (
            <View key={index} style={getStyles(theme).thermalRow}>
              <Text style={getStyles(theme).thermalLabel}>{info.label.toUpperCase()}:</Text>
              <Text style={getStyles(theme).thermalValue}>{info.value}</Text>
            </View>
          ))}
          
          <View style={getStyles(theme).thermalRow}>
            <Text style={getStyles(theme).thermalLabel}>STATUS:</Text>
            <Text style={[getStyles(theme).thermalValue, { color: getStatusColor(), fontWeight: 'bold' }]}>
              {getStatusText()}
            </Text>
          </View>
        </View>

        {/* Thermal Divider */}
        <View style={getStyles(theme).thermalDivider} />

        {/* Summary in Thermal Style */}
        <View style={getStyles(theme).receiptSummary}>
          <View style={getStyles(theme).thermalSummaryRow}>
            <Text style={getStyles(theme).thermalSummaryLabel}>
              {netAmount !== undefined ? 'NET AMOUNT' : 'TOTAL AMOUNT'}
            </Text>
            <Text style={getStyles(theme).thermalSummaryAmount}>
              ${formatAmount(netAmount !== undefined ? netAmount : amount)}
            </Text>
          </View>
        </View>

        {/* Custom Content */}
        {children}

        {/* Thermal Footer */}
        <View style={getStyles(theme).thermalFooter}>
          <View style={getStyles(theme).thermalDivider} />
          <Text style={getStyles(theme).thermalFooterText}>
            THANK YOU FOR USING HOOPAY
          </Text>
          <Text style={getStyles(theme).thermalFooterNote}>
            {status.toLowerCase().includes('verified') || status.toLowerCase().includes('completed') || status.toLowerCase().includes('success')
              ? 'TRANSACTION COMPLETED'
              : 'PROCESSING YOUR REQUEST'
            }
          </Text>
          <View style={getStyles(theme).thermalBarcode}>
            <Text style={getStyles(theme).barcodeText}>|||||||||||||||||||||||||||</Text>
          </View>
        </View>
      </View>
      
      <PerforatedEdge isTop={false} theme={theme} />
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  receiptContainer: {
    marginBottom: 24,
  },
  receiptContent: {
    backgroundColor: theme.surface,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.border,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  thermalReceiptTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.text,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 4,
  },
  thermalReceiptSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 12,
  },
  thermalDivider: {
    height: 1,
    backgroundColor: theme.text,
    marginVertical: 8,
    opacity: 0.3,
  },
  receiptDate: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  receiptSection: {
    marginBottom: 16,
  },
  thermalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  thermalLabel: {
    fontSize: 14,
    color: theme.text,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  thermalValue: {
    fontSize: 14,
    color: theme.text,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  thermalAmountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.primary,
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  receiptSummary: {
    marginBottom: 16,
  },
  thermalSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  thermalSummaryLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
    letterSpacing: 1,
  },
  thermalSummaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.primary,
  },
  thermalFooter: {
    alignItems: 'center',
    marginTop: 8,
  },
  thermalFooterText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.text,
    textAlign: 'center',
    letterSpacing: 1,
    marginVertical: 8,
  },
  thermalFooterNote: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  thermalBarcode: {
    marginTop: 8,
  },
  barcodeText: {
    fontSize: 24,
    color: theme.text,
    letterSpacing: -1,
    opacity: 0.7,
  },
  // Enhanced perforated edge styles
  perforatedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 5,
    overflow: 'hidden',
  },
  perforatedTop: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: theme.border,
    paddingVertical: 6,
    position: 'relative',
  },
  perforatedBottom: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: theme.border,
    paddingVertical: 6,
    position: 'relative',
  },
  perforationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.background,
    borderWidth: 0.5,
    borderColor: theme.border,
  },
});

export default ThermalReceipt; 