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
