const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Configure path alias resolver
const { resolver } = config;
config.resolver = {
  ...resolver,
  alias: {
    '@': path.resolve(__dirname),
  },
  unstable_enablePackageExports: true,
  platforms: ['ios', 'android', 'native', 'web'],
  sourceExts: [...resolver.sourceExts, 'jsx', 'js', 'ts', 'tsx'],
};

module.exports = config;
