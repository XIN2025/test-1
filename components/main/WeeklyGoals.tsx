import { CircularProgressRing } from '@/components/CircularProgressRing';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useGoals } from '@/hooks/useGoals';

import { useRouter } from 'expo-router';
import { Target } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export default function WeeklyGoals() {
  const { user } = useAuth();
  const userEmail = user?.email || '';

  const { goals } = useGoals({ userEmail });
  const router = useRouter();
  const { isDarkMode } = useTheme();

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ marginRight: 8 }}>
            <Target size={20} color={isDarkMode ? '#34d399' : '#114131'} />
          </View>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: isDarkMode ? '#f3f4f6' : '#1f2937',
            }}
          >
            Weekly Goals
          </Text>
        </View>
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
            {`${(goals || []).filter((g: any) => g.completed).length}/${(goals || []).length}`}
          </Text>
        </View>
      </View>
      {(goals || []).length === 0 ? (
        <Text
          style={{
            fontSize: 14,
            color: isDarkMode ? '#9ca3af' : '#6b7280',
          }}
        >
          No goals yet.
        </Text>
      ) : (
        <View>
          {goals.slice(0, 5).map((g) => {
            return (
              <View
                key={g.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                  paddingVertical: 4,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    flex: 1,
                  }}
                >
                  {/* Circular Progress Ring */}
                  <View style={{ marginRight: 12 }}>
                    <CircularProgressRing
                      size={44}
                      strokeWidth={3}
                      progress={g.completion_percentage || 0}
                      color={
                        g.completion_percentage
                          ? g.completion_percentage >= 80
                            ? '#10b981' // Green for high completion
                            : g.completion_percentage >= 50
                              ? '#f59e0b' // Yellow for medium completion
                              : '#ef4444' // Red for low completion
                          : '#374151' // Gray for no completion
                      }
                      backgroundColor={isDarkMode ? '#374151' : '#e5e7eb'}
                      showPercentage={false}
                      textColor={isDarkMode ? '#d1d5db' : '#374151'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: isDarkMode ? '#e5e7eb' : '#1f2937',
                        marginBottom: 2,
                      }}
                    >
                      {g.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: isDarkMode ? '#9ca3af' : '#6b7280',
                      }}
                    >
                      {g.completion_percentage}% completed this week
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: g.completed
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
                    {g.completed ? 'Done' : 'Active'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
      <TouchableOpacity
        style={{
          marginTop: 12,
          padding: 12,
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
