export default {
  expo: {
    name: 'Evra',
    slug: 'evra',
    owner: 'gamma-heizen',
    version: '1.0.5',
    orientation: 'portrait',
    icon: './assets/images/logo.png',
    scheme: 'app',
    userInterfaceStyle: 'automatic',
    newArchEnabled: false,
    ios: {
      bundleIdentifier: 'com.evra.app',
      supportsTablet: true,
      deploymentTarget: '16.0',
      googleServicesFile: process.env.GOOGLE_SERVICES_PLIST ?? './GoogleService-Info.plist',
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
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
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
      'expo-notifications',
      '@react-native-firebase/app',
      '@react-native-firebase/messaging',
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      API_BASE_URL: 'https://api.evra.opengig.work',
      eas: {
        projectId: 'e25ba26a-90e5-4708-a76c-63ba61de3089',
      },
    },
  },
  updates: {
    url: 'https://u.expo.dev/e25ba26a-90e5-4708-a76c-63ba61de3089',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
};
