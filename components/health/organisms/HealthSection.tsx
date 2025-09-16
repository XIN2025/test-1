import React from 'react';
import { View } from 'react-native';
import HealthSectionTitle from '../atoms/HealthSectionTitle';
import HealthMetricList from '../molecules/HealthMetricList';

interface HealthMetric {
  type: string;
  value: string | number;
  unit?: string;
  label: string;
  isAvailable?: boolean;
}

interface HealthSectionProps {
  title: string;
  metrics: HealthMetric[];
  isDarkMode?: boolean;
  columns?: 1 | 2;
}

export default function HealthSection({ title, metrics, isDarkMode = false, columns = 1 }: HealthSectionProps) {
  return (
    <View style={{ marginBottom: 32 }}>
      <HealthSectionTitle title={title} isDarkMode={isDarkMode} />
      <HealthMetricList metrics={metrics} isDarkMode={isDarkMode} />
    </View>
  );
}
