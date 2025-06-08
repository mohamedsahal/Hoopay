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
  Dimensions,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import Svg, { Path, Circle, Line } from 'react-native-svg';

const { width } = Dimensions.get('window');

const AboutScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();

  const handleEmailPress = () => {
    Linking.openURL('mailto:info@hoopaywallet.com');
  };

  const handleWebsitePress = () => {
    Linking.openURL('https://hoopaywallet.com');
  };

  const InfoCard = ({ title, children, style = {} }) => (
    <View style={[getStyles(colors).infoCard, { backgroundColor: colors.surface }, style]}>
      <Text style={[getStyles(colors).cardTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );

  const ValueItem = ({ icon, title, description }) => (
    <View style={getStyles(colors).valueItem}>
      <View style={[getStyles(colors).valueIcon, { backgroundColor: colors.primaryLight }]}>
        {icon}
      </View>
      <View style={getStyles(colors).valueContent}>
        <Text style={[getStyles(colors).valueTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[getStyles(colors).valueDescription, { color: colors.textSecondary }]}>
          {description}
        </Text>
      </View>
    </View>
  );

  const ServiceItem = ({ title, description }) => (
    <View style={getStyles(colors).serviceItem}>
      <View style={[getStyles(colors).serviceBullet, { backgroundColor: colors.primary }]} />
      <View style={getStyles(colors).serviceContent}>
        <Text style={[getStyles(colors).serviceTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[getStyles(colors).serviceDescription, { color: colors.textSecondary }]}>
          {description}
        </Text>
      </View>
    </View>
  );

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
        <Text style={[getStyles(colors).headerTitle, { color: colors.text }]}>About Hoopay</Text>
        <View style={getStyles(colors).placeholder} />
      </View>

      <ScrollView 
        style={getStyles(colors).scrollView}
        contentContainerStyle={getStyles(colors).scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={getStyles(colors).heroSection}>
          <Text style={[getStyles(colors).appName, { color: colors.primary }]}>Hoopay</Text>
          <Text style={[getStyles(colors).tagline, { color: colors.text }]}>
            Banking & Budgeting in your Hand
          </Text>
        </View>

        {/* Our Story */}
        <InfoCard title="Our Story">
          <Text style={[getStyles(colors).bodyText, { color: colors.textSecondary }]}>
            Founded in 2016, Hoopay was born from a simple vision: to make financial services accessible to everyone, everywhere. We recognized that traditional banking systems often leave many underserved, with complicated processes and high fees creating barriers to financial inclusion.
          </Text>
          <Text style={[getStyles(colors).bodyText, { color: colors.textSecondary, marginTop: 12 }]}>
            Our team of financial experts and technology innovators came together to create a platform that simplifies banking, provides transparent services, and empowers users to take control of their financial journey with intuitive tools and resources.
          </Text>
        </InfoCard>

        {/* Our Mission */}
        <InfoCard title="Our Mission">
          <Text style={[getStyles(colors).bodyText, { color: colors.textSecondary }]}>
            At Hoopay, our mission is to democratize financial services by providing a secure, user-friendly platform that makes banking accessible to all. We believe that everyone deserves access to efficient, affordable, and transparent financial services.
          </Text>
        </InfoCard>

        {/* Our Values */}
        <InfoCard title="Our Values">
          <ValueItem
            icon={
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                  stroke={colors.primary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Circle cx="9" cy="7" r="4" stroke={colors.primary} strokeWidth="2" />
                <Path d="m22 21-3-3m0 0-3-3m3 3h-6m6 0v-6" stroke={colors.primary} strokeWidth="2" />
              </Svg>
            }
            title="Inclusion"
            description="Making financial services accessible to everyone regardless of background or location."
          />
          
          <ValueItem
            icon={
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                  stroke={colors.primary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            }
            title="Innovation"
            description="Continuously improving our platform with cutting-edge technology to deliver the best experience."
          />
          
          <ValueItem
            icon={
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke={colors.primary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            }
            title="Integrity"
            description="Operating with honesty, transparency, and the highest ethical standards in all our services."
          />
          
          <ValueItem
            icon={
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  stroke={colors.primary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            }
            title="Impact"
            description="Creating positive change in communities by empowering financial independence."
          />
        </InfoCard>

        {/* Our Services */}
        <InfoCard title="Our Services">
          <ServiceItem
            title="Digital Wallets"
            description="Secure, easy-to-use digital wallets for multiple currencies, with low fees and fast transactions."
          />
          <ServiceItem
            title="Money Transfers"
            description="Send and receive money globally with competitive exchange rates and minimal processing time."
          />
          <ServiceItem
            title="Financial Analytics"
            description="Intuitive tools to track spending, analyze financial habits, and set budgeting goals."
          />
          <ServiceItem
            title="Referral Program"
            description="Earn rewards by inviting friends and family to join our growing community of users."
          />
        </InfoCard>

        {/* Company Info */}
        <InfoCard title="Company Information">
          <View style={getStyles(colors).companyInfoGrid}>
            <View style={getStyles(colors).companyInfoItem}>
              <Text style={[getStyles(colors).companyInfoLabel, { color: colors.textSecondary }]}>Founded</Text>
              <Text style={[getStyles(colors).companyInfoValue, { color: colors.text }]}>2016</Text>
            </View>
            <View style={getStyles(colors).companyInfoItem}>
              <Text style={[getStyles(colors).companyInfoLabel, { color: colors.textSecondary }]}>Headquarters</Text>
              <Text style={[getStyles(colors).companyInfoValue, { color: colors.text }]}>Garowe, Somalia</Text>
            </View>
            <View style={getStyles(colors).companyInfoItem}>
              <Text style={[getStyles(colors).companyInfoLabel, { color: colors.textSecondary }]}>Status</Text>
              <Text style={[getStyles(colors).companyInfoValue, { color: colors.success }]}>Operational</Text>
            </View>
            <View style={getStyles(colors).companyInfoItem}>
              <Text style={[getStyles(colors).companyInfoLabel, { color: colors.textSecondary }]}>Version</Text>
              <Text style={[getStyles(colors).companyInfoValue, { color: colors.text }]}>1.0.0</Text>
            </View>
          </View>
        </InfoCard>

        {/* Why Choose Us */}
        <InfoCard title="Why Choose Us">
          <View style={getStyles(colors).benefitsList}>
            {[
              'Secure and encrypted transactions',
              '24/7 customer support',
              'Competitive fees and exchange rates',
              'User-friendly mobile and web platforms',
              'Transparent processing of all transactions'
            ].map((benefit, index) => (
              <View key={index} style={getStyles(colors).benefitItem}>
                <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    stroke={colors.success}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={[getStyles(colors).benefitText, { color: colors.textSecondary }]}>
                  {benefit}
                </Text>
              </View>
            ))}
          </View>
        </InfoCard>

        {/* Contact Information */}
        <InfoCard title="Contact Us">
          <TouchableOpacity style={getStyles(colors).contactItem} onPress={handleEmailPress}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <Path
                d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                stroke={colors.primary}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M22 6l-10 7L2 6"
                stroke={colors.primary}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <View style={getStyles(colors).contactContent}>
              <Text style={[getStyles(colors).contactLabel, { color: colors.textSecondary }]}>Email</Text>
              <Text style={[getStyles(colors).contactValue, { color: colors.primary }]}>info@hoopaywallet.com</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={getStyles(colors).contactItem} onPress={handleWebsitePress}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <Circle cx="12" cy="12" r="10" stroke={colors.primary} strokeWidth="2" />
              <Line x1="2" y1="12" x2="22" y2="12" stroke={colors.primary} strokeWidth="2" />
              <Path
                d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"
                stroke={colors.primary}
                strokeWidth="2"
              />
            </Svg>
            <View style={getStyles(colors).contactContent}>
              <Text style={[getStyles(colors).contactLabel, { color: colors.textSecondary }]}>Website</Text>
              <Text style={[getStyles(colors).contactValue, { color: colors.primary }]}>hoopaywallet.com</Text>
            </View>
          </TouchableOpacity>
        </InfoCard>

        {/* Footer */}
        <View style={getStyles(colors).footer}>
          <Text style={[getStyles(colors).footerText, { color: colors.textSecondary }]}>
            © 2025 Hoopay. All rights reserved.
          </Text>
          <Text style={[getStyles(colors).footerSubtext, { color: colors.textSecondary }]}>
            Experience the Hoopay difference today with our comprehensive financial services.
          </Text>
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
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 30,
    marginBottom: 20,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '500',
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  valueIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  valueContent: {
    flex: 1,
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  valueDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  serviceBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
    marginRight: 12,
  },
  serviceContent: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  companyInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  companyInfoItem: {
    width: '48%',
    marginBottom: 16,
  },
  companyInfoLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  companyInfoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  benefitsList: {
    marginTop: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contactContent: {
    marginLeft: 16,
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  footerSubtext: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default AboutScreen; 