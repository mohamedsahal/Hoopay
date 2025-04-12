import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  Image,
  Switch
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Svg, Path } from 'react-native-svg';
import Colors from '../constants/Colors';

// Import the profile image
const profileImage = require('../assets/images/profile.jpg');

const SettingItem = ({ icon, title, description, hasSwitch, hasBadge, onPress }) => {
  const [isEnabled, setIsEnabled] = React.useState(false);
  const toggleSwitch = () => setIsEnabled(previousState => !previousState);
  
  return (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={hasSwitch}
    >
      <View style={styles.settingIconContainer}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      {hasSwitch && (
        <Switch
          trackColor={{ false: "#E0E0E0", true: Colors.primaryLight }}
          thumbColor={isEnabled ? Colors.primary : "#f4f3f4"}
          ios_backgroundColor="#E0E0E0"
          onValueChange={toggleSwitch}
          value={isEnabled}
        />
      )}
      {hasBadge && (
        <View style={styles.notificationBadge}>
          <Text style={styles.notificationBadgeText}>2</Text>
        </View>
      )}
      {!hasSwitch && !hasBadge && (
        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 18l6-6-6-6"
            stroke="#95a5a6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      )}
    </TouchableOpacity>
  );
};

const ProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  
  const handleLogout = () => {
    // Add logout logic here
    navigation.navigate('Login');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top || 30 }]}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            <Image source={profileImage} style={styles.profileImage} />
          </View>
          <Text style={styles.profileName}>Mohamed Nur Sahal</Text>
          <Text style={styles.profileEmail}>mohamedsahal@gmail.com</Text>
          <TouchableOpacity style={styles.editProfileButton}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
        
        {/* Account Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          
          <View style={styles.settingsCard}>
            <SettingItem
              icon={
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 15a3 3 0 100-6 3 3 0 000 6z"
                    stroke={Colors.primary}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
                    stroke={Colors.primary}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              }
              title="Account Security"
              description="Password, 2FA & Recovery"
              onPress={() => console.log('Account security pressed')}
            />
            
            <SettingItem
              icon={
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"
                    stroke={Colors.primary}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M13.73 21a2 2 0 01-3.46 0"
                    stroke={Colors.primary}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              }
              title="Notifications"
              description="Push & Email notifications"
              hasBadge={true}
              onPress={() => console.log('Notifications pressed')}
            />
            
            <SettingItem
              icon={
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M22 12h-4l-3 9L9 3l-3 9H2"
                    stroke={Colors.primary}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              }
              title="Activity History"
              description="View your account activity"
              onPress={() => console.log('Activity history pressed')}
            />
          </View>
        </View>
        
        {/* App Preferences */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>App Preferences</Text>
          
          <View style={styles.settingsCard}>
            <SettingItem
              icon={
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                    stroke={Colors.primary}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              }
              title="Privacy Settings"
              hasSwitch={true}
              onPress={() => console.log('Privacy settings pressed')}
            />
            
            <SettingItem
              icon={
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                    stroke={Colors.primary}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              }
              title="Dark Mode"
              hasSwitch={true}
              onPress={() => console.log('Dark mode pressed')}
            />
            
            <SettingItem
              icon={
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 2a10 10 0 100 20 10 10 0 000-20z"
                    stroke={Colors.primary}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M2 12h2M20 12h2M12 2v2M12 20v2"
                    stroke={Colors.primary}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              }
              title="Language"
              description="English (US)"
              onPress={() => console.log('Language pressed')}
            />
          </View>
        </View>
        
        {/* Help & About */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Help & About</Text>
          
          <View style={styles.settingsCard}>
            <SettingItem
              icon={
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                    stroke={Colors.primary}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M9.09 9.00001C9.3251 8.33167 9.78915 7.76811 10.4 7.40914C11.0108 7.05016 11.7289 6.91891 12.4272 7.03872C13.1255 7.15853 13.7588 7.52154 14.2151 8.06354C14.6713 8.60553 14.9211 9.29153 14.92 10C14.92 12 11.92 13 11.92 13"
                    stroke={Colors.primary}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M12 17H12.01"
                    stroke={Colors.primary}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              }
              title="Help Center"
              onPress={() => console.log('Help center pressed')}
            />
            
            <SettingItem
              icon={
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M8 3H5a2 2 0 00-2 2v14a2 2 0 002 2h3M16 3h3a2 2 0 012 2v14a2 2 0 01-2 2h-3M12 8v8M8 12h8"
                    stroke={Colors.primary}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              }
              title="About App"
              description="Version 1.0.0"
              onPress={() => console.log('About app pressed')}
            />
          </View>
        </View>
        
        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(200, 230, 200, 0.7)',
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 16,
    color: '#95a5a6',
    marginBottom: 15,
  },
  editProfileButton: {
    backgroundColor: Colors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  settingsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(200, 230, 200, 0.7)',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(230, 230, 230, 0.8)',
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(57, 183, 71, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  settingDescription: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 2,
  },
  notificationBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    marginVertical: 20,
    shadowColor: 'rgba(255, 107, 107, 0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default ProfileScreen; 