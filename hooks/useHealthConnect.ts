import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initialize,
  requestPermission,
  getGrantedPermissions,
  readRecords,
  RecordType,
} from 'react-native-health-connect';
import { TimeRangeFilter } from 'react-native-health-connect/lib/typescript/types/base.types';

export interface HealthMetric {
  value: number | string;
  unit?: string;
  date?: Date;
  isAvailable: boolean;
  error?: string;
}

export interface HealthConnectData {
  // Core metrics that are guaranteed to work
  steps: HealthMetric;
  heartRate: HealthMetric;
  activeEnergy: HealthMetric;
  sleep: HealthMetric;
  weight: HealthMetric;
  bodyFat: HealthMetric;
  bloodGlucose: HealthMetric;
  oxygenSaturation: HealthMetric;

  // Additional metrics that are available in the library
  restingHeartRate: HealthMetric;
  heartRateVariability: HealthMetric;
  bloodPressureSystolic: HealthMetric;
  bloodPressureDiastolic: HealthMetric;
  bodyTemperature: HealthMetric;
  respiratoryRate: HealthMetric;
  vo2Max: HealthMetric;
  distanceWalkingRunning: HealthMetric;
  distanceCycling: HealthMetric;
  flightsClimbed: HealthMetric;
  standTime: HealthMetric;
  exerciseTime: HealthMetric;
  mindfulMinutes: HealthMetric;
  bodyMassIndex: HealthMetric;
  leanBodyMass: HealthMetric;
  waistCircumference: HealthMetric;
  bloodAlcoholContent: HealthMetric;
  caffeine: HealthMetric;
  dietaryWater: HealthMetric;
  dietaryEnergyConsumed: HealthMetric;
  dietaryProtein: HealthMetric;
  dietaryCarbohydrates: HealthMetric;
  dietaryFatTotal: HealthMetric;
  dietaryFiber: HealthMetric;
  dietarySugar: HealthMetric;
  dietarySodium: HealthMetric;
  dietaryCholesterol: HealthMetric;
  dietarySaturatedFat: HealthMetric;
  dietaryCalcium: HealthMetric;
  dietaryIron: HealthMetric;
  dietaryMagnesium: HealthMetric;
  dietaryPotassium: HealthMetric;
  dietaryVitaminA: HealthMetric;
  dietaryVitaminB6: HealthMetric;
  dietaryVitaminB12: HealthMetric;
  dietaryVitaminC: HealthMetric;
  dietaryVitaminD: HealthMetric;
  dietaryVitaminE: HealthMetric;
  dietaryVitaminK: HealthMetric;
  dietaryFolate: HealthMetric;
}

export function useHealthConnect() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermissions, setHasPermissions] = useState(false);

  const [healthData, setHealthData] = useState<HealthConnectData>({
    // Core metrics
    steps: { value: 0, isAvailable: false },
    heartRate: { value: 0, unit: 'bpm', isAvailable: false },
    activeEnergy: { value: 0, unit: 'kcal', isAvailable: false },
    sleep: { value: 0, unit: 'hrs', isAvailable: false },
    weight: { value: 0, unit: 'kg', isAvailable: false },
    bodyFat: { value: 0, unit: '%', isAvailable: false },
    bloodGlucose: { value: 0, unit: 'mg/dL', isAvailable: false },
    oxygenSaturation: { value: 0, unit: '%', isAvailable: false },

    // Additional metrics
    restingHeartRate: { value: 0, unit: 'bpm', isAvailable: false },
    heartRateVariability: { value: 0, unit: 'ms', isAvailable: false },
    bloodPressureSystolic: { value: 0, unit: 'mmHg', isAvailable: false },
    bloodPressureDiastolic: { value: 0, unit: 'mmHg', isAvailable: false },
    bodyTemperature: { value: 0, unit: '°C', isAvailable: false },
    respiratoryRate: { value: 0, unit: '/min', isAvailable: false },
    vo2Max: { value: 0, unit: 'mL/kg·min', isAvailable: false },
    distanceWalkingRunning: { value: 0, unit: 'km', isAvailable: false },
    distanceCycling: { value: 0, unit: 'km', isAvailable: false },
    flightsClimbed: { value: 0, unit: 'flights', isAvailable: false },
    standTime: { value: 0, unit: 'hrs', isAvailable: false },
    exerciseTime: { value: 0, unit: 'min', isAvailable: false },
    mindfulMinutes: { value: 0, unit: 'min', isAvailable: false },
    bodyMassIndex: { value: 0, unit: 'kg/m²', isAvailable: false },
    leanBodyMass: { value: 0, unit: 'kg', isAvailable: false },
    waistCircumference: { value: 0, unit: 'cm', isAvailable: false },
    bloodAlcoholContent: { value: 0, unit: '%', isAvailable: false },
    caffeine: { value: 0, unit: 'mg', isAvailable: false },
    dietaryWater: { value: 0, unit: 'L', isAvailable: false },
    dietaryEnergyConsumed: { value: 0, unit: 'kcal', isAvailable: false },
    dietaryProtein: { value: 0, unit: 'g', isAvailable: false },
    dietaryCarbohydrates: { value: 0, unit: 'g', isAvailable: false },
    dietaryFatTotal: { value: 0, unit: 'g', isAvailable: false },
    dietaryFiber: { value: 0, unit: 'g', isAvailable: false },
    dietarySugar: { value: 0, unit: 'g', isAvailable: false },
    dietarySodium: { value: 0, unit: 'mg', isAvailable: false },
    dietaryCholesterol: { value: 0, unit: 'mg', isAvailable: false },
    dietarySaturatedFat: { value: 0, unit: 'g', isAvailable: false },
    dietaryCalcium: { value: 0, unit: 'mg', isAvailable: false },
    dietaryIron: { value: 0, unit: 'mg', isAvailable: false },
    dietaryMagnesium: { value: 0, unit: 'mg', isAvailable: false },
    dietaryPotassium: { value: 0, unit: 'mg', isAvailable: false },
    dietaryVitaminA: { value: 0, unit: 'μg', isAvailable: false },
    dietaryVitaminB6: { value: 0, unit: 'mg', isAvailable: false },
    dietaryVitaminB12: { value: 0, unit: 'μg', isAvailable: false },
    dietaryVitaminC: { value: 0, unit: 'mg', isAvailable: false },
    dietaryVitaminD: { value: 0, unit: 'μg', isAvailable: false },
    dietaryVitaminE: { value: 0, unit: 'mg', isAvailable: false },
    dietaryVitaminK: { value: 0, unit: 'μg', isAvailable: false },
    dietaryFolate: { value: 0, unit: 'μg', isAvailable: false },
  });

  const verifyPermissions = useCallback(async (useCache = false) => {
    try {
      if (Platform.OS !== 'android') return false;
      const isInitialized = await initialize();
      if (!isInitialized) return false;

      // If using cache, check stored permission status first
      if (useCache) {
        const cachedPermissionStatus = await AsyncStorage.getItem('healthconnect_permissions_granted');
        if (cachedPermissionStatus === 'true') {
          // Verify permissions are still valid
          try {
            const permissions = await getGrantedPermissions();
            const hasAccess = permissions && Object.keys(permissions).length > 0;

            if (!hasAccess) {
              await AsyncStorage.removeItem('healthconnect_permissions_granted');
              return false;
            }
            return true;
          } catch {
            await AsyncStorage.removeItem('healthconnect_permissions_granted');
            return false;
          }
        }
      }

      // Full permission check
      try {
        const permissions = await getGrantedPermissions();
        const hasAccess = permissions && Object.keys(permissions).length > 0;

        // Update cache based on verification result
        if (hasAccess) {
          await AsyncStorage.setItem('healthconnect_permissions_granted', 'true');
        } else {
          await AsyncStorage.removeItem('healthconnect_permissions_granted');
        }

        return hasAccess;
      } catch {
        await AsyncStorage.removeItem('healthconnect_permissions_granted');
        return false;
      }
    } catch (error) {
      console.error('Error verifying Health Connect permissions:', error);
      try {
        await AsyncStorage.removeItem('healthconnect_permissions_granted');
      } catch {}
      return false;
    }
  }, []);

  const checkHealthDataAvailability = useCallback(async () => {
    try {
      if (Platform.OS !== 'android') {
        setIsAvailable(false);
        setIsLoading(false);
        return;
      }

      const available = await initialize();
      setIsAvailable(available);

      if (available) {
        const isAuthorized = await verifyPermissions(true);
        setHasPermissions(isAuthorized);
        console.log('Health Connect available, authorized:', isAuthorized);
      }
    } catch (error) {
      console.error('Error checking Health Connect availability:', error);
      setIsAvailable(false);
      setHasPermissions(false);
    } finally {
      setIsLoading(false);
    }
  }, [verifyPermissions]);

  const requestHealthConnectPermissions = useCallback(
    async (requestAllPermissions = false) => {
      if (!isAvailable) return false;

      try {
        setIsLoading(true);

        console.log('Requesting Health Connect permissions');

        // Request permissions for all the health data types we need
        const permissions = await requestPermission([
          { accessType: 'read', recordType: 'Steps' },
          { accessType: 'read', recordType: 'HeartRate' },
          { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
          { accessType: 'read', recordType: 'Weight' },
          { accessType: 'read', recordType: 'BodyFat' },
          { accessType: 'read', recordType: 'BloodGlucose' },
          { accessType: 'read', recordType: 'OxygenSaturation' },
          { accessType: 'read', recordType: 'SleepSession' },
          { accessType: 'read', recordType: 'RestingHeartRate' },
          { accessType: 'read', recordType: 'BodyTemperature' },
          { accessType: 'read', recordType: 'RespiratoryRate' },
          { accessType: 'read', recordType: 'Vo2Max' },
          { accessType: 'read', recordType: 'Distance' },
          { accessType: 'read', recordType: 'FloorsClimbed' },
          { accessType: 'read', recordType: 'ExerciseSession' },
          { accessType: 'read', recordType: 'BloodPressure' },
          { accessType: 'read', recordType: 'LeanBodyMass' },
          { accessType: 'read', recordType: 'Nutrition' },
          { accessType: 'read', recordType: 'Hydration' },
          { accessType: 'read', recordType: 'BackgroundAccessPermission' },
        ]);

        console.log('Health Connect permissions result:', permissions);

        // Check if we got the permissions we need
        const hasRequiredPermissions = permissions && Object.keys(permissions).length > 0;
        setHasPermissions(hasRequiredPermissions);

        if (hasRequiredPermissions) {
          await AsyncStorage.setItem('healthconnect_permissions_granted', 'true');
        } else {
          await AsyncStorage.removeItem('healthconnect_permissions_granted');
        }

        return hasRequiredPermissions;
      } catch (error) {
        console.error('Error requesting Health Connect permissions:', error);
        setHasPermissions(false);
        try {
          await AsyncStorage.removeItem('healthconnect_permissions_granted');
        } catch {}
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isAvailable],
  );

  const resetHealthConnectPermissions = useCallback(async () => {
    try {
      // Clear cached permissions
      await AsyncStorage.removeItem('healthconnect_permissions_granted');
      setHasPermissions(false);

      // Reset health data
      setHealthData({
        // Core metrics
        steps: { value: 0, isAvailable: false },
        heartRate: { value: 0, unit: 'bpm', isAvailable: false },
        activeEnergy: { value: 0, unit: 'kcal', isAvailable: false },
        sleep: { value: 0, unit: 'hrs', isAvailable: false },
        weight: { value: 0, unit: 'kg', isAvailable: false },
        bodyFat: { value: 0, unit: '%', isAvailable: false },
        bloodGlucose: { value: 0, unit: 'mg/dL', isAvailable: false },
        oxygenSaturation: { value: 0, unit: '%', isAvailable: false },

        // Additional metrics
        restingHeartRate: { value: 0, unit: 'bpm', isAvailable: false },
        heartRateVariability: { value: 0, unit: 'ms', isAvailable: false },
        bloodPressureSystolic: { value: 0, unit: 'mmHg', isAvailable: false },
        bloodPressureDiastolic: { value: 0, unit: 'mmHg', isAvailable: false },
        bodyTemperature: { value: 0, unit: '°C', isAvailable: false },
        respiratoryRate: { value: 0, unit: '/min', isAvailable: false },
        vo2Max: { value: 0, unit: 'mL/kg·min', isAvailable: false },
        distanceWalkingRunning: { value: 0, unit: 'km', isAvailable: false },
        distanceCycling: { value: 0, unit: 'km', isAvailable: false },
        flightsClimbed: { value: 0, unit: 'flights', isAvailable: false },
        standTime: { value: 0, unit: 'hrs', isAvailable: false },
        exerciseTime: { value: 0, unit: 'min', isAvailable: false },
        mindfulMinutes: { value: 0, unit: 'min', isAvailable: false },
        bodyMassIndex: { value: 0, unit: 'kg/m²', isAvailable: false },
        leanBodyMass: { value: 0, unit: 'kg', isAvailable: false },
        waistCircumference: { value: 0, unit: 'cm', isAvailable: false },
        bloodAlcoholContent: { value: 0, unit: '%', isAvailable: false },
        caffeine: { value: 0, unit: 'mg', isAvailable: false },
        dietaryWater: { value: 0, unit: 'L', isAvailable: false },
        dietaryEnergyConsumed: { value: 0, unit: 'kcal', isAvailable: false },
        dietaryProtein: { value: 0, unit: 'g', isAvailable: false },
        dietaryCarbohydrates: { value: 0, unit: 'g', isAvailable: false },
        dietaryFatTotal: { value: 0, unit: 'g', isAvailable: false },
        dietaryFiber: { value: 0, unit: 'g', isAvailable: false },
        dietarySugar: { value: 0, unit: 'g', isAvailable: false },
        dietarySodium: { value: 0, unit: 'mg', isAvailable: false },
        dietaryCholesterol: { value: 0, unit: 'mg', isAvailable: false },
        dietarySaturatedFat: { value: 0, unit: 'g', isAvailable: false },
        dietaryCalcium: { value: 0, unit: 'mg', isAvailable: false },
        dietaryIron: { value: 0, unit: 'mg', isAvailable: false },
        dietaryMagnesium: { value: 0, unit: 'mg', isAvailable: false },
        dietaryPotassium: { value: 0, unit: 'mg', isAvailable: false },
        dietaryVitaminA: { value: 0, unit: 'μg', isAvailable: false },
        dietaryVitaminB6: { value: 0, unit: 'mg', isAvailable: false },
        dietaryVitaminB12: { value: 0, unit: 'μg', isAvailable: false },
        dietaryVitaminC: { value: 0, unit: 'mg', isAvailable: false },
        dietaryVitaminD: { value: 0, unit: 'μg', isAvailable: false },
        dietaryVitaminE: { value: 0, unit: 'mg', isAvailable: false },
        dietaryVitaminK: { value: 0, unit: 'μg', isAvailable: false },
        dietaryFolate: { value: 0, unit: 'μg', isAvailable: false },
      });

      console.log('Health Connect permissions reset successfully');
      return true;
    } catch (error) {
      console.error('Error resetting Health Connect permissions:', error);
      return false;
    }
  }, []);

  const fetchHealthMetric = useCallback(
    async (recordType: RecordType, timeRange?: TimeRangeFilter): Promise<HealthMetric> => {
      try {
        console.log(`Fetching ${recordType} from Health Connect`);

        // Use 24-hour window for consistency with iOS
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const records = await readRecords(recordType, {
          timeRangeFilter: timeRange || {
            operator: 'between',
            startTime: twentyFourHoursAgo.toISOString(),
            endTime: now.toISOString(),
          },
        });

        if (records && records.records.length > 0) {
          // Special handling for Sleep: aggregate all sleep sessions in the last 24 hours
          if (recordType === 'SleepSession') {
            console.log('Processing sleep sessions for the last 24 hours');
            console.log('Number of sleep sessions found:', records.records.length);

            let totalSleepMs = 0;
            let latestEnd: Date | undefined;

            for (const record of records.records) {
              const sleepRecord = record as any;
              if (sleepRecord.startTime && sleepRecord.endTime) {
                const startMs = new Date(sleepRecord.startTime).getTime();
                const endMs = new Date(sleepRecord.endTime).getTime();
                const durationMs = Math.max(0, endMs - startMs);
                totalSleepMs += durationMs;

                if (!latestEnd || endMs > latestEnd.getTime()) {
                  latestEnd = new Date(endMs);
                }
              }
            }

            const hours = totalSleepMs / (1000 * 60 * 60);
            console.log('Total sleep hours calculated:', hours);

            return {
              value: Math.round(hours * 10) / 10,
              unit: 'hrs',
              date: latestEnd ?? now,
              isAvailable: true,
            };
          }

          // For cumulative metrics like steps and active energy, sum all values from the last 24 hours
          if (recordType === 'Steps' || recordType === 'ActiveCaloriesBurned') {
            const totalValue = records.records.reduce((sum, record: any) => {
              return sum + (record.count || record.total || record.value || record.steps || 0);
            }, 0);

            return {
              value: Math.round(totalValue),
              unit: recordType === 'Steps' ? 'steps' : 'kcal',
              date: now,
              isAvailable: true,
            };
          }

          // For instantaneous metrics, get the most recent
          const latestRecord = records.records[records.records.length - 1];
          const value =
            (latestRecord as any).count ||
            (latestRecord as any).total ||
            (latestRecord as any).value ||
            (latestRecord as any).energy?.kilocalories ||
            (latestRecord as any).steps ||
            0;

          return {
            value: Math.round(value * 10) / 10,
            unit: 'unknown',
            date: now,
            isAvailable: true,
          };
        }

        return { value: 0, isAvailable: false, error: 'No data available' };
      } catch (error) {
        console.warn(`Health Connect metric ${recordType} is not available:`, error);
        return { value: 0, isAvailable: false, error: 'Metric not supported or no data available' };
      }
    },
    [],
  );

  const fetchAllHealthData = useCallback(async () => {
    if (!hasPermissions) return;

    setIsLoading(true);
    try {
      // Re-verify permissions before fetching data
      const stillHasPermissions = await verifyPermissions(false);
      if (!stillHasPermissions) {
        setHasPermissions(false);
        setIsLoading(false);
        return;
      }

      // Get 24-hour window for consistency with iOS (instead of just "today")
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const timeRange: TimeRangeFilter = {
        operator: 'between',
        startTime: twentyFourHoursAgo.toISOString(),
        endTime: now.toISOString(),
      };

      const [
        steps,
        heartRate,
        activeEnergy,
        sleep,
        weight,
        bodyFat,
        bloodGlucose,
        oxygenSaturation,
        restingHeartRate,
        bodyTemperature,
        respiratoryRate,
        vo2Max,
        distance,
        flightsClimbed,
        exerciseTime,
        bloodPressure,
        leanBodyMass,
        nutrition,
        hydration,
      ] = await Promise.all([
        fetchHealthMetric('Steps', timeRange),
        fetchHealthMetric('HeartRate', timeRange),
        fetchHealthMetric('ActiveCaloriesBurned', timeRange),
        fetchHealthMetric('SleepSession', timeRange),
        fetchHealthMetric('Weight', timeRange),
        fetchHealthMetric('BodyFat', timeRange),
        fetchHealthMetric('BloodGlucose', timeRange),
        fetchHealthMetric('OxygenSaturation', timeRange),
        fetchHealthMetric('RestingHeartRate', timeRange),
        fetchHealthMetric('BodyTemperature', timeRange),
        fetchHealthMetric('RespiratoryRate', timeRange),
        fetchHealthMetric('Vo2Max', timeRange),
        fetchHealthMetric('Distance', timeRange),
        fetchHealthMetric('FloorsClimbed', timeRange),
        fetchHealthMetric('ExerciseSession', timeRange),
        fetchHealthMetric('BloodPressure', timeRange),
        fetchHealthMetric('LeanBodyMass', timeRange),
        fetchHealthMetric('Nutrition', timeRange),
        fetchHealthMetric('Hydration', timeRange),
      ]);

      if (__DEV__) {
        console.log('Health Connect data fetched successfully');
      }

      setHealthData({
        steps,
        heartRate,
        activeEnergy,
        sleep,
        weight,
        bodyFat,
        bloodGlucose,
        oxygenSaturation,
        restingHeartRate,
        heartRateVariability: { value: 0, isAvailable: false }, // Not available in Health Connect
        bloodPressureSystolic: bloodPressure,
        bloodPressureDiastolic: bloodPressure,
        bodyTemperature,
        respiratoryRate,
        vo2Max,
        distanceWalkingRunning: distance,
        distanceCycling: { value: 0, isAvailable: false }, // Not directly available
        flightsClimbed,
        standTime: { value: 0, isAvailable: false }, // Not available in Health Connect
        exerciseTime,
        mindfulMinutes: { value: 0, isAvailable: false }, // Not available in Health Connect
        bodyMassIndex: { value: 0, isAvailable: false }, // Calculate from weight/height
        leanBodyMass,
        waistCircumference: { value: 0, isAvailable: false }, // Not available in Health Connect
        bloodAlcoholContent: { value: 0, isAvailable: false }, // Not available in Health Connect
        caffeine: { value: 0, isAvailable: false }, // Part of nutrition
        dietaryWater: hydration,
        dietaryEnergyConsumed: nutrition,
        dietaryProtein: { value: 0, isAvailable: false }, // Part of nutrition
        dietaryCarbohydrates: { value: 0, isAvailable: false }, // Part of nutrition
        dietaryFatTotal: { value: 0, isAvailable: false }, // Part of nutrition
        dietaryFiber: { value: 0, isAvailable: false }, // Part of nutrition
        dietarySugar: { value: 0, isAvailable: false }, // Part of nutrition
        dietarySodium: { value: 0, isAvailable: false }, // Part of nutrition
        dietaryCholesterol: { value: 0, isAvailable: false }, // Part of nutrition
        dietarySaturatedFat: { value: 0, isAvailable: false }, // Part of nutrition
        dietaryCalcium: { value: 0, isAvailable: false }, // Part of nutrition
        dietaryIron: { value: 0, isAvailable: false }, // Part of nutrition
        dietaryMagnesium: { value: 0, isAvailable: false }, // Part of nutrition
        dietaryPotassium: { value: 0, isAvailable: false }, // Part of nutrition
        dietaryVitaminA: { value: 0, isAvailable: false }, // Part of nutrition
        dietaryVitaminB6: { value: 0, isAvailable: false }, // Part of nutrition
        dietaryVitaminB12: { value: 0, isAvailable: false }, // Part of nutrition
        dietaryVitaminC: { value: 0, isAvailable: false }, // Part of nutrition
        dietaryVitaminD: { value: 0, isAvailable: false }, // Part of nutrition
        dietaryVitaminE: { value: 0, isAvailable: false }, // Part of nutrition
        dietaryVitaminK: { value: 0, isAvailable: false }, // Part of nutrition
        dietaryFolate: { value: 0, isAvailable: false }, // Part of nutrition
      });
    } catch (error) {
      console.error('Error fetching Health Connect data:', error);
      const stillHasPermissions = await verifyPermissions(false);
      if (!stillHasPermissions) {
        setHasPermissions(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [hasPermissions, fetchHealthMetric, verifyPermissions]);

  useEffect(() => {
    checkHealthDataAvailability();
  }, [checkHealthDataAvailability]);

  useEffect(() => {
    if (hasPermissions) {
      fetchAllHealthData();
    }
  }, [hasPermissions, fetchAllHealthData]);

  return {
    isAvailable,
    isLoading,
    hasPermissions,
    healthData,
    requestPermissions: requestHealthConnectPermissions,
    refreshData: fetchAllHealthData,
    verifyPermissions: () => verifyPermissions(false),
    resetPermissions: resetHealthConnectPermissions,
  };
}
