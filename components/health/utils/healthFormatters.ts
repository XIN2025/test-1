export const formatHealthValue = (value: number | string, type: string): string => {
  if (typeof value === 'string') return value;
  if (typeof value !== 'number' || isNaN(value) || value === 0) return '--';

  switch (type) {
    case 'steps':
      return Math.round(value).toLocaleString();
    case 'heartRate':
    case 'restingHeartRate':
      return Math.round(value).toString();
    case 'activeEnergy':
      return Math.round(value).toString();
    case 'sleep':
      return value.toFixed(1);
    case 'weight':
    case 'bodyFat':
    case 'leanBodyMass':
      return value.toFixed(1);
    case 'bloodGlucose':
      return value.toFixed(0);
    case 'oxygenSaturation':
      return value.toFixed(1);
    case 'bloodPressureSystolic':
    case 'bloodPressureDiastolic':
      return Math.round(value).toString();
    case 'bodyTemperature':
      return value.toFixed(1);
    case 'respiratoryRate':
      return value.toFixed(1);
    case 'vo2Max':
      return value.toFixed(1);
    case 'distance':
      return value.toFixed(1);
    case 'flightsClimbed':
      return Math.round(value).toString();
    case 'exerciseTime':
      return Math.round(value).toString();
    case 'dietaryWater':
      return value.toFixed(1);
    case 'dietaryEnergyConsumed':
      return Math.round(value).toString();
    default:
      return value.toFixed(1);
  }
};

export const normalizeUnit = (unit: string | undefined, type: string): string => {
  // Handle invalid or unknown units
  if (!unit || unit === 'unknown' || unit === '') {
    // Return default units based on type
    switch (type) {
      case 'steps':
        return 'steps';
      case 'heartRate':
      case 'restingHeartRate':
        return 'bpm';
      case 'activeEnergy':
        return 'kcal';
      case 'sleep':
        return 'hrs';
      case 'weight':
        return 'kg';
      case 'bodyFat':
        return '%';
      case 'leanBodyMass':
        return 'kg';
      case 'bloodGlucose':
        return 'mg/dL';
      case 'oxygenSaturation':
        return '%';
      case 'bloodPressureSystolic':
      case 'bloodPressureDiastolic':
        return 'mmHg';
      case 'bodyTemperature':
        return '°C';
      case 'respiratoryRate':
        return '/min';
      case 'vo2Max':
        return 'mL/kg/min';
      case 'distance':
        return 'km';
      case 'flightsClimbed':
        return 'floors';
      case 'exerciseTime':
        return 'min';
      case 'dietaryWater':
        return 'L';
      case 'dietaryEnergyConsumed':
        return 'kcal';
      default:
        return '';
    }
  }

  return unit;
};
