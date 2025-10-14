import { useState, useEffect, useCallback } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { useHealthKit } from './useHealthKit';
import { healthDataSyncManager } from '../services/healthDataSyncManager';
import { setLastPermissionCheckTimestamp } from '../utils/healthSyncStorage';

export interface PermissionSyncStatus {
  hasPermissions: boolean;
  isCheckingPermissions: boolean;
  isSyncing: boolean;
  lastSync?: Date;
  shouldSync: boolean;
  error?: string;
}

/**
 * Hook for managing HealthKit permission-based sync on iOS
 * Monitors permission changes and triggers sync when app becomes active
 */
export function useHealthKitPermissionSync() {
  const [syncStatus, setSyncStatus] = useState<PermissionSyncStatus>({
    hasPermissions: false,
    isCheckingPermissions: false,
    isSyncing: false,
    shouldSync: false,
  });

  const { hasPermissions, isAvailable, verifyPermissions } = useHealthKit();

  // Check if we should sync and update status
  const checkSyncStatus = useCallback(async () => {
    if (Platform.OS !== 'ios' || !isAvailable) {
      return;
    }

    try {
      setSyncStatus((prev) => ({ ...prev, isCheckingPermissions: true }));

      // Verify current permissions
      const currentPermissions = await verifyPermissions();

      // Get sync manager status
      const syncManagerStatus = await healthDataSyncManager.getSyncStatus();

      setSyncStatus((prev) => ({
        ...prev,
        hasPermissions: currentPermissions,
        shouldSync: syncManagerStatus.shouldSync,
        lastSync: syncManagerStatus.lastSync,
        isCheckingPermissions: false,
      }));

      // Update permission check timestamp
      await setLastPermissionCheckTimestamp(new Date());

      console.log('📱 Permission sync status updated:', {
        hasPermissions: currentPermissions,
        shouldSync: syncManagerStatus.shouldSync,
        lastSync: syncManagerStatus.lastSync?.toISOString(),
      });
    } catch (error) {
      console.error('Error checking sync status:', error);
      setSyncStatus((prev) => ({
        ...prev,
        isCheckingPermissions: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAvailable]); // verifyPermissions is stable from useHealthKit hook

  // Trigger sync if conditions are met
  const triggerSyncIfNeeded = useCallback(async () => {
    if (Platform.OS !== 'ios' || !isAvailable || !syncStatus.hasPermissions) {
      return;
    }

    if (!syncStatus.shouldSync) {
      console.log('📱 Skipping sync - not needed or no permissions');
      return;
    }

    try {
      setSyncStatus((prev) => ({ ...prev, isSyncing: true, error: undefined }));

      console.log('📱 Triggering iOS health data sync...');
      const result = await healthDataSyncManager.syncHealthData();

      if (result.success) {
        setSyncStatus((prev) => ({
          ...prev,
          isSyncing: false,
          shouldSync: false,
          lastSync: result.timestamp,
        }));
        console.log('✅ iOS health data sync completed successfully');
      } else {
        setSyncStatus((prev) => ({
          ...prev,
          isSyncing: false,
          error: result.error,
        }));
        console.error('❌ iOS health data sync failed:', result.error);
      }
    } catch (error) {
      console.error('Error during sync:', error);
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [isAvailable, syncStatus.hasPermissions, syncStatus.shouldSync]);

  // Handle app state changes
  const handleAppStateChange = useCallback(
    (nextAppState: AppStateStatus) => {
      if (Platform.OS !== 'ios' || !isAvailable) {
        return;
      }

      console.log('📱 App state changed to:', nextAppState);

      if (nextAppState === 'active') {
        // App became active, check permissions and sync if needed
        console.log('📱 App became active, checking permissions and sync status...');
        checkSyncStatus().then(() => {
          // After checking status, trigger sync if needed
          setTimeout(() => {
            triggerSyncIfNeeded();
          }, 1000); // Small delay to ensure app is fully active
        });
      }
    },
    [isAvailable, checkSyncStatus, triggerSyncIfNeeded],
  );

  // Manual sync function
  const manualSync = useCallback(
    async (forceSync: boolean = false) => {
      if (Platform.OS !== 'ios' || !isAvailable || !syncStatus.hasPermissions) {
        return false;
      }

      try {
        setSyncStatus((prev) => ({ ...prev, isSyncing: true, error: undefined }));

        console.log('📱 Manual iOS health data sync triggered...');
        const result = await healthDataSyncManager.syncHealthData(forceSync);

        if (result.success) {
          setSyncStatus((prev) => ({
            ...prev,
            isSyncing: false,
            shouldSync: false,
            lastSync: result.timestamp,
          }));
          console.log('✅ Manual iOS health data sync completed successfully');
          return true;
        } else {
          setSyncStatus((prev) => ({
            ...prev,
            isSyncing: false,
            error: result.error,
          }));
          console.error('❌ Manual iOS health data sync failed:', result.error);
          return false;
        }
      } catch (error) {
        console.error('Error during manual sync:', error);
        setSyncStatus((prev) => ({
          ...prev,
          isSyncing: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
        return false;
      }
    },
    [isAvailable, syncStatus.hasPermissions],
  );

  // Set up app state listener and initial check
  useEffect(() => {
    if (Platform.OS !== 'ios' || !isAvailable) {
      return;
    }

    // Set up app state listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Initial check when hook mounts
    checkSyncStatus();

    return () => {
      subscription?.remove();
    };
  }, [isAvailable, handleAppStateChange, checkSyncStatus]);

  // Update sync status when HealthKit permissions change
  useEffect(() => {
    if (Platform.OS !== 'ios' || !isAvailable) {
      return;
    }

    setSyncStatus((prev) => ({
      ...prev,
      hasPermissions,
    }));

    // If permissions were just granted, trigger sync
    if (hasPermissions && !syncStatus.isSyncing) {
      console.log('📱 HealthKit permissions detected, checking if sync is needed...');
      setTimeout(() => {
        triggerSyncIfNeeded();
      }, 500); // Small delay to ensure permissions are fully processed
    }
  }, [hasPermissions, isAvailable, syncStatus.isSyncing, triggerSyncIfNeeded]);

  return {
    ...syncStatus,
    checkSyncStatus,
    triggerSyncIfNeeded,
    manualSync,
  };
}
