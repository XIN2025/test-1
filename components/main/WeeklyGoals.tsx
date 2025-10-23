import { CircularProgressRing } from '@/components/CircularProgressRing';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useGoals } from '@/hooks/useGoals';
import { Goal } from '@/types/goals';

import { useRouter } from 'expo-router';
import { Target } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const getGoalProgressColor = (percentage?: number) => {
  if (!percentage) return '#374151';
  if (percentage >= 80) return '#10b981';
  if (percentage >= 50) return '#f59e0b';
  return '#ef4444';
};

const GoalItem = ({ goal }: { goal: Goal }) => {
  const { isDarkMode } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
      }}
    >
      <View className="flex-1 flex-row items-center gap-3">
        <CircularProgressRing
          size={36}
          strokeWidth={4}
          progress={goal.completion_percentage || 0}
          color={getGoalProgressColor(goal.completion_percentage)}
          backgroundColor={isDarkMode ? '#374151' : '#e5e7eb'}
          showPercentage={false}
          textColor={isDarkMode ? '#d1d5db' : '#374151'}
        />
        <View className="flex-1">
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: isDarkMode ? '#e5e7eb' : '#1f2937',
            }}
          >
            {goal.title}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: isDarkMode ? '#9ca3af' : '#6b7280',
            }}
          >
            {goal.completion_percentage}% completed this week
          </Text>
        </View>
        <View className="flex-col items-end">
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: goal.completed
                ? isDarkMode
                  ? '#34d399'
                  : '#10b981'
                : isDarkMode
                  ? '#4b5563'
                  : '#94a3b8',
            }}
          />
          <Text
            style={{
              fontSize: 11,
              marginTop: 4,
              color: isDarkMode ? '#9ca3af' : '#6b7280',
            }}
          >
            {goal.completed ? 'Done' : 'Active'}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default function WeeklyGoals() {
  const { user } = useAuth();
  const userEmail = user?.email || '';

  const { goals } = useGoals({ userEmail });
  const router = useRouter();
  const { isDarkMode } = useTheme();

  return (
    <>
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <Target size={24} color={isDarkMode ? '#34d399' : '#114131'} />
          <Text
            style={{
              flex: 1,
              fontSize: 18,
              marginBottom: 2,
              fontWeight: '600',
              color: isDarkMode ? '#f3f4f6' : '#1f2937',
            }}
          >
            Weekly Goals
          </Text>
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 20,
              backgroundColor: isDarkMode ? '#064e3b' : '#e6f4f1',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: isDarkMode ? '#34d399' : '#114131',
              }}
            >
              {`${goals.filter((goal) => goal.completed).length}/${goals.length}`}
            </Text>
          </View>
        </View>
      </View>
      {goals.length === 0 ? (
        <Text
          style={{
            fontSize: 14,
            color: isDarkMode ? '#9ca3af' : '#6b7280',
          }}
        >
          No goals yet.
        </Text>
      ) : (
        <View className="gap-2">
          {goals.slice(0, 5).map((goal) => (
            <GoalItem key={goal.id} goal={goal} />
          ))}
        </View>
      )}
      <TouchableOpacity
        style={{
          padding: 12,
          marginTop: 12,
          borderRadius: 12,
          backgroundColor: isDarkMode ? '#064e3b' : '#e6f4f1',
        }}
        onPress={() => router.push('./goals')}
        activeOpacity={0.7}
      >
        <Text
          style={{
            textAlign: 'center',
            fontSize: 14,
            fontWeight: '600',
            color: isDarkMode ? '#34d399' : '#114131',
          }}
        >
          View All Goals
        </Text>
      </TouchableOpacity>
    </>
  );
}
