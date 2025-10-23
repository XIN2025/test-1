import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FlaskConical, TrendingUp, AlertCircle, ChevronRight, Circle } from 'lucide-react-native';
import { shadow } from '@/utils/commonStyles';

interface SimpleLabTestsCardProps {
  isDarkMode: boolean;
  onPress: () => void;
}

export default function SimpleLabTestsCard({ isDarkMode, onPress }: SimpleLabTestsCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: isDarkMode ? '#374151' : '#ffffff',
        borderRadius: 16,
        padding: 16,
        justifyContent: 'space-between',
        ...shadow.card,
      }}
      activeOpacity={0.8}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View
          style={{
            padding: 10,
            borderRadius: 24,
            backgroundColor: isDarkMode ? '#f97316' : '#fed7aa',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FlaskConical size={24} color={isDarkMode ? '#ffffff' : '#f97316'} />
        </View>

        <View style={{ flexDirection: 'column', flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: isDarkMode ? '#f3f4f6' : '#1f2937',
                flex: 1,
              }}
            >
              Lab Tests
            </Text>
            <Circle size={8} fill="#34d399" strokeWidth={0} />
            <Text
              style={{
                fontSize: 12,
                color: isDarkMode ? '#34d399' : '#059669',
                fontWeight: '500',
                marginLeft: 4,
              }}
            >
              Connected
            </Text>
          </View>
          <Text
            style={{
              fontSize: 12,
              color: isDarkMode ? '#9ca3af' : '#6b7280',
            }}
          >
            Last updated today
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                borderRadius: 8,
                backgroundColor: isDarkMode ? '#064e3b' : '#f0fdf4',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 4,
              }}
            >
              <TrendingUp size={12} color="#059669" />
            </View>
            <Text
              style={{
                fontSize: 12,
                color: isDarkMode ? '#9ca3af' : '#6b7280',
                fontWeight: '500',
              }}
            >
              3 Tests
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                borderRadius: 8,
                backgroundColor: isDarkMode ? '#92400e' : '#fffbeb',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 4,
              }}
            >
              <AlertCircle size={12} color="#d97706" />
            </View>
            <Text
              style={{
                fontSize: 12,
                color: isDarkMode ? '#9ca3af' : '#6b7280',
                fontWeight: '500',
              }}
            >
              2 Low
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text
            style={{
              fontSize: 12,
              color: isDarkMode ? '#9ca3af' : '#6b7280',
            }}
          >
            View your test results
          </Text>
          <ChevronRight size={10} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
        </View>
      </View>
    </TouchableOpacity>
  );
}
