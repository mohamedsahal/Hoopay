#!/usr/bin/env node

/**
 * Dependency Fix Script for React Native 0.74.5 + React 18.3.1 Compatibility
 * This script helps clean up and prepare for the new dependency versions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Starting React Native compatibility fix...\n');

// Helper function to run commands
function runCommand(command, description) {
  try {
    console.log(`📦 ${description}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed\n`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    console.log('Continuing with other fixes...\n');
  }
}

// Helper function to check if file exists
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// Main fix process
async function fixDependencies() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fileExists(packageJsonPath)) {
    console.error('❌ package.json not found. Please run this script from your project root.');
    process.exit(1);
  }

  console.log('1. Clearing npm cache...');
  runCommand('npm cache clean --force', 'Clearing npm cache');

  console.log('2. Removing node_modules and package-lock.json...');
  if (fileExists('node_modules')) {
    try {
      runCommand('rm -rf node_modules', 'Removing node_modules (Unix)');
    } catch {
      runCommand('rmdir /s /q node_modules', 'Removing node_modules (Windows)');
    }
  }
  
  if (fileExists('package-lock.json')) {
    fs.unlinkSync('package-lock.json');
    console.log('✅ Removed package-lock.json\n');
  }

  console.log('3. Installing compatible dependencies...');
  runCommand('npm install', 'Installing new dependencies');

  console.log('4. Installing additional compatibility packages...');
  runCommand('npm install @react-native/metro-config @babel/plugin-transform-private-property-in-object babel-plugin-transform-remove-console --save-dev', 'Installing compatibility packages');

  console.log('5. Running Metro bundler reset...');
  runCommand('npx expo r -c', 'Resetting Metro bundler cache');

  console.log('6. Checking for potential issues...');
  
  // Check React versions
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const reactVersion = packageJson.dependencies?.react;
    const reactNativeVersion = packageJson.dependencies?.['react-native'];
    
    console.log(`📋 React version: ${reactVersion}`);
    console.log(`📋 React Native version: ${reactNativeVersion}`);
    
    if (reactVersion && reactVersion.includes('19')) {
      console.warn('⚠️  Warning: React 19 detected. Consider downgrading to React 18.3.1 for better compatibility.');
    }
    
    if (reactNativeVersion && (reactNativeVersion.includes('0.79') || reactNativeVersion.includes('0.80'))) {
      console.warn('⚠️  Warning: React Native 0.79+ detected. Consider using 0.74.5 for better stability.');
    }
    
  } catch (error) {
    console.warn('⚠️  Could not verify package versions:', error.message);
  }

  console.log('\n🎉 Dependency fix process completed!');
  console.log('\nNext steps:');
  console.log('1. Run: npx expo start --clear');
  console.log('2. If you encounter issues, try: npm run ios or npm run android');
  console.log('3. Check the console for any remaining compatibility warnings');
  console.log('\n📚 The compatibility polyfill has been added to handle runtime issues.');
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run the fix
fixDependencies().catch((error) => {
  console.error('❌ Fix process failed:', error);
  process.exit(1);
}); 