import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import HealthMetricCard from './HealthMetricCard';
import { HealthMetricType } from '../atoms/HealthMetricIcon';

interface HealthData {
  type: HealthMetricType;
  value: string | number;
  unit?: string;
  label: string;
}

interface HealthSummaryCardProps {
  healthData: HealthData[];
  isDarkMode?: boolean;
  onViewAll?: () => void;
  isLoading?: boolean;
}

export default function HealthSummaryCard({
  healthData,
  isDarkMode = false,
  onViewAll,
  isLoading = false,
}: HealthSummaryCardProps) {
  return (
    <View
      style={{
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDarkMode ? 0.3 : 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: isDarkMode ? '#f3f4f6' : '#1f2937',
          }}
        >
          Health Overview
        </Text>
        {onViewAll && (
          <TouchableOpacity
            onPress={onViewAll}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}
            activeOpacity={0.7}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: isDarkMode ? '#34d399' : '#059669',
                marginRight: 4,
              }}
            >
              View All
            </Text>
            <ArrowRight size={16} color={isDarkMode ? '#34d399' : '#059669'} />
          </TouchableOpacity>
        )}
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        {healthData.slice(0, 3).map((data, index) => (
          <View key={index} style={{ flex: 1 }}>
            <HealthMetricCard
              type={data.type}
              value={data.value}
              unit={data.unit}
              label={data.label}
              isDarkMode={isDarkMode}
              isLoading={isLoading}
              size="small"
            />
          </View>
        ))}
      </View>
    </View>
  );
}
