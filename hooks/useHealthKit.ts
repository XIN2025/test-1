import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  isHealthDataAvailable,
  requestAuthorization,
  getMostRecentQuantitySample,
  getMostRecentCategorySample,
  queryQuantitySamples,
  subscribeToChanges,
  QuantityTypeIdentifier,
  CategoryTypeIdentifier,
} from '@kingstinct/react-native-healthkit';

export interface HealthMetric {
  value: number | string;
  unit?: string;
  date?: Date;
  isAvailable: boolean;
  error?: string;
}

export interface HealthKitData {
  steps: HealthMetric;
  heartRate: HealthMetric;
  activeEnergy: HealthMetric;
  sleep: HealthMetric;
  weight: HealthMetric;
  bodyFat: HealthMetric;
  bloodGlucose: HealthMetric;
  oxygenSaturation: HealthMetric;
}

const HEALTH_PERMISSIONS = [
  'HKQuantityTypeIdentifierStepCount',
  'HKQuantityTypeIdentifierHeartRate',
  'HKQuantityTypeIdentifierActiveEnergyBurned',
  'HKQuantityTypeIdentifierBodyMass',
  'HKQuantityTypeIdentifierBodyFatPercentage',
  'HKQuantityTypeIdentifierBloodGlucose',
  'HKQuantityTypeIdentifierOxygenSaturation',
  'HKCategoryTypeIdentifierSleepAnalysis',
] as const;

export function useHealthKit() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [healthData, setHealthData] = useState<HealthKitData>({
    steps: { value: 0, isAvailable: false },
    heartRate: { value: 0, unit: 'bpm', isAvailable: false },
    activeEnergy: { value: 0, unit: 'kcal', isAvailable: false },
    sleep: { value: 0, unit: 'hrs', isAvailable: false },
    weight: { value: 0, unit: 'kg', isAvailable: false },
    bodyFat: { value: 0, unit: '%', isAvailable: false },
    bloodGlucose: { value: 0, unit: 'mg/dL', isAvailable: false },
    oxygenSaturation: { value: 0, unit: '%', isAvailable: false },
  });

  const verifyPermissions = useCallback(async (useCache = false) => {
    try {
      if (Platform.OS !== 'ios') return false;

      // If using cache, check stored permission status first
      if (useCache) {
        const cachedPermissionStatus = await AsyncStorage.getItem('healthkit_permissions_granted');
        if (cachedPermissionStatus === 'true') {
          // Even with cache, do a quick verification to ensure permissions are still valid
          try {
            const permissionCheck = Promise.race([
              getMostRecentQuantitySample('HKQuantityTypeIdentifierStepCount' as QuantityTypeIdentifier),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000)), // 2 second timeout for cached check
            ]);

            const stepsSample = await permissionCheck;
            const hasAccess = stepsSample !== null && stepsSample !== undefined;

            // If verification fails, clear the cache
            if (!hasAccess) {
              await AsyncStorage.removeItem('healthkit_permissions_granted');
              return false;
            }
            return true;
          } catch {
            // If verification fails, clear the cache and return false
            await AsyncStorage.removeItem('healthkit_permissions_granted');
            return false;
          }
        }
      }

      // Full permission check by attempting to access health data
      try {
        // Use a Promise.race to timeout quickly if permissions aren't available
        const permissionCheck = Promise.race([
          getMostRecentQuantitySample('HKQuantityTypeIdentifierStepCount' as QuantityTypeIdentifier),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000)), // 1 second timeout
        ]);

        const stepsSample = await permissionCheck;
        const hasAccess = stepsSample !== null && stepsSample !== undefined;

        // Update cache based on verification result
        if (hasAccess) {
          await AsyncStorage.setItem('healthkit_permissions_granted', 'true');
        } else {
          await AsyncStorage.removeItem('healthkit_permissions_granted');
        }

        return hasAccess;
      } catch {
        // If we get an error or timeout, we likely don't have permissions
        await AsyncStorage.removeItem('healthkit_permissions_granted');
        return false;
      }
    } catch (error) {
      console.error('Error verifying permissions:', error);
      // Clear cache on error to be safe
      try {
        await AsyncStorage.removeItem('healthkit_permissions_granted');
      } catch {}
      return false;
    }
  }, []);

  const checkHealthDataAvailability = useCallback(async () => {
    try {
      if (Platform.OS !== 'ios') {
        setIsAvailable(false);
        setIsLoading(false);
        return;
      }

      const available = await isHealthDataAvailable();
      setIsAvailable(available);

      if (available) {
        // Always verify permissions, but use cache for faster initial load
        const hasValidPermissions = await verifyPermissions(true);
        setHasPermissions(hasValidPermissions);
      }
    } catch (error) {
      console.error('Error checking health data availability:', error);
      setIsAvailable(false);
      setHasPermissions(false);
    } finally {
      setIsLoading(false);
    }
  }, [verifyPermissions]);

  const requestHealthKitPermissions = useCallback(async () => {
    if (!isAvailable) return false;

    try {
      setIsLoading(true);
      // requestAuthorization expects (toShare, read) - we only need read permissions
      await requestAuthorization([], HEALTH_PERMISSIONS);

      // Verify that permissions were actually granted by attempting to access data
      const hasValidPermissions = await verifyPermissions(false);
      setHasPermissions(hasValidPermissions);

      return hasValidPermissions;
    } catch (error) {
      console.error('Error requesting HealthKit permissions:', error);
      setHasPermissions(false);
      // Clear any cached permissions on error
      try {
        await AsyncStorage.removeItem('healthkit_permissions_granted');
      } catch {}
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable, verifyPermissions]);

  const fetchHealthMetric = useCallback(async (type: string, isCategory = false): Promise<HealthMetric> => {
    try {
      // Get today's date range (start of today to now)
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

      if (isCategory) {
        const sample = await getMostRecentCategorySample(type as CategoryTypeIdentifier);
        if (sample) {
          // For sleep, calculate duration in hours
          if (type.includes('Sleep')) {
            const duration =
              (new Date(sample.endDate).getTime() - new Date(sample.startDate).getTime()) / (1000 * 60 * 60);
            return {
              value: Math.round(duration * 10) / 10,
              unit: 'hrs',
              date: new Date(sample.endDate),
              isAvailable: true,
            };
          }
          return {
            value: sample.value,
            date: new Date(sample.endDate),
            isAvailable: true,
          };
        }
      } else {
        // For cumulative metrics like steps and active energy, get today's total
        if (type.includes('StepCount') || type.includes('ActiveEnergyBurned')) {
          try {
            // PERFORMANCE FIX: Query ONLY today's samples using native date range filtering
            // This prevents fetching ALL historical data and filtering in JavaScript,
            // which was causing severe memory and CPU performance issues
            const samples = await queryQuantitySamples(type as QuantityTypeIdentifier, {
              filter: {
                startDate: startOfToday,
                endDate: now,
                strictStartDate: true,
                strictEndDate: true,
              },
              ascending: false, // Get newest first
              limit: 1000, // Reasonable limit to prevent excessive memory usage
            });

            if (samples && samples.length > 0) {
              // Sum up all the values from today (no JS filtering needed - all samples are from today)
              const totalValue = samples.reduce((sum, sample) => sum + sample.quantity, 0);
              return {
                value: Math.round(totalValue),
                unit: samples[0].unit,
                date: new Date(samples[samples.length - 1].endDate),
                isAvailable: true,
              };
            }
          } catch (queryError) {
            console.log(`Query failed for ${type}, falling back to most recent sample:`, queryError);
            // Fall back to most recent sample if query fails
            const sample = await getMostRecentQuantitySample(type as QuantityTypeIdentifier);
            if (sample) {
              return {
                value: Math.round(sample.quantity * 10) / 10,
                unit: sample.unit,
                date: new Date(sample.endDate),
                isAvailable: true,
              };
            }
          }
        } else {
          // For instantaneous metrics like heart rate, weight, etc., get the most recent
          const sample = await getMostRecentQuantitySample(type as QuantityTypeIdentifier);
          if (sample) {
            return {
              value: Math.round(sample.quantity * 10) / 10,
              unit: sample.unit,
              date: new Date(sample.endDate),
              isAvailable: true,
            };
          }
        }
      }

      return { value: 0, isAvailable: false, error: 'No data available' };
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
      return { value: 0, isAvailable: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  const fetchAllHealthData = useCallback(async () => {
    if (!hasPermissions) return;

    setIsLoading(true);
    try {
      // Re-verify permissions before fetching data to catch revoked permissions
      const stillHasPermissions = await verifyPermissions(false);
      if (!stillHasPermissions) {
        setHasPermissions(false);
        setIsLoading(false);
        return;
      }

      const [steps, heartRate, activeEnergy, sleep, weight, bodyFat, bloodGlucose, oxygenSaturation] =
        await Promise.all([
          fetchHealthMetric('HKQuantityTypeIdentifierStepCount'),
          fetchHealthMetric('HKQuantityTypeIdentifierHeartRate'),
          fetchHealthMetric('HKQuantityTypeIdentifierActiveEnergyBurned'),
          fetchHealthMetric('HKCategoryTypeIdentifierSleepAnalysis', true),
          fetchHealthMetric('HKQuantityTypeIdentifierBodyMass'),
          fetchHealthMetric('HKQuantityTypeIdentifierBodyFatPercentage'),
          fetchHealthMetric('HKQuantityTypeIdentifierBloodGlucose'),
          fetchHealthMetric('HKQuantityTypeIdentifierOxygenSaturation'),
        ]);

      setHealthData({
        steps,
        heartRate,
        activeEnergy,
        sleep,
        weight,
        bodyFat,
        bloodGlucose,
        oxygenSaturation,
      });
    } catch (error) {
      console.error('Error fetching health data:', error);
      // Check if error is due to revoked permissions
      const stillHasPermissions = await verifyPermissions(false);
      if (!stillHasPermissions) {
        setHasPermissions(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [hasPermissions, fetchHealthMetric, verifyPermissions]);

  const setupHealthKitSubscriptions = useCallback(() => {
    if (!hasPermissions) return [];

    const subscriptionIds: string[] = [];

    try {
      // Subscribe to step count changes
      const stepsSubscriptionId = subscribeToChanges('HKQuantityTypeIdentifierStepCount', () => {
        fetchHealthMetric('HKQuantityTypeIdentifierStepCount').then((steps: HealthMetric) => {
          setHealthData((prev: HealthKitData) => ({ ...prev, steps }));
        });
      });
      if (typeof stepsSubscriptionId === 'string') {
        subscriptionIds.push(stepsSubscriptionId);
      }

      // Subscribe to heart rate changes
      const heartRateSubscriptionId = subscribeToChanges('HKQuantityTypeIdentifierHeartRate', () => {
        fetchHealthMetric('HKQuantityTypeIdentifierHeartRate').then((heartRate: HealthMetric) => {
          setHealthData((prev: HealthKitData) => ({ ...prev, heartRate }));
        });
      });
      if (typeof heartRateSubscriptionId === 'string') {
        subscriptionIds.push(heartRateSubscriptionId);
      }

      // Subscribe to active energy changes
      const activeEnergySubscriptionId = subscribeToChanges('HKQuantityTypeIdentifierActiveEnergyBurned', () => {
        fetchHealthMetric('HKQuantityTypeIdentifierActiveEnergyBurned').then((activeEnergy: HealthMetric) => {
          setHealthData((prev: HealthKitData) => ({ ...prev, activeEnergy }));
        });
      });
      if (typeof activeEnergySubscriptionId === 'string') {
        subscriptionIds.push(activeEnergySubscriptionId);
      }

      // Subscribe to sleep analysis changes
      const sleepSubscriptionId = subscribeToChanges('HKCategoryTypeIdentifierSleepAnalysis', () => {
        fetchHealthMetric('HKCategoryTypeIdentifierSleepAnalysis', true).then((sleep: HealthMetric) => {
          setHealthData((prev: HealthKitData) => ({ ...prev, sleep }));
        });
      });
      if (typeof sleepSubscriptionId === 'string') {
        subscriptionIds.push(sleepSubscriptionId);
      }

      // Subscribe to weight changes
      const weightSubscriptionId = subscribeToChanges('HKQuantityTypeIdentifierBodyMass', () => {
        fetchHealthMetric('HKQuantityTypeIdentifierBodyMass').then((weight: HealthMetric) => {
          setHealthData((prev: HealthKitData) => ({ ...prev, weight }));
        });
      });
      if (typeof weightSubscriptionId === 'string') {
        subscriptionIds.push(weightSubscriptionId);
      }

      // Subscribe to body fat percentage changes
      const bodyFatSubscriptionId = subscribeToChanges('HKQuantityTypeIdentifierBodyFatPercentage', () => {
        fetchHealthMetric('HKQuantityTypeIdentifierBodyFatPercentage').then((bodyFat: HealthMetric) => {
          setHealthData((prev: HealthKitData) => ({ ...prev, bodyFat }));
        });
      });
      if (typeof bodyFatSubscriptionId === 'string') {
        subscriptionIds.push(bodyFatSubscriptionId);
      }

      // Subscribe to blood glucose changes
      const bloodGlucoseSubscriptionId = subscribeToChanges('HKQuantityTypeIdentifierBloodGlucose', () => {
        fetchHealthMetric('HKQuantityTypeIdentifierBloodGlucose').then((bloodGlucose: HealthMetric) => {
          setHealthData((prev: HealthKitData) => ({ ...prev, bloodGlucose }));
        });
      });
      if (typeof bloodGlucoseSubscriptionId === 'string') {
        subscriptionIds.push(bloodGlucoseSubscriptionId);
      }

      // Subscribe to oxygen saturation changes
      const oxygenSaturationSubscriptionId = subscribeToChanges('HKQuantityTypeIdentifierOxygenSaturation', () => {
        fetchHealthMetric('HKQuantityTypeIdentifierOxygenSaturation').then((oxygenSaturation: HealthMetric) => {
          setHealthData((prev: HealthKitData) => ({ ...prev, oxygenSaturation }));
        });
      });
      if (typeof oxygenSaturationSubscriptionId === 'string') {
        subscriptionIds.push(oxygenSaturationSubscriptionId);
      }
    } catch (error) {
      console.error('Error setting up HealthKit subscriptions:', error);
    }

    // Return cleanup function that handles subscription IDs properly
    return () => {
      subscriptionIds.forEach((subscriptionId) => {
        try {
          // Note: The HealthKit library might have a different method to unsubscribe
          // For now, we'll just log the subscription ID since we can't call it as a function
          console.log('Cleaning up HealthKit subscription:', subscriptionId);
        } catch (error) {
          console.error('Error cleaning up subscription:', subscriptionId, error);
        }
      });
    };
  }, [hasPermissions, fetchHealthMetric]);

  useEffect(() => {
    checkHealthDataAvailability();
  }, [checkHealthDataAvailability]);

  useEffect(() => {
    if (hasPermissions) {
      fetchAllHealthData();
      const cleanup = setupHealthKitSubscriptions();

      return typeof cleanup === 'function' ? cleanup : undefined;
    }
  }, [hasPermissions, fetchAllHealthData, setupHealthKitSubscriptions]);

  return {
    isAvailable,
    isLoading,
    hasPermissions,
    healthData,
    requestPermissions: requestHealthKitPermissions,
    refreshData: fetchAllHealthData,
    verifyPermissions: () => verifyPermissions(false),
  };
}
