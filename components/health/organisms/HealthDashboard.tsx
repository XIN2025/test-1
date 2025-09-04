import React, { useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Platform, Alert } from 'react-native';
import { Activity, ChevronRight } from 'lucide-react-native';
import HealthSummaryCard from '../molecules/HealthSummaryCard';
import { useHealthKit } from '../../../hooks/useHealthKit';

interface HealthDashboardProps {
  isDarkMode?: boolean;
  onViewAllHealth?: () => void;
}

export default function HealthDashboard({ isDarkMode = false, onViewAllHealth }: HealthDashboardProps) {
  const { isAvailable, isLoading, hasPermissions, healthData, requestPermissions, verifyPermissions } = useHealthKit();

  // Periodically verify permissions to catch revoked access
  const checkPermissionsStatus = useCallback(async () => {
    if (hasPermissions && isAvailable) {
      try {
        await verifyPermissions();
      } catch (error) {
        console.error('Error verifying permissions in HealthDashboard:', error);
      }
    }
  }, [hasPermissions, isAvailable, verifyPermissions]);

  // Check permissions when component becomes visible or when user interacts
  useEffect(() => {
    if (hasPermissions) {
      checkPermissionsStatus();

      // Set up periodic check every 30 seconds when component is active
      const interval = setInterval(checkPermissionsStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [hasPermissions, checkPermissionsStatus]);

  // If not iOS, don't show the health dashboard
  if (Platform.OS !== 'ios' || !isAvailable) {
    return null;
  }

  const handleRequestPermissions = async () => {
    const granted = await requestPermissions();
    if (!granted) {
      Alert.alert(
        'Health Permissions Required',
        'To show your health data, please grant access to Health app in Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Settings',
            onPress: () => {
              // You can add logic to open settings if needed
            },
          },
        ],
      );
    }
  };

  // If permissions not granted, show permission request
  if (!hasPermissions) {
    return (
      <View
        style={{
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDarkMode ? 0.3 : 0.1,
          shadowRadius: 4,
          elevation: 3,
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: isDarkMode ? '#064e3b' : '#f0fdf4',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <Activity size={32} color={isDarkMode ? '#34d399' : '#059669'} />
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
          Connect Your Health Data
        </Text>

        <Text
          style={{
            fontSize: 14,
            color: isDarkMode ? '#9ca3af' : '#6b7280',
            textAlign: 'center',
            marginBottom: 20,
            lineHeight: 20,
          }}
        >
          Get insights from your Apple Health data including steps, heart rate, sleep, and more
        </Text>

        <TouchableOpacity
          onPress={handleRequestPermissions}
          style={{
            backgroundColor: isDarkMode ? '#059669' : '#059669',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
          }}
          activeOpacity={0.8}
        >
          <Text
            style={{
              color: '#ffffff',
              fontSize: 16,
              fontWeight: '600',
              marginRight: 8,
            }}
          >
            Connect Health App
          </Text>
          <ChevronRight size={16} color="#ffffff" />
        </TouchableOpacity>
      </View>
    );
  }

  // Prepare health data for display
  const healthDataForDisplay = [
    {
      type: 'steps' as const,
      value: healthData.steps.value,
      unit: 'steps',
      label: 'Steps Today',
    },
    {
      type: 'heartRate' as const,
      value: healthData.heartRate.value,
      unit: healthData.heartRate.unit,
      label: 'Heart Rate',
    },
    {
      type: 'activeEnergy' as const,
      value: healthData.activeEnergy.value,
      unit: healthData.activeEnergy.unit,
      label: 'Active Energy',
    },
    {
      type: 'sleep' as const,
      value: healthData.sleep.value,
      unit: healthData.sleep.unit,
      label: 'Sleep Last Night',
    },
  ];

  return (
    <View style={{ marginBottom: 16 }}>
      <HealthSummaryCard
        healthData={healthDataForDisplay}
        isDarkMode={isDarkMode}
        onViewAll={onViewAllHealth}
        isLoading={isLoading}
      />

      {onViewAllHealth && (
        <TouchableOpacity
          onPress={onViewAllHealth}
          style={{
            marginTop: 12,
            backgroundColor: isDarkMode ? '#059669' : '#059669',
            paddingVertical: 16,
            paddingHorizontal: 20,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
          activeOpacity={0.8}
        >
          <Activity size={20} color="#ffffff" style={{ marginRight: 8 }} />
          <Text
            style={{
              color: '#ffffff',
              fontSize: 16,
              fontWeight: '600',
              flex: 1,
              textAlign: 'center',
            }}
          >
            View Complete Health Dashboard
          </Text>
          <ChevronRight size={20} color="#ffffff" />
        </TouchableOpacity>
      )}
    </View>
  );
}
