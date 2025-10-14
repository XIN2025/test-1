import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { useHealthDataBackgroundSync } from '../hooks/useHealthDataBackgroundSync';

export const HeadlessBackgroundSync: React.FC = () => {
  const { initializeBackgroundSync, syncStatus } = useHealthDataBackgroundSync();

  useEffect(() => {
    // Only initialize background sync for Android
    // iOS uses foreground sync only (handled elsewhere)
    if (Platform.OS === 'android' && !syncStatus.isRegistered) {
      initializeBackgroundSync();
    }
  }, [syncStatus.isRegistered, initializeBackgroundSync]);

  return null;
};

export default HeadlessBackgroundSync;
