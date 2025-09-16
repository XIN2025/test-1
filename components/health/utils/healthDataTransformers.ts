import { formatHealthValue, normalizeUnit } from './healthFormatters';

export interface HealthMetric {
  type: string;
  value: string | number;
  unit?: string;
  label: string;
  isAvailable?: boolean;
}

export interface HealthData {
  steps?: { value: number | string; unit?: string; isAvailable?: boolean };
  heartRate?: { value: number | string; unit?: string; isAvailable?: boolean };
  activeEnergy?: { value: number | string; unit?: string; isAvailable?: boolean };
  sleep?: { value: number | string; unit?: string; isAvailable?: boolean };
  weight?: { value: number | string; unit?: string; isAvailable?: boolean };
  bodyFat?: { value: number | string; unit?: string; isAvailable?: boolean };
  bloodGlucose?: { value: number | string; unit?: string; isAvailable?: boolean };
  oxygenSaturation?: { value: number | string; unit?: string; isAvailable?: boolean };
  restingHeartRate?: { value: number | string; unit?: string; isAvailable?: boolean };
  bloodPressureSystolic?: { value: number | string; unit?: string; isAvailable?: boolean };
  bloodPressureDiastolic?: { value: number | string; unit?: string; isAvailable?: boolean };
  bodyTemperature?: { value: number | string; unit?: string; isAvailable?: boolean };
  respiratoryRate?: { value: number | string; unit?: string; isAvailable?: boolean };
  vo2Max?: { value: number | string; unit?: string; isAvailable?: boolean };
  distanceWalkingRunning?: { value: number | string; unit?: string; isAvailable?: boolean };
  distance?: { value: number | string; unit?: string; isAvailable?: boolean };
  flightsClimbed?: { value: number | string; unit?: string; isAvailable?: boolean };
  exerciseTime?: { value: number | string; unit?: string; isAvailable?: boolean };
  leanBodyMass?: { value: number | string; unit?: string; isAvailable?: boolean };
  dietaryWater?: { value: number | string; unit?: string; isAvailable?: boolean };
  dietaryEnergyConsumed?: { value: number | string; unit?: string; isAvailable?: boolean };
}

export const createHealthSections = (
  healthData: HealthData | null,
): {
  title: string;
  metrics: HealthMetric[];
  columns?: 1 | 2;
}[] => {
  if (!healthData) return [];

  // Core activity metrics
  const coreActivityMetrics: HealthMetric[] = [
    {
      type: 'steps',
      value: formatHealthValue(healthData?.steps?.value || 0, 'steps'),
      unit: normalizeUnit(healthData?.steps?.unit, 'steps'),
      label: 'Steps',
      isAvailable: healthData?.steps?.isAvailable || false,
    },
    {
      type: 'activeEnergy',
      value: formatHealthValue(healthData?.activeEnergy?.value || 0, 'activeEnergy'),
      unit: normalizeUnit(healthData?.activeEnergy?.unit, 'activeEnergy'),
      label: 'Active Calories',
      isAvailable: healthData?.activeEnergy?.isAvailable || false,
    },
    {
      type: 'distanceWalkingRunning',
      value: formatHealthValue(
        healthData?.distanceWalkingRunning?.value || healthData?.distance?.value || 0,
        'distance',
      ),
      unit: normalizeUnit(healthData?.distanceWalkingRunning?.unit || healthData?.distance?.unit, 'distance'),
      label: 'Distance Walked/Run',
      isAvailable: healthData?.distanceWalkingRunning?.isAvailable || healthData?.distance?.isAvailable || false,
    },
    {
      type: 'flightsClimbed',
      value: formatHealthValue(healthData?.flightsClimbed?.value || 0, 'flightsClimbed'),
      unit: normalizeUnit(healthData?.flightsClimbed?.unit, 'flightsClimbed'),
      label: 'Floors Climbed',
      isAvailable: healthData?.flightsClimbed?.isAvailable || false,
    },
    {
      type: 'exerciseTime',
      value: formatHealthValue(healthData?.exerciseTime?.value || 0, 'exerciseTime'),
      unit: normalizeUnit(healthData?.exerciseTime?.unit, 'exerciseTime'),
      label: 'Exercise Time',
      isAvailable: healthData?.exerciseTime?.isAvailable || false,
    },
  ];

  // Vital signs metrics
  const vitalSignsMetrics: HealthMetric[] = [
    {
      type: 'heartRate',
      value: formatHealthValue(healthData?.heartRate?.value || 0, 'heartRate'),
      unit: normalizeUnit(healthData?.heartRate?.unit, 'heartRate'),
      label: 'Heart Rate',
      isAvailable: healthData?.heartRate?.isAvailable || false,
    },
    {
      type: 'restingHeartRate',
      value: formatHealthValue(healthData?.restingHeartRate?.value || 0, 'restingHeartRate'),
      unit: normalizeUnit(healthData?.restingHeartRate?.unit, 'restingHeartRate'),
      label: 'Resting Heart Rate',
      isAvailable: healthData?.restingHeartRate?.isAvailable || false,
    },
    {
      type: 'bloodPressureSystolic',
      value: formatHealthValue(healthData?.bloodPressureSystolic?.value || 0, 'bloodPressureSystolic'),
      unit: normalizeUnit(healthData?.bloodPressureSystolic?.unit, 'bloodPressureSystolic'),
      label: 'Blood Pressure (Systolic)',
      isAvailable: healthData?.bloodPressureSystolic?.isAvailable || false,
    },
    {
      type: 'bloodPressureDiastolic',
      value: formatHealthValue(healthData?.bloodPressureDiastolic?.value || 0, 'bloodPressureDiastolic'),
      unit: normalizeUnit(healthData?.bloodPressureDiastolic?.unit, 'bloodPressureDiastolic'),
      label: 'Blood Pressure (Diastolic)',
      isAvailable: healthData?.bloodPressureDiastolic?.isAvailable || false,
    },
    {
      type: 'bodyTemperature',
      value: formatHealthValue(healthData?.bodyTemperature?.value || 0, 'bodyTemperature'),
      unit: normalizeUnit(healthData?.bodyTemperature?.unit, 'bodyTemperature'),
      label: 'Body Temperature',
      isAvailable: healthData?.bodyTemperature?.isAvailable || false,
    },
    {
      type: 'respiratoryRate',
      value: formatHealthValue(healthData?.respiratoryRate?.value || 0, 'respiratoryRate'),
      unit: normalizeUnit(healthData?.respiratoryRate?.unit, 'respiratoryRate'),
      label: 'Respiratory Rate',
      isAvailable: healthData?.respiratoryRate?.isAvailable || false,
    },
  ];

  // Body composition metrics
  const bodyCompositionMetrics: HealthMetric[] = [
    {
      type: 'weight',
      value: formatHealthValue(healthData?.weight?.value || 0, 'weight'),
      unit: normalizeUnit(healthData?.weight?.unit, 'weight'),
      label: 'Weight',
      isAvailable: healthData?.weight?.isAvailable || false,
    },
    {
      type: 'bodyFat',
      value: formatHealthValue(healthData?.bodyFat?.value || 0, 'bodyFat'),
      unit: normalizeUnit(healthData?.bodyFat?.unit, 'bodyFat'),
      label: 'Body Fat %',
      isAvailable: healthData?.bodyFat?.isAvailable || false,
    },
    {
      type: 'leanBodyMass',
      value: formatHealthValue(healthData?.leanBodyMass?.value || 0, 'leanBodyMass'),
      unit: normalizeUnit(healthData?.leanBodyMass?.unit, 'leanBodyMass'),
      label: 'Lean Body Mass',
      isAvailable: healthData?.leanBodyMass?.isAvailable || false,
    },
  ];

  // Health metrics
  const healthMetrics: HealthMetric[] = [
    {
      type: 'sleep',
      value: formatHealthValue(healthData?.sleep?.value || 0, 'sleep'),
      unit: normalizeUnit(healthData?.sleep?.unit, 'sleep'),
      label: 'Sleep',
      isAvailable: healthData?.sleep?.isAvailable || false,
    },
    {
      type: 'bloodGlucose',
      value: formatHealthValue(healthData?.bloodGlucose?.value || 0, 'bloodGlucose'),
      unit: normalizeUnit(healthData?.bloodGlucose?.unit, 'bloodGlucose'),
      label: 'Blood Glucose',
      isAvailable: healthData?.bloodGlucose?.isAvailable || false,
    },
    {
      type: 'oxygenSaturation',
      value: formatHealthValue(healthData?.oxygenSaturation?.value || 0, 'oxygenSaturation'),
      unit: normalizeUnit(healthData?.oxygenSaturation?.unit, 'oxygenSaturation'),
      label: 'Oxygen Saturation',
      isAvailable: healthData?.oxygenSaturation?.isAvailable || false,
    },
    {
      type: 'vo2Max',
      value: formatHealthValue(healthData?.vo2Max?.value || 0, 'vo2Max'),
      unit: normalizeUnit(healthData?.vo2Max?.unit, 'vo2Max'),
      label: 'VO2 Max',
      isAvailable: healthData?.vo2Max?.isAvailable || false,
    },
  ];

  // Nutrition metrics
  const nutritionMetrics: HealthMetric[] = [
    {
      type: 'dietaryWater',
      value: formatHealthValue(healthData?.dietaryWater?.value || 0, 'dietaryWater'),
      unit: normalizeUnit(healthData?.dietaryWater?.unit, 'dietaryWater'),
      label: 'Water Intake',
      isAvailable: healthData?.dietaryWater?.isAvailable || false,
    },
    {
      type: 'dietaryEnergyConsumed',
      value: formatHealthValue(healthData?.dietaryEnergyConsumed?.value || 0, 'dietaryEnergyConsumed'),
      unit: normalizeUnit(healthData?.dietaryEnergyConsumed?.unit, 'dietaryEnergyConsumed'),
      label: 'Calories Consumed',
      isAvailable: healthData?.dietaryEnergyConsumed?.isAvailable || false,
    },
  ];

  return [
    { title: 'Activity', metrics: coreActivityMetrics, columns: 1 },
    { title: 'Vital Signs', metrics: vitalSignsMetrics, columns: 1 },
    { title: 'Body Composition', metrics: bodyCompositionMetrics, columns: 1 },
    { title: 'Health', metrics: healthMetrics, columns: 1 },
    { title: 'Nutrition', metrics: nutritionMetrics, columns: 1 },
  ];
};
