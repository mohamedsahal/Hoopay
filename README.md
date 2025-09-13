# Hoopay Wallet

A modern, secure mobile wallet application built with React Native and Expo, designed for seamless financial transactions and digital asset management.

## 📱 Features

- **Secure Authentication**: Biometric authentication (Face ID, Touch ID, Fingerprint)
- **Multi-Platform Support**: iOS, Android, and Web
- **Digital Wallet**: Send, receive, and manage digital assets
- **KYC Integration**: Know Your Customer verification system
- **Real-time Notifications**: Push notifications for transactions
- **Community Features**: Social interactions and referrals
- **Modern UI/UX**: Beautiful, responsive design with dark/light theme support

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v20.11.1 or higher)
- **npm** (v10.2.4 or higher)
- **Expo CLI** (latest version)
- **EAS CLI** (latest version)
- **Git**

### System Requirements

- **macOS**: For iOS development (Xcode required)
- **Windows/Linux/macOS**: For Android development (Android Studio recommended)
- **Minimum Android SDK**: 24 (Android 7.0)
- **Minimum iOS**: 12.0
- **Target Android SDK**: 36
- **Target iOS**: Latest

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/hoopay.git
cd hoopay
```

### 2. Install Dependencies

```bash
# Install project dependencies
npm install --legacy-peer-deps

# Install Expo CLI globally (if not already installed)
npm install -g @expo/cli

# Install EAS CLI globally (if not already installed)
npm install -g eas-cli@latest
```


## 🛠️ Development Setup

### Local Development

1. **Start the development server**:
   ```bash
   npm start
   # or
   expo start
   ```

2. **Run on specific platforms**:
   ```bash
   # Android
   npm run android
   # or
   expo run:android

   # iOS
   npm run ios
   # or
   expo run:ios

   # Web
   npm run web
   # or
   expo start --web
   ```

### Development Tools

- **Metro Bundler**: Automatically starts with `expo start`
- **Expo Dev Tools**: Available at `http://localhost:19002`
- **React Native Debugger**: For debugging React Native applications

## 📱 Platform-Specific Setup

### Android Setup

1. **Install Android Studio**:
   - Download from [developer.android.com](https://developer.android.com/studio)
   - Install Android SDK (API level 36)
   - Set up Android emulator or connect physical device

2. **Configure Android**:
   ```bash
   # Enable USB debugging on your Android device
   # Or start an Android emulator
   
   # Run on Android
   expo run:android
   ```

### iOS Setup (macOS only)

1. **Install Xcode**:
   - Download from Mac App Store
   - Install Xcode Command Line Tools
   - Set up iOS Simulator

2. **Configure iOS**:
   ```bash
   # Run on iOS Simulator
   expo run:ios
   
   # Or run on physical device (requires Apple Developer account)
   expo run:ios --device
   ```

## 🏗️ Build Configuration

### Project Structure

```
hoopay/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # App screens
│   ├── navigation/         # Navigation configuration
│   ├── services/           # API and business logic
│   ├── contexts/           # React contexts
│   ├── hooks/             # Custom hooks
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript type definitions
│   └── assets/            # Images, animations, etc.
├── assets/                # Static assets
├── android/               # Android-specific files (generated)
├── ios/                   # iOS-specific files (generated)
├── App.tsx               # Main app component
├── app.json              # Expo configuration
├── eas.json              # EAS Build configuration
├── babel.config.js       # Babel configuration
├── metro.config.js       # Metro bundler configuration
└── package.json          # Dependencies and scripts
```

### Key Configuration Files

- **`app.json`**: Expo app configuration
- **`eas.json`**: EAS Build profiles and settings
- **`babel.config.js`**: Babel transpilation settings
- **`metro.config.js`**: Metro bundler configuration
- **`tsconfig.json`**: TypeScript configuration

## 🚀 Deployment

### EAS Build Setup

1. **Login to Expo**:
   ```bash
   eas login
   ```

2. **Configure EAS**:
   ```bash
   eas build:configure
   ```

3. **Build for Development**:
   ```bash
   # Android APK
   eas build --platform android --profile development
   
   # iOS Simulator
   eas build --platform ios --profile development
   ```

4. **Build for Production**:
   ```bash
   # Android App Bundle (for Google Play Store)
   eas build --platform android --profile production
   
   # iOS App Store
   eas build --platform ios --profile production
   
   # Android APK (for direct distribution)
   eas build --platform android --profile production-apk
   ```

### Build Profiles

The project includes several build profiles in `eas.json`:

- **`development`**: Development builds with dev client
- **`preview`**: Internal distribution builds
- **`production`**: Production builds for app stores
- **`production-apk`**: Production APK for direct distribution
- **`production-simple`**: Minimal production configuration

### Environment Variables

Set up environment variables for different build profiles:

```bash
# Development
eas env:create --environment development --name API_URL --value "https://dev-api.hoopay.com"

# Production
eas env:create --environment production --name API_URL --value "https://api.hoopay.com"
```

## 🔧 Troubleshooting

### Common Issues

1. **Metro bundler issues**:
   ```bash
   # Clear Metro cache
   expo start --clear
   # or
   npx expo start --clear
   ```

2. **Dependency conflicts**:
   ```bash
   # Remove node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install --legacy-peer-deps
   ```

3. **Build failures**:
   ```bash
   # Clean and rebuild
   rm -rf android ios
   npx expo prebuild --clean
   ```

4. **EAS CLI outdated**:
   ```bash
   # Update EAS CLI
   npm install -g eas-cli@latest
   ```

### Platform-Specific Issues

#### Android
- Ensure Android SDK is properly installed
- Check that `ANDROID_HOME` environment variable is set
- Verify USB debugging is enabled on physical devices

#### iOS
- Ensure Xcode is up to date
- Check that iOS Simulator is installed
- Verify Apple Developer account for device builds

## 📚 Scripts

### Available Scripts

```bash
# Development
npm start                 # Start Expo development server
npm run android          # Run on Android
npm run ios              # Run on iOS
npm run web              # Run on web

# Building
eas build --platform android --profile production    # Build Android production
eas build --platform ios --profile production        # Build iOS production

# Utilities
npx expo install --check  # Check for outdated dependencies
npx expo prebuild --clean # Clean and regenerate native projects
```

## 🔐 Security

- **Biometric Authentication**: Secure access using device biometrics
- **Secure Storage**: Sensitive data encrypted using Expo SecureStore
- **API Security**: HTTPS endpoints with proper authentication
- **Code Obfuscation**: Production builds include code obfuscation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:

- **Documentation**: [Expo Docs](https://docs.expo.dev/)
- **Community**: [Expo Discord](https://chat.expo.dev/)
- **Issues**: [GitHub Issues](https://github.com/your-username/hoopay/issues)

## 🏆 Acknowledgments

- Built with [Expo](https://expo.dev/)
- Powered by [React Native](https://reactnative.dev/)
- UI components from [Expo Vector Icons](https://docs.expo.dev/guides/icons/)
- Animations by [Lottie](https://lottiefiles.com/)

---

**Happy Coding! 🚀**
