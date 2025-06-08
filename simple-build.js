const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Starting simple APK build for HoopayApp...');

try {
  // Check if we can access eas command
  console.log('📋 Checking build configuration...');
  
  // Create a simple build command
  console.log('🔨 Triggering build...');
  execSync('eas build --platform android --profile production --non-interactive', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('✅ Build started successfully!');
  console.log('📱 Your APK will be available at: https://expo.dev/accounts/exaliye/projects/HoopayNew/builds');
  
} catch (error) {
  console.log('❌ Build failed:', error.message);
  console.log('');
  console.log('🔄 Alternative: Visit https://expo.dev/accounts/exaliye/projects/HoopayNew');
  console.log('   Click "Builds" → "Create a build" → Select Android → Production');
} 