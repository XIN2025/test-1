import React from 'react';
import { Text } from 'react-native';

interface HealthMetricValueProps {
  value: string | number;
  unit?: string;
  isDarkMode?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function HealthMetricValue({
  value,
  unit,
  isDarkMode = false,
  size = 'medium',
}: HealthMetricValueProps) {
  const sizeStyles = {
    small: { fontSize: 14, fontWeight: '600' as const },
    medium: { fontSize: 16, fontWeight: '700' as const },
    large: { fontSize: 18, fontWeight: '700' as const },
  };

  // Handle fallback for missing or invalid data
  const displayValue = (() => {
    if (value === '--' || value === 0 || value === '0' || value === 'unknown' || value === '') {
      return '--';
    }
    return value;
  })();

  const displayUnit = (() => {
    if (unit === 'unknown' || unit === '' || !unit) {
      return null;
    }
    return unit;
  })();

  return (
    <Text
      style={{
        ...sizeStyles[size],
        color: isDarkMode ? '#f3f4f6' : '#1f2937',
        textAlign: 'right',
      }}
    >
      {displayValue}{' '}
      {displayUnit && (
        <Text style={{ fontSize: sizeStyles[size].fontSize * 0.8, fontWeight: '500' }}>{displayUnit}</Text>
      )}
    </Text>
  );
}
