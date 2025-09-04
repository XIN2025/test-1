import React from 'react';
import { View } from 'react-native';
import { Activity, Heart, Footprints, Zap, Droplets, Moon, Target, TrendingUp } from 'lucide-react-native';

export type HealthMetricType =
  | 'steps'
  | 'heartRate'
  | 'activeEnergy'
  | 'sleep'
  | 'hydration'
  | 'bodyFat'
  | 'weight'
  | 'bloodGlucose'
  | 'bloodPressure'
  | 'oxygenSaturation';

interface HealthMetricIconProps {
  type: HealthMetricType;
  size?: number;
  color?: string;
  backgroundColor?: string;
  showBackground?: boolean;
}

const iconMap = {
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
};

export default function HealthMetricIcon({
  type,
  size = 24,
  color = '#059669',
  backgroundColor = '#f0fdf4',
  showBackground = true,
}: HealthMetricIconProps) {
  const IconComponent = iconMap[type];

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
