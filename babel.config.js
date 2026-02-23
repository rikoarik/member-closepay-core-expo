const path = require('path');

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [require.resolve('babel-preset-expo')],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@core': path.resolve(__dirname, 'packages/core'),
            '@plugins': path.resolve(__dirname, 'packages/plugins'),
            '@app': path.resolve(__dirname, 'apps/member-base/src'),
          },
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
