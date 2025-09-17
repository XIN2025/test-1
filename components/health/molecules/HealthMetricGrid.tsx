import React from 'react';
import { StyleSheet, View } from 'react-native';
import HealthMetricCard from './HealthMetricCard';

interface HealthMetric {
  type: string;
  value: string | number;
  unit?: string;
  label: string;
  isAvailable?: boolean;
}

interface HealthMetricGridProps {
  metrics: HealthMetric[];
  isDarkMode?: boolean;
  columns?: 1 | 2;
}

export default function HealthMetricGrid({ metrics, isDarkMode = false, columns = 2 }: HealthMetricGridProps) {
  const style = StyleSheet.create({
    container: {
      flexDirection: columns === 1 ? ('column' as const) : ('row' as const),
      flexWrap: columns === 1 ? ('nowrap' as const) : ('wrap' as const),
      justifyContent: columns === 1 ? ('flex-start' as const) : ('space-between' as const),
    },
    item: {
      width: columns === 2 ? '48%' : '100%',
      marginBottom: 16,
    },
  });

  return (
    <View style={style.container}>
      {metrics.map((metric) => (
        <View key={metric.type} style={style.item}>
          <HealthMetricCard
            type={metric.type as any}
            value={metric.value}
            unit={metric.unit}
            label={metric.label}
            isDarkMode={isDarkMode}
          />
        </View>
      ))}
    </View>
  );
}
