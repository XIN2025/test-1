import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Activity, RefreshCw, Info } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useHealthKit } from '../../hooks/useHealthKit';
import HealthMetricCard from '../../components/health/molecules/HealthMetricCard';

export default function HealthDashboard() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { isAvailable, isLoading, hasPermissions, healthData, refreshData, requestPermissions } = useHealthKit();

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleRequestPermissions = async () => {
    const granted = await requestPermissions();
    if (!granted) {
      Alert.alert(
        'Health Permissions Required',
        'To show your health data, please grant access to Health app in Settings.',
        [{ text: 'Cancel', style: 'cancel' }],
      );
    }
  };

  // If not iOS or HealthKit not available
  if (Platform.OS !== 'ios' || !isAvailable) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#111827' : '#f9fafb' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Activity size={64} color={isDarkMode ? '#6b7280' : '#9ca3af'} />
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: isDarkMode ? '#f3f4f6' : '#1f2937',
              textAlign: 'center',
              marginTop: 16,
              marginBottom: 8,
            }}
          >
            Health Data Not Available
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: isDarkMode ? '#9ca3af' : '#6b7280',
              textAlign: 'center',
              lineHeight: 24,
            }}
          >
            Health data integration is only available on iOS devices with Apple Health app.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginTop: 24,
              backgroundColor: isDarkMode ? '#059669' : '#059669',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Helper function to format health values for better display
  const formatHealthValue = (value: number | string, type: string): string => {
    if (typeof value === 'string') return value;
    if (value === 0 || !value) return '--';

    switch (type) {
      case 'steps':
        return value.toLocaleString(); // Add commas for thousands
      case 'sleep':
        // Convert hours to hours and minutes format
        const hours = Math.floor(value);
        const minutes = Math.round((value - hours) * 60);
        return `${hours}h ${minutes}m`;
      default:
        return (Math.round(value * 10) / 10).toString(); // Round to 1 decimal place and convert to string
    }
  };

  // Helper function to normalize units for better display
  const normalizeUnit = (unit: string | undefined, type: string): string => {
    if (!unit) return '';

    switch (type) {
      case 'heartRate':
        return unit && unit.includes('count') ? 'bpm' : unit || 'bpm';
      case 'steps':
        return 'steps';
      case 'activeEnergy':
        return unit && unit.includes('kcal') ? 'cal' : unit || 'cal';
      case 'sleep':
        return ''; // We format sleep as "7h 23m" so no unit needed
      default:
        console.log('unit', unit);
        return unit;
    }
  };

  const allHealthMetrics = [
    {
      type: 'steps' as const,
      value: formatHealthValue(healthData.steps.value, 'steps'),
      unit: normalizeUnit(healthData.steps.unit, 'steps'),
      label: 'Steps Today',
      isAvailable: healthData.steps.isAvailable,
    },
    {
      type: 'heartRate' as const,
      value: formatHealthValue(healthData.heartRate.value, 'heartRate'),
      unit: normalizeUnit(healthData.heartRate.unit, 'heartRate'),
      label: 'Heart Rate Today',
      isAvailable: healthData.heartRate.isAvailable,
    },
    {
      type: 'activeEnergy' as const,
      value: formatHealthValue(healthData.activeEnergy.value, 'activeEnergy'),
      unit: normalizeUnit(healthData.activeEnergy.unit, 'activeEnergy'),
      label: 'Active Energy Today',
      isAvailable: healthData.activeEnergy.isAvailable,
    },
    {
      type: 'sleep' as const,
      value: formatHealthValue(healthData.sleep.value, 'sleep'),
      unit: normalizeUnit(healthData.sleep.unit, 'sleep'),
      label: 'Sleep Last Night',
      isAvailable: healthData.sleep.isAvailable,
    },
    {
      type: 'weight' as const,
      value: formatHealthValue(healthData.weight.value, 'weight'),
      unit: normalizeUnit(healthData.weight.unit, 'weight'),
      label: 'Recent Weight',
      isAvailable: healthData.weight.isAvailable,
    },
    {
      type: 'bodyFat' as const,
      value: formatHealthValue(healthData.bodyFat.value, 'bodyFat'),
      unit: normalizeUnit(healthData.bodyFat.unit, 'bodyFat'),
      label: 'Body Fat %',
      isAvailable: healthData.bodyFat.isAvailable,
    },
    {
      type: 'bloodGlucose' as const,
      value: formatHealthValue(healthData.bloodGlucose.value, 'bloodGlucose'),
      unit: normalizeUnit(healthData.bloodGlucose.unit, 'bloodGlucose'),
      label: 'Recent Blood Glucose',
      isAvailable: healthData.bloodGlucose.isAvailable,
    },
    {
      type: 'oxygenSaturation' as const,
      value: formatHealthValue(healthData.oxygenSaturation.value, 'oxygenSaturation'),
      unit: normalizeUnit(healthData.oxygenSaturation.unit, 'oxygenSaturation'),
      label: 'Recent Oxygen Saturation',
      isAvailable: healthData.oxygenSaturation.isAvailable,
    },
  ];

  return (
    <SafeAreaView>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowLeft size={20} color={isDarkMode ? '#f3f4f6' : '#374151'} />
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: isDarkMode ? '#f3f4f6' : '#1f2937',
            }}
          >
            Health Dashboard
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: isDarkMode ? '#9ca3af' : '#6b7280',
            }}
          >
            Apple Health Integration
          </Text>
        </View>

        <TouchableOpacity
          onPress={onRefresh}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isDarkMode ? '#064e3b' : '#f0fdf4',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          disabled={isLoading || refreshing}
        >
          <RefreshCw
            size={20}
            color={isDarkMode ? '#34d399' : '#059669'}
            style={{
              transform: [{ rotate: isLoading || refreshing ? '180deg' : '0deg' }],
            }}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{
          height: '100%',
          backgroundColor: isDarkMode ? '#111827' : '#f9fafb',
        }}
        contentContainerStyle={{ padding: 16, paddingBottom: 240 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[isDarkMode ? '#34d399' : '#059669']}
            tintColor={isDarkMode ? '#34d399' : '#059669'}
          />
        }
      >
        {isLoading ? (
          // Loading state to prevent flicker
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: isDarkMode ? '#064e3b' : '#f0fdf4',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
              }}
            >
              <Activity size={40} color={isDarkMode ? '#34d399' : '#059669'} />
            </View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: isDarkMode ? '#f3f4f6' : '#1f2937',
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              Loading Health Data
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: isDarkMode ? '#9ca3af' : '#6b7280',
                textAlign: 'center',
              }}
            >
              Checking permissions and syncing data...
            </Text>
          </View>
        ) : !hasPermissions ? (
          // Permission request screen
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: isDarkMode ? '#064e3b' : '#f0fdf4',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
              }}
            >
              <Activity size={40} color={isDarkMode ? '#34d399' : '#059669'} />
            </View>

            <Text
              style={{
                fontSize: 24,
                fontWeight: '700',
                color: isDarkMode ? '#f3f4f6' : '#1f2937',
                textAlign: 'center',
                marginBottom: 12,
              }}
            >
              Connect Your Health Data
            </Text>

            <Text
              style={{
                fontSize: 16,
                color: isDarkMode ? '#9ca3af' : '#6b7280',
                textAlign: 'center',
                lineHeight: 24,
                marginBottom: 32,
                paddingHorizontal: 20,
              }}
            >
              Grant access to your Apple Health data to see comprehensive health insights including steps, heart rate,
              sleep patterns, and more.
            </Text>

            <TouchableOpacity
              onPress={handleRequestPermissions}
              style={{
                backgroundColor: isDarkMode ? '#059669' : '#059669',
                paddingHorizontal: 32,
                paddingVertical: 16,
                borderRadius: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  color: '#ffffff',
                  fontSize: 18,
                  fontWeight: '600',
                }}
              >
                Connect Apple Health
              </Text>
            </TouchableOpacity>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 24,
                paddingHorizontal: 20,
              }}
            >
              <Info size={16} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
              <Text
                style={{
                  fontSize: 14,
                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                  marginLeft: 8,
                  flex: 1,
                }}
              >
                Your health data stays private and secure on your device
              </Text>
            </View>
          </View>
        ) : (
          // Health metrics display
          <>
            {/* Quick Stats */}
            <View style={{ marginBottom: 24 }}>
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
                    fontSize: 20,
                    fontWeight: '700',
                    color: isDarkMode ? '#f3f4f6' : '#1f2937',
                  }}
                >
                  Today&apos;s Overview
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: isDarkMode ? '#9ca3af' : '#6b7280',
                    fontWeight: '500',
                  }}
                >
                  {new Date().toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    weekday: 'short',
                  })}
                </Text>
              </View>

              <View style={{ gap: 12 }}>
                {allHealthMetrics.slice(0, 4).map((metric, index) => (
                  <HealthMetricCard
                    key={index}
                    type={metric.type}
                    value={metric.isAvailable ? metric.value : '--'}
                    unit={metric.unit}
                    label={metric.label}
                    isDarkMode={isDarkMode}
                    isLoading={isLoading}
                    size="large"
                    layout="horizontal"
                  />
                ))}
              </View>
            </View>

            {/* All Health Metrics */}
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: isDarkMode ? '#f3f4f6' : '#1f2937',
                  marginBottom: 16,
                }}
              >
                All Health Metrics
              </Text>

              <View style={{ gap: 12 }}>
                {allHealthMetrics.map((metric, index) => (
                  <HealthMetricCard
                    key={index}
                    type={metric.type}
                    value={metric.isAvailable ? metric.value : '--'}
                    unit={metric.unit}
                    label={metric.label}
                    isDarkMode={isDarkMode}
                    isLoading={isLoading}
                    size="large"
                    layout="horizontal"
                    onPress={() => {
                      // You can add navigation to detailed view here
                      console.log(`Tapped ${metric.label}`);
                    }}
                  />
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
