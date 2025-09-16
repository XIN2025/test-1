import React from 'react';
import PlatformHealthCard from './health/PlatformHealthCard';

interface SimpleHealthCardProps {
  isDarkMode?: boolean;
  onPress?: () => void;
  width?: number;
  height?: number;
}

export default function SimpleHealthCard({
  isDarkMode = false,
  onPress,
  width = 160,
  height = 160,
}: SimpleHealthCardProps) {
  return <PlatformHealthCard isDarkMode={isDarkMode} onPress={onPress} width={width} height={height} />;
}
