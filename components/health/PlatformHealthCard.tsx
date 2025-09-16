import React from 'react';
import { Platform } from 'react-native';
import IOSHealthCard from './IOSHealthCard';
import AndroidHealthCard from './AndroidHealthCard';

interface PlatformHealthCardProps {
  isDarkMode?: boolean;
  onPress?: () => void;
  width?: number;
  height?: number;
}

/**
 * Platform-specific Health Card Component
 * Automatically renders the appropriate health card based on the platform
 * - iOS: Uses HealthKit via IOSHealthCard
 * - Android: Uses Health Connect via AndroidHealthCard
 */
export default function PlatformHealthCard({
  isDarkMode = false,
  onPress,
  width = 160,
  height = 160,
}: PlatformHealthCardProps) {
  if (Platform.OS === 'ios') {
    return <IOSHealthCard isDarkMode={isDarkMode} onPress={onPress} width={width} height={height} />;
  } else if (Platform.OS === 'android') {
    return <AndroidHealthCard isDarkMode={isDarkMode} onPress={onPress} width={width} height={height} />;
  } else {
    // Unsupported platform - return null
    return null;
  }
}
