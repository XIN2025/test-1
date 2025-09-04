import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import HealthMetricIcon, { HealthMetricType } from '../atoms/HealthMetricIcon';
import HealthMetricValue from '../atoms/HealthMetricValue';

interface HealthMetricCardProps {
  type: HealthMetricType;
  value: string | number;
  unit?: string;
  label: string;
  isDarkMode?: boolean;
  onPress?: () => void;
  isLoading?: boolean;
  size?: 'small' | 'medium' | 'large';
  layout?: 'vertical' | 'horizontal';
}

export default function HealthMetricCard({
  type,
  value,
  unit,
  label,
  isDarkMode = false,
  onPress,
  isLoading = false,
  size = 'medium',
  layout = 'vertical',
}: HealthMetricCardProps) {
  const cardSizes = {
    small: {
      padding: 12,
      iconSize: 20,
    },
    medium: {
      padding: 16,
      iconSize: 24,
    },
    large: {
      padding: 20,
      iconSize: 28,
    },
  };

  const cardSize = cardSizes[size];

  const content = (
    <View
      style={{
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        borderRadius: 16,
        padding: cardSize.padding,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDarkMode ? 0.3 : 0.1,
        shadowRadius: 4,
        elevation: 3,
        flexDirection: layout === 'horizontal' ? 'row' : 'column',
        alignItems: layout === 'horizontal' ? 'center' : 'center',
        justifyContent: layout === 'horizontal' ? 'space-between' : 'center',
        minHeight: layout === 'horizontal' ? 70 : size === 'large' ? 120 : size === 'medium' ? 100 : 80,
      }}
    >
      <View
        style={{
          flexDirection: layout === 'horizontal' ? 'row' : 'column',
          alignItems: 'center',
          flex: layout === 'horizontal' ? 1 : undefined,
        }}
      >
        <HealthMetricIcon
          type={type}
          size={cardSize.iconSize}
          color={isDarkMode ? '#34d399' : '#059669'}
          backgroundColor={isDarkMode ? '#064e3b' : '#f0fdf4'}
        />
        {layout === 'horizontal' && (
          <View style={{ marginLeft: 12, alignItems: 'flex-start', flex: 1 }}>
            {isLoading ? (
              <HealthMetricValue
                value="--"
                unit={unit}
                label={label}
                isDarkMode={isDarkMode}
                size={size === 'large' ? 'medium' : 'small'}
                textAlign="left"
              />
            ) : (
              <HealthMetricValue
                value={value}
                unit={unit}
                label={label}
                isDarkMode={isDarkMode}
                size={size === 'large' ? 'medium' : 'small'}
                textAlign="left"
              />
            )}
          </View>
        )}
      </View>

      {layout === 'vertical' && (
        <View style={{ marginTop: 8, alignItems: 'center' }}>
          {isLoading ? (
            <HealthMetricValue
              value="--"
              unit={unit}
              label={label}
              isDarkMode={isDarkMode}
              size={size === 'large' ? 'medium' : 'small'}
              textAlign="center"
            />
          ) : (
            <HealthMetricValue
              value={value}
              unit={unit}
              label={label}
              isDarkMode={isDarkMode}
              size={size === 'large' ? 'medium' : 'small'}
              textAlign="center"
            />
          )}
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}
