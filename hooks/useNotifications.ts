import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import messaging from '@react-native-firebase/messaging';
import { nudgeApi } from '../services/nudgeApi';
import { STORAGE_KEYS, getStorageItem, setStorageItem, removeStorageItem } from '../utils/storage';

let globalNotificationsConfigured = false;

interface UseNotificationsOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onTokenRefresh?: (token: string) => void;
  onForegroundMessage?: (message: any) => void;
  onNotificationOpened?: (data: any) => void;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const useNotifications = (options: UseNotificationsOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined' | null>(null);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL;

  const checkPermissionStatus = async () => {
    try {
      if (!Constants.isDevice) {
        setPermissionStatus('denied');
        return 'denied';
      }

      const { status: expoStatus } = await Notifications.getPermissionsAsync();
      const finalStatus = expoStatus === 'granted' ? 'granted' : 'denied';
      setPermissionStatus(finalStatus);
      return finalStatus;
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      setPermissionStatus('denied');
      return 'denied';
    }
  };

  const requestPermissions = async () => {
    try {
      const authStatus = await messaging().requestPermission();
      const fcmEnabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!fcmEnabled) {
        console.log('FCM push notification permissions not granted');
        setPermissionStatus('denied');
        return 'denied';
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Expo notification permissions not granted');
        setPermissionStatus('denied');
        return 'denied';
      }

      setPermissionStatus('granted');
      return 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      setPermissionStatus('denied');
      return 'denied';
    }
  };

  const getFCMToken = async () => {
    try {
      const storedToken = await getStorageItem<string>(STORAGE_KEYS.FCM_TOKEN);

      const currentToken = await messaging().getToken();

      if (storedToken === currentToken && storedToken) {
        setFcmToken(storedToken);
        console.log('Using cached FCM token');
        return storedToken;
      }

      if (currentToken) {
        await setStorageItem(STORAGE_KEYS.FCM_TOKEN, currentToken);
        setFcmToken(currentToken);
        console.log('FCM token updated in storage');
        return currentToken;
      }
      throw new Error('Failed to get FCM token');
    } catch (error) {
      console.error('Error getting FCM token:', error);
      throw new Error('Failed to get push token');
    }
  };

  const getExpoPushToken = async () => {
    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      return token;
    } catch (error) {
      console.error('Error getting Expo push token:', error);
      throw new Error('Failed to get expo push token');
    }
  };

  const registerFCMToken = async (email: string, token: string) => {
    try {
      const { success, message } = await nudgeApi.registerFcmToken(email, token);
      if (!success) {
        throw new Error(message || 'Failed to register FCM token.');
      }
      return { success: true };
    } catch (error) {
      console.error('FCM token registration error:', error);
      throw error;
    }
  };

  const setupTokenRefreshHandler = () => {
    messaging().onTokenRefresh(async (newToken) => {
      console.log('FCM Token refreshed:', newToken);
      await setStorageItem(STORAGE_KEYS.FCM_TOKEN, newToken);
      setFcmToken(newToken);
      options.onTokenRefresh?.(newToken);
    });
  };

  const setupForegroundMessageHandler = () => {
    messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message received:', remoteMessage);
      options.onForegroundMessage?.(remoteMessage);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: remoteMessage.notification?.title || 'New Message',
          body: remoteMessage.notification?.body || 'You have a new message',
          data: remoteMessage.data || {},
        },
        trigger: null,
      });
    });
  };

  const setupNotificationResponseListener = () => {
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened app from background:', remoteMessage);
      options.onNotificationOpened?.(remoteMessage.data);
    });

    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('Notification opened app from quit state:', remoteMessage);
          options.onNotificationOpened?.(remoteMessage.data);
        }
      });

    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Expo notification response:', response);
      options.onNotificationOpened?.(response.notification.request.content.data);
    });
  };

  const configureNotifications = async () => {
    if (globalNotificationsConfigured) {
      console.log('Notifications already configured globally, skipping...');
      setIsConfigured(true);
      return;
    }

    try {
      await setupAndroidNotificationChannel();
      setupTokenRefreshHandler();
      setupForegroundMessageHandler();
      setupNotificationResponseListener();

      globalNotificationsConfigured = true;
      setIsConfigured(true);
      console.log('Notifications configured successfully (globally)');
    } catch (error) {
      console.error('Error configuring notifications:', error);
      throw error;
    }
  };

  const updateNotificationPreference = async (email: string, enabled: boolean) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/profile/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          notifications_enabled: enabled,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update notification preference');
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating notification preference:', error);
      throw error;
    }
  };

  const setupAndroidNotificationChannel = async () => {
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      } catch (error) {
        console.error('Error setting up Android notification channel:', error);
      }
    }
  };

  const enableNotifications = async (
    email: string,
    options: {
      showSuccessAlert?: boolean;
      updateProfile?: boolean;
      onSuccess?: () => void;
      onError?: (error: string) => void;
    } = {},
  ) => {
    const { showSuccessAlert = true, updateProfile = true, onSuccess, onError } = options;

    setIsLoading(true);
    try {
      await configureNotifications();

      const status = await requestPermissions();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive push notifications.',
        );
        return { success: false, error: 'Permission denied' };
      }

      const fcmToken = await getFCMToken();

      await registerFCMToken(email, fcmToken);

      if (updateProfile) {
        await updateNotificationPreference(email, true);
      }

      if (showSuccessAlert) {
        Alert.alert('Notifications enabled!', 'You will now receive nudges and reminders.');
      }

      onSuccess?.();
      return { success: true, token: fcmToken };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to enable notifications';

      if (showSuccessAlert) {
        Alert.alert('Error', errorMessage);
      }

      onError?.(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const disableNotifications = async (
    email: string,
    options: { showSuccessAlert?: boolean; onSuccess?: () => void; onError?: (error: string) => void } = {},
  ) => {
    const { showSuccessAlert = true, onSuccess, onError } = options;

    setIsLoading(true);
    try {
      await updateNotificationPreference(email, false);

      if (showSuccessAlert) {
        Alert.alert('Notifications Updated', 'Push notifications have been disabled.');
      }

      onSuccess?.();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disable notifications';

      if (showSuccessAlert) {
        Alert.alert('Error', errorMessage);
      }

      onError?.(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const toggleNotifications = async (
    email: string,
    enabled: boolean,
    options: { showSuccessAlert?: boolean; onSuccess?: () => void; onError?: (error: string) => void } = {},
  ) => {
    if (enabled) {
      return await enableNotifications(email, options);
    } else {
      return await disableNotifications(email, options);
    }
  };

  const refreshFCMToken = async (email?: string) => {
    try {
      const newToken = await getFCMToken();
      if (email && newToken) {
        await registerFCMToken(email, newToken);
      }
      return newToken;
    } catch (error) {
      console.error('Error refreshing FCM token:', error);
      throw error;
    }
  };

  const clearTokens = async () => {
    try {
      await removeStorageItem(STORAGE_KEYS.FCM_TOKEN);
      setFcmToken(null);
      setIsConfigured(false);
      globalNotificationsConfigured = false;
      console.log('Notification tokens cleared from storage and state');
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  };

  const loadCachedToken = async () => {
    try {
      const cachedToken = await getStorageItem<string>(STORAGE_KEYS.FCM_TOKEN);
      if (cachedToken) {
        setFcmToken(cachedToken);
        console.log('Loaded FCM token from cache');
      }
    } catch (error) {
      console.error('Error loading cached token:', error);
    }
  };

  useEffect(() => {
    const initializeNotifications = async () => {
      await loadCachedToken();

      const status = await checkPermissionStatus();
      if (status === 'granted') {
        await configureNotifications();
      }
    };

    initializeNotifications();
  }, []);

  return {
    isLoading,
    permissionStatus,
    fcmToken,
    isConfigured,
    checkPermissionStatus,
    enableNotifications,
    disableNotifications,
    toggleNotifications,
    requestPermissions,
    getFCMToken,
    getExpoPushToken,
    registerFCMToken,
    refreshFCMToken,
    clearTokens,
    configureNotifications,
    updateNotificationPreference,
    setupAndroidNotificationChannel,
  };
};
