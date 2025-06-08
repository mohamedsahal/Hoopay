@echo off
echo Setting up Node.js 20.11.0 for HoopayApp build...

echo Installing Node.js 20.11.0...
nvm install 20.11.0

echo Switching to Node.js 20.11.0...
nvm use 20.11.0

echo Verifying Node.js version...
node --version

echo Installing dependencies...
npm install --legacy-peer-deps

echo Building production APK...
eas build --platform android --profile production

echo Build setup complete!
pause 