module.exports = function (api) {
  api.cache(true);

  const plugins = [
    // Worklets plugin must be last
    'react-native-worklets/plugin',
  ];

  // Add production plugins if available
  if (process.env.NODE_ENV === 'production') {
    try {
      require.resolve('babel-plugin-transform-remove-console');
      plugins.push(['babel-plugin-transform-remove-console', { exclude: ['error'] }]);
    } catch (error) {
      console.warn('babel-plugin-transform-remove-console not found, skipping console removal');
    }
  }

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};