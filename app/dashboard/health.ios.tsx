import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Activity, RefreshCw, RotateCcw } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useHealthKit } from '../../hooks/useHealthKit';
import HealthDashboardContent from '../../components/health/organisms/HealthDashboardContent';
import { createHealthSections } from '../../components/health/utils/healthDataTransformers';

export default function HealthDashboardIOS() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { isAvailable, isLoading, hasPermissions, healthData, requestPermissions, refreshData, resetPermissions } =
    useHealthKit();

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } catch (error) {
      console.error('Error refreshing health data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRequestPermissions = async () => {
    try {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          'Permissions Required',
          'Health permissions are required to view your health data. Please enable them in Settings.',
          [{ text: 'OK' }],
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request health permissions. Please try again.', [{ text: 'OK' }]);
    }
  };

  const handleResetPermissions = async () => {
    Alert.alert(
      'Reset Permissions',
      'This will reset all health permissions and you will need to grant them again. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetPermissions();
              Alert.alert('Success', 'Permissions have been reset.');
            } catch (error) {
              console.error('Error resetting permissions:', error);
              Alert.alert('Error', 'Failed to reset permissions.');
            }
          },
        },
      ],
    );
  };

  const healthSections = createHealthSections(healthData);

  if (!isAvailable) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#111827' : '#f9fafb' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Activity size={48} color={isDarkMode ? '#6b7280' : '#9ca3af'} />
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: isDarkMode ? '#f3f4f6' : '#1f2937',
              marginTop: 16,
              textAlign: 'center',
            }}
          >
            HealthKit Not Available
          </Text>
          <Text style={{ fontSize: 14, color: isDarkMode ? '#9ca3af' : '#6b7280', marginTop: 8, textAlign: 'center' }}>
            HealthKit is not available on this device.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#111827' : '#f9fafb' }} edges={['top']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: isDarkMode ? '#374151' : '#e5e7eb',
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <ArrowLeft size={20} color={isDarkMode ? '#f3f4f6' : '#1f2937'} />
          <Text style={{ fontSize: 18, fontWeight: '600', color: isDarkMode ? '#f3f4f6' : '#1f2937', marginLeft: 8 }}>
            Health Dashboard
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={onRefresh}
            style={{
              padding: 8,
              marginRight: 8,
            }}
          >
            <RefreshCw size={20} color={isDarkMode ? '#f3f4f6' : '#1f2937'} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleResetPermissions}
            style={{
              padding: 8,
            }}
          >
            <RotateCcw size={20} color={isDarkMode ? '#f3f4f6' : '#1f2937'} />
          </TouchableOpacity>
        </View>
      </View>

      {!hasPermissions ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 }}>
          <Activity size={48} color={isDarkMode ? '#6b7280' : '#9ca3af'} />
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: isDarkMode ? '#f3f4f6' : '#1f2937',
              marginTop: 16,
              textAlign: 'center',
            }}
          >
            Health Permissions Required
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: isDarkMode ? '#9ca3af' : '#6b7280',
              marginTop: 8,
              textAlign: 'center',
              marginBottom: 24,
            }}
          >
            Grant access to your health data to view your metrics and track your progress.
          </Text>
          <TouchableOpacity
            onPress={handleRequestPermissions}
            style={{
              backgroundColor: isDarkMode ? '#059669' : '#059669',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>Grant Permissions</Text>
          </TouchableOpacity>
        </View>
      ) : isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 }}>
          <Activity size={48} color={isDarkMode ? '#6b7280' : '#9ca3af'} />
          <Text style={{ fontSize: 16, color: isDarkMode ? '#9ca3af' : '#6b7280', marginTop: 16 }}>
            Loading health data...
          </Text>
        </View>
      ) : (
        <HealthDashboardContent
          isDarkMode={isDarkMode}
          refreshing={refreshing}
          onRefresh={onRefresh}
          sections={healthSections}
        />
      )}
    </SafeAreaView>
  );
}
