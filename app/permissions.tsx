import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';

const PermissionsPage = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { login } = useAuth();

  const { isLoading, permissionStatus, checkPermissionStatus, enableNotifications } = useNotifications();

  // Helper to authenticate user before navigating to dashboard
  const authenticateAndContinue = async () => {
    // Get email and name from params (normalize for array or string)
    const email = Array.isArray(params?.email) ? params.email[0] : String(params?.email || '');
    const name = Array.isArray(params?.name) ? params.name[0] : String(params?.name || '');

    if (email && name) {
      try {
        // Mark as first-time user for new registrations
        await login(email, name, true);
        console.log('authenticated');
        // Only redirect after successful authentication - navigate to dashboard
        router.replace({
          pathname: '/dashboard/main',
          params,
        });
      } catch (err) {
        // If login fails, do not redirect, but you may want to handle this
        console.error('Failed to authenticate user in PermissionsPage:', err);
        Alert.alert('Authentication Error', 'Failed to authenticate user. Please try again.');
      }
    } else {
      // If email or name is missing, do not redirect
      Alert.alert('Missing Information', 'User email or name not found. Cannot continue.');
    }
  };

  const registerForPushNotificationsAsync = async () => {
    const email = params?.email;
    if (!email) {
      Alert.alert('Error', 'User email not found. Cannot register FCM token.');
      return;
    }

    const result = await enableNotifications(String(email), {
      showSuccessAlert: true,
      updateProfile: true,
    });

    if (result.success) {
      // After enabling, proceed to next step (authenticate and go to dashboard)
      await authenticateAndContinue();
    }
  };

  // Handler for skipping notifications
  const handleSkip = async () => {
    await authenticateAndContinue();
  };

  useEffect(() => {
    // Check current notification permission status on mount
    checkPermissionStatus();
  }, [checkPermissionStatus]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
          backgroundColor: '#F9FAFB',
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 400,
            backgroundColor: '#fff',
            borderRadius: 20,
            paddingVertical: 36,
            paddingHorizontal: 28,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 2,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 26,
              fontWeight: 'bold',
              color: '#114131',
              marginBottom: 12,
              textAlign: 'center',
              letterSpacing: 0.2,
            }}
          >
            Enable Notifications
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#114131',
              textAlign: 'center',
              marginBottom: 24,
              lineHeight: 22,
            }}
          >
            To help you stay on track, Evra would like to send you notifications for nudges and reminders.
          </Text>

          {permissionStatus === 'granted' && (
            <View
              style={{
                backgroundColor: '#D1FAE5',
                borderRadius: 8,
                paddingVertical: 10,
                paddingHorizontal: 16,
                marginBottom: 20,
                width: '100%',
              }}
            >
              <Text
                style={{
                  color: '#047857',
                  fontWeight: '600',
                  textAlign: 'center',
                  fontSize: 15,
                }}
              >
                Notifications are enabled!
              </Text>
            </View>
          )}

          {permissionStatus !== 'granted' && (
            <TouchableOpacity
              style={{
                backgroundColor: isLoading ? '#A7F3D0' : '#059669',
                borderRadius: 8,
                paddingVertical: 14,
                width: '100%',
                alignItems: 'center',
                marginBottom: 14,
                opacity: isLoading ? 0.7 : 1,
              }}
              onPress={registerForPushNotificationsAsync}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={{
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: 16,
                    letterSpacing: 0.2,
                  }}
                >
                  Enable Notifications
                </Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={{
              backgroundColor: '#F3F4F6',
              borderRadius: 8,
              paddingVertical: 14,
              width: '100%',
              alignItems: 'center',
              marginBottom: 0,
              marginTop: 2,
              borderWidth: 1,
              borderColor: '#D1D5DB',
            }}
            onPress={handleSkip}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <Text
              style={{
                color: '#6B7280',
                fontWeight: '600',
                fontSize: 16,
                letterSpacing: 0.2,
              }}
            >
              Skip
            </Text>
          </TouchableOpacity>

          {permissionStatus === 'denied' && (
            <View
              style={{
                marginTop: 22,
                backgroundColor: '#FEE2E2',
                borderRadius: 8,
                paddingVertical: 10,
                paddingHorizontal: 16,
                width: '100%',
              }}
            >
              <Text
                style={{
                  color: '#B91C1C',
                  textAlign: 'center',
                  fontSize: 14,
                  fontWeight: '500',
                }}
              >
                Notifications are disabled. You can enable them in your device settings.
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default PermissionsPage;
