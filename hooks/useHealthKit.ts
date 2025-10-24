import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  isHealthDataAvailable,
  getMostRecentQuantitySample,
  getMostRecentCategorySample,
  queryCategorySamples,
  queryQuantitySamples,
  subscribeToChanges,
  QuantityTypeIdentifier,
  CategoryTypeIdentifier,
  useHealthkitAuthorization,
  AuthorizationRequestStatus,
  CategoryValueSleepAnalysis,
} from '@kingstinct/react-native-healthkit';

export interface HealthMetric {
  value: number | string;
  unit?: string;
  date?: Date;
  isAvailable: boolean;
  error?: string;
}

export interface HealthKitData {
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

// Note: We now use the kingstinct useHealthkitAuthorization hook which handles all permissions
// The permissions are defined directly in the hook call below

export function useHealthKit() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermissions, setHasPermissions] = useState(false);

  // Permission change listeners
  const permissionChangeListeners = useRef<Set<(hasPermissions: boolean) => void>>(new Set());

  // Use the kingstinct recommended authorization hook
  const [authorizationStatus, requestHealthkitAuthorization] = useHealthkitAuthorization([
    'HKQuantityTypeIdentifierStepCount',
    'HKQuantityTypeIdentifierHeartRate',
    'HKQuantityTypeIdentifierActiveEnergyBurned',
    'HKQuantityTypeIdentifierBodyMass',
    'HKQuantityTypeIdentifierBodyFatPercentage',
    'HKQuantityTypeIdentifierBloodGlucose',
    'HKQuantityTypeIdentifierOxygenSaturation',
    'HKCategoryTypeIdentifierSleepAnalysis',
    'HKQuantityTypeIdentifierRestingHeartRate',
    'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
    'HKQuantityTypeIdentifierBodyTemperature',
    'HKQuantityTypeIdentifierRespiratoryRate',
    'HKQuantityTypeIdentifierVO2Max',
    'HKQuantityTypeIdentifierDistanceWalkingRunning',
    'HKQuantityTypeIdentifierDistanceCycling',
    'HKQuantityTypeIdentifierFlightsClimbed',
    'HKQuantityTypeIdentifierAppleStandTime',
    'HKQuantityTypeIdentifierAppleExerciseTime',
    'HKCategoryTypeIdentifierMindfulSession',
    'HKQuantityTypeIdentifierBodyMassIndex',
    'HKQuantityTypeIdentifierLeanBodyMass',
    'HKQuantityTypeIdentifierWaistCircumference',
    'HKQuantityTypeIdentifierBloodPressureSystolic',
    'HKQuantityTypeIdentifierBloodPressureDiastolic',
    'HKQuantityTypeIdentifierBloodAlcoholContent',
    'HKQuantityTypeIdentifierDietaryCaffeine',
    'HKQuantityTypeIdentifierDietaryWater',
    'HKQuantityTypeIdentifierDietaryEnergyConsumed',
    'HKQuantityTypeIdentifierDietaryProtein',
    'HKQuantityTypeIdentifierDietaryCarbohydrates',
    'HKQuantityTypeIdentifierDietaryFatTotal',
    'HKQuantityTypeIdentifierDietaryFiber',
    'HKQuantityTypeIdentifierDietarySugar',
    'HKQuantityTypeIdentifierDietarySodium',
    'HKQuantityTypeIdentifierDietaryCholesterol',
    'HKQuantityTypeIdentifierDietaryFatSaturated',
    'HKQuantityTypeIdentifierDietaryCalcium',
    'HKQuantityTypeIdentifierDietaryIron',
    'HKQuantityTypeIdentifierDietaryMagnesium',
    'HKQuantityTypeIdentifierDietaryPotassium',
    'HKQuantityTypeIdentifierDietaryVitaminA',
    'HKQuantityTypeIdentifierDietaryVitaminB6',
    'HKQuantityTypeIdentifierDietaryVitaminB12',
    'HKQuantityTypeIdentifierDietaryVitaminC',
    'HKQuantityTypeIdentifierDietaryVitaminD',
    'HKQuantityTypeIdentifierDietaryVitaminE',
    'HKQuantityTypeIdentifierDietaryVitaminK',
    'HKQuantityTypeIdentifierDietaryFolate',
  ]);
  const [healthData, setHealthData] = useState<HealthKitData>({
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
        // Use the authorization status from the kingstinct hook
        const isAuthorized = authorizationStatus === AuthorizationRequestStatus.unnecessary;
        const previousPermissions = hasPermissions;
        setHasPermissions(isAuthorized);

        // Notify listeners if permissions changed
        if (previousPermissions !== isAuthorized) {
          console.log('📱 HealthKit permissions changed:', isAuthorized);
          permissionChangeListeners.current.forEach((listener) => {
            try {
              listener(isAuthorized);
            } catch (error) {
              console.error('Error in permission change listener:', error);
            }
          });
        }

        console.log('Authorization status:', authorizationStatus, 'isAuthorized:', isAuthorized);
      }
    } catch (error) {
      console.error('Error checking health data availability:', error);
      setIsAvailable(false);
      setHasPermissions(false);
    } finally {
      setIsLoading(false);
    }
  }, [authorizationStatus, hasPermissions]);

  const requestHealthKitPermissions = useCallback(
    async (requestAllPermissions = false) => {
      if (!isAvailable) return false;

      try {
        setIsLoading(true);

        console.log('Requesting HealthKit permissions using kingstinct authorization');

        // Use the kingstinct recommended authorization method
        await requestHealthkitAuthorization();

        // The authorization status will be updated automatically by the hook
        // We'll check it in the next render cycle
        return true;
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
    },
    [isAvailable, requestHealthkitAuthorization],
  );

  const resetHealthKitPermissions = useCallback(async () => {
    try {
      // Clear cached permissions
      await AsyncStorage.removeItem('healthkit_permissions_granted');
      setHasPermissions(false);

      // Re-request permissions using kingstinct authorization
      console.log('Resetting permissions and re-requesting authorization');
      await requestHealthkitAuthorization();

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

      console.log('HealthKit permissions reset successfully');
      return true;
    } catch (error) {
      console.error('Error resetting HealthKit permissions:', error);
      return false;
    }
  }, [requestHealthkitAuthorization]);

  // Add permission change listener
  const addPermissionChangeListener = useCallback((listener: (hasPermissions: boolean) => void) => {
    permissionChangeListeners.current.add(listener);
    return () => {
      permissionChangeListeners.current.delete(listener);
    };
  }, []);

  // Remove permission change listener
  const removePermissionChangeListener = useCallback((listener: (hasPermissions: boolean) => void) => {
    permissionChangeListeners.current.delete(listener);
  }, []);

  const fetchHealthMetric = useCallback(async (type: string, isCategory = false): Promise<HealthMetric> => {
    try {
      console.log(`Fetching ${type} (category: ${isCategory})`);

      // Get today's date range (start of today to now)
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

      if (isCategory) {
        // Special handling for Sleep: aggregate all sleep segments in the last 24 hours
        if (type.includes('Sleep')) {
          console.log('yyyyyyyyyyyyyyyyyyyyy');
          console.log('type', type);
          const now = new Date();
          const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          console.log('xxxxxxxxxxxxxxxxxxxxxxxxx');
          console.log('twentyFourHoursAgo', twentyFourHoursAgo);
          console.log('xxxxxxxxxxxxxxxxxxxxxxxxx');

          const samples = await queryCategorySamples(type as CategoryTypeIdentifier, {
            filter: {
              startDate: twentyFourHoursAgo,
              endDate: now,
              strictStartDate: true,
              strictEndDate: true,
            },
            ascending: false,
          });

          if (samples && samples.length > 0) {
            // Sum durations for asleep categories only
            const asleepValues = new Set<number>([
              CategoryValueSleepAnalysis.asleepUnspecified,
              CategoryValueSleepAnalysis.asleepCore,
              CategoryValueSleepAnalysis.asleepDeep,
              CategoryValueSleepAnalysis.asleepREM,
            ]);
            console.log('aaaaaaaaaaaaaaaaaaaaa');
            console.log('samples', samples);
            console.log('samples.length', samples.length);
            console.log('asleepValues', asleepValues);
            console.log('aaaaaaaaaaaaaaaaaaaaa');

            let totalMs = 0;
            let latestEnd: Date | undefined;

            for (const s of samples) {
              if (asleepValues.has(Number(s.value))) {
                const startMs = new Date(s.startDate).getTime();
                const endMs = new Date(s.endDate).getTime();
                totalMs += Math.max(0, endMs - startMs);
                if (!latestEnd || endMs > latestEnd.getTime()) {
                  latestEnd = new Date(endMs);
                }
              }
            }

            const hours = totalMs / (1000 * 60 * 60);
            console.log('zzzzzzzzzzzzzzzzzzz');
            console.log('hours', hours);
            console.log('zzzzzzzzzzzzzzzzzzz');
            return {
              value: Math.round(hours * 10) / 10,
              unit: 'hrs',
              date: latestEnd ?? now,
              isAvailable: true,
            };
          }

          // Fallback: most recent category sample (legacy behavior)
          const recent = await getMostRecentCategorySample(type as CategoryTypeIdentifier);
          if (recent) {
            const duration =
              (new Date(recent.endDate).getTime() - new Date(recent.startDate).getTime()) / (1000 * 60 * 60);
            return {
              value: Math.round(duration * 10) / 10,
              unit: 'hrs',
              date: new Date(recent.endDate),
              isAvailable: true,
            };
          }
        } else {
          // Non-sleep category: keep most recent value behavior
          const sample = await getMostRecentCategorySample(type as CategoryTypeIdentifier);
          if (sample) {
            return {
              value: sample.value,
              date: new Date(sample.endDate),
              isAvailable: true,
            };
          }
        }
      } else {
        // For cumulative metrics like steps and active energy, get today's total
        if (type.includes('StepCount') || type.includes('ActiveEnergyBurned')) {
          try {
            // PERFORMANCE FIX: Query ONLY today's samples using native date range filtering
            // This prevents fetching ALL historical data and filtering in JavaScript,
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
            console.log(`Successfully fetched quantity ${type}:`, sample.quantity, sample.unit);
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
      // Log the error but don't throw - return unavailable status instead
      console.warn(`Health metric ${type} is not available or not supported:`, error);
      return { value: 0, isAvailable: false, error: 'Metric not supported or no data available' };
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
        heartRateVariability,
        bloodPressureSystolic,
        bloodPressureDiastolic,
        bodyTemperature,
        respiratoryRate,
        vo2Max,
        distanceWalkingRunning,
        distanceCycling,
        flightsClimbed,
        standTime,
        exerciseTime,
        mindfulMinutes,
        bodyMassIndex,
        leanBodyMass,
        waistCircumference,
        bloodAlcoholContent,
        caffeine,
        dietaryWater,
        dietaryEnergyConsumed,
        dietaryProtein,
        dietaryCarbohydrates,
        dietaryFatTotal,
        dietaryFiber,
        dietarySugar,
        dietarySodium,
        dietaryCholesterol,
        dietarySaturatedFat,
        dietaryCalcium,
        dietaryIron,
        dietaryMagnesium,
        dietaryPotassium,
        dietaryVitaminA,
        dietaryVitaminB6,
        dietaryVitaminB12,
        dietaryVitaminC,
        dietaryVitaminD,
        dietaryVitaminE,
        dietaryVitaminK,
        dietaryFolate,
      ] = await Promise.all([
        fetchHealthMetric('HKQuantityTypeIdentifierStepCount'),
        fetchHealthMetric('HKQuantityTypeIdentifierHeartRate'),
        fetchHealthMetric('HKQuantityTypeIdentifierActiveEnergyBurned'),
        fetchHealthMetric('HKCategoryTypeIdentifierSleepAnalysis', true),
        fetchHealthMetric('HKQuantityTypeIdentifierBodyMass'),
        fetchHealthMetric('HKQuantityTypeIdentifierBodyFatPercentage'),
        fetchHealthMetric('HKQuantityTypeIdentifierBloodGlucose'),
        fetchHealthMetric('HKQuantityTypeIdentifierOxygenSaturation'),
        // Additional metrics
        fetchHealthMetric('HKQuantityTypeIdentifierRestingHeartRate'),
        fetchHealthMetric('HKQuantityTypeIdentifierHeartRateVariabilitySDNN'),
        fetchHealthMetric('HKQuantityTypeIdentifierBloodPressureSystolic'),
        fetchHealthMetric('HKQuantityTypeIdentifierBloodPressureDiastolic'),
        fetchHealthMetric('HKQuantityTypeIdentifierBodyTemperature'),
        fetchHealthMetric('HKQuantityTypeIdentifierRespiratoryRate'),
        fetchHealthMetric('HKQuantityTypeIdentifierVO2Max'),
        fetchHealthMetric('HKQuantityTypeIdentifierDistanceWalkingRunning'),
        fetchHealthMetric('HKQuantityTypeIdentifierDistanceCycling'),
        fetchHealthMetric('HKQuantityTypeIdentifierFlightsClimbed'),
        fetchHealthMetric('HKQuantityTypeIdentifierAppleStandTime'),
        fetchHealthMetric('HKQuantityTypeIdentifierAppleExerciseTime'),
        fetchHealthMetric('HKCategoryTypeIdentifierMindfulSession', true),
        fetchHealthMetric('HKQuantityTypeIdentifierBodyMassIndex'),
        fetchHealthMetric('HKQuantityTypeIdentifierLeanBodyMass'),
        fetchHealthMetric('HKQuantityTypeIdentifierWaistCircumference'),
        fetchHealthMetric('HKQuantityTypeIdentifierBloodAlcoholContent'),
        fetchHealthMetric('HKQuantityTypeIdentifierDietaryCaffeine'),
        fetchHealthMetric('HKQuantityTypeIdentifierDietaryWater'),
        fetchHealthMetric('HKQuantityTypeIdentifierDietaryEnergyConsumed'),
        fetchHealthMetric('HKQuantityTypeIdentifierDietaryProtein'),
        fetchHealthMetric('HKQuantityTypeIdentifierDietaryCarbohydrates'),
        fetchHealthMetric('HKQuantityTypeIdentifierDietaryFatTotal'),
        fetchHealthMetric('HKQuantityTypeIdentifierDietaryFiber'),
        fetchHealthMetric('HKQuantityTypeIdentifierDietarySugar'),
        fetchHealthMetric('HKQuantityTypeIdentifierDietarySodium'),
        fetchHealthMetric('HKQuantityTypeIdentifierDietaryCholesterol'),
        fetchHealthMetric('HKQuantityTypeIdentifierDietaryFatSaturated'),
        fetchHealthMetric('HKQuantityTypeIdentifierDietaryCalcium'),
        fetchHealthMetric('HKQuantityTypeIdentifierDietaryIron'),
        fetchHealthMetric('HKQuantityTypeIdentifierDietaryMagnesium'),
        fetchHealthMetric('HKQuantityTypeIdentifierDietaryPotassium'),
        fetchHealthMetric('HKQuantityTypeIdentifierDietaryVitaminA'),
        fetchHealthMetric('HKQuantityTypeIdentifierDietaryVitaminB6'),
        fetchHealthMetric('HKQuantityTypeIdentifierDietaryVitaminB12'),
        fetchHealthMetric('HKQuantityTypeIdentifierDietaryVitaminC'),
        fetchHealthMetric('HKQuantityTypeIdentifierDietaryVitaminD'),
        fetchHealthMetric('HKQuantityTypeIdentifierDietaryVitaminE'),
        fetchHealthMetric('HKQuantityTypeIdentifierDietaryVitaminK'),
        fetchHealthMetric('HKQuantityTypeIdentifierDietaryFolate'),
      ]);
      if (__DEV__) {
        console.log('HealthKit data fetched successfully');
        // Optionally keep minimal, non-sensitive diagnostics here during development.
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
        heartRateVariability,
        bloodPressureSystolic,
        bloodPressureDiastolic,
        bodyTemperature,
        respiratoryRate,
        vo2Max,
        distanceWalkingRunning,
        distanceCycling,
        flightsClimbed,
        standTime,
        exerciseTime,
        mindfulMinutes,
        bodyMassIndex,
        leanBodyMass,
        waistCircumference,
        bloodAlcoholContent,
        caffeine,
        dietaryWater,
        dietaryEnergyConsumed,
        dietaryProtein,
        dietaryCarbohydrates,
        dietaryFatTotal,
        dietaryFiber,
        dietarySugar,
        dietarySodium,
        dietaryCholesterol,
        dietarySaturatedFat,
        dietaryCalcium,
        dietaryIron,
        dietaryMagnesium,
        dietaryPotassium,
        dietaryVitaminA,
        dietaryVitaminB6,
        dietaryVitaminB12,
        dietaryVitaminC,
        dietaryVitaminD,
        dietaryVitaminE,
        dietaryVitaminK,
        dietaryFolate,
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

  useEffect(() => {
    console.log('healthData', healthData);
  }, [healthData]);

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
    resetPermissions: resetHealthKitPermissions,
    addPermissionChangeListener,
    removePermissionChangeListener,
  };
}
