import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as BackgroundTask from 'expo-background-task';
import { healthDataBackgroundSync } from '../services/healthDataBackgroundSync';
import { useAuth } from '../context/AuthContext';

interface HealthMetric {
  value: number;
  unit: string;
  isAvailable: boolean;
  error: string;
}

interface HealthDataUpdate {
  steps?: HealthMetric;
  heartRate?: HealthMetric;
  activeEnergy?: HealthMetric;
  sleep?: HealthMetric;
  weight?: HealthMetric;
  bodyFat?: HealthMetric;
  bloodGlucose?: HealthMetric;
  oxygenSaturation?: HealthMetric;
}

export interface BackgroundSyncStatus {
  isRegistered: boolean;
  status: BackgroundTask.BackgroundTaskStatus;
  lastSync?: Date;
  lastUpdatedHealthData?: Date;
  isAvailable: boolean;
}

export const useHealthDataBackgroundSync = () => {
  const { user } = useAuth();
  const userEmail = user?.email;

  const [syncStatus, setSyncStatus] = useState<BackgroundSyncStatus>({
    isRegistered: false,
    status: BackgroundTask.BackgroundTaskStatus.Restricted,
    isAvailable: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // Convert health data from your existing format to the required format
  const convertHealthData = useCallback((healthData: any): HealthDataUpdate => {
    const converted: HealthDataUpdate = {};

    // Convert steps
    if (healthData.steps) {
      const hasValue = !!healthData.steps.value || !!healthData.steps.quantity;
      converted.steps = {
        value: healthData.steps.value || healthData.steps.quantity || 0,
        unit: 'count',
        isAvailable: hasValue,
        error: hasValue ? '' : 'No data available',
      };
    }

    // Convert heart rate
    if (healthData.heartRate) {
      const hasValue = !!healthData.heartRate.value || !!healthData.heartRate.quantity;
      converted.heartRate = {
        value: healthData.heartRate.value || healthData.heartRate.quantity || 0,
        unit: 'BPM',
        isAvailable: hasValue,
        error: hasValue ? '' : 'No data available',
      };
    }

    // Convert active energy
    if (healthData.activeEnergy) {
      const hasValue = !!healthData.activeEnergy.value || !!healthData.activeEnergy.quantity;
      converted.activeEnergy = {
        value: healthData.activeEnergy.value || healthData.activeEnergy.quantity || 0,
        unit: 'kcal',
        isAvailable: hasValue,
        error: hasValue ? '' : 'No data available',
      };
    }

    // Convert sleep
    if (healthData.sleep) {
      const sleepValue = healthData.sleep.value || healthData.sleep.quantity || 0;
      const hasValue = !!sleepValue;
      converted.sleep = {
        value: sleepValue,
        unit: 'hours',
        isAvailable: hasValue,
        error: hasValue ? '' : 'No data available',
      };
    }

    // Convert weight
    if (healthData.weight) {
      const hasValue = !!healthData.weight.value || !!healthData.weight.quantity;
      converted.weight = {
        value: healthData.weight.value || healthData.weight.quantity || 0,
        unit: 'kg',
        isAvailable: hasValue,
        error: hasValue ? '' : 'No data available',
      };
    }

    return converted;
  }, []);

  // Update sync status
  const updateSyncStatus = useCallback(async () => {
    try {
      const status = await healthDataBackgroundSync.getTaskStatus();
      setSyncStatus({
        ...status,
        isAvailable: status.status === BackgroundTask.BackgroundTaskStatus.Available,
      });
    } catch (error) {
      console.error('Failed to update sync status:', error);
      setLastError(error instanceof Error ? error.message : 'Unknown error');
    }
  }, []);

  // Initialize background sync
  const initializeBackgroundSync = useCallback(async () => {
    if (!userEmail) {
      console.log('No user email available for background sync initialization');
      return;
    }

    setIsLoading(true);
    setLastError(null);

    try {
      console.log('🚀 Initializing health data background sync for:', userEmail.substring(0, 10) + '...');

      // Set user email in the background service
      await healthDataBackgroundSync.setUserEmail(userEmail);

      // Register the background task
      await healthDataBackgroundSync.registerTask();

      // Update status
      await updateSyncStatus();

      console.log('✅ Health data background sync initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize background sync:', error);
      setLastError(error instanceof Error ? error.message : 'Initialization failed');
    } finally {
      setIsLoading(false);
    }
  }, [userEmail, updateSyncStatus]);

  // Cleanup background sync
  const cleanupBackgroundSync = useCallback(async () => {
    setIsLoading(true);
    setLastError(null);

    try {
      console.log('🧹 Cleaning up health data background sync...');

      // Unregister the background task
      await healthDataBackgroundSync.unregisterTask();

      // Clear user email
      await healthDataBackgroundSync.clearUserEmail();

      // Update status
      await updateSyncStatus();

      console.log('✅ Health data background sync cleaned up successfully');
    } catch (error) {
      console.error('❌ Failed to cleanup background sync:', error);
      setLastError(error instanceof Error ? error.message : 'Cleanup failed');
    } finally {
      setIsLoading(false);
    }
  }, [updateSyncStatus]);

  // Update health data for background sync
  const updateHealthData = useCallback(
    async (healthData: any) => {
      try {
        const convertedData = convertHealthData(healthData);
        await healthDataBackgroundSync.updateHealthData(convertedData);
        console.log('📊 Health data updated for background sync:', Object.keys(convertedData));
      } catch (error) {
        console.error('❌ Failed to update health data:', error);
        setLastError(error instanceof Error ? error.message : 'Failed to update health data');
      }
    },
    [convertHealthData],
  );

  // Manual sync
  const manualSync = useCallback(
    async (forceSync: boolean = false): Promise<boolean> => {
      setIsLoading(true);
      setLastError(null);

      try {
        console.log(`🔄 Starting manual health data sync${forceSync ? ' (forced)' : ''}...`);
        const success = await healthDataBackgroundSync.manualSync(forceSync);

        if (success) {
          console.log('✅ Manual sync completed successfully');
          await updateSyncStatus(); // Update last sync time
        } else {
          setLastError('Manual sync failed');
        }

        return success;
      } catch (error) {
        console.error('❌ Manual sync failed:', error);
        setLastError(error instanceof Error ? error.message : 'Manual sync failed');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [updateSyncStatus],
  );

  // Test background task (development only)
  const testBackgroundTask = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setLastError(null);

    try {
      console.log('🧪 Testing background task...');
      const success = await healthDataBackgroundSync.triggerTaskForTesting();

      if (success) {
        console.log('✅ Background task test completed');
        await updateSyncStatus(); // Update last sync time
      } else {
        setLastError('Background task test failed');
      }

      return success;
    } catch (error) {
      console.error('❌ Background task test failed:', error);
      setLastError(error instanceof Error ? error.message : 'Background task test failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [updateSyncStatus]);

  // Auto-initialize when user logs in
  useEffect(() => {
    if (userEmail && !syncStatus.isRegistered) {
      initializeBackgroundSync();
    }
  }, [userEmail, syncStatus.isRegistered, initializeBackgroundSync]);

  // Auto-cleanup when user logs out
  useEffect(() => {
    if (!userEmail && syncStatus.isRegistered) {
      cleanupBackgroundSync();
    }
  }, [userEmail, syncStatus.isRegistered, cleanupBackgroundSync]);

  // Update status on app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App came to foreground, update status
        updateSyncStatus();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [updateSyncStatus]);

  // Initial status check
  useEffect(() => {
    updateSyncStatus();
  }, [updateSyncStatus]);

  // Get sync timing information
  const getSyncTimingInfo = useCallback(async () => {
    try {
      const lastUpdated = await healthDataBackgroundSync.getLastUpdatedHealthData();
      if (!lastUpdated) {
        return { canSync: true, message: 'No previous sync found' };
      }

      const now = new Date();
      const timeSinceLastUpdate = now.getTime() - lastUpdated.getTime();
      const syncThresholdMs = 55 * 60 * 1000; // 55 minutes in milliseconds
      const minutesSinceLastUpdate = Math.round(timeSinceLastUpdate / (1000 * 60));

      if (timeSinceLastUpdate >= syncThresholdMs) {
        return {
          canSync: true,
          message: `Last sync was ${minutesSinceLastUpdate} minutes ago`,
          lastUpdated,
          minutesSinceLastUpdate,
        };
      } else {
        const minutesUntilNextSync = 55 - minutesSinceLastUpdate;
        return {
          canSync: false,
          message: `Last sync was ${minutesSinceLastUpdate} minutes ago. Next sync available in ${minutesUntilNextSync} minutes`,
          lastUpdated,
          minutesSinceLastUpdate,
          minutesUntilNextSync,
        };
      }
    } catch (error) {
      console.error('❌ Failed to get sync timing info:', error);
      return { canSync: true, message: 'Error checking sync status' };
    }
  }, []);

  return {
    // Status
    syncStatus,
    isLoading,
    lastError,

    // Actions
    initializeBackgroundSync,
    cleanupBackgroundSync,
    updateHealthData,
    manualSync,
    testBackgroundTask,
    updateSyncStatus,
    getSyncTimingInfo,

    // Helpers
    isAvailable: syncStatus.isAvailable,
    isRegistered: syncStatus.isRegistered,
    lastSync: syncStatus.lastSync,
    lastUpdatedHealthData: syncStatus.lastUpdatedHealthData,
  };
};
