import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useHealthKitPermissionSync } from '../hooks/useHealthKitPermissionSync';

/**
 * iOS-specific health data sync component
 * Handles foreground-only sync when app is active
 * No background sync since HealthKit data can't be accessed when device is locked
 */
export const IOSHealthDataSync: React.FC = () => {
  const { checkSyncStatus } = useHealthKitPermissionSync();
  const hasInitialized = useRef(false);
  const checkSyncStatusRef = useRef(checkSyncStatus);

  // Keep the ref updated
  useEffect(() => {
    checkSyncStatusRef.current = checkSyncStatus;
  }, [checkSyncStatus]);

  useEffect(() => {
    // Only run on iOS and only once
    if (Platform.OS !== 'ios' || hasInitialized.current) {
      return;
    }

    console.log('📱 iOS Health Data Sync component mounted - checking sync status...');
    hasInitialized.current = true;

    // Use setTimeout to avoid calling checkSyncStatus during render
    setTimeout(() => {
      checkSyncStatusRef.current();
    }, 100);
  }, []); // Empty dependency array to run only once

  // This component doesn't render anything
  return null;
};

export default IOSHealthDataSync;
