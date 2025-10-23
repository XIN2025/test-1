module.exports = function (api) {
  api.cache(true);

  const plugins = [
    [
      'babel-plugin-module-resolver',
      {
        root: ['./'],
        alias: {
          '@': './',
        },
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.android.js', '.android.tsx', '.ios.js', '.ios.tsx', '.json'],
      },
    ],
  ];

  plugins.push('react-native-reanimated/plugin');

  return {
    presets: ['babel-preset-expo', 'nativewind/babel'],
    plugins,
  };
};
