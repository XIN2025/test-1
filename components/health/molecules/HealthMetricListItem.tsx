import React from 'react';
import { View } from 'react-native';
import HealthMetricIcon from '../atoms/HealthMetricIcon';
import HealthMetricLabel from '../atoms/HealthMetricLabel';
import HealthMetricValue from '../atoms/HealthMetricValue';

interface HealthMetricListItemProps {
  type: string;
  label: string;
  value: string | number;
  unit?: string;
  isDarkMode?: boolean;
  isAvailable?: boolean;
}

export default function HealthMetricListItem({
  type,
  label,
  value,
  unit,
  isDarkMode = false,
  isAvailable = false,
}: HealthMetricListItemProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDarkMode ? 0.3 : 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      {/* Left: Icon */}
      <View style={{ marginRight: 16 }}>
        <HealthMetricIcon
          type={type as any}
          size={24}
          color={isDarkMode ? '#34d399' : '#059669'}
          backgroundColor={isDarkMode ? '#064e3b' : '#f0fdf4'}
        />
      </View>

      {/* Center: Label */}
      <View style={{ flex: 1, marginRight: 12 }}>
        <HealthMetricLabel label={label} isDarkMode={isDarkMode} size="medium" />
      </View>

      {/* Right: Value */}
      <View>
        <HealthMetricValue value={value} unit={unit} isDarkMode={isDarkMode} size="medium" />
      </View>
    </View>
  );
}
