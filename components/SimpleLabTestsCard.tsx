import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { FlaskConical, TrendingUp, AlertCircle, ChevronRight } from 'lucide-react-native';

interface SimpleLabTestsCardProps {
  isDarkMode: boolean;
  onPress: () => void;
  width?: number;
  height?: number;
}

const { width: screenWidth } = Dimensions.get('window');

export default function SimpleLabTestsCard({
  isDarkMode,
  onPress,
  width = screenWidth * 0.44,
  height = screenWidth * 0.4,
}: SimpleLabTestsCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width,
        height,
        backgroundColor: isDarkMode ? '#374151' : '#ffffff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        justifyContent: 'space-between',
      }}
      activeOpacity={0.8}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: isDarkMode ? '#f97316' : '#fed7aa',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FlaskConical size={20} color={isDarkMode ? '#ffffff' : '#f97316'} />
          </View>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: isDarkMode ? '#f3f4f6' : '#1f2937',
              marginBottom: 4,
            }}
          >
            Lab Tests
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#34d399',
              marginRight: 4,
            }}
          />
          <Text
            style={{
              fontSize: 10,
              color: isDarkMode ? '#34d399' : '#059669',
              fontWeight: '500',
            }}
          >
            Connected
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start' }}>
        {/* Quick Stats */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: isDarkMode ? '#064e3b' : '#f0fdf4',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 4,
              }}
            >
              <TrendingUp size={10} color="#059669" />
            </View>
            <Text
              style={{
                fontSize: 10,
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
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: isDarkMode ? '#92400e' : '#fffbeb',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 4,
              }}
            >
              <AlertCircle size={10} color="#d97706" />
            </View>
            <Text
              style={{
                fontSize: 10,
                color: isDarkMode ? '#9ca3af' : '#6b7280',
                fontWeight: '500',
              }}
            >
              2 Low
            </Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text
          style={{
            fontSize: 10,
            color: isDarkMode ? '#9ca3af' : '#6b7280',
          }}
        >
          Last updated today
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text
            style={{
              fontSize: 10,
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
