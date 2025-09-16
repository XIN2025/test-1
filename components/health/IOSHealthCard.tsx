import React, { useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Activity, Heart } from 'lucide-react-native';
import { useHealthKit } from '../../hooks/useHealthKit';

interface IOSHealthCardProps {
  isDarkMode?: boolean;
  onPress?: () => void;
  width?: number;
  height?: number;
}

export default function IOSHealthCard({ isDarkMode = false, onPress, width = 160, height = 160 }: IOSHealthCardProps) {
  const { isAvailable, hasPermissions, healthData, requestPermissions, isLoading, verifyPermissions } = useHealthKit();

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

  // If health data is not available, don't show the health card
  if (!isAvailable) {
    return null;
  }

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
      style={{
        width,
        height,
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDarkMode ? 0.3 : 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
      activeOpacity={0.7}
    >
      {isLoading ? (
        // Loading state to prevent flicker
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
      ) : !hasPermissions ? (
        // Show connect button if not connected
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
      ) : (
        // Show simple health stats if connected
        <>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Heart size={16} color={isDarkMode ? '#34d399' : '#059669'} />
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: isDarkMode ? '#f3f4f6' : '#1f2937',
                marginLeft: 6,
              }}
            >
              Health
            </Text>
          </View>

          {/* Show 3 key metrics in a list */}
          <View style={{ width: '100%', flex: 1 }}>
            {/* Steps */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                }}
              >
                Steps
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: isDarkMode ? '#f3f4f6' : '#1f2937',
                }}
              >
                {Math.round(Number(healthData?.steps?.value) || 0).toLocaleString()}
              </Text>
            </View>

            {/* Heart Rate */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                }}
              >
                Heart Rate
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: isDarkMode ? '#f3f4f6' : '#1f2937',
                }}
              >
                {Math.round(Number(healthData?.heartRate?.value) || 0)} {'bpm'}
              </Text>
            </View>

            {/* Sleep */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 0,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                }}
              >
                Sleep
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: isDarkMode ? '#f3f4f6' : '#1f2937',
                }}
              >
                {Number(healthData?.sleep?.value) ? `${Number(healthData?.sleep?.value).toFixed(1)}h` : '--'}
              </Text>
            </View>
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}
