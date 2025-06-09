// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('svg');
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');

module.exports = config; 