import { Platform } from 'react-native';
import {
  getMostRecentQuantitySample,
  queryQuantitySamples,
  queryCategorySamples,
  CategoryValueSleepAnalysis,
} from '@kingstinct/react-native-healthkit';
import { readRecords } from 'react-native-health-connect';

interface HourlyHealthMetric {
  value: number;
  unit: string;
  isAvailable: boolean;
  error: string;
}

interface HourlyHealthData {
  steps: HourlyHealthMetric;
  heartRate: HourlyHealthMetric;
  activeEnergy: HourlyHealthMetric;
  sleep: HourlyHealthMetric;
  weight: HourlyHealthMetric;
  bodyFat: HourlyHealthMetric;
  bloodGlucose: HourlyHealthMetric;
  oxygenSaturation: HourlyHealthMetric;
}

// Create default metric for hourly data
const createHourlyMetric = (value: number = 0, unit: string = '', error: string = ''): HourlyHealthMetric => ({
  value,
  unit,
  isAvailable: !error,
  error,
});

/**
 * Fetches health data for the last 1 hour specifically for background sync
 */
export class HourlyHealthDataFetcher {
  private static instance: HourlyHealthDataFetcher;

  private constructor() {}

  public static getInstance(): HourlyHealthDataFetcher {
    if (!HourlyHealthDataFetcher.instance) {
      HourlyHealthDataFetcher.instance = new HourlyHealthDataFetcher();
    }
    return HourlyHealthDataFetcher.instance;
  }

  /**
   * Get the time range for the last hour
   */
  private getLastHourTimeRange(): { startTime: Date; endTime: Date } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

    return {
      startTime: oneHourAgo,
      endTime: now,
    };
  }

  /**
   * Get the time range from a specific start time to now
   */
  private getTimeRangeFromTime(startTime?: Date): { startTime: Date; endTime: Date } {
    const now = new Date();
    const fromTime = startTime || new Date(now.getTime() - 60 * 60 * 1000); // Default to 1 hour ago

    return {
      startTime: fromTime,
      endTime: now,
    };
  }

  /**
   * Fetch health data for the last 1 hour (iOS HealthKit)
   */
  private async fetchIOSHourlyData(): Promise<HourlyHealthData> {
    const { startTime, endTime } = this.getLastHourTimeRange();
    return this.fetchIOSHealthDataForTimeRange(startTime, endTime);
  }

  /**
   * Fetch health data from a specific time to now (iOS HealthKit)
   */
  private async fetchIOSHealthDataFromTime(fromTime?: Date): Promise<HourlyHealthData> {
    const { startTime, endTime } = this.getTimeRangeFromTime(fromTime);
    return this.fetchIOSHealthDataForTimeRange(startTime, endTime);
  }

  /**
   * Fetch health data for a specific time range (iOS HealthKit)
   */
  private async fetchIOSHealthDataForTimeRange(startTime: Date, endTime: Date): Promise<HourlyHealthData> {
    console.log(`📊 Fetching iOS health data for time range: ${startTime.toISOString()} to ${endTime.toISOString()}`);

    try {
      // Fetch steps (sum for the time range)
      const steps = await this.fetchIOSSteps(startTime, endTime);

      // Fetch heart rate (average for the time range)
      const heartRate = await this.fetchIOSHeartRate(startTime, endTime);

      // Fetch active energy (sum for the time range)
      const activeEnergy = await this.fetchIOSActiveEnergy(startTime, endTime);

      // Fetch sleep (sum for the time range - if any sleep occurred)
      const sleep = await this.fetchIOSSleep(startTime, endTime);

      // Fetch weight (most recent value in the time range)
      const weight = await this.fetchIOSWeight(startTime, endTime);

      // Fetch body fat (most recent value in the time range)
      const bodyFat = await this.fetchIOSBodyFat(startTime, endTime);

      // Fetch blood glucose (average for the time range)
      const bloodGlucose = await this.fetchIOSBloodGlucose(startTime, endTime);

      // Fetch oxygen saturation (average for the time range)
      const oxygenSaturation = await this.fetchIOSOxygenSaturation(startTime, endTime);

      return {
        steps,
        heartRate,
        activeEnergy,
        sleep,
        weight,
        bodyFat,
        bloodGlucose,
        oxygenSaturation,
      };
    } catch (error) {
      console.error('❌ Failed to fetch iOS health data for time range:', error);
      return this.getDefaultHourlyData();
    }
  }

  /**
   * Fetch health data for the last 1 hour (Android Health Connect)
   */
  private async fetchAndroidHourlyData(): Promise<HourlyHealthData> {
    const { startTime, endTime } = this.getLastHourTimeRange();
    return this.fetchAndroidHealthDataForTimeRange(startTime, endTime);
  }

  /**
   * Fetch health data from a specific time to now (Android Health Connect)
   */
  private async fetchAndroidHealthDataFromTime(fromTime?: Date): Promise<HourlyHealthData> {
    const { startTime, endTime } = this.getTimeRangeFromTime(fromTime);
    return this.fetchAndroidHealthDataForTimeRange(startTime, endTime);
  }

  /**
   * Fetch health data for a specific time range (Android Health Connect)
   */
  private async fetchAndroidHealthDataForTimeRange(startTime: Date, endTime: Date): Promise<HourlyHealthData> {
    console.log(
      `📊 Fetching Android health data for time range: ${startTime.toISOString()} to ${endTime.toISOString()}`,
    );

    try {
      const timeRange = {
        operator: 'between' as const,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      };

      // Fetch steps (sum for the time range)
      const steps = await this.fetchAndroidSteps(timeRange);

      // Fetch heart rate (average for the time range)
      const heartRate = await this.fetchAndroidHeartRate(timeRange);

      // Fetch active energy (sum for the time range)
      const activeEnergy = await this.fetchAndroidActiveEnergy(timeRange);

      // Fetch sleep (sum for the time range)
      const sleep = await this.fetchAndroidSleep(timeRange);

      // Fetch weight (most recent value in the time range)
      const weight = await this.fetchAndroidWeight(timeRange);

      // Fetch body fat (most recent value in the time range)
      const bodyFat = await this.fetchAndroidBodyFat(timeRange);

      // Fetch blood glucose (average for the time range)
      const bloodGlucose = await this.fetchAndroidBloodGlucose(timeRange);

      // Fetch oxygen saturation (average for the time range)
      const oxygenSaturation = await this.fetchAndroidOxygenSaturation(timeRange);

      return {
        steps,
        heartRate,
        activeEnergy,
        sleep,
        weight,
        bodyFat,
        bloodGlucose,
        oxygenSaturation,
      };
    } catch (error) {
      console.error('❌ Failed to fetch Android health data for time range:', error);
      return this.getDefaultHourlyData();
    }
  }

  // iOS specific fetch methods
  private async fetchIOSSteps(startTime: Date, endTime: Date): Promise<HourlyHealthMetric> {
    try {
      const samples = await queryQuantitySamples('HKQuantityTypeIdentifierStepCount', {
        filter: { startDate: startTime, endDate: endTime },
        ascending: false,
      });

      if (samples && samples.length > 0) {
        // Sum all step counts in the hour
        const totalSteps = samples.reduce((sum, sample) => sum + sample.quantity, 0);
        return createHourlyMetric(Math.round(totalSteps), 'count');
      }

      return createHourlyMetric(0, 'count', 'No steps data for the time range');
    } catch (error) {
      return createHourlyMetric(0, 'count', 'Failed to fetch steps data');
    }
  }

  private async fetchIOSHeartRate(startTime: Date, endTime: Date): Promise<HourlyHealthMetric> {
    try {
      const samples = await queryQuantitySamples('HKQuantityTypeIdentifierHeartRate', {
        filter: { startDate: startTime, endDate: endTime },
        ascending: false,
      });

      if (samples && samples.length > 0) {
        // Average heart rate for the hour
        const averageHR = samples.reduce((sum, sample) => sum + sample.quantity, 0) / samples.length;
        return createHourlyMetric(Math.round(averageHR), 'BPM');
      }

      return createHourlyMetric(0, 'BPM', 'No heart rate data for the last hour');
    } catch (error) {
      return createHourlyMetric(0, 'BPM', 'Failed to fetch heart rate data');
    }
  }

  private async fetchIOSActiveEnergy(startTime: Date, endTime: Date): Promise<HourlyHealthMetric> {
    try {
      const samples = await queryQuantitySamples('HKQuantityTypeIdentifierActiveEnergyBurned', {
        filter: { startDate: startTime, endDate: endTime },
        ascending: false,
      });

      if (samples && samples.length > 0) {
        // Sum all active energy in the hour
        const totalEnergy = samples.reduce((sum, sample) => sum + sample.quantity, 0);
        return createHourlyMetric(Math.round(totalEnergy), 'kcal');
      }

      return createHourlyMetric(0, 'kcal', 'No active energy data for the last hour');
    } catch (error) {
      return createHourlyMetric(0, 'kcal', 'Failed to fetch active energy data');
    }
  }

  private async fetchIOSSleep(startTime: Date, endTime: Date): Promise<HourlyHealthMetric> {
    try {
      const samples = await queryCategorySamples('HKCategoryTypeIdentifierSleepAnalysis', {
        filter: { startDate: startTime, endDate: endTime },
        ascending: false,
      });

      if (samples && samples.length > 0) {
        // Sum sleep time in the hour (in minutes)
        let totalSleepMinutes = 0;

        samples.forEach((sample) => {
          if (
            sample.value === CategoryValueSleepAnalysis.inBed ||
            sample.value === CategoryValueSleepAnalysis.asleepCore ||
            sample.value === CategoryValueSleepAnalysis.asleepDeep ||
            sample.value === CategoryValueSleepAnalysis.asleepREM ||
            sample.value === CategoryValueSleepAnalysis.asleepUnspecified
          ) {
            const sampleStart = new Date(sample.startDate);
            const sampleEnd = new Date(sample.endDate);
            const durationMs = sampleEnd.getTime() - sampleStart.getTime();
            totalSleepMinutes += durationMs / (1000 * 60);
          }
        });

        const sleepHours = totalSleepMinutes / 60;
        return createHourlyMetric(Number(sleepHours.toFixed(2)), 'hours');
      }

      return createHourlyMetric(0, 'hours', 'No sleep data for the last hour');
    } catch (error) {
      return createHourlyMetric(0, 'hours', 'Failed to fetch sleep data');
    }
  }

  private async fetchIOSWeight(startTime: Date, endTime: Date): Promise<HourlyHealthMetric> {
    try {
      const sample = await getMostRecentQuantitySample('HKQuantityTypeIdentifierBodyMass');

      if (sample && new Date(sample.startDate) >= startTime) {
        return createHourlyMetric(Number(sample.quantity.toFixed(1)), 'kg');
      }

      return createHourlyMetric(0, 'kg', 'No weight data for the last hour');
    } catch (error) {
      return createHourlyMetric(0, 'kg', 'Failed to fetch weight data');
    }
  }

  private async fetchIOSBodyFat(startTime: Date, endTime: Date): Promise<HourlyHealthMetric> {
    try {
      const sample = await getMostRecentQuantitySample('HKQuantityTypeIdentifierBodyFatPercentage');

      if (sample && new Date(sample.startDate) >= startTime) {
        return createHourlyMetric(Number((sample.quantity * 100).toFixed(1)), '%');
      }

      return createHourlyMetric(0, '%', 'No body fat data for the last hour');
    } catch (error) {
      return createHourlyMetric(0, '%', 'Failed to fetch body fat data');
    }
  }

  private async fetchIOSBloodGlucose(startTime: Date, endTime: Date): Promise<HourlyHealthMetric> {
    try {
      const samples = await queryQuantitySamples('HKQuantityTypeIdentifierBloodGlucose', {
        filter: { startDate: startTime, endDate: endTime },
        ascending: false,
      });

      if (samples && samples.length > 0) {
        const averageGlucose = samples.reduce((sum, sample) => sum + sample.quantity, 0) / samples.length;
        return createHourlyMetric(Math.round(averageGlucose), 'mg/dL');
      }

      return createHourlyMetric(0, 'mg/dL', 'No blood glucose data for the last hour');
    } catch (error) {
      return createHourlyMetric(0, 'mg/dL', 'Failed to fetch blood glucose data');
    }
  }

  private async fetchIOSOxygenSaturation(startTime: Date, endTime: Date): Promise<HourlyHealthMetric> {
    try {
      const samples = await queryQuantitySamples('HKQuantityTypeIdentifierOxygenSaturation', {
        filter: { startDate: startTime, endDate: endTime },
        ascending: false,
      });

      if (samples && samples.length > 0) {
        const averageO2 = samples.reduce((sum, sample) => sum + sample.quantity, 0) / samples.length;
        return createHourlyMetric(Math.round(averageO2 * 100), '%');
      }

      return createHourlyMetric(0, '%', 'No oxygen saturation data for the last hour');
    } catch (error) {
      return createHourlyMetric(0, '%', 'Failed to fetch oxygen saturation data');
    }
  }

  // Android specific fetch methods
  private async fetchAndroidSteps(timeRange: any): Promise<HourlyHealthMetric> {
    try {
      const records = await readRecords('Steps', timeRange);

      if (records && records.records.length > 0) {
        const totalSteps = records.records.reduce((sum: number, record: any) => sum + (record.count || 0), 0);
        return createHourlyMetric(totalSteps, 'count');
      }

      return createHourlyMetric(0, 'count', 'No steps data for the last hour');
    } catch (error) {
      return createHourlyMetric(0, 'count', 'Failed to fetch steps data');
    }
  }

  private async fetchAndroidHeartRate(timeRange: any): Promise<HourlyHealthMetric> {
    try {
      const records = await readRecords('HeartRate', timeRange);

      if (records && records.records.length > 0) {
        const validRecords = records.records.filter((record: any) => record.beatsPerMinute > 0);
        if (validRecords.length > 0) {
          const averageHR =
            validRecords.reduce((sum: number, record: any) => sum + record.beatsPerMinute, 0) / validRecords.length;
          return createHourlyMetric(Math.round(averageHR), 'BPM');
        }
      }

      return createHourlyMetric(0, 'BPM', 'No heart rate data for the last hour');
    } catch (error) {
      return createHourlyMetric(0, 'BPM', 'Failed to fetch heart rate data');
    }
  }

  private async fetchAndroidActiveEnergy(timeRange: any): Promise<HourlyHealthMetric> {
    try {
      const records = await readRecords('ActiveCaloriesBurned', timeRange);

      if (records && records.records.length > 0) {
        const totalEnergy = records.records.reduce(
          (sum: number, record: any) => sum + (record.energy?.inKilocalories || 0),
          0,
        );
        return createHourlyMetric(Math.round(totalEnergy), 'kcal');
      }

      return createHourlyMetric(0, 'kcal', 'No active energy data for the last hour');
    } catch (error) {
      return createHourlyMetric(0, 'kcal', 'Failed to fetch active energy data');
    }
  }

  private async fetchAndroidSleep(timeRange: any): Promise<HourlyHealthMetric> {
    try {
      const records = await readRecords('SleepSession', timeRange);

      if (records && records.records.length > 0) {
        let totalSleepMinutes = 0;

        records.records.forEach((record: any) => {
          if (record.startTime && record.endTime) {
            const start = new Date(record.startTime);
            const end = new Date(record.endTime);
            const durationMs = end.getTime() - start.getTime();
            totalSleepMinutes += durationMs / (1000 * 60);
          }
        });

        const sleepHours = totalSleepMinutes / 60;
        return createHourlyMetric(Number(sleepHours.toFixed(2)), 'hours');
      }

      return createHourlyMetric(0, 'hours', 'No sleep data for the last hour');
    } catch (error) {
      return createHourlyMetric(0, 'hours', 'Failed to fetch sleep data');
    }
  }

  private async fetchAndroidWeight(timeRange: any): Promise<HourlyHealthMetric> {
    try {
      const records = await readRecords('Weight', timeRange);

      if (records && records.records.length > 0) {
        const latestRecord = records.records[records.records.length - 1];
        const weightKg = latestRecord.weight?.inKilograms || 0;
        return createHourlyMetric(Number(weightKg.toFixed(1)), 'kg');
      }

      return createHourlyMetric(0, 'kg', 'No weight data for the last hour');
    } catch (error) {
      return createHourlyMetric(0, 'kg', 'Failed to fetch weight data');
    }
  }

  private async fetchAndroidBodyFat(timeRange: any): Promise<HourlyHealthMetric> {
    try {
      const records = await readRecords('BodyFat', timeRange);

      if (records && records.records.length > 0) {
        const latestRecord = records.records[records.records.length - 1];
        const bodyFatPercent = latestRecord.percentage || 0;
        return createHourlyMetric(Number(bodyFatPercent.toFixed(1)), '%');
      }

      return createHourlyMetric(0, '%', 'No body fat data for the last hour');
    } catch (error) {
      return createHourlyMetric(0, '%', 'Failed to fetch body fat data');
    }
  }

  private async fetchAndroidBloodGlucose(timeRange: any): Promise<HourlyHealthMetric> {
    try {
      const records = await readRecords('BloodGlucose', timeRange);

      if (records && records.records.length > 0) {
        const validRecords = records.records.filter((record: any) => record.level?.inMilligramsPerDeciliter > 0);
        if (validRecords.length > 0) {
          const averageGlucose =
            validRecords.reduce((sum: number, record: any) => sum + record.level.inMilligramsPerDeciliter, 0) /
            validRecords.length;
          return createHourlyMetric(Math.round(averageGlucose), 'mg/dL');
        }
      }

      return createHourlyMetric(0, 'mg/dL', 'No blood glucose data for the last hour');
    } catch (error) {
      return createHourlyMetric(0, 'mg/dL', 'Failed to fetch blood glucose data');
    }
  }

  private async fetchAndroidOxygenSaturation(timeRange: any): Promise<HourlyHealthMetric> {
    try {
      const records = await readRecords('OxygenSaturation', timeRange);

      if (records && records.records.length > 0) {
        const validRecords = records.records.filter((record: any) => record.percentage > 0);
        if (validRecords.length > 0) {
          const averageO2 =
            validRecords.reduce((sum: number, record: any) => sum + record.percentage, 0) / validRecords.length;
          return createHourlyMetric(Math.round(averageO2), '%');
        }
      }

      return createHourlyMetric(0, '%', 'No oxygen saturation data for the last hour');
    } catch (error) {
      return createHourlyMetric(0, '%', 'Failed to fetch oxygen saturation data');
    }
  }

  /**
   * Get default hourly data (when no data is available)
   */
  private getDefaultHourlyData(): HourlyHealthData {
    return {
      steps: createHourlyMetric(0, 'count', 'No data available'),
      heartRate: createHourlyMetric(0, 'BPM', 'No data available'),
      activeEnergy: createHourlyMetric(0, 'kcal', 'No data available'),
      sleep: createHourlyMetric(0, 'hours', 'No data available'),
      weight: createHourlyMetric(0, 'kg', 'No data available'),
      bodyFat: createHourlyMetric(0, '%', 'No data available'),
      bloodGlucose: createHourlyMetric(0, 'mg/dL', 'No data available'),
      oxygenSaturation: createHourlyMetric(0, '%', 'No data available'),
    };
  }

  /**
   * Main method to fetch hourly health data
   */
  public async fetchHourlyHealthData(): Promise<HourlyHealthData> {
    console.log('📊 Starting hourly health data fetch...');

    try {
      if (Platform.OS === 'ios') {
        return await this.fetchIOSHourlyData();
      } else if (Platform.OS === 'android') {
        return await this.fetchAndroidHourlyData();
      } else {
        console.warn('⚠️ Unsupported platform for health data');
        return this.getDefaultHourlyData();
      }
    } catch (error) {
      console.error('❌ Failed to fetch hourly health data:', error);
      return this.getDefaultHourlyData();
    }
  }

  /**
   * Main method to fetch health data from a specific time to now
   */
  public async fetchHealthDataFromTime(fromTime?: Date): Promise<HourlyHealthData> {
    const startTime = fromTime || new Date(Date.now() - 60 * 60 * 1000); // Default to 1 hour ago
    console.log(`📊 Starting health data fetch from ${startTime.toISOString()} to now...`);

    try {
      if (Platform.OS === 'ios') {
        return await this.fetchIOSHealthDataFromTime(fromTime);
      } else if (Platform.OS === 'android') {
        return await this.fetchAndroidHealthDataFromTime(fromTime);
      } else {
        console.warn('⚠️ Unsupported platform for health data');
        return this.getDefaultHourlyData();
      }
    } catch (error) {
      console.error('❌ Failed to fetch health data from time:', error);
      return this.getDefaultHourlyData();
    }
  }
}

// Export singleton instance
export const hourlyHealthDataFetcher = HourlyHealthDataFetcher.getInstance();
