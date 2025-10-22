module.exports = function (api) {
  api.cache(false);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
          },
        },
      ],
      'nativewind/babel',
      'react-native-reanimated/plugin',
    ],
  };
};
