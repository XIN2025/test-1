import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { hourlyHealthDataFetcher } from './hourlyHealthDataFetcher';
import { healthDataSyncManager } from './healthDataSyncManager';

// Background task identifier
const HEALTH_DATA_SYNC_TASK = 'health-data-sync';

// Storage keys
const LAST_SYNC_KEY = 'lastHealthDataSync';
const LAST_UPDATED_HEALTH_DATA_KEY = 'lastUpdatedHealthData';
const HEALTH_DATA_KEY = 'currentHealthData';

// API configuration
const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || 'https://api.evra.opengig.work';

interface HealthMetric {
  value: number;
  unit: string;
  isAvailable: boolean;
  error: string;
}

interface HealthDataPayload {
  steps: HealthMetric;
  heartRate: HealthMetric;
  activeEnergy: HealthMetric;
  sleep: HealthMetric;
  weight: HealthMetric;
  bodyFat: HealthMetric;
  bloodGlucose: HealthMetric;
  oxygenSaturation: HealthMetric;
}

// Note: createDefaultMetric function removed - now using hourlyHealthDataFetcher

// Helper function to check if we should sync (only sync once per hour)
const shouldSyncHealthData = async (): Promise<{
  shouldSync: boolean;
  lastUpdated?: Date;
  timeSinceLastUpdate?: number;
}> => {
  try {
    const lastUpdatedStr = await AsyncStorage.getItem(LAST_UPDATED_HEALTH_DATA_KEY);

    if (!lastUpdatedStr) {
      // No previous update, should sync
      return { shouldSync: true };
    }

    const lastUpdated = new Date(parseInt(lastUpdatedStr));
    const now = new Date();
    const timeSinceLastUpdate = now.getTime() - lastUpdated.getTime();
    const syncThresholdMs = 60 * 60 * 1000; // 55 minutes in milliseconds

    const shouldSync = timeSinceLastUpdate >= syncThresholdMs;

    console.log(`📊 Last health data update: ${lastUpdated.toISOString()}`);
    console.log(`📊 Time since last update: ${Math.round(timeSinceLastUpdate / (1000 * 60))} minutes`);
    console.log(`📊 Should sync: ${shouldSync}`);

    return {
      shouldSync,
      lastUpdated,
      timeSinceLastUpdate: Math.round(timeSinceLastUpdate / (1000 * 60)), // in minutes
    };
  } catch (error) {
    console.error('❌ Error checking last update time:', error);
    // If there's an error reading the timestamp, err on the side of syncing
    return { shouldSync: true };
  }
};

// Helper function to update the last updated timestamp
const updateLastUpdatedTimestamp = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(LAST_UPDATED_HEALTH_DATA_KEY, Date.now().toString());
    console.log(`📊 Updated last health data timestamp: ${new Date().toISOString()}`);
  } catch (error) {
    console.error('❌ Error updating last updated timestamp:', error);
  }
};

// Define the background task
TaskManager.defineTask(HEALTH_DATA_SYNC_TASK, async () => {
  try {
    console.log('🔄 Background health data sync started at:', new Date().toISOString());

    // For iOS, use the new sync manager instead of background tasks
    if (Platform.OS === 'ios') {
      console.log('📱 iOS detected - using foreground sync manager instead of background task');
      const result = await healthDataSyncManager.syncHealthData();
      return result.success ? BackgroundTask.BackgroundTaskResult.Success : BackgroundTask.BackgroundTaskResult.Failed;
    }

    // Android background sync logic (unchanged)
    const userEmail = await AsyncStorage.getItem('userEmail');
    if (!userEmail) {
      console.log('❌ No user email found, skipping sync');
      return BackgroundTask.BackgroundTaskResult.Failed;
    }

    // Check if we should sync (only sync once per hour)
    const syncCheck = await shouldSyncHealthData();
    if (!syncCheck.shouldSync) {
      console.log(
        `⏰ Skipping sync - last update was ${syncCheck.timeSinceLastUpdate} minutes ago (less than 55 minutes)`,
      );
      return BackgroundTask.BackgroundTaskResult.Success;
    }

    // Fetch health data from last updated time to now
    console.log('📊 Fetching health data from last update to now for background sync...');
    const lastUpdated = syncCheck.lastUpdated;
    const hourlyHealthData = await hourlyHealthDataFetcher.fetchHealthDataFromTime(lastUpdated);

    // Convert hourly health data to the required payload format
    const payload: HealthDataPayload = {
      steps: {
        value: hourlyHealthData.steps.value,
        unit: hourlyHealthData.steps.unit,
        isAvailable: hourlyHealthData.steps.isAvailable,
        error: hourlyHealthData.steps.error,
      },
      heartRate: {
        value: hourlyHealthData.heartRate.value,
        unit: hourlyHealthData.heartRate.unit,
        isAvailable: hourlyHealthData.heartRate.isAvailable,
        error: hourlyHealthData.heartRate.error,
      },
      activeEnergy: {
        value: hourlyHealthData.activeEnergy.value,
        unit: hourlyHealthData.activeEnergy.unit,
        isAvailable: hourlyHealthData.activeEnergy.isAvailable,
        error: hourlyHealthData.activeEnergy.error,
      },
      sleep: {
        value: hourlyHealthData.sleep.value,
        unit: hourlyHealthData.sleep.unit,
        isAvailable: hourlyHealthData.sleep.isAvailable,
        error: hourlyHealthData.sleep.error,
      },
      weight: {
        value: hourlyHealthData.weight.value,
        unit: hourlyHealthData.weight.unit,
        isAvailable: hourlyHealthData.weight.isAvailable,
        error: hourlyHealthData.weight.error,
      },
      bodyFat: {
        value: hourlyHealthData.bodyFat.value,
        unit: hourlyHealthData.bodyFat.unit,
        isAvailable: hourlyHealthData.bodyFat.isAvailable,
        error: hourlyHealthData.bodyFat.error,
      },
      bloodGlucose: {
        value: hourlyHealthData.bloodGlucose.value,
        unit: hourlyHealthData.bloodGlucose.unit,
        isAvailable: hourlyHealthData.bloodGlucose.isAvailable,
        error: hourlyHealthData.bloodGlucose.error,
      },
      oxygenSaturation: {
        value: hourlyHealthData.oxygenSaturation.value,
        unit: hourlyHealthData.oxygenSaturation.unit,
        isAvailable: hourlyHealthData.oxygenSaturation.isAvailable,
        error: hourlyHealthData.oxygenSaturation.error,
      },
    };

    console.log('📊 Syncing health data for user:', userEmail.substring(0, 10) + '...');
    console.log('📊 Health data payload:', JSON.stringify(payload, null, 2));

    // Make API call
    const response = await fetch(`${API_BASE_URL}/api/health-alert/${encodeURIComponent(userEmail)}/hourly-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API request failed:', response.status, errorText);
      return BackgroundTask.BackgroundTaskResult.Failed;
    }

    const result = await response.json();
    console.log('✅ Health data sync successful:', result);

    // Update last sync timestamp
    await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());

    // Update last updated health data timestamp
    await updateLastUpdatedTimestamp();

    console.log('🎉 Background health data sync completed successfully at:', new Date().toISOString());
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.error('❌ Background health data sync failed:', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

// Service class to manage the background task
export class HealthDataBackgroundSync {
  private static instance: HealthDataBackgroundSync;

  private constructor() {}

  public static getInstance(): HealthDataBackgroundSync {
    if (!HealthDataBackgroundSync.instance) {
      HealthDataBackgroundSync.instance = new HealthDataBackgroundSync();
    }
    return HealthDataBackgroundSync.instance;
  }

  // Register the background task
  async registerTask(): Promise<void> {
    try {
      console.log('📱 Registering health data background sync task...');

      // For iOS, don't register background tasks - use foreground sync instead
      if (Platform.OS === 'ios') {
        console.log('📱 iOS detected - skipping background task registration, using foreground sync');
        return;
      }

      // Check if background tasks are available
      const status = await BackgroundTask.getStatusAsync();
      console.log('📱 Background task status:', BackgroundTask.BackgroundTaskStatus[status]);

      if (status === BackgroundTask.BackgroundTaskStatus.Restricted) {
        console.warn('⚠️ Background tasks are restricted on this device');
        return;
      }

      // Check if task is already registered
      const isRegistered = await TaskManager.isTaskRegisteredAsync(HEALTH_DATA_SYNC_TASK);
      if (isRegistered) {
        console.log('📱 Health data sync task is already registered');
        return;
      }

      // Register the task with 15-minute minimum interval (Android requirement)
      await BackgroundTask.registerTaskAsync(HEALTH_DATA_SYNC_TASK, {
        minimumInterval: 15, // 15 minutes minimum for Android compatibility
      });

      console.log('✅ Health data background sync task registered successfully');
    } catch (error) {
      console.error('❌ Failed to register background task:', error);
      throw error;
    }
  }

  // Unregister the background task
  async unregisterTask(): Promise<void> {
    try {
      console.log('📱 Unregistering health data background sync task...');

      // For iOS, nothing to unregister since we don't use background tasks
      if (Platform.OS === 'ios') {
        console.log('📱 iOS detected - no background task to unregister');
        return;
      }

      const isRegistered = await TaskManager.isTaskRegisteredAsync(HEALTH_DATA_SYNC_TASK);
      if (!isRegistered) {
        console.log('📱 Health data sync task is not registered');
        return;
      }

      await BackgroundTask.unregisterTaskAsync(HEALTH_DATA_SYNC_TASK);
      console.log('✅ Health data background sync task unregistered successfully');
    } catch (error) {
      console.error('❌ Failed to unregister background task:', error);
      throw error;
    }
  }

  // Store user email for the background task
  async setUserEmail(email: string): Promise<void> {
    try {
      await AsyncStorage.setItem('userEmail', email);
      console.log('📱 User email stored for background sync:', email.substring(0, 10) + '...');

      // Also store in iOS sync manager
      if (Platform.OS === 'ios') {
        await healthDataSyncManager.setUserEmail(email);
      }
    } catch (error) {
      console.error('❌ Failed to store user email:', error);
    }
  }

  // Clear user email (for logout)
  async clearUserEmail(): Promise<void> {
    try {
      await AsyncStorage.removeItem('userEmail');
      console.log('📱 User email cleared from background sync');

      // Also clear from iOS sync manager
      if (Platform.OS === 'ios') {
        await healthDataSyncManager.clearUserEmail();
      }
    } catch (error) {
      console.error('❌ Failed to clear user email:', error);
    }
  }

  // Update health data for syncing
  async updateHealthData(healthData: Partial<HealthDataPayload>): Promise<void> {
    try {
      // Get existing data
      const existingDataStr = await AsyncStorage.getItem(HEALTH_DATA_KEY);
      let existingData: Partial<HealthDataPayload> = {};

      if (existingDataStr) {
        try {
          existingData = JSON.parse(existingDataStr);
        } catch (error) {
          console.error('❌ Failed to parse existing health data:', error);
        }
      }

      // Merge with new data
      const updatedData = { ...existingData, ...healthData };

      // Store updated data
      await AsyncStorage.setItem(HEALTH_DATA_KEY, JSON.stringify(updatedData));

      console.log('📊 Health data updated for background sync:', Object.keys(healthData));
    } catch (error) {
      console.error('❌ Failed to update health data:', error);
    }
  }

  // Get last updated health data timestamp
  async getLastUpdatedHealthData(): Promise<Date | null> {
    try {
      const lastUpdatedStr = await AsyncStorage.getItem(LAST_UPDATED_HEALTH_DATA_KEY);
      return lastUpdatedStr ? new Date(parseInt(lastUpdatedStr)) : null;
    } catch (error) {
      console.error('❌ Failed to get last updated health data timestamp:', error);
      return null;
    }
  }

  // Get task status
  async getTaskStatus(): Promise<{
    isRegistered: boolean;
    status: BackgroundTask.BackgroundTaskStatus;
    lastSync?: Date;
    lastUpdatedHealthData?: Date;
  }> {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(HEALTH_DATA_SYNC_TASK);
      const status = await BackgroundTask.getStatusAsync();

      let lastSync: Date | undefined;
      const lastSyncStr = await AsyncStorage.getItem(LAST_SYNC_KEY);
      if (lastSyncStr) {
        lastSync = new Date(parseInt(lastSyncStr));
      }

      let lastUpdatedHealthData: Date | undefined;
      const lastUpdatedStr = await AsyncStorage.getItem(LAST_UPDATED_HEALTH_DATA_KEY);
      if (lastUpdatedStr) {
        lastUpdatedHealthData = new Date(parseInt(lastUpdatedStr));
      }

      return {
        isRegistered,
        status,
        lastSync,
        lastUpdatedHealthData,
      };
    } catch (error) {
      console.error('❌ Failed to get task status:', error);
      return {
        isRegistered: false,
        status: BackgroundTask.BackgroundTaskStatus.Restricted,
      };
    }
  }

  // Trigger task for testing (development only)
  async triggerTaskForTesting(): Promise<boolean> {
    try {
      console.log('🧪 Triggering background task for testing...');
      const result = await BackgroundTask.triggerTaskWorkerForTestingAsync();
      console.log('🧪 Background task test trigger result:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to trigger background task for testing:', error);
      return false;
    }
  }

  // Manual sync (can be called from foreground)
  async manualSync(forceSync: boolean = false): Promise<boolean> {
    try {
      console.log('🔄 Starting manual health data sync...');

      // For iOS, use the new sync manager
      if (Platform.OS === 'ios') {
        console.log('📱 iOS detected - using foreground sync manager for manual sync');
        const result = await healthDataSyncManager.syncHealthData(forceSync);
        return result.success;
      }

      // Android manual sync logic (unchanged)
      const userEmail = await AsyncStorage.getItem('userEmail');
      if (!userEmail) {
        console.log('❌ No user email found for manual sync');
        return false;
      }

      // Check if we should sync (only sync once per hour unless forced)
      if (!forceSync) {
        const syncCheck = await shouldSyncHealthData();
        if (!syncCheck.shouldSync) {
          console.log(
            `⏰ Skipping manual sync - last update was ${syncCheck.timeSinceLastUpdate} minutes ago (less than 55 minutes). Use forceSync=true to override.`,
          );
          return false;
        }
      }

      // Fetch health data from last updated time to now for manual sync
      console.log('📊 Fetching health data from last update to now for manual sync...');
      const lastUpdatedStr = await AsyncStorage.getItem(LAST_UPDATED_HEALTH_DATA_KEY);
      const lastUpdated = lastUpdatedStr ? new Date(parseInt(lastUpdatedStr)) : undefined;
      const hourlyHealthData = await hourlyHealthDataFetcher.fetchHealthDataFromTime(lastUpdated);

      // Convert hourly health data to the required payload format
      const payload: HealthDataPayload = {
        steps: {
          value: hourlyHealthData.steps.value,
          unit: hourlyHealthData.steps.unit,
          isAvailable: hourlyHealthData.steps.isAvailable,
          error: hourlyHealthData.steps.error,
        },
        heartRate: {
          value: hourlyHealthData.heartRate.value,
          unit: hourlyHealthData.heartRate.unit,
          isAvailable: hourlyHealthData.heartRate.isAvailable,
          error: hourlyHealthData.heartRate.error,
        },
        activeEnergy: {
          value: hourlyHealthData.activeEnergy.value,
          unit: hourlyHealthData.activeEnergy.unit,
          isAvailable: hourlyHealthData.activeEnergy.isAvailable,
          error: hourlyHealthData.activeEnergy.error,
        },
        sleep: {
          value: hourlyHealthData.sleep.value,
          unit: hourlyHealthData.sleep.unit,
          isAvailable: hourlyHealthData.sleep.isAvailable,
          error: hourlyHealthData.sleep.error,
        },
        weight: {
          value: hourlyHealthData.weight.value,
          unit: hourlyHealthData.weight.unit,
          isAvailable: hourlyHealthData.weight.isAvailable,
          error: hourlyHealthData.weight.error,
        },
        bodyFat: {
          value: hourlyHealthData.bodyFat.value,
          unit: hourlyHealthData.bodyFat.unit,
          isAvailable: hourlyHealthData.bodyFat.isAvailable,
          error: hourlyHealthData.bodyFat.error,
        },
        bloodGlucose: {
          value: hourlyHealthData.bloodGlucose.value,
          unit: hourlyHealthData.bloodGlucose.unit,
          isAvailable: hourlyHealthData.bloodGlucose.isAvailable,
          error: hourlyHealthData.bloodGlucose.error,
        },
        oxygenSaturation: {
          value: hourlyHealthData.oxygenSaturation.value,
          unit: hourlyHealthData.oxygenSaturation.unit,
          isAvailable: hourlyHealthData.oxygenSaturation.isAvailable,
          error: hourlyHealthData.oxygenSaturation.error,
        },
      };

      console.log('📊 Manual sync payload:', JSON.stringify(payload, null, 2));

      // Make API call
      const response = await fetch(`${API_BASE_URL}/api/health-alert/${encodeURIComponent(userEmail)}/hourly-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Manual sync API request failed:', response.status, errorText);
        return false;
      }

      const result = await response.json();
      console.log('✅ Manual health data sync successful:', result);

      // Update last sync timestamp
      await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());

      // Update last updated health data timestamp
      await updateLastUpdatedTimestamp();

      return true;
    } catch (error) {
      console.error('❌ Manual health data sync failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const healthDataBackgroundSync = HealthDataBackgroundSync.getInstance();
