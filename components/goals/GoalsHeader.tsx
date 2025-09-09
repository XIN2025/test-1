import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Target, Star, BookOpen, Plus } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { formatDate } from '@/utils/date';

interface GoalsHeaderProps {
  weekStart: Date;
  weekEnd: Date;
  openPreferences: () => void;
  setShowUploadModal: (show: boolean) => void;
  setShowAddGoal: (show: boolean) => void;
}

const GoalsHeader: React.FC<GoalsHeaderProps> = ({
  weekStart,
  weekEnd,
  openPreferences,
  setShowUploadModal,
  setShowAddGoal,
}) => {
  const { isDarkMode } = useTheme();
  return (
    <View>
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: isDarkMode ? '#374151' : '#e5e7eb',
          backgroundColor: isDarkMode ? '#111827' : '#ffffff',
          paddingHorizontal: 16,
          paddingVertical: 16,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
                backgroundColor: isDarkMode ? '#1f6f51' : '#114131',
              }}
            >
              <Target size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: isDarkMode ? '#f3f4f6' : '#1f2937',
                  marginBottom: 2,
                }}
              >
                Weekly Goals
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                }}
              >
                {formatDate(weekStart)} - {formatDate(weekEnd)}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={openPreferences}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isDarkMode ? '#1f6f51' : '#114131',
                marginRight: 8,
              }}
              activeOpacity={0.7}
            >
              <Star size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowUploadModal(true)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isDarkMode ? '#1f6f51' : '#114131',
                marginRight: 8,
              }}
              activeOpacity={0.7}
            >
              <BookOpen size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowAddGoal(true)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isDarkMode ? '#1f6f51' : '#114131',
              }}
              activeOpacity={0.7}
            >
              <Plus size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default GoalsHeader;
