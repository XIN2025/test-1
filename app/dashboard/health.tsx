import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Activity, RefreshCw, Info, RotateCcw } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useHealthKit } from '../../hooks/useHealthKit';
import HealthMetricCard from '../../components/health/molecules/HealthMetricCard';

export default function HealthDashboard() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { isAvailable, isLoading, hasPermissions, healthData, refreshData, requestPermissions, resetPermissions } =
    useHealthKit();

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleRequestPermissions = async () => {
    const granted = await requestPermissions(false); // Start with core permissions only
    if (!granted) {
      Alert.alert(
        'Health Permissions Required',
        'To show your health data, please grant access to Health app in Settings.',
        [{ text: 'Cancel', style: 'cancel' }],
      );
    }
  };

  const handleResetPermissions = async () => {
    Alert.alert(
      'Reset Health Permissions',
      'This will clear all cached permissions and reset your health data. You will need to grant permissions again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const success = await resetPermissions();
            if (success) {
              Alert.alert(
                'Permissions Reset',
                'Health permissions have been reset. You can now request permissions again.',
                [{ text: 'OK' }],
              );
            }
          },
        },
      ],
    );
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
      case 'flightsClimbed':
        return value.toLocaleString(); // Add commas for thousands
      case 'sleep':
      case 'standTime':
        // Convert hours to hours and minutes format
        const hours = Math.floor(value);
        const minutes = Math.round((value - hours) * 60);
        return `${hours}h ${minutes}m`;
      case 'exerciseTime':
      case 'mindfulMinutes':
        // Convert minutes to hours and minutes if > 60 minutes
        if (value >= 60) {
          const hours = Math.floor(value / 60);
          const mins = Math.round(value % 60);
          return `${hours}h ${mins}m`;
        }
        return `${Math.round(value)}m`;
      case 'distanceWalkingRunning':
      case 'distanceCycling':
        // Format distance in km with 2 decimal places
        return (Math.round(value * 100) / 100).toString();
      case 'bodyTemperature':
        // Format temperature with 1 decimal place
        return (Math.round(value * 10) / 10).toString();
      case 'heartRateVariability':
        // Format HRV with 1 decimal place
        return (Math.round(value * 10) / 10).toString();
      case 'vo2Max':
        // Format VO2 Max with 1 decimal place
        return (Math.round(value * 10) / 10).toString();
      case 'dietaryWater':
        // Format water in liters with 2 decimal places
        return (Math.round(value * 100) / 100).toString();
      case 'bloodAlcoholContent':
        // Format BAC as percentage with 3 decimal places
        return (Math.round(value * 1000) / 1000).toString();
      default:
        return (Math.round(value * 10) / 10).toString(); // Round to 1 decimal place and convert to string
    }
  };

  // Helper function to normalize units for better display
  const normalizeUnit = (unit: string | undefined, type: string): string => {
    if (!unit) return '';

    switch (type) {
      case 'heartRate':
      case 'restingHeartRate':
        return unit && unit.includes('count') ? 'bpm' : unit || 'bpm';
      case 'steps':
        return 'steps';
      case 'activeEnergy':
      case 'dietaryEnergyConsumed':
        return unit && unit.includes('kcal') ? 'cal' : unit || 'cal';
      case 'sleep':
      case 'standTime':
        return ''; // We format sleep as "7h 23m" so no unit needed
      case 'exerciseTime':
      case 'mindfulMinutes':
        return ''; // We format time as "1h 30m" so no unit needed
      case 'distanceWalkingRunning':
      case 'distanceCycling':
        return unit && unit.includes('km') ? 'km' : unit || 'km';
      case 'flightsClimbed':
        return 'flights';
      case 'heartRateVariability':
        return 'ms';
      case 'vo2Max':
        return 'mL/kg·min';
      case 'bloodPressureSystolic':
      case 'bloodPressureDiastolic':
        return 'mmHg';
      case 'bodyTemperature':
        return '°C';
      case 'respiratoryRate':
        return '/min';
      case 'bodyMassIndex':
        return 'kg/m²';
      case 'waistCircumference':
        return 'cm';
      case 'bodyWaterPercentage':
      case 'bodyFat':
      case 'oxygenSaturation':
      case 'bloodAlcoholContent':
        return '%';
      case 'dietaryWater':
        return 'L';
      case 'caffeine':
        return 'mg';
      case 'dietaryProtein':
      case 'dietaryCarbohydrates':
      case 'dietaryFatTotal':
      case 'dietaryFiber':
      case 'dietarySugar':
      case 'dietarySaturatedFat':
        return 'g';
      case 'dietarySodium':
      case 'dietaryCholesterol':
      case 'dietaryCalcium':
      case 'dietaryIron':
      case 'dietaryMagnesium':
      case 'dietaryPotassium':
        return 'mg';
      case 'dietaryVitaminA':
      case 'dietaryVitaminB12':
      case 'dietaryVitaminD':
      case 'dietaryVitaminK':
      case 'dietaryFolate':
        return 'μg';
      case 'dietaryVitaminB6':
      case 'dietaryVitaminC':
      case 'dietaryVitaminE':
        return 'mg';
      default:
        return unit;
    }
  };

  // Core Activity Metrics
  const coreActivityMetrics = [
    {
      type: 'steps' as const,
      value: formatHealthValue(healthData.steps.value, 'steps'),
      unit: normalizeUnit(healthData.steps.unit, 'steps'),
      label: 'Steps Today',
      isAvailable: healthData.steps.isAvailable,
    },
    {
      type: 'activeEnergy' as const,
      value: formatHealthValue(healthData.activeEnergy.value, 'activeEnergy'),
      unit: normalizeUnit(healthData.activeEnergy.unit, 'activeEnergy'),
      label: 'Active Energy Today',
      isAvailable: healthData.activeEnergy.isAvailable,
    },
    {
      type: 'distanceWalkingRunning' as const,
      value: formatHealthValue(healthData.distanceWalkingRunning.value, 'distanceWalkingRunning'),
      unit: normalizeUnit(healthData.distanceWalkingRunning.unit, 'distanceWalkingRunning'),
      label: 'Distance Walked/Run',
      isAvailable: healthData.distanceWalkingRunning.isAvailable,
    },
    {
      type: 'distanceCycling' as const,
      value: formatHealthValue(healthData.distanceCycling.value, 'distanceCycling'),
      unit: normalizeUnit(healthData.distanceCycling.unit, 'distanceCycling'),
      label: 'Distance Cycled',
      isAvailable: healthData.distanceCycling.isAvailable,
    },
    {
      type: 'flightsClimbed' as const,
      value: formatHealthValue(healthData.flightsClimbed.value, 'flightsClimbed'),
      unit: normalizeUnit(healthData.flightsClimbed.unit, 'flightsClimbed'),
      label: 'Flights Climbed',
      isAvailable: healthData.flightsClimbed.isAvailable,
    },
    {
      type: 'exerciseTime' as const,
      value: formatHealthValue(healthData.exerciseTime.value, 'exerciseTime'),
      unit: normalizeUnit(healthData.exerciseTime.unit, 'exerciseTime'),
      label: 'Exercise Time',
      isAvailable: healthData.exerciseTime.isAvailable,
    },
    {
      type: 'standTime' as const,
      value: formatHealthValue(healthData.standTime.value, 'standTime'),
      unit: normalizeUnit(healthData.standTime.unit, 'standTime'),
      label: 'Stand Time',
      isAvailable: healthData.standTime.isAvailable,
    },
  ];

  // Heart Health Metrics
  const heartHealthMetrics = [
    {
      type: 'heartRate' as const,
      value: formatHealthValue(healthData.heartRate.value, 'heartRate'),
      unit: normalizeUnit(healthData.heartRate.unit, 'heartRate'),
      label: 'Heart Rate Today',
      isAvailable: healthData.heartRate.isAvailable,
    },
    {
      type: 'restingHeartRate' as const,
      value: formatHealthValue(healthData.restingHeartRate.value, 'restingHeartRate'),
      unit: normalizeUnit(healthData.restingHeartRate.unit, 'restingHeartRate'),
      label: 'Resting Heart Rate',
      isAvailable: healthData.restingHeartRate.isAvailable,
    },
    {
      type: 'heartRateVariability' as const,
      value: formatHealthValue(healthData.heartRateVariability.value, 'heartRateVariability'),
      unit: normalizeUnit(healthData.heartRateVariability.unit, 'heartRateVariability'),
      label: 'Heart Rate Variability',
      isAvailable: healthData.heartRateVariability.isAvailable,
    },
    {
      type: 'vo2Max' as const,
      value: formatHealthValue(healthData.vo2Max.value, 'vo2Max'),
      unit: normalizeUnit(healthData.vo2Max.unit, 'vo2Max'),
      label: 'VO₂ Max',
      isAvailable: healthData.vo2Max.isAvailable,
    },
  ];

  // Vital Signs
  const vitalSignsMetrics = [
    {
      type: 'bloodPressureSystolic' as const,
      value: formatHealthValue(healthData.bloodPressureSystolic.value, 'bloodPressureSystolic'),
      unit: normalizeUnit(healthData.bloodPressureSystolic.unit, 'bloodPressureSystolic'),
      label: 'Blood Pressure (Systolic)',
      isAvailable: healthData.bloodPressureSystolic.isAvailable,
    },
    {
      type: 'bloodPressureDiastolic' as const,
      value: formatHealthValue(healthData.bloodPressureDiastolic.value, 'bloodPressureDiastolic'),
      unit: normalizeUnit(healthData.bloodPressureDiastolic.unit, 'bloodPressureDiastolic'),
      label: 'Blood Pressure (Diastolic)',
      isAvailable: healthData.bloodPressureDiastolic.isAvailable,
    },
    {
      type: 'bodyTemperature' as const,
      value: formatHealthValue(healthData.bodyTemperature.value, 'bodyTemperature'),
      unit: normalizeUnit(healthData.bodyTemperature.unit, 'bodyTemperature'),
      label: 'Body Temperature',
      isAvailable: healthData.bodyTemperature.isAvailable,
    },
    {
      type: 'respiratoryRate' as const,
      value: formatHealthValue(healthData.respiratoryRate.value, 'respiratoryRate'),
      unit: normalizeUnit(healthData.respiratoryRate.unit, 'respiratoryRate'),
      label: 'Respiratory Rate',
      isAvailable: healthData.respiratoryRate.isAvailable,
    },
    {
      type: 'oxygenSaturation' as const,
      value: formatHealthValue(healthData.oxygenSaturation.value, 'oxygenSaturation'),
      unit: normalizeUnit(healthData.oxygenSaturation.unit, 'oxygenSaturation'),
      label: 'Oxygen Saturation',
      isAvailable: healthData.oxygenSaturation.isAvailable,
    },
    {
      type: 'bloodGlucose' as const,
      value: formatHealthValue(healthData.bloodGlucose.value, 'bloodGlucose'),
      unit: normalizeUnit(healthData.bloodGlucose.unit, 'bloodGlucose'),
      label: 'Blood Glucose',
      isAvailable: healthData.bloodGlucose.isAvailable,
    },
  ];

  // Body Composition
  const bodyCompositionMetrics = [
    {
      type: 'weight' as const,
      value: formatHealthValue(healthData.weight.value, 'weight'),
      unit: normalizeUnit(healthData.weight.unit, 'weight'),
      label: 'Weight',
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
      type: 'bodyMassIndex' as const,
      value: formatHealthValue(healthData.bodyMassIndex.value, 'bodyMassIndex'),
      unit: normalizeUnit(healthData.bodyMassIndex.unit, 'bodyMassIndex'),
      label: 'BMI',
      isAvailable: healthData.bodyMassIndex.isAvailable,
    },
    {
      type: 'leanBodyMass' as const,
      value: formatHealthValue(healthData.leanBodyMass.value, 'leanBodyMass'),
      unit: normalizeUnit(healthData.leanBodyMass.unit, 'leanBodyMass'),
      label: 'Lean Body Mass',
      isAvailable: healthData.leanBodyMass.isAvailable,
    },
    {
      type: 'waistCircumference' as const,
      value: formatHealthValue(healthData.waistCircumference.value, 'waistCircumference'),
      unit: normalizeUnit(healthData.waistCircumference.unit, 'waistCircumference'),
      label: 'Waist Circumference',
      isAvailable: healthData.waistCircumference.isAvailable,
    },
  ];

  // Sleep & Wellness
  const sleepWellnessMetrics = [
    {
      type: 'sleep' as const,
      value: formatHealthValue(healthData.sleep.value, 'sleep'),
      unit: normalizeUnit(healthData.sleep.unit, 'sleep'),
      label: 'Sleep Last Night',
      isAvailable: healthData.sleep.isAvailable,
    },
    {
      type: 'mindfulMinutes' as const,
      value: formatHealthValue(healthData.mindfulMinutes.value, 'mindfulMinutes'),
      unit: normalizeUnit(healthData.mindfulMinutes.unit, 'mindfulMinutes'),
      label: 'Mindful Minutes',
      isAvailable: healthData.mindfulMinutes.isAvailable,
    },
  ];

  // Dietary & Lifestyle
  const dietaryLifestyleMetrics = [
    {
      type: 'dietaryWater' as const,
      value: formatHealthValue(healthData.dietaryWater.value, 'dietaryWater'),
      unit: normalizeUnit(healthData.dietaryWater.unit, 'dietaryWater'),
      label: 'Water Intake',
      isAvailable: healthData.dietaryWater.isAvailable,
    },
    {
      type: 'dietaryEnergyConsumed' as const,
      value: formatHealthValue(healthData.dietaryEnergyConsumed.value, 'dietaryEnergyConsumed'),
      unit: normalizeUnit(healthData.dietaryEnergyConsumed.unit, 'dietaryEnergyConsumed'),
      label: 'Calories Consumed',
      isAvailable: healthData.dietaryEnergyConsumed.isAvailable,
    },
    {
      type: 'caffeine' as const,
      value: formatHealthValue(healthData.caffeine.value, 'caffeine'),
      unit: normalizeUnit(healthData.caffeine.unit, 'caffeine'),
      label: 'Caffeine',
      isAvailable: healthData.caffeine.isAvailable,
    },
    {
      type: 'bloodAlcoholContent' as const,
      value: formatHealthValue(healthData.bloodAlcoholContent.value, 'bloodAlcoholContent'),
      unit: normalizeUnit(healthData.bloodAlcoholContent.unit, 'bloodAlcoholContent'),
      label: 'Blood Alcohol Content',
      isAvailable: healthData.bloodAlcoholContent.isAvailable,
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#1f2937' : '#ffffff' }}>
      {/* Header */}
      <View>
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

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={handleResetPermissions}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: isDarkMode ? '#7f1d1d' : '#fef2f2',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              disabled={isLoading}
            >
              <RotateCcw size={20} color={isDarkMode ? '#fca5a5' : '#dc2626'} />
            </TouchableOpacity>

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
                  {coreActivityMetrics.slice(0, 4).map((metric, index) => (
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

              {/* Core Activity Metrics */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: '700',
                    color: isDarkMode ? '#f3f4f6' : '#1f2937',
                    marginBottom: 16,
                  }}
                >
                  Activity & Movement
                </Text>

                <View style={{ gap: 12 }}>
                  {coreActivityMetrics.map((metric, index) => (
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
                        console.log(`Tapped ${metric.label}`);
                      }}
                    />
                  ))}
                </View>
              </View>

              {/* Heart Health Metrics */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: '700',
                    color: isDarkMode ? '#f3f4f6' : '#1f2937',
                    marginBottom: 16,
                  }}
                >
                  Heart Health
                </Text>

                <View style={{ gap: 12 }}>
                  {heartHealthMetrics.map((metric, index) => (
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
                        console.log(`Tapped ${metric.label}`);
                      }}
                    />
                  ))}
                </View>
              </View>

              {/* Vital Signs */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: '700',
                    color: isDarkMode ? '#f3f4f6' : '#1f2937',
                    marginBottom: 16,
                  }}
                >
                  Vital Signs
                </Text>

                <View style={{ gap: 12 }}>
                  {vitalSignsMetrics.map((metric, index) => (
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
                        console.log(`Tapped ${metric.label}`);
                      }}
                    />
                  ))}
                </View>
              </View>

              {/* Body Composition */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: '700',
                    color: isDarkMode ? '#f3f4f6' : '#1f2937',
                    marginBottom: 16,
                  }}
                >
                  Body Composition
                </Text>

                <View style={{ gap: 12 }}>
                  {bodyCompositionMetrics.map((metric, index) => (
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
                        console.log(`Tapped ${metric.label}`);
                      }}
                    />
                  ))}
                </View>
              </View>

              {/* Sleep & Wellness */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: '700',
                    color: isDarkMode ? '#f3f4f6' : '#1f2937',
                    marginBottom: 16,
                  }}
                >
                  Sleep & Wellness
                </Text>

                <View style={{ gap: 12 }}>
                  {sleepWellnessMetrics.map((metric, index) => (
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
                        console.log(`Tapped ${metric.label}`);
                      }}
                    />
                  ))}
                </View>
              </View>

              {/* Dietary & Lifestyle */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: '700',
                    color: isDarkMode ? '#f3f4f6' : '#1f2937',
                    marginBottom: 16,
                  }}
                >
                  Dietary & Lifestyle
                </Text>

                <View style={{ gap: 12 }}>
                  {dietaryLifestyleMetrics.map((metric, index) => (
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
                        console.log(`Tapped ${metric.label}`);
                      }}
                    />
                  ))}
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
