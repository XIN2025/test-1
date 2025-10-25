import { useTheme } from '@/context/ThemeContext';

import React from 'react';
import { Pressable, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Utensils, FileText, Pill, ShoppingBag } from 'lucide-react-native';
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
      disabled={!onPress}
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
  tabs?: string[];
  onTabPress?: (tab: string) => void;
  activeTab?: string;
}

export default function Header({
  title,
  subtitle,
  showBackButton,
  leftComponent,
  leftIcon,
  rightIcons,
  tabs,
  activeTab,
  onTabPress,
}: HeaderProps) {
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
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <View className="flex-row items-center justify-between">
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
      {tabs && tabs.length > 0 && (
        <View className="flex-row items-center justify-between gap-2">
          {tabs.map((tab, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => onTabPress?.(tab)}
              style={{
                flex: 1,
                alignItems: 'center',
                borderRadius: 8,
                paddingVertical: 6,
                backgroundColor: activeTab === tab ? '#10b981' : isDarkMode ? '#374151' : '#f3f4f6',
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  textAlign: 'center',
                  fontSize: 12,
                  fontWeight: '500',
                  color: activeTab === tab ? '#ffffff' : isDarkMode ? '#d1d5db' : '#374151',
                }}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
