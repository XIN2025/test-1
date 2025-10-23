import { useTheme } from '@/context/ThemeContext';

import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { shadow } from '@/utils/commonStyles';

interface IconProps {
  icon: React.ElementType;
  accessibilityLabel?: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'tertiary';
}

const lightColors = {
  primary: {
    background: '#114131',
    icon: '#fff',
  },
  secondary: {
    background: '#f3f4f6',
    icon: '#374151',
  },
  tertiary: {
    background: '#fed9b1',
    icon: '#f97316',
  },
};

const darkColors = {
  primary: {
    background: '#1f6f51',
    icon: '#fff',
  },
  secondary: {
    background: '#374151',
    icon: '#f3f4f6',
  },
  tertiary: {
    background: '#f97316',
    icon: '#fff',
  },
};

const MIcon = ({ icon, accessibilityLabel, onPress, variant = 'primary' }: IconProps) => {
  const { isDarkMode } = useTheme();
  const colors = (isDarkMode ? darkColors : lightColors)[variant];
  const Icon = icon;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        },
        onPress && shadow.card,
      ]}
      accessibilityLabel={accessibilityLabel}
    >
      <Icon size={20} color={colors.icon} />
    </TouchableOpacity>
  );
};

interface HeaderProps {
  title: string;
  subtitle: string;
  showBackButton?: boolean;
  leftComponent?: React.ReactNode;
  leftIcon?: IconProps;
  rightIcons?: IconProps[];
}

export default function Header({ title, subtitle, showBackButton, leftComponent, leftIcon, rightIcons }: HeaderProps) {
  const router = useRouter();
  const { isDarkMode } = useTheme();

  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: isDarkMode ? '#374151' : '#e5e7eb',
        backgroundColor: isDarkMode ? '#111827' : '#ffffff',
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View className="flex-row items-center gap-2">
        {showBackButton && (
          <MIcon icon={ArrowLeft} accessibilityLabel="Back" onPress={() => router.back()} variant="secondary" />
        )}
        {leftComponent}
        {leftIcon && <MIcon {...leftIcon} />}
        <View className="ml-2">
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: isDarkMode ? '#f3f4f6' : '#1f2937',
              marginBottom: 2,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: isDarkMode ? '#9ca3af' : '#6b7280',
            }}
          >
            {subtitle}
          </Text>
        </View>
      </View>
      <View className="flex flex-row items-center gap-3">
        {rightIcons?.map((icon, index) => (
          <MIcon key={index} {...icon} />
        ))}
      </View>
    </View>
  );
}
