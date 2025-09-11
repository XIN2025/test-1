import React from 'react';
import { View } from 'react-native';
import {
  Activity,
  Heart,
  Footprints,
  Zap,
  Droplets,
  Moon,
  Target,
  TrendingUp,
  Thermometer,
  Wind,
  Gauge,
  Bike,
  Clock,
  Brain,
  Scale,
  Ruler,
  // Bone,
  Coffee,
  Utensils,
  Pill,
  Droplet,
  Flame,
  Apple,
} from 'lucide-react-native';

export type HealthMetricType =
  // Core metrics
  | 'steps'
  | 'heartRate'
  | 'activeEnergy'
  | 'sleep'
  | 'hydration'
  | 'bodyFat'
  | 'weight'
  | 'bloodGlucose'
  | 'bloodPressure'
  | 'oxygenSaturation'

  // Additional metrics
  | 'restingHeartRate'
  | 'heartRateVariability'
  | 'bloodPressureSystolic'
  | 'bloodPressureDiastolic'
  | 'bodyTemperature'
  | 'respiratoryRate'
  | 'vo2Max'
  | 'distanceWalkingRunning'
  | 'distanceCycling'
  | 'flightsClimbed'
  | 'standTime'
  | 'exerciseTime'
  | 'mindfulMinutes'
  | 'bodyMassIndex'
  | 'leanBodyMass'
  | 'waistCircumference'
  | 'bloodAlcoholContent'
  | 'caffeine'
  | 'dietaryWater'
  | 'dietaryEnergyConsumed'
  | 'dietaryProtein'
  | 'dietaryCarbohydrates'
  | 'dietaryFatTotal'
  | 'dietaryFiber'
  | 'dietarySugar'
  | 'dietarySodium'
  | 'dietaryCholesterol'
  | 'dietarySaturatedFat'
  | 'dietaryCalcium'
  | 'dietaryIron'
  | 'dietaryMagnesium'
  | 'dietaryPotassium'
  | 'dietaryVitaminA'
  | 'dietaryVitaminB6'
  | 'dietaryVitaminB12'
  | 'dietaryVitaminC'
  | 'dietaryVitaminD'
  | 'dietaryVitaminE'
  | 'dietaryVitaminK'
  | 'dietaryFolate';

interface HealthMetricIconProps {
  type: HealthMetricType;
  size?: number;
  color?: string;
  backgroundColor?: string;
  showBackground?: boolean;
}

const iconMap = {
  // Core metrics
  steps: Footprints,
  heartRate: Heart,
  activeEnergy: Zap,
  sleep: Moon,
  hydration: Droplets,
  bodyFat: Target,
  weight: TrendingUp,
  bloodGlucose: Activity,
  bloodPressure: Activity,
  oxygenSaturation: Activity,

  // Heart health
  restingHeartRate: Heart,
  heartRateVariability: Heart,
  vo2Max: Gauge,

  // Vital signs
  bloodPressureSystolic: Activity,
  bloodPressureDiastolic: Activity,
  bodyTemperature: Thermometer,
  respiratoryRate: Wind,

  // Activity & movement
  distanceWalkingRunning: Footprints,
  distanceCycling: Bike,
  flightsClimbed: Footprints,
  standTime: Clock,
  exerciseTime: Clock,

  // Wellness
  mindfulMinutes: Brain,

  // Body composition
  bodyMassIndex: Scale,
  leanBodyMass: Scale,
  waistCircumference: Ruler,

  // Lifestyle
  bloodAlcoholContent: Droplet,
  caffeine: Coffee,

  // Dietary
  dietaryWater: Droplets,
  dietaryEnergyConsumed: Flame,
  dietaryProtein: Utensils,
  dietaryCarbohydrates: Apple,
  dietaryFatTotal: Utensils,
  dietaryFiber: Apple,
  dietarySugar: Apple,
  dietarySodium: Pill,
  dietaryCholesterol: Pill,
  dietarySaturatedFat: Utensils,
  dietaryCalcium: Pill,
  dietaryIron: Pill,
  dietaryMagnesium: Pill,
  dietaryPotassium: Pill,
  dietaryVitaminA: Pill,
  dietaryVitaminB6: Pill,
  dietaryVitaminB12: Pill,
  dietaryVitaminC: Pill,
  dietaryVitaminD: Pill,
  dietaryVitaminE: Pill,
  dietaryVitaminK: Pill,
  dietaryFolate: Pill,
};

export default function HealthMetricIcon({
  type,
  size = 24,
  color = '#059669',
  backgroundColor = '#f0fdf4',
  showBackground = true,
}: HealthMetricIconProps) {
  const IconComponent = iconMap[type] || Activity; // Fallback to Activity icon if type not found

  // Debug logging to help identify missing types
  if (!iconMap[type]) {
    console.warn(`HealthMetricIcon: No icon found for type "${type}", using fallback Activity icon`);
  }

  if (!showBackground) {
    return <IconComponent size={size} color={color} />;
  }

  return (
    <View
      style={{
        width: size + 16,
        height: size + 16,
        borderRadius: (size + 16) / 2,
        backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <IconComponent size={size} color={color} />
    </View>
  );
}
