import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useHealthDataBackgroundSync } from '../hooks/useHealthDataBackgroundSync';
import * as BackgroundTask from 'expo-background-task';

interface HealthDataBackgroundSyncManagerProps {
  className?: string;
}

export const HealthDataBackgroundSyncManager: React.FC<HealthDataBackgroundSyncManagerProps> = ({ className = '' }) => {
  const {
    syncStatus,
    isLoading,
    lastError,
    initializeBackgroundSync,
    cleanupBackgroundSync,
    manualSync,
    testBackgroundTask,
    updateSyncStatus,
    getSyncTimingInfo,
  } = useHealthDataBackgroundSync();

  const handleManualSync = async (forceSync: boolean = false) => {
    try {
      // Check sync timing if not forcing
      if (!forceSync) {
        const timingInfo = await getSyncTimingInfo();
        if (!timingInfo.canSync) {
          Alert.alert('Sync Not Needed', timingInfo.message + '\n\nWould you like to force sync anyway?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Force Sync', onPress: () => handleManualSync(true) },
          ]);
          return;
        }
      }

      const success = await manualSync(forceSync);
      Alert.alert(
        success ? 'Sync Successful' : 'Sync Failed',
        success
          ? `Health data has been synced to the server successfully${forceSync ? ' (forced)' : ''}.`
          : 'Failed to sync health data. Please try again.',
      );
    } catch {
      Alert.alert('Error', 'An error occurred during sync.');
    }
  };

  const handleTestBackgroundTask = async () => {
    Alert.alert(
      'Test Background Task',
      'This will trigger the background task immediately for testing. Check the console for logs.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Test',
          onPress: async () => {
            try {
              const success = await testBackgroundTask();
              Alert.alert(
                'Test Result',
                success
                  ? 'Background task triggered successfully. Check console logs for details.'
                  : 'Failed to trigger background task.',
              );
            } catch {
              Alert.alert('Error', 'An error occurred during testing.');
            }
          },
        },
      ],
    );
  };

  const handleInitialize = async () => {
    try {
      await initializeBackgroundSync();
      Alert.alert('Success', 'Background sync has been initialized.');
    } catch {
      Alert.alert('Error', 'Failed to initialize background sync.');
    }
  };

  const handleCleanup = async () => {
    Alert.alert('Cleanup Background Sync', 'This will stop all background sync tasks. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Cleanup',
        style: 'destructive',
        onPress: async () => {
          try {
            await cleanupBackgroundSync();
            Alert.alert('Success', 'Background sync has been cleaned up.');
          } catch {
            Alert.alert('Error', 'Failed to cleanup background sync.');
          }
        },
      },
    ]);
  };

  const getStatusText = (status: BackgroundTask.BackgroundTaskStatus): string => {
    switch (status) {
      case BackgroundTask.BackgroundTaskStatus.Available:
        return 'Available';
      case BackgroundTask.BackgroundTaskStatus.Restricted:
        return 'Restricted';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: BackgroundTask.BackgroundTaskStatus): string => {
    switch (status) {
      case BackgroundTask.BackgroundTaskStatus.Available:
        return 'text-green-600';
      case BackgroundTask.BackgroundTaskStatus.Restricted:
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <View className={`rounded-lg bg-white p-4 shadow-sm ${className}`}>
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-gray-900">Health Data Background Sync</Text>
        <TouchableOpacity
          onPress={updateSyncStatus}
          disabled={isLoading}
          className={`rounded px-3 py-1 ${isLoading ? 'bg-gray-300' : 'bg-blue-500'}`}
        >
          <Text className={`text-sm ${isLoading ? 'text-gray-500' : 'text-white'}`}>
            {isLoading ? 'Loading...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Status Information */}
      <View className="mb-4 rounded-lg bg-gray-50 p-3">
        <Text className="mb-2 text-sm font-medium text-gray-900">Status</Text>
        <View className="space-y-1">
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-600">Background Tasks:</Text>
            <Text className={`text-sm font-medium ${getStatusColor(syncStatus.status)}`}>
              {getStatusText(syncStatus.status)}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-600">Task Registered:</Text>
            <Text className={`text-sm font-medium ${syncStatus.isRegistered ? 'text-green-600' : 'text-red-600'}`}>
              {syncStatus.isRegistered ? 'Yes' : 'No'}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-600">Available:</Text>
            <Text className={`text-sm font-medium ${syncStatus.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
              {syncStatus.isAvailable ? 'Yes' : 'No'}
            </Text>
          </View>
          {syncStatus.lastSync && (
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-600">Last Sync:</Text>
              <Text className="text-sm font-medium text-gray-900">{syncStatus.lastSync.toLocaleString()}</Text>
            </View>
          )}
          {syncStatus.lastUpdatedHealthData && (
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-600">Last Health Update:</Text>
              <Text className="text-sm font-medium text-gray-900">
                {syncStatus.lastUpdatedHealthData.toLocaleString()}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Error Display */}
      {lastError && (
        <View className="mb-4 rounded-lg bg-red-50 p-3">
          <Text className="mb-1 text-sm font-medium text-red-800">Error</Text>
          <Text className="text-sm text-red-600">{lastError}</Text>
        </View>
      )}

      {/* Actions */}
      <View className="space-y-3">
        {!syncStatus.isRegistered ? (
          <TouchableOpacity
            onPress={handleInitialize}
            disabled={isLoading || !syncStatus.isAvailable}
            className={`rounded-lg px-4 py-3 ${isLoading || !syncStatus.isAvailable ? 'bg-gray-300' : 'bg-green-500'}`}
          >
            <Text
              className={`text-center font-medium ${
                isLoading || !syncStatus.isAvailable ? 'text-gray-500' : 'text-white'
              }`}
            >
              {isLoading ? 'Initializing...' : 'Initialize Background Sync'}
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              onPress={() => handleManualSync()}
              disabled={isLoading}
              className={`rounded-lg px-4 py-3 ${isLoading ? 'bg-gray-300' : 'bg-blue-500'}`}
            >
              <Text className={`text-center font-medium ${isLoading ? 'text-gray-500' : 'text-white'}`}>
                {isLoading ? 'Syncing...' : 'Manual Sync Now'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleTestBackgroundTask}
              disabled={isLoading}
              className={`rounded-lg px-4 py-3 ${isLoading ? 'bg-gray-300' : 'bg-orange-500'}`}
            >
              <Text className={`text-center font-medium ${isLoading ? 'text-gray-500' : 'text-white'}`}>
                {isLoading ? 'Testing...' : 'Test Background Task'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCleanup}
              disabled={isLoading}
              className={`rounded-lg px-4 py-3 ${isLoading ? 'bg-gray-300' : 'bg-red-500'}`}
            >
              <Text className={`text-center font-medium ${isLoading ? 'text-gray-500' : 'text-white'}`}>
                {isLoading ? 'Cleaning...' : 'Cleanup Background Sync'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Information */}
      <View className="mt-4 rounded-lg bg-blue-50 p-3">
        <Text className="mb-1 text-sm font-medium text-blue-800">Information</Text>
        <Text className="text-xs text-blue-600">
          • Background tasks run automatically every 15+ minutes when the app is in the background{'\n'}• Health data is
          only synced when 55+ minutes have passed since last update{'\n'}• Manual sync respects the 55-minute limit
          unless forced{'\n'}• Test function triggers the background task for development testing{'\n'}• Check console
          logs for detailed sync information
        </Text>
      </View>
    </View>
  );
};
