import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { authService } from '../../services/auth';
import { useTheme } from '../../contexts/ThemeContext';
import Colors from '../../constants/Colors';

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
    referral_code: ''
  });
  const [loading, setLoading] = useState(false);

  // Use theme context with fallback
  let colors, isDarkMode;
  try {
    const theme = useTheme();
    colors = theme.colors;
    isDarkMode = theme.isDarkMode;
  } catch (error) {
    console.warn('ThemeContext not available in RegisterScreen, using default colors');
    colors = Colors;
    isDarkMode = false;
  }

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.password_confirmation) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const response = await authService.register(formData);

      if (response.success) {
        if (response.requiresVerification) {
          // Navigate to verification screen
          navigation.navigate('Verification', { email: formData.email });
        } else {
          // Navigate to main app if no verification required
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainApp' }],
          });
        }
      }
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error.message || 'An error occurred during registration'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>

      <TextInput
        style={[styles.input, { 
          borderColor: colors.border, 
          backgroundColor: colors.surface,
          color: colors.text 
        }]}
        placeholder="Full Name"
        placeholderTextColor={colors.placeholder}
        value={formData.name}
        onChangeText={(value) => updateFormData('name', value)}
        autoCapitalize="words"
      />

      <TextInput
        style={[styles.input, { 
          borderColor: colors.border, 
          backgroundColor: colors.surface,
          color: colors.text 
        }]}
        placeholder="Email"
        placeholderTextColor={colors.placeholder}
        value={formData.email}
        onChangeText={(value) => updateFormData('email', value)}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={[styles.input, { 
          borderColor: colors.border, 
          backgroundColor: colors.surface,
          color: colors.text 
        }]}
        placeholder="Password"
        placeholderTextColor={colors.placeholder}
        value={formData.password}
        onChangeText={(value) => updateFormData('password', value)}
        secureTextEntry
      />

      <TextInput
        style={[styles.input, { 
          borderColor: colors.border, 
          backgroundColor: colors.surface,
          color: colors.text 
        }]}
        placeholder="Confirm Password"
        placeholderTextColor={colors.placeholder}
        value={formData.password_confirmation}
        onChangeText={(value) => updateFormData('password_confirmation', value)}
        secureTextEntry
      />

      <TextInput
        style={[styles.input, { 
          borderColor: colors.border, 
          backgroundColor: colors.surface,
          color: colors.text 
        }]}
        placeholder="Phone (Optional)"
        placeholderTextColor={colors.placeholder}
        value={formData.phone}
        onChangeText={(text) => setFormData({ ...formData, phone: text })}
        keyboardType="phone-pad"
      />

      <TextInput
        style={[styles.input, { 
          borderColor: colors.border, 
          backgroundColor: colors.surface,
          color: colors.text 
        }]}
        placeholder="Referral Code (Optional)"
        placeholderTextColor={colors.placeholder}
        value={formData.referral_code}
        onChangeText={(text) => setFormData({ ...formData, referral_code: text })}
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Register</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('Login')}
        style={styles.loginButton}
      >
        <Text style={[styles.loginText, { color: colors.primary }]}>Already have an account? Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginButton: {
    marginTop: 20,
    padding: 10,
  },
  loginText: {
    fontSize: 16,
  },
}); 