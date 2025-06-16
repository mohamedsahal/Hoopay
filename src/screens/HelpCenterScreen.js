import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  StatusBar,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import Svg, { Path, Circle, Line } from 'react-native-svg';

const HelpCenterScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();

  const handleWhatsAppPress = () => {
    const phoneNumber = '+252905251111';
    const message = 'Hello, I need help with my Hoopay account.';
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          const webUrl = `https://wa.me/${phoneNumber.replace('+', '')}?text=${encodeURIComponent(message)}`;
          return Linking.openURL(webUrl);
        }
      })
      .catch((err) => {
        Alert.alert('Error', 'Unable to open WhatsApp. Please contact us directly at +252905251111');
      });
  };

  const handleEmailPress = () => {
    const email = 'info@hoopaywallet.com';
    const subject = 'Help Request - Hoopay App';
    const body = 'Hi Hoopay Support Team,\n\nI need assistance with:\n\n[Please describe your issue here]\n\nThank you.';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('Email Not Available', `Please send an email to: ${email}`);
        }
      })
      .catch((err) => {
        Alert.alert('Error', `Unable to open email client. Please contact us at: ${email}`);
      });
  };

  const handleInstagramPress = () => {
    const username = 'hooexpress';
    const url = `instagram://user?username=${username}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          return Linking.openURL(`https://instagram.com/${username}`);
        }
      })
      .catch((err) => {
        Alert.alert('Error', 'Unable to open Instagram');
      });
  };

  const handleFacebookPress = () => {
    const pageName = 'HooPay1';
    const url = `fb://page/${pageName}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          return Linking.openURL(`https://facebook.com/${pageName}`);
        }
      })
      .catch((err) => {
        Alert.alert('Error', 'Unable to open Facebook');
      });
  };

  const handleTelegramPress = () => {
    const username = 'Hoopay1';
    const url = `tg://resolve?domain=${username}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          return Linking.openURL(`https://t.me/${username}`);
        }
      })
      .catch((err) => {
        Alert.alert('Error', 'Unable to open Telegram');
      });
  };



  return (
    <SafeAreaView style={[getStyles(colors).container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      
      {/* Header */}
      <View style={[getStyles(colors).header, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={getStyles(colors).backButton}
          onPress={() => navigation.goBack()}
        >
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path
              d="M19 12H5M12 19l-7-7 7-7"
              stroke={colors.text}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={[getStyles(colors).headerTitle, { color: colors.text }]}>Help Center</Text>
        <View style={getStyles(colors).placeholder} />
      </View>

      <ScrollView 
        style={getStyles(colors).scrollView}
        contentContainerStyle={getStyles(colors).scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={getStyles(colors).headerSection}>
          <Text style={[getStyles(colors).mainTitle, { color: colors.text }]}>
            Contact us
          </Text>
          <Text style={[getStyles(colors).subtitle, { color: colors.textSecondary }]}>
            If you need any help please contact us our WhatsApp number by clicking the below button thanks
          </Text>
        </View>

        {/* Contact Options */}
        <View style={getStyles(colors).contactList}>
          {/* WhatsApp Chat */}
          <TouchableOpacity 
            style={[getStyles(colors).contactOption, { backgroundColor: colors.surface }]} 
            onPress={handleWhatsAppPress}
            activeOpacity={0.7}
          >
            <View style={[getStyles(colors).iconContainer, { backgroundColor: '#25D366' }]}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M21 15.46l-5.27-.61-2.52 2.52c-2.83-1.44-5.15-3.75-6.59-6.59l2.53-2.52L8.54 3H3.03C2.45 13.18 10.82 21.55 21 20.97v-5.51z"
                  fill="white"
                />
              </Svg>
            </View>
            <View style={getStyles(colors).contactInfo}>
              <Text style={[getStyles(colors).optionTitle, { color: colors.text }]}>WhatsApp Chat</Text>
              <Text style={[getStyles(colors).optionSubtitle, { color: colors.textSecondary }]}>+252905251111</Text>
            </View>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <Path
                d="M9 18l6-6-6-6"
                stroke={colors.textSecondary}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          {/* Support Email */}
          <TouchableOpacity 
            style={[getStyles(colors).contactOption, { backgroundColor: colors.surface }]} 
            onPress={handleEmailPress}
            activeOpacity={0.7}
          >
            <View style={[getStyles(colors).iconContainer, { backgroundColor: colors.info || colors.primary }]}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M22 6l-10 7L2 6"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <View style={getStyles(colors).contactInfo}>
              <Text style={[getStyles(colors).optionTitle, { color: colors.text }]}>Support Email</Text>
              <Text style={[getStyles(colors).optionSubtitle, { color: colors.textSecondary }]}>info@hoopaywallet.com</Text>
            </View>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <Path
                d="M9 18l6-6-6-6"
                stroke={colors.textSecondary}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Social Media Grid */}
        <View style={getStyles(colors).socialSection}>
          <Text style={[getStyles(colors).sectionTitle, { color: colors.text }]}>Follow Us</Text>
          <View style={getStyles(colors).socialGrid}>
            {/* Instagram */}
            <TouchableOpacity 
              style={[getStyles(colors).socialItem, { backgroundColor: colors.surface }]} 
              onPress={handleInstagramPress}
              activeOpacity={0.7}
            >
              <View style={[getStyles(colors).socialIcon, { backgroundColor: '#E4405F' }]}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
                    fill="white"
                  />
                </Svg>
              </View>
              <Text style={[getStyles(colors).socialTitle, { color: colors.text }]}>Instagram</Text>
              <Text style={[getStyles(colors).socialHandle, { color: colors.textSecondary }]}>@hoopaywallet</Text>
            </TouchableOpacity>

            {/* Facebook */}
            <TouchableOpacity 
              style={[getStyles(colors).socialItem, { backgroundColor: colors.surface }]} 
              onPress={handleFacebookPress}
              activeOpacity={0.7}
            >
              <View style={[getStyles(colors).socialIcon, { backgroundColor: '#1877F2' }]}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <Text style={[getStyles(colors).socialTitle, { color: colors.text }]}>Facebook</Text>
              <Text style={[getStyles(colors).socialHandle, { color: colors.textSecondary }]}>HooPay1</Text>
            </TouchableOpacity>

            {/* Telegram */}
            <TouchableOpacity 
              style={[getStyles(colors).socialItem, { backgroundColor: colors.surface }]} 
              onPress={handleTelegramPress}
              activeOpacity={0.7}
            >
              <View style={[getStyles(colors).socialIcon, { backgroundColor: '#0088cc' }]}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 0C5.374 0 0 5.373 0 12s5.374 12 12 12 12-5.373 12-12S18.626 0 12 0zm5.568 8.16c-.169 1.858-1.135 6.173-1.607 8.184-.199.851-.591 1.138-.969 1.167-.822.075-1.446-.544-2.244-1.067-1.248-.819-1.954-1.329-3.168-2.129-1.402-.925-.491-1.434.305-2.266.208-.217 3.818-3.505 3.887-3.81.009-.039.017-.173-.065-.245s-.174-.05-.249-.03c-.106.029-1.778 1.13-5.029 3.32-.476.327-.908.487-1.296.48-.427-.008-1.248-.241-1.86-.44-.751-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.015 3.332-1.386 4.025-1.627 4.477-1.635.099-.001.32.023.464.141.121.099.155.232.171.326.016.062.037.201.02.311z"
                    fill="white"
                  />
                </Svg>
              </View>
              <Text style={[getStyles(colors).socialTitle, { color: colors.text }]}>Telegram</Text>
              <Text style={[getStyles(colors).socialHandle, { color: colors.textSecondary }]}>@Hoopay1</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Extra padding for safe area
  },
  headerSection: {
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
  },
  contactList: {
    marginTop: 20,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  socialSection: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  socialGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  socialItem: {
    width: '30%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  socialIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  socialTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  socialHandle: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
});

export default HelpCenterScreen; 