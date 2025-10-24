export default {
  expo: {
    name: 'Evra',
    slug: 'evra',
    owner: 'evrahealth',
    version: '1.0.5',
    orientation: 'portrait',
    icon: './assets/images/logo.png',
    scheme: 'app',
    userInterfaceStyle: 'light',
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
        NSMicrophoneUsageDescription: 'Allow Evra to access your microphone for voice input in chat',
      },
      userInterfaceStyle: 'light',
    },
    android: {
      package: 'com.evra.app',
      userInterfaceStyle: 'light',
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#fdf4de',
      },
      edgeToEdgeEnabled: true,
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
      permissions: [
        // Steps and Activity (matching iOS HKQuantityTypeIdentifierStepCount)
        'android.permission.health.READ_STEPS',
        'android.permission.health.WRITE_STEPS',

        // Active Calories (matching iOS HKQuantityTypeIdentifierActiveEnergyBurned)
        'android.permission.health.READ_ACTIVE_CALORIES_BURNED',
        'android.permission.health.WRITE_ACTIVE_CALORIES_BURNED',

        // Distance (matching iOS HKQuantityTypeIdentifierDistanceWalkingRunning, HKQuantityTypeIdentifierDistanceCycling)
        'android.permission.health.READ_DISTANCE',
        'android.permission.health.WRITE_DISTANCE',

        // Floors Climbed (matching iOS HKQuantityTypeIdentifierFlightsClimbed)
        'android.permission.health.READ_FLOORS_CLIMBED',
        'android.permission.health.WRITE_FLOORS_CLIMBED',

        // Exercise (matching iOS HKQuantityTypeIdentifierAppleExerciseTime)
        'android.permission.health.READ_EXERCISE',
        'android.permission.health.WRITE_EXERCISE',

        // Heart Rate (matching iOS HKQuantityTypeIdentifierHeartRate)
        'android.permission.health.READ_HEART_RATE',
        'android.permission.health.WRITE_HEART_RATE',

        // Resting Heart Rate (matching iOS HKQuantityTypeIdentifierRestingHeartRate)
        'android.permission.health.READ_RESTING_HEART_RATE',
        'android.permission.health.WRITE_RESTING_HEART_RATE',

        // Blood Pressure (matching iOS HKQuantityTypeIdentifierBloodPressureSystolic, HKQuantityTypeIdentifierBloodPressureDiastolic)
        'android.permission.health.READ_BLOOD_PRESSURE',
        'android.permission.health.WRITE_BLOOD_PRESSURE',

        // VO2 Max (matching iOS HKQuantityTypeIdentifierVO2Max)
        'android.permission.health.READ_VO2_MAX',
        'android.permission.health.WRITE_VO2_MAX',

        // Weight (matching iOS HKQuantityTypeIdentifierBodyMass)
        'android.permission.health.READ_WEIGHT',
        'android.permission.health.WRITE_WEIGHT',

        // Body Fat (matching iOS HKQuantityTypeIdentifierBodyFatPercentage)
        'android.permission.health.READ_BODY_FAT',
        'android.permission.health.WRITE_BODY_FAT',

        // Lean Body Mass (matching iOS HKQuantityTypeIdentifierLeanBodyMass)
        'android.permission.health.READ_LEAN_BODY_MASS',
        'android.permission.health.WRITE_LEAN_BODY_MASS',

        // Body Temperature (matching iOS HKQuantityTypeIdentifierBodyTemperature)
        'android.permission.health.READ_BODY_TEMPERATURE',
        'android.permission.health.WRITE_BODY_TEMPERATURE',

        // Respiratory Rate (matching iOS HKQuantityTypeIdentifierRespiratoryRate)
        'android.permission.health.READ_RESPIRATORY_RATE',
        'android.permission.health.WRITE_RESPIRATORY_RATE',

        // Oxygen Saturation (matching iOS HKQuantityTypeIdentifierOxygenSaturation)
        'android.permission.health.READ_OXYGEN_SATURATION',
        'android.permission.health.WRITE_OXYGEN_SATURATION',

        // Blood Glucose (matching iOS HKQuantityTypeIdentifierBloodGlucose)
        'android.permission.health.READ_BLOOD_GLUCOSE',
        'android.permission.health.WRITE_BLOOD_GLUCOSE',

        // Sleep (matching iOS HKCategoryTypeIdentifierSleepAnalysis)
        'android.permission.health.READ_SLEEP',
        'android.permission.health.WRITE_SLEEP',

        // Nutrition (matching iOS dietary types: HKQuantityTypeIdentifierDietaryCaffeine, HKQuantityTypeIdentifierDietaryWater, etc.)
        'android.permission.health.READ_NUTRITION',
        'android.permission.health.WRITE_NUTRITION',

        // Hydration (matching iOS HKQuantityTypeIdentifierDietaryWater)
        'android.permission.health.READ_HYDRATION',
        'android.permission.health.WRITE_HYDRATION',

        // Background Access
        'android.permission.health.READ_HEALTH_DATA_IN_BACKGROUND',

        // Audio Recording for voice input
        'android.permission.RECORD_AUDIO',
      ],
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-document-picker',
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
            newArchEnabled: false,
          },
          android: {
            minSdkVersion: 26,
            newArchEnabled: false,
            excludedModules: ['react-native-worklets'],
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
      'expo-health-connect',
      'expo-background-task',
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      API_BASE_URL: process.env.API_BASE_URL,
      eas: {
        projectId: '29057e40-c485-49b4-a2b4-6c71c1878caa',
      },
    },
  },
  updates: {
    url: 'https://u.expo.dev/29057e40-c485-49b4-a2b4-6c71c1878caa',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
};
