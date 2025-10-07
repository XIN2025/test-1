import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useHealthDataBackgroundSync } from '../hooks/useHealthDataBackgroundSync';

const HEALTH_DATA_SYNC_TASK = 'health-data-sync';

interface BackgroundTaskDebuggerProps {
  className?: string;
}

export const BackgroundTaskDebugger: React.FC<BackgroundTaskDebuggerProps> = ({ className = '' }) => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  // const { syncStatus } = useHealthDataBackgroundSync();

  const collectDebugInfo = async () => {
    setIsRefreshing(true);

    try {
      const info: any = {
        timestamp: new Date().toISOString(),
        backgroundTaskStatus: await BackgroundTask.getStatusAsync(),
        isTaskRegistered: await TaskManager.isTaskRegisteredAsync(HEALTH_DATA_SYNC_TASK),
        registeredTasks: await TaskManager.getRegisteredTasksAsync(),
        storage: {},
        permissions: {},
        device: {
          platform: Platform.OS,
          version: Platform.Version,
        },
      };

      // Get storage info
      try {
        const userEmail = await AsyncStorage.getItem('userEmail');
        const healthData = await AsyncStorage.getItem('currentHealthData');
        const lastSync = await AsyncStorage.getItem('lastHealthDataSync');

        info.storage = {
          userEmail: userEmail ? userEmail.substring(0, 10) + '...' : null,
          hasHealthData: !!healthData,
          healthDataKeys: healthData ? Object.keys(JSON.parse(healthData)) : [],
          lastSync: lastSync ? new Date(parseInt(lastSync)).toISOString() : null,
        };
      } catch (error) {
        info.storage.error = error instanceof Error ? error.message : 'Unknown error';
      }

      // Check if task is defined
      info.taskDefined = !!TaskManager.isTaskDefined?.(HEALTH_DATA_SYNC_TASK);

      setDebugInfo(info);
    } catch (error) {
      console.error('Failed to collect debug info:', error);
      Alert.alert('Error', 'Failed to collect debug information');
    } finally {
      setIsRefreshing(false);
    }
  };

  const triggerManualTest = async () => {
    try {
      console.log('🧪 Manual trigger test started');
      Alert.alert('Manual Test', 'Triggering background task manually. Check console logs.');

      const result = await BackgroundTask.triggerTaskWorkerForTestingAsync();
      console.log('🧪 Manual trigger result:', result);

      Alert.alert(
        'Manual Test Result',
        result ? 'Task triggered successfully. Check console logs.' : 'Task trigger failed.',
      );

      // Refresh debug info after test
      setTimeout(collectDebugInfo, 2000);
    } catch (error) {
      console.error('Manual trigger failed:', error);
      Alert.alert('Error', 'Manual trigger failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const clearAllData = async () => {
    Alert.alert('Clear Debug Data', 'This will clear all background task related data. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('userEmail');
            await AsyncStorage.removeItem('currentHealthData');
            await AsyncStorage.removeItem('lastHealthDataSync');
            Alert.alert('Success', 'Debug data cleared');
            collectDebugInfo();
          } catch (e) {
            console.error('Failed to clear data:', e);
            Alert.alert('Error', 'Failed to clear data');
          }
        },
      },
    ]);
  };

  const forceReregister = async () => {
    try {
      // Unregister first
      try {
        await BackgroundTask.unregisterTaskAsync(HEALTH_DATA_SYNC_TASK);
        console.log('Unregistered existing task');
      } catch (e) {
        console.warn('No existing task to unregister', e);
      }

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Re-register
      await BackgroundTask.registerTaskAsync(HEALTH_DATA_SYNC_TASK, {
        minimumInterval: 15, // Use 15 for Android compatibility
      });

      Alert.alert('Success', 'Task re-registered successfully');
      collectDebugInfo();
    } catch (error) {
      console.error('Re-registration failed:', error);
      Alert.alert('Error', 'Re-registration failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  useEffect(() => {
    collectDebugInfo();
  }, []);

  const getStatusColor = (status: any) => {
    if (status === BackgroundTask.BackgroundTaskStatus.Available) return 'text-green-600';
    if (status === BackgroundTask.BackgroundTaskStatus.Restricted) return 'text-red-600';
    return 'text-gray-600';
  };

  const getStatusText = (status: any) => {
    if (status === BackgroundTask.BackgroundTaskStatus.Available) return 'Available';
    if (status === BackgroundTask.BackgroundTaskStatus.Restricted) return 'Restricted';
    return 'Unknown';
  };

  return (
    <View className={`rounded-lg bg-white p-4 shadow-sm ${className}`}>
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-gray-900">Background Task Debugger</Text>
        <TouchableOpacity
          onPress={collectDebugInfo}
          disabled={isRefreshing}
          className={`rounded px-3 py-1 ${isRefreshing ? 'bg-gray-300' : 'bg-blue-500'}`}
        >
          <Text className={`text-sm ${isRefreshing ? 'text-gray-500' : 'text-white'}`}>
            {isRefreshing ? 'Loading...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="mb-4 max-h-96">
        {/* Current Status */}
        <View className="mb-4 rounded-lg bg-gray-50 p-3">
          <Text className="mb-2 text-sm font-medium text-gray-900">Current Status</Text>
          <View className="space-y-1">
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-600">Background Tasks:</Text>
              <Text className={`text-sm font-medium ${getStatusColor(debugInfo.backgroundTaskStatus)}`}>
                {getStatusText(debugInfo.backgroundTaskStatus)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-600">Task Registered:</Text>
              <Text className={`text-sm font-medium ${debugInfo.isTaskRegistered ? 'text-green-600' : 'text-red-600'}`}>
                {debugInfo.isTaskRegistered ? 'Yes' : 'No'}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-600">Task Defined:</Text>
              <Text className={`text-sm font-medium ${debugInfo.taskDefined ? 'text-green-600' : 'text-red-600'}`}>
                {debugInfo.taskDefined ? 'Yes' : 'No'}
              </Text>
            </View>
          </View>
        </View>

        {/* Storage Info */}
        <View className="mb-4 rounded-lg bg-gray-50 p-3">
          <Text className="mb-2 text-sm font-medium text-gray-900">Storage Info</Text>
          <View className="space-y-1">
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-600">User Email:</Text>
              <Text className="text-sm font-medium text-gray-900">{debugInfo.storage?.userEmail || 'Not set'}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-600">Health Data:</Text>
              <Text className="text-sm font-medium text-gray-900">
                {debugInfo.storage?.hasHealthData ? 'Available' : 'None'}
              </Text>
            </View>
            {debugInfo.storage?.lastSync && (
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-600">Last Sync:</Text>
                <Text className="text-sm font-medium text-gray-900">
                  {new Date(debugInfo.storage.lastSync).toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Device Info */}
        <View className="mb-4 rounded-lg bg-gray-50 p-3">
          <Text className="mb-2 text-sm font-medium text-gray-900">Device Info</Text>
          <View className="space-y-1">
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-600">Platform:</Text>
              <Text className="text-sm font-medium text-gray-900">{debugInfo.device?.platform}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-600">Version:</Text>
              <Text className="text-sm font-medium text-gray-900">{debugInfo.device?.version}</Text>
            </View>
          </View>
        </View>

        {/* Registered Tasks */}
        {debugInfo.registeredTasks && debugInfo.registeredTasks.length > 0 && (
          <View className="mb-4 rounded-lg bg-gray-50 p-3">
            <Text className="mb-2 text-sm font-medium text-gray-900">Registered Tasks</Text>
            {debugInfo.registeredTasks.map((task: any, index: number) => (
              <Text key={index} className="text-sm text-gray-700">
                • {task.taskName || task}
              </Text>
            ))}
          </View>
        )}

        {/* Debug JSON */}
        <View className="rounded-lg bg-gray-50 p-3">
          <Text className="mb-2 text-sm font-medium text-gray-900">Full Debug Info</Text>
          <Text className="font-mono text-xs text-gray-600">{JSON.stringify(debugInfo, null, 2)}</Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View className="space-y-3">
        <TouchableOpacity onPress={triggerManualTest} className="rounded-lg bg-orange-500 px-4 py-3">
          <Text className="text-center font-medium text-white">🧪 Trigger Manual Test</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={forceReregister} className="rounded-lg bg-purple-500 px-4 py-3">
          <Text className="text-center font-medium text-white">🔄 Force Re-register Task</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={clearAllData} className="rounded-lg bg-red-500 px-4 py-3">
          <Text className="text-center font-medium text-white">🗑️ Clear Debug Data</Text>
        </TouchableOpacity>
      </View>

      {/* Troubleshooting Tips */}
      <View className="mt-4 rounded-lg bg-yellow-50 p-3">
        <Text className="mb-1 text-sm font-medium text-yellow-800">Troubleshooting Tips</Text>
        <Text className="text-xs text-yellow-700">
          • Background tasks only work on physical devices, not simulators{'\n'}• iOS: Tasks may be delayed based on
          usage patterns{'\n'}• Android: Minimum interval is 15 minutes{'\n'}• Battery optimization may prevent tasks
          from running{'\n'}• Try manual test first, then wait 15-30 minutes for automatic execution
        </Text>
      </View>
    </View>
  );
};
