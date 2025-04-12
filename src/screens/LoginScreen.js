import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../constants/Colors';
import { Svg, Path } from 'react-native-svg';
import ColorLogo from '../assets/images/color logo.svg';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const formRef = useRef(null);

  const handleLogin = () => {
    // UI only - would normally handle login logic here
    navigation.replace('Main');
  };

  const handleGoogleLogin = () => {
    // UI only - would normally handle Google login here
    navigation.replace('Main');
  };

  const handleFacebookLogin = () => {
    // UI only - would normally handle Facebook login here
    navigation.replace('Main');
  };

  const navigateToSignup = () => {
    navigation.navigate('Signup');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Animatable.View 
            animation="fadeIn" 
            duration={1000} 
            style={styles.logoContainer}
          >
            <ColorLogo width={420} height={80} />
          </Animatable.View>

          <Animatable.Text
            animation="fadeIn"
            duration={1000}
            style={styles.headerTitle}
          >
            Welcome to Hoopay
          </Animatable.Text>
          <Text style={styles.headerSubtitle}>Swap money securely and easily</Text>
        </View>

        <Animatable.View
          ref={formRef}
          animation="fadeInUp"
          duration={800}
          delay={300}
          style={styles.formContainer}
        >
          <View style={styles.inputContainer}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={styles.inputIcon}>
              <Path
                d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6ZM20 6L12 11L4 6H20ZM20 18H4V8L12 13L20 8V18Z"
                fill={Colors.textSecondary}
              />
            </Svg>
            <TextInput
              ref={emailInputRef}
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputContainer}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={styles.inputIcon}>
              <Path
                d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17ZM15.1 8H8.9V6C8.9 4.29 10.29 2.9 12 2.9C13.71 2.9 15.1 4.29 15.1 6V8Z"
                fill={Colors.textSecondary}
              />
            </Svg>
            <TextInput
              ref={passwordInputRef}
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={Colors.textSecondary}
              secureTextEntry={!isPasswordVisible}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.passwordVisibilityButton}
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            >
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <Path
                  d={
                    isPasswordVisible
                      ? "M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z"
                      : "M12 6C15.79 6 19.17 8.13 20.82 12C19.17 15.87 15.79 18 12 18C8.21 18 4.83 15.87 3.18 12C4.83 8.13 8.21 6 12 6ZM12 4C7 4 2.73 7.11 1 12C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12C21.27 7.11 17 4 12 4ZM12 9C13.38 9 14.5 10.12 14.5 11.5C14.5 12.88 13.38 14 12 14C10.62 14 9.5 12.88 9.5 11.5C9.5 10.12 10.62 9 12 9ZM12 7C9.52 7 7.5 9.02 7.5 11.5C7.5 13.98 9.52 16 12 16C14.48 16 16.5 13.98 16.5 11.5C16.5 9.02 14.48 7 12 7Z"
                  }
                  fill={Colors.textSecondary}
                />
              </Svg>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotPasswordButton}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogin}>
            <LinearGradient
              colors={[Colors.gradientStart, Colors.gradientEnd]}
              style={styles.loginButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.loginButtonText}>LOG IN</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>OR</Text>
            <View style={styles.separatorLine} />
          </View>

          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: Colors.google }]}
              onPress={handleGoogleLogin}
            >
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.56V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z"
                  fill="white"
                />
                <Path
                  d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.56C14.75 18.22 13.48 18.62 12 18.62C9.11 18.62 6.66 16.65 5.82 13.91H2.14V16.76C3.95 20.42 7.69 23 12 23Z"
                  fill="white"
                />
                <Path
                  d="M5.82 13.91C5.59 13.25 5.46 12.53 5.46 11.79C5.46 11.05 5.59 10.33 5.82 9.67V6.82H2.14C1.41 8.31 1 9.96 1 11.79C1 13.62 1.41 15.27 2.14 16.76L5.82 13.91Z"
                  fill="white"
                />
                <Path
                  d="M12 5.38C13.62 5.38 15.06 5.94 16.21 7.02L19.35 3.89C17.46 2.14 14.97 1 12 1C7.69 1 3.95 3.58 2.14 7.24L5.82 10.09C6.66 7.35 9.11 5.38 12 5.38Z"
                  fill="white"
                />
              </Svg>
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: Colors.facebook }]}
              onPress={handleFacebookLogin}
            >
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M20.0073 3H3.99274C3.44664 3 3 3.44664 3 3.99274V20.0073C3 20.5534 3.44664 21 3.99274 21H12.3689V14.3817H10.0151V11.5924H12.3689V9.57602C12.3689 7.20995 13.8797 5.86397 15.9971 5.86397C16.9981 5.86397 17.8577 5.93866 18.1071 5.97276V8.46919L16.7244 8.46991C15.6392 8.46991 15.4209 8.9898 15.4209 9.7516V11.5924H18.021L17.6784 14.3817H15.4209V21H20.0073C20.5534 21 21 20.5534 21 20.0073V3.99274C21 3.44664 20.5534 3 20.0073 3Z"
                  fill="white"
                />
              </Svg>
              <Text style={styles.socialButtonText}>Facebook</Text>
            </TouchableOpacity>
          </View>
        </Animatable.View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={navigateToSignup}>
            <Text style={styles.signupText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 0,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  formContainer: {
    paddingHorizontal: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: Colors.text,
    fontSize: 16,
  },
  passwordVisibilityButton: {
    padding: 8,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: 5,
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: Colors.secondary,
    fontSize: 14,
  },
  loginButton: {
    height: 55,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  loginButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  separatorText: {
    marginHorizontal: 10,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 15,
    flex: 0.48,
  },
  socialButtonText: {
    color: Colors.background,
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  signupText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 5,
  },
});

export default LoginScreen; 