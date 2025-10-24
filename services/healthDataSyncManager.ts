import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { hourlyHealthDataFetcher } from './hourlyHealthDataFetcher';
import { getLastSyncTimestamp, setLastSyncTimestamp, shouldSyncHealthData } from '../utils/healthSyncStorage';

// API configuration
const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || 'https://api.evra.opengig.work';

interface HealthMetric {
  value: number;
  unit: string;
  isAvailable: boolean;
  error?: string;
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

export interface SyncResult {
  success: boolean;
  error?: string;
  dataSynced?: boolean;
  timestamp?: Date;
}

/**
 * iOS-specific health data sync manager
 * Handles syncing health data when app becomes active (not in background)
 */
export class HealthDataSyncManager {
  private static instance: HealthDataSyncManager;

  private constructor() {}

  public static getInstance(): HealthDataSyncManager {
    if (!HealthDataSyncManager.instance) {
      HealthDataSyncManager.instance = new HealthDataSyncManager();
    }
    return HealthDataSyncManager.instance;
  }

  /**
   * Check if we should sync health data (iOS only)
   * Returns false for Android or if sync is not needed
   */
  public async shouldSync(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return false;
    }

    const syncCheck = await shouldSyncHealthData();
    return syncCheck.shouldSync;
  }

  /**
   * Sync health data from last sync timestamp to now (iOS only)
   */
  public async syncHealthData(forceSync: boolean = false): Promise<SyncResult> {
    try {
      if (Platform.OS !== 'ios') {
        return { success: true, dataSynced: false };
      }

      console.log('📱 Starting iOS health data sync...');

      // Get user email from storage
      const userEmail = await AsyncStorage.getItem('userEmail');
      if (!userEmail) {
        console.log('❌ No user email found, skipping sync');
        return { success: false, error: 'No user email found' };
      }

      // Check if we should sync (unless forced)
      if (!forceSync) {
        const syncCheck = await shouldSyncHealthData();
        if (!syncCheck.shouldSync) {
          console.log(
            `⏰ Skipping sync - last update was ${syncCheck.timeSinceLastSync} minutes ago (less than 1 hour). Use forceSync=true to override.`,
          );
          return { success: true, dataSynced: false };
        }
      }

      // Get last sync timestamp to fetch data from that point
      const lastSync = await getLastSyncTimestamp();
      console.log('📊 Fetching health data from last sync to now...');
      console.log('📊 Last sync:', lastSync ? lastSync.toISOString() : 'Never');

      // Fetch health data from last sync time to now
      const hourlyHealthData = await hourlyHealthDataFetcher.fetchHealthDataFromTime(lastSync);

      // Convert to API payload format
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
        return { success: false, error: `API request failed: ${response.status} ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ Health data sync successful:', result);

      // Update last sync timestamp
      const syncTimestamp = new Date();
      await setLastSyncTimestamp(syncTimestamp);

      console.log('🎉 iOS health data sync completed successfully at:', syncTimestamp.toISOString());
      return {
        success: true,
        dataSynced: true,
        timestamp: syncTimestamp,
      };
    } catch (error) {
      console.error('❌ iOS health data sync failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get sync status information
   */
  public async getSyncStatus(): Promise<{
    lastSync?: Date;
    shouldSync: boolean;
    timeSinceLastSync?: number;
  }> {
    if (Platform.OS !== 'ios') {
      return { shouldSync: false };
    }

    const syncCheck = await shouldSyncHealthData();
    return {
      lastSync: syncCheck.lastSync,
      shouldSync: syncCheck.shouldSync,
      timeSinceLastSync: syncCheck.timeSinceLastSync,
    };
  }

  /**
   * Store user email for sync operations
   */
  public async setUserEmail(email: string): Promise<void> {
    try {
      await AsyncStorage.setItem('userEmail', email);
      console.log('📱 User email stored for iOS sync:', email.substring(0, 10) + '...');
    } catch (error) {
      console.error('❌ Failed to store user email:', error);
    }
  }

  /**
   * Clear user email (for logout)
   */
  public async clearUserEmail(): Promise<void> {
    try {
      await AsyncStorage.removeItem('userEmail');
      console.log('📱 User email cleared from iOS sync');
    } catch (error) {
      console.error('❌ Failed to clear user email:', error);
    }
  }
}

// Export singleton instance
export const healthDataSyncManager = HealthDataSyncManager.getInstance();
