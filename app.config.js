export default {
  expo: {
    name: 'Evra',
    slug: 'app',
    version: '1.0.3',
    orientation: 'portrait',
    icon: './assets/images/logo.png',
    scheme: 'app',
    userInterfaceStyle: 'automatic',
    newArchEnabled: false,
    ios: {
      bundleIdentifier: 'com.evra.app',
      supportsTablet: true,
      deploymentTarget: '16.0',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSHealthShareUsageDescription: 'Your own custom usage description',
        NSHealthUpdateUsageDescription: 'Your own custom usage description',
      },
    },
    android: {
      package: 'com.evra.app',
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#fdf4de',
      },
      edgeToEdgeEnabled: true,
      googleServicesFile: './google-services.json',
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/evra.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
        },
      ],
      [
        'expo-build-properties',
        {
          ios: {
            useFrameworks: 'static',
          },
        },
      ],
      [
        '@kingstinct/react-native-healthkit',
        {
          NSHealthShareUsageDescription: 'Your own custom usage description',
          NSHealthUpdateUsageDescription: 'Your own custom usage description',
          background: true,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      API_BASE_URL: 'https://api.evra.opengig.work',
      eas: {
        projectId: '0da319d3-c739-435f-8d48-4036b2df3c77',
      },
    },
  },
};
