module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Worklets plugin must be last
      'react-native-worklets/plugin',
      // Production plugins
      ...(process.env.NODE_ENV === 'production' 
        ? [['transform-remove-console', { exclude: ['error'] }]]
        : []
      ),
    ],
  };
};