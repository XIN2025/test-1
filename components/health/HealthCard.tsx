import React, { useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Activity, Heart } from 'lucide-react-native';
import { commonStylesDark, commonStylesLight } from '@/utils/commonStyles';
import { HealthData, useHealthDataSummary } from './useHealthDataSummary';
import { useTheme } from '@/context/ThemeContext';

interface HealthCardProps {
  onPress?: () => void;
  width?: number;
  height?: number;
}

const LoadingState = ({ isDarkMode }: { isDarkMode: boolean }) => {
  return (
    <>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: isDarkMode ? '#064e3b' : '#f0fdf4',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        <Activity size={24} color={isDarkMode ? '#34d399' : '#059669'} />
      </View>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: isDarkMode ? '#f3f4f6' : '#1f2937',
          textAlign: 'center',
          marginBottom: 4,
        }}
      >
        Health Data
      </Text>
      <Text
        style={{
          fontSize: 11,
          color: isDarkMode ? '#9ca3af' : '#6b7280',
          textAlign: 'center',
        }}
      >
        Loading...
      </Text>
    </>
  );
};

const UnavailableState = ({ isDarkMode }: { isDarkMode: boolean }) => {
  return (
    <>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: isDarkMode ? '#064e3b' : '#f0fdf4',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        <Activity size={24} color={isDarkMode ? '#34d399' : '#059669'} />
      </View>
      <Text
        style={{
          fontSize: 12,
          color: isDarkMode ? '#9ca3af' : '#6b7280',
          textAlign: 'center',
        }}
      >
        Health Connect is not available on this device.
      </Text>
    </>
  );
};

const ConnectButton = ({ isDarkMode }: { isDarkMode: boolean }) => {
  return (
    <>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: isDarkMode ? '#064e3b' : '#f0fdf4',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        <Activity size={24} color={isDarkMode ? '#34d399' : '#059669'} />
      </View>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: isDarkMode ? '#f3f4f6' : '#1f2937',
          textAlign: 'center',
          marginBottom: 4,
        }}
      >
        Health Data
      </Text>
      <Text
        style={{
          fontSize: 11,
          color: isDarkMode ? '#9ca3af' : '#6b7280',
          textAlign: 'center',
        }}
      >
        Tap to Connect
      </Text>
    </>
  );
};

const ConnectedState = ({ isDarkMode, healthData }: { isDarkMode: boolean; healthData: HealthData }) => {
  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <View
          style={{
            padding: 6,
            borderRadius: 24,
            backgroundColor: isDarkMode ? '#064e3b' : '#f0fdf4',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Heart size={16} color="#059669" />
        </View>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: isDarkMode ? '#f3f4f6' : '#1f2937',
            marginLeft: 6,
          }}
        >
          Health
        </Text>
      </View>

      {/* Show 3 key metrics in a list */}
      <View style={{ width: '100%', flex: 1, gap: 8, justifyContent: 'center' }}>
        <StatItem
          label="Steps"
          value={Math.round(Number(healthData?.steps?.value) || 0).toLocaleString()}
          isDarkMode={isDarkMode}
        />
        <StatItem
          label="Heart Rate"
          value={`${Math.round(Number(healthData?.heartRate?.value) || 0)} bpm`}
          isDarkMode={isDarkMode}
        />
        <StatItem
          label="Sleep"
          value={Number(healthData?.sleep?.value) ? `${Number(healthData?.sleep?.value).toFixed(1)}h` : '--'}
          isDarkMode={isDarkMode}
        />
      </View>
    </>
  );
};

const StatItem = ({ label, value, isDarkMode }: { label: string; value: string; isDarkMode: boolean }) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 14,
          color: isDarkMode ? '#9ca3af' : '#6b7280',
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 14,
          fontWeight: '600',
          color: isDarkMode ? '#f3f4f6' : '#1f2937',
        }}
      >
        {value}
      </Text>
    </View>
  );
};

export default function HealthCard({ onPress, width, height }: HealthCardProps) {
  const { isAvailable, hasPermissions, healthData, requestPermissions, isLoading, verifyPermissions } =
    useHealthDataSummary();
  const { isDarkMode } = useTheme();

  // Periodically verify permissions to catch revoked access
  const checkPermissionsStatus = useCallback(async () => {
    if (hasPermissions && isAvailable) {
      try {
        await verifyPermissions();
      } catch (error) {
        console.error('Error verifying permissions in IOSHealthCard:', error);
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

  const handlePress = async () => {
    if (!hasPermissions) {
      await requestPermissions();
    } else {
      // Verify permissions before proceeding
      try {
        const stillHasPermissions = await verifyPermissions();
        if (stillHasPermissions && onPress) {
          onPress();
        } else if (!stillHasPermissions) {
          // Permissions were revoked, request them again
          await requestPermissions();
        }
      } catch (error) {
        console.error('Error verifying permissions on press:', error);
        // Fallback to requesting permissions
        await requestPermissions();
      }
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        (isDarkMode ? commonStylesDark : commonStylesLight).pressableCard,
        {
          width,
          height,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
      activeOpacity={0.7}
      disabled={isLoading || !isAvailable}
    >
      {!isAvailable ? (
        <UnavailableState isDarkMode={isDarkMode} />
      ) : isLoading ? (
        <LoadingState isDarkMode={isDarkMode} />
      ) : !hasPermissions ? (
        <ConnectButton isDarkMode={isDarkMode} />
      ) : (
        <ConnectedState isDarkMode={isDarkMode} healthData={healthData} />
      )}
    </TouchableOpacity>
  );
}
