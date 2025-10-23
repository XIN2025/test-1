import { useHealthConnect } from '@/hooks/useHealthConnect';
import { useHealthKit } from '@/hooks/useHealthKit';
import { Platform } from 'react-native';
import { HealthMetric } from '@/types/health';

export interface HealthData {
  steps: HealthMetric;
  heartRate: HealthMetric;
  sleep: HealthMetric;
}

export const useHealthDataSummary = () => {
  const {
    isAvailable: isAvailableIOS,
    hasPermissions: hasPermissionsIOS,
    healthData: healthDataIOS,
    requestPermissions: requestPermissionsIOS,
    isLoading: isLoadingIOS,
    verifyPermissions: verifyPermissionsIOS,
  } = useHealthKit();
  const {
    isAvailable: isAvailableAndroid,
    hasPermissions: hasPermissionsAndroid,
    healthData: healthDataAndroid,
    requestPermissions: requestPermissionsAndroid,
    isLoading: isLoadingAndroid,
    verifyPermissions: verifyPermissionsAndroid,
  } = useHealthConnect();

  return Platform.OS === 'ios'
    ? {
        isAvailable: isAvailableIOS,
        hasPermissions: hasPermissionsIOS,
        healthData: healthDataIOS as HealthData,
        requestPermissions: requestPermissionsIOS,
        isLoading: isLoadingIOS,
        verifyPermissions: verifyPermissionsIOS,
      }
    : {
        isAvailable: isAvailableAndroid,
        hasPermissions: hasPermissionsAndroid,
        healthData: healthDataAndroid as HealthData,
        requestPermissions: requestPermissionsAndroid,
        isLoading: isLoadingAndroid,
        verifyPermissions: verifyPermissionsAndroid,
      };
};
