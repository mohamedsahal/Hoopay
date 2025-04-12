import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  SafeAreaView,
  Image,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Svg, Path, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';

// Import the images
const profileImage = require('../assets/images/profile.jpg');
const walletImage = require('../assets/images/wallet.png');
const sahalImage = require('../assets/images/sahal.png');

const CurrencySelector = ({ 
  label, 
  selected, 
  amount, 
  onChangeAmount,
  onPress,
  iconImage
}) => (
  <View style={styles.currencySelector}>
    <Text style={styles.selectorLabel}>{label}</Text>
    <View style={styles.selectorContent}>
      <View style={styles.currencyLeft}>
        <View style={styles.currencyLogoContainer}>
          <Image source={iconImage} style={styles.currencyIcon} />
        </View>
        <Text style={styles.currencyName}>{selected.name}</Text>
        <TouchableOpacity onPress={onPress} style={styles.dropdownButton}>
          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <Path
              d="M6 9l6 6 6-6"
              stroke="#95a5a6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>
      
      <View style={styles.amountContainer}>
        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={onChangeAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor="#95a5a6"
        />
      </View>
    </View>
  </View>
);

// Custom Swap Button Component
const SwapButtonIcon = ({ onPress }) => {
  // Create an animated value for rotation
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    // Add rotation animation on press
    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true
    }).start(() => {
      rotateAnim.setValue(0);
      onPress();
    });
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  });

  return (
    <TouchableOpacity 
      style={styles.swapButtonContainer} 
      onPress={handlePress}
    >
      <Animated.View style={[styles.swapButton, { transform: [{ rotate: spin }] }]}>
        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <Path
            d="M7.5 21.5L4.5 18.5M4.5 18.5L7.5 15.5M4.5 18.5H15.5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M16.5 8.5L19.5 5.5M19.5 5.5L16.5 2.5M19.5 5.5H8.5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>
    </TouchableOpacity>
  );
};

const SwapScreen = () => {
  const insets = useSafeAreaInsets();
  const [fromCurrency, setFromCurrency] = useState({
    name: 'Sahal',
    symbol: 'SAH',
  });
  const [toCurrency, setToCurrency] = useState({
    name: 'Premier',
    symbol: 'PRE',
  });
  const [fromAmount, setFromAmount] = useState('0.00');
  const [toAmount, setToAmount] = useState('0.00');
  const [serviceCharge, setServiceCharge] = useState('0.00');
  const [netAmount, setNetAmount] = useState('$ 0.00');
  const [totalExchange, setTotalExchange] = useState('$ 0.00');

  const handleSwap = () => {
    // Swap currencies and amounts
    const tempCurrency = fromCurrency;
    const tempAmount = fromAmount;
    
    setFromCurrency(toCurrency);
    setFromAmount(toAmount);
    
    setToCurrency(tempCurrency);
    setToAmount(tempAmount);
  };

  const executeSwap = () => {
    // Implementation of actual swap execution
    console.log('Executing swap transaction...');
    // This would connect to your backend to perform the transaction
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top || 30 }]}>
        <View style={styles.userSection}>
          <View style={styles.profileImageContainer}>
            <Image source={profileImage} style={styles.profileImage} />
          </View>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>Hello <Text style={styles.username}>Mohamed</Text></Text>
            <Text style={styles.timeOfDay}>Good Night</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <Path
              d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
              stroke="#95a5a6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>
      
      {/* Total Exchange */}
      <View style={styles.totalExchangeContainer}>
        <Text style={styles.totalExchangeLabel}>Total Exchange</Text>
        <Text style={styles.totalExchangeValue}>{totalExchange}</Text>
      </View>
      
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContentContainer}>
        {/* Main Swap Cards with Overlap Design */}
        <View style={styles.swapCardsContainer}>
          {/* You Pay Card */}
          <View style={[styles.swapCard, styles.topCard]}>
            <CurrencySelector 
              label="You Pay" 
              selected={fromCurrency}
              amount={fromAmount}
              onChangeAmount={setFromAmount}
              onPress={() => {/* Handle currency selection */}}
              iconImage={sahalImage}
            />
          </View>
          
          {/* Swap Button - Positioned to overlap cards */}
          <View style={styles.centerSwapButtonContainer}>
            <TouchableOpacity onPress={handleSwap}>
              <View style={styles.centerSwapButton}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M7 16l-4-4m0 0l4-4m-4 4h18"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
            </TouchableOpacity>
          </View>
          
          {/* You Get Card */}
          <View style={[styles.swapCard, styles.bottomCard]}>
            <CurrencySelector 
              label="You Get" 
              selected={toCurrency}
              amount={toAmount}
              onChangeAmount={setToAmount}
              onPress={() => {/* Handle currency selection */}}
              iconImage={walletImage}
            />
          </View>
        </View>
        
        {/* Bottom Swap Button - Matching the screenshot */}
        <TouchableOpacity style={styles.mainSwapButton}>
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.mainSwapButtonGradient}
          >
            <Text style={styles.mainSwapButtonText}>Swap</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Transaction Details</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount</Text>
            <Text style={styles.summaryValue}>$ {fromAmount}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service Charge</Text>
            <View style={styles.serviceChargeContainer}>
              <View style={styles.serviceChargePill}>
                <Text style={styles.serviceChargePillText}>{serviceCharge}</Text>
              </View>
              <Text style={styles.summaryValue}>$ {serviceCharge}</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Net Amount</Text>
            <Text style={styles.netAmount}>{netAmount}</Text>
          </View>
        </View>
      </ScrollView>
      
      {/* Fixed Swap Button at Bottom */}
      <View style={[styles.bottomButtonContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 14 }]}>
        <TouchableOpacity 
          style={styles.bottomSwapButton}
          onPress={executeSwap}
        >
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bottomSwapButtonGradient}
          >
            <Text style={styles.bottomSwapButtonText}>Exchange Now</Text>
            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={styles.arrowIcon}>
              <Path
                d="M5 12h14M12 5l7 7-7 7"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    paddingTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  greetingContainer: {
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 18,
    color: '#333',
    fontWeight: '300',
  },
  username: {
    color: Colors.primary,
    fontWeight: '600',
  },
  timeOfDay: {
    fontSize: 13,
    color: '#95a5a6',
    marginTop: 1,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E1E8ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalExchangeContainer: {
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 12,
  },
  totalExchangeLabel: {
    fontSize: 15,
    color: '#95a5a6',
    marginBottom: 2,
  },
  totalExchangeValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  swapCardsContainer: {
    marginHorizontal: 16,
    marginTop: 24,
    position: 'relative',
    paddingBottom: 15,
    height: 250,
  },
  swapCard: {
    backgroundColor: '#EAF7EB',
    borderRadius: 24,
    padding: 24,
    shadowColor: 'rgba(0, 0, 0, 0.12)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(200, 230, 200, 0.8)',
  },
  topCard: {
    marginBottom: 55,
    height: 100,
    marginTop: 32,
  },
  bottomCard: {
    marginTop: -25,
    height: 100,
  },
  centerSwapButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '44%',
    alignItems: 'center',
    zIndex: 10,
    paddingTop: 15,
  },
  centerSwapButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  currencySelector: {
    marginVertical: 0,
  },
  selectorLabel: {
    fontSize: 12,
    color: '#4E7A51',
    fontWeight: '500',
    position: 'absolute',
    top: -24,
    left: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  selectorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0.65,
  },
  currencyLogoContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  currencyIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  currencyName: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
    flex: 1,
  },
  dropdownButton: {
    paddingHorizontal: 4,
  },
  amountContainer: {
    flex: 0.35,
    alignItems: 'flex-end',
  },
  amountInput: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
    minWidth: 70,
  },
  mainSwapButton: {
    marginHorizontal: 16,
    marginTop: 28,
    marginBottom: 20,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mainSwapButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainSwapButtonText: {
    color: Colors.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
  summary: {
    margin: 16,
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(230, 240, 230, 0.5)',
  },
  summaryHeader: {
    backgroundColor: '#F8FBFA',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF5F0',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#385A3C',
    letterSpacing: 0.2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6A8A71',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF5F0',
    marginHorizontal: 14,
  },
  serviceChargeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceChargePill: {
    backgroundColor: '#E1F5E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(78, 122, 81, 0.2)',
  },
  serviceChargePillText: {
    fontSize: 10,
    color: '#4E7A51',
    fontWeight: '600',
  },
  netAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#385A3C',
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    backgroundColor: 'rgba(245, 247, 250, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#E1E8ED',
  },
  bottomSwapButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  bottomSwapButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  bottomSwapButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  arrowIcon: {
    marginLeft: 4,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 100,
  },
});

export default SwapScreen; 