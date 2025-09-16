import React from 'react';
import { View } from 'react-native';
import HealthMetricListItem from './HealthMetricListItem';

interface HealthMetric {
  type: string;
  value: string | number;
  unit?: string;
  label: string;
  isAvailable?: boolean;
}

interface HealthMetricListProps {
  metrics: HealthMetric[];
  isDarkMode?: boolean;
}

export default function HealthMetricList({ metrics, isDarkMode = false }: HealthMetricListProps) {
  return (
    <View>
      {metrics.map((metric) => (
        <HealthMetricListItem
          key={metric.type}
          type={metric.type}
          label={metric.label}
          value={metric.value}
          unit={metric.unit}
          isDarkMode={isDarkMode}
          isAvailable={metric.isAvailable}
        />
      ))}
    </View>
  );
}
