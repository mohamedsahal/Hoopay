import React, { useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Colors from '../constants/Colors';

const CommunityRedirectScreen = () => {
  const navigation = useNavigation();
  const hasNavigated = useRef(false);

  useFocusEffect(
    React.useCallback(() => {
      console.log('CommunityRedirectScreen focused - navigating to Community...');
      
      // Reset navigation flag when screen comes into focus
      hasNavigated.current = false;
      
      const timer = setTimeout(() => {
        if (!hasNavigated.current) {
          hasNavigated.current = true;
          console.log('Navigating to Community stack...');
          navigation.navigate('CommunityStack');
        }
      }, 1); // Even faster transition
      
      return () => {
        clearTimeout(timer);
      };
    }, [navigation])
  );

  // Return dark background to prevent white flash
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }} />
  );
};

export default CommunityRedirectScreen; 