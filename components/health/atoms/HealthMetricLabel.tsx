import React from 'react';
import { Text } from 'react-native';

interface HealthMetricLabelProps {
  label: string;
  isDarkMode?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function HealthMetricLabel({ label, isDarkMode = false, size = 'medium' }: HealthMetricLabelProps) {
  const sizeStyles = {
    small: { fontSize: 12, fontWeight: '500' as const },
    medium: { fontSize: 14, fontWeight: '600' as const },
    large: { fontSize: 16, fontWeight: '600' as const },
  };

  return (
    <Text
      style={{
        ...sizeStyles[size],
        color: isDarkMode ? '#9ca3af' : '#6b7280',
        flexWrap: 'wrap',
        flexShrink: 1,
      }}
      numberOfLines={2}
      ellipsizeMode="tail"
    >
      {label}
    </Text>
  );
}
