module.exports = function (api) {
  api.cache(true);
  const plugins = [
    // Reanimated v4 uses worklets plugin
    'react-native-worklets/plugin',
  ];

  if (process.env.NODE_ENV === 'production') {
    // Strip console.* in production except errors
    plugins.push(['transform-remove-console', { exclude: ['error'] }]);
  }

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};