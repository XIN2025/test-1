import React from 'react';
import { View, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import GoalsHeader from './GoalsHeader';

const SkeletonGoalCard = () => {
  const { isDarkMode } = useTheme();
  return (
    <View
      style={{
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
      }}
    >
      {/* Header skeleton */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
              marginRight: 8,
            }}
          />
          <View
            style={{
              width: 180,
              height: 18,
              borderRadius: 4,
              backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
            }}
          />
        </View>
        <View
          style={{
            width: 54,
            height: 54,
            borderRadius: 27,
            backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
          }}
        />
      </View>

      {/* Description skeleton */}
      <View
        style={{
          width: '90%',
          height: 14,
          borderRadius: 4,
          backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
          marginBottom: 8,
        }}
      />
      <View
        style={{
          width: '70%',
          height: 14,
          borderRadius: 4,
          backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
          marginBottom: 12,
        }}
      />

      {/* Priority skeleton */}
      <View
        style={{
          width: 100,
          height: 12,
          borderRadius: 4,
          backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
        }}
      />
    </View>
  );
};

const LoadingScreen = ({ weekStart, weekEnd }: { weekStart: Date; weekEnd: Date }) => {
  const { isDarkMode } = useTheme();
  return (
    <SafeAreaView style={{ backgroundColor: isDarkMode ? '#111827' : '#fff' }}>
      {/* Fixed Header */}
      <View>
        <GoalsHeader
          weekStart={weekStart}
          weekEnd={weekEnd}
          openPreferences={() => {}}
          setShowUploadModal={() => {}}
          setShowAddGoal={() => {}}
        />
        {/* Scrollable Content */}
        <ScrollView
          style={{
            height: '100%',
            backgroundColor: isDarkMode ? '#111827' : '#F0FDF4',
          }}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 16 }}>
            {/* Skeleton cards only - no loading card to prevent height issues */}
            <SkeletonGoalCard />
            <SkeletonGoalCard />
            <SkeletonGoalCard />
            <SkeletonGoalCard />
            <SkeletonGoalCard />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default LoadingScreen;
