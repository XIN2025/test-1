module.exports = function (api) {
  api.cache(true);

  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }]],
    plugins: [
      'nativewind/babel',
      'react-native-reanimated/plugin',
      require.resolve('expo-router/babel'),
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
          },
        },
      ],
    ],
  };
};
