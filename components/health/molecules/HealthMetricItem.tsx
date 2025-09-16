import React from 'react';
import { View } from 'react-native';
import HealthMetricLabel from '../atoms/HealthMetricLabel';
import HealthMetricValue from '../atoms/HealthMetricValue';

interface HealthMetricItemProps {
  label: string;
  value: string | number;
  unit?: string;
  isDarkMode?: boolean;
  layout?: 'horizontal' | 'vertical';
}

export default function HealthMetricItem({
  label,
  value,
  unit,
  isDarkMode = false,
  layout = 'horizontal',
}: HealthMetricItemProps) {
  if (layout === 'vertical') {
    return (
      <View style={{ alignItems: 'center' }}>
        <HealthMetricValue value={value} unit={unit} isDarkMode={isDarkMode} size="large" />
        <HealthMetricLabel label={label} isDarkMode={isDarkMode} size="small" />
      </View>
    );
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      }}
    >
      <HealthMetricLabel label={label} isDarkMode={isDarkMode} />
      <HealthMetricValue value={value} unit={unit} isDarkMode={isDarkMode} />
    </View>
  );
}
