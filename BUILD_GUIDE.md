# HoopayApp Production APK Build Guide

## Quick Start Options

### Option 1: Local Build (After Terminal Restart)

1. **Close and reopen your PowerShell terminal as Administrator**
2. **Navigate to your project:**
   ```powershell
   cd "C:\Users\hoopa\OneDrive\Documents\MobileApp\HoopayApp"
   ```
3. **Run the automated setup script:**
   ```powershell
   .\build-setup.bat
   ```

**OR manually:**
```powershell
# Install Node.js 20.11.0
nvm install 20.11.0
nvm use 20.11.0

# Verify version
node --version  # Should show v20.11.0

# Install dependencies
npm install --legacy-peer-deps

# Build APK
eas build --platform android --profile production
```

### Option 2: GitHub Actions (Cloud Build)

1. **Push your code to GitHub**
2. **Add your Expo token to GitHub Secrets:**
   - Go to your GitHub repository
   - Go to Settings → Secrets and variables → Actions
   - Add new secret: `EXPO_TOKEN`
   - Get your token from: https://expo.dev/accounts/[username]/settings/access-tokens

3. **Trigger the build:**
   - Go to Actions tab in your GitHub repository
   - Click "Build APK" workflow
   - Click "Run workflow"

4. **Download your APK:**
   - After build completes, download from the Artifacts section

## Build Configuration

Your app is configured with:
- **App Name:** HoopayNew
- **Package:** com.exaliye.HoopayNew  
- **Build Type:** APK (for easy testing)
- **Firebase:** Configured with google-services.json

## Troubleshooting

**If you get Node.js version errors:**
- Make sure you're using Node.js 20.11.0 (not 22.x)
- Restart your terminal after installing NVM

**If dependencies fail:**
- Use `npm install --legacy-peer-deps`
- Clear cache: `npm cache clean --force`

**If EAS build fails:**
- Check your internet connection
- Verify your Expo account: `eas whoami`

## Current Status
✅ App configuration updated  
✅ Build profiles configured  
✅ Dependencies resolved  
✅ GitHub Actions workflow ready  
⏳ Waiting for Node.js version switch or GitHub build

## Support
Your APK will be generated with all necessary permissions and configurations for production testing. 