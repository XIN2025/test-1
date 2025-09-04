import React from 'react';
import { Text, View } from 'react-native';

interface HealthMetricValueProps {
  value: string | number;
  unit?: string;
  label?: string;
  isDarkMode?: boolean;
  size?: 'small' | 'medium' | 'large';
  textAlign?: 'left' | 'center' | 'right';
  showLabel?: boolean;
}

export default function HealthMetricValue({
  value,
  unit,
  label,
  isDarkMode = false,
  size = 'medium',
  textAlign = 'left',
  showLabel = true,
}: HealthMetricValueProps) {
  const sizeStyles = {
    small: {
      value: 14,
      unit: 12,
      label: 11,
    },
    medium: {
      value: 18,
      unit: 14,
      label: 12,
    },
    large: {
      value: 24,
      unit: 16,
      label: 14,
    },
  };

  const styles = sizeStyles[size];

  return (
    <View
      style={{
        alignItems: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
        flex: 1,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          flexWrap: 'wrap',
          justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
        }}
      >
        <Text
          style={{
            fontSize: styles.value,
            fontWeight: '700',
            color: isDarkMode ? '#f3f4f6' : '#1f2937',
          }}
        >
          {value}
        </Text>
        {unit && (
          <Text
            style={{
              fontSize: styles.unit,
              fontWeight: '500',
              color: isDarkMode ? '#9ca3af' : '#6b7280',
              marginLeft: 4,
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {unit}
          </Text>
        )}
      </View>
      {label && showLabel && (
        <Text
          style={{
            fontSize: styles.label,
            color: isDarkMode ? '#9ca3af' : '#6b7280',
            marginTop: 2,
            textAlign: textAlign,
          }}
          numberOfLines={2}
        >
          {label}
        </Text>
      )}
    </View>
  );
}
