import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys for iOS health data sync
const LAST_SYNC_TIMESTAMP_KEY = 'ios_health_last_sync_timestamp';
const LAST_PERMISSION_CHECK_KEY = 'ios_health_last_permission_check';

export interface SyncTimestamp {
  timestamp: number;
  date: Date;
}

/**
 * Get the last successful sync timestamp
 */
export const getLastSyncTimestamp = async (): Promise<Date | null> => {
  try {
    const timestampStr = await AsyncStorage.getItem(LAST_SYNC_TIMESTAMP_KEY);
    if (!timestampStr) {
      return null;
    }
    return new Date(parseInt(timestampStr));
  } catch (error) {
    console.error('Error getting last sync timestamp:', error);
    return null;
  }
};

/**
 * Set the last successful sync timestamp
 */
export const setLastSyncTimestamp = async (timestamp: Date): Promise<void> => {
  try {
    await AsyncStorage.setItem(LAST_SYNC_TIMESTAMP_KEY, timestamp.getTime().toString());
    console.log('📊 Updated last sync timestamp:', timestamp.toISOString());
  } catch (error) {
    console.error('Error setting last sync timestamp:', error);
  }
};

/**
 * Get the last permission check timestamp
 */
export const getLastPermissionCheckTimestamp = async (): Promise<Date | null> => {
  try {
    const timestampStr = await AsyncStorage.getItem(LAST_PERMISSION_CHECK_KEY);
    if (!timestampStr) {
      return null;
    }
    return new Date(parseInt(timestampStr));
  } catch (error) {
    console.error('Error getting last permission check timestamp:', error);
    return null;
  }
};

/**
 * Set the last permission check timestamp
 */
export const setLastPermissionCheckTimestamp = async (timestamp: Date): Promise<void> => {
  try {
    await AsyncStorage.setItem(LAST_PERMISSION_CHECK_KEY, timestamp.getTime().toString());
    console.log('📊 Updated last permission check timestamp:', timestamp.toISOString());
  } catch (error) {
    console.error('Error setting last permission check timestamp:', error);
  }
};

/**
 * Check if enough time has passed since last sync (1 hour threshold)
 */
export const shouldSyncHealthData = async (): Promise<{
  shouldSync: boolean;
  lastSync?: Date;
  timeSinceLastSync?: number;
}> => {
  try {
    const lastSync = await getLastSyncTimestamp();

    if (!lastSync) {
      // No previous sync, should sync
      return { shouldSync: true };
    }

    const now = new Date();
    const timeSinceLastSync = now.getTime() - lastSync.getTime();
    const syncThresholdMs = 60 * 60 * 1000; // 1 hour in milliseconds

    const shouldSync = timeSinceLastSync >= syncThresholdMs;

    console.log(`📊 Last health data sync: ${lastSync.toISOString()}`);
    console.log(`📊 Time since last sync: ${Math.round(timeSinceLastSync / (1000 * 60))} minutes`);
    console.log(`📊 Should sync: ${shouldSync}`);

    return {
      shouldSync,
      lastSync,
      timeSinceLastSync: Math.round(timeSinceLastSync / (1000 * 60)), // in minutes
    };
  } catch (error) {
    console.error('Error checking sync threshold:', error);
    // If there's an error, err on the side of syncing
    return { shouldSync: true };
  }
};

/**
 * Clear all sync timestamps (useful for logout or reset)
 */
export const clearSyncTimestamps = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([LAST_SYNC_TIMESTAMP_KEY, LAST_PERMISSION_CHECK_KEY]);
    console.log('📊 Cleared all sync timestamps');
  } catch (error) {
    console.error('Error clearing sync timestamps:', error);
  }
};
