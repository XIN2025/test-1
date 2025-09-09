import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Target, Plus } from 'lucide-react-native';

interface EmptyGoalsProps {
  setShowAddGoal: (show: boolean) => void;
}

const EmptyGoals = ({ setShowAddGoal }: EmptyGoalsProps) => {
  const { isDarkMode } = useTheme();
  return (
    <View
      style={{
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        borderRadius: 16,
        padding: 32,
        marginBottom: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDarkMode ? 0.3 : 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <Target size={32} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
      </View>
      <Text
        style={{
          fontSize: 18,
          fontWeight: '600',
          color: isDarkMode ? '#f3f4f6' : '#1f2937',
          marginBottom: 8,
          textAlign: 'center',
        }}
      >
        No Goals Yet
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: isDarkMode ? '#9ca3af' : '#6b7280',
          textAlign: 'center',
          marginBottom: 24,
          lineHeight: 20,
        }}
      >
        Start your health journey by creating your first goal. Track progress, build habits, and achieve lasting
        wellness.
      </Text>
      <TouchableOpacity
        onPress={() => setShowAddGoal(true)}
        style={{
          backgroundColor: isDarkMode ? '#059669' : '#114131',
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
        }}
        activeOpacity={0.8}
      >
        <Plus size={18} color="#ffffff" style={{ marginRight: 8 }} />
        <Text
          style={{
            color: '#ffffff',
            fontSize: 16,
            fontWeight: '600',
          }}
        >
          Create Your First Goal
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default EmptyGoals;
