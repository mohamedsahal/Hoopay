import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const VerificationBadge = ({ 
  level = 'basic', 
  status = 'unverified', 
  size = 'medium',
  showText = true,
  style = {}
}) => {
  
  const getBadgeConfig = () => {
    // For submitted but not yet verified (gray badge)
    if (status === 'pending' || status === 'submitted') {
      return {
        backgroundColor: '#9E9E9E', // Gray
        borderColor: '#757575',
        iconColor: 'white',
        textColor: '#9E9E9E',
        statusText: 'Under Review'
      };
    }
    
    // For verified status (green tick for all verified users)
    if (status === 'verified' || status === 'approved') {
      return {
        backgroundColor: '#4CAF50', // Green for all verified users
        borderColor: '#2E7D32',
        iconColor: 'white',
        textColor: '#4CAF50',
        statusText: level === 'advanced' ? 'Unlimited' : 'Verified'
      };
    }
    
    // For unverified/not started - don't show anything
    return null;
  };

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          badgeSize: 16,
          iconSize: 10,
          fontSize: 10,
          borderWidth: 1,
        };
      case 'medium':
        return {
          badgeSize: 20,
          iconSize: 12,
          fontSize: 12,
          borderWidth: 2,
        };
      case 'large':
        return {
          badgeSize: 24,
          iconSize: 14,
          fontSize: 14,
          borderWidth: 2,
        };
      default:
        return {
          badgeSize: 20,
          iconSize: 12,
          fontSize: 12,
          borderWidth: 2,
        };
    }
  };

  const badgeConfig = getBadgeConfig();
  
  // Don't render anything if not verified
  if (!badgeConfig) {
    return null;
  }
  
  const sizeConfig = getSizeConfig();

  const badgeStyle = {
    width: sizeConfig.badgeSize,
    height: sizeConfig.badgeSize,
    borderRadius: sizeConfig.badgeSize / 2,
    backgroundColor: badgeConfig.backgroundColor,
    borderWidth: sizeConfig.borderWidth,
    borderColor: badgeConfig.borderColor,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: badgeConfig.backgroundColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  };

  return (
    <View style={[styles.container, style]}>
      <View style={badgeStyle}>
        <Ionicons 
          name="checkmark" 
          size={sizeConfig.iconSize} 
          color={badgeConfig.iconColor} 
        />
      </View>
      
      {showText && (
        <Text style={[
          styles.statusText, 
          { 
            color: badgeConfig.textColor,
            fontSize: sizeConfig.fontSize,
            marginLeft: 4 
          }
        ]}>
          {badgeConfig.statusText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontWeight: '600',
  },
});

export default VerificationBadge; 