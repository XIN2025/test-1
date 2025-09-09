import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { nudgeApi } from '../services/nudgeApi';

interface UseNotificationsOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const useNotifications = (options: UseNotificationsOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined' | null>(null);

  const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || 'http://localhost:8000';

  const checkPermissionStatus = async () => {
    try {
      if (!Constants.isDevice) {
        setPermissionStatus('denied');
        return 'denied';
      }
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
      return status;
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return 'denied';
    }
  };

  const requestPermissions = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      setPermissionStatus(finalStatus);
      return finalStatus;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      setPermissionStatus('denied');
      return 'denied';
    }
  };

  const getExpoPushToken = async () => {
    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      return token;
    } catch (error) {
      console.error('Error getting Expo push token:', error);
      throw new Error('Failed to get push token');
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
      const status = await requestPermissions();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive push notifications.',
        );
        return { success: false, error: 'Permission denied' };
      }

      const token = await getExpoPushToken();

      await registerFCMToken(email, token);

      if (updateProfile) {
        await updateNotificationPreference(email, true);
      }

      await setupAndroidNotificationChannel();

      if (showSuccessAlert) {
        Alert.alert('Notifications enabled!', 'You will now receive nudges and reminders.');
      }

      onSuccess?.();
      return { success: true, token };
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

  return {
    isLoading,
    permissionStatus,
    checkPermissionStatus,
    enableNotifications,
    disableNotifications,
    toggleNotifications,
    requestPermissions,
    getExpoPushToken,
    registerFCMToken,
    updateNotificationPreference,
    setupAndroidNotificationChannel,
  };
};
