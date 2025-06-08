import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const CommunityButton = () => {
  const navigation = useNavigation();

  const handlePress = () => {
    // Navigate to the separate Community stack
    navigation.navigate('Community');
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <MaterialIcons name="groups" size={26} color="#FFFFFF" />
        <Text style={styles.label}>Community</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    color: '#FFFFFF',
    marginTop: 5,
  },
});

export default CommunityButton; 