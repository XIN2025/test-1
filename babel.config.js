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
    'react-native-reanimated/plugin',
    'react-native-worklets/plugin', // Add this line
  ];

  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins,
  };
};
