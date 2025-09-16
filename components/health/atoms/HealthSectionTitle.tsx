import React from 'react';
import { Text } from 'react-native';

interface HealthSectionTitleProps {
  title: string;
  isDarkMode?: boolean;
}

export default function HealthSectionTitle({ title, isDarkMode = false }: HealthSectionTitleProps) {
  return (
    <Text
      style={{
        fontSize: 20,
        fontWeight: '700',
        color: isDarkMode ? '#f3f4f6' : '#1f2937',
        marginBottom: 16,
      }}
    >
      {title}
    </Text>
  );
}
