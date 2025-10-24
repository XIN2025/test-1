import { CircularProgressRing } from '@/components/CircularProgressRing';
import GoalProgressTracker from '@/components/goals/GoalProgressTracker';
import ActionItemCard from '@/components/goals/ActionItemCard';
import { useTheme } from '@/context/ThemeContext';
import { ActionItem, Goal } from '@/types/goals';
import React from 'react';
import { BarChart3, Trash } from 'lucide-react-native';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { commonStylesDark, commonStylesLight, shadow } from '@/utils/commonStyles';

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'health':
      return '❤️';
    case 'fitness':
      return '💪';
    case 'nutrition':
      return '🥗';
    case 'mental':
      return '🧠';
    case 'personal':
      return '⭐';
    default:
      return '🎯';
  }
};

const getGoalProgressColor = (percentage?: number) => {
  if (!percentage) return '#374151';
  if (percentage >= 80) return '#10b981';
  if (percentage >= 50) return '#f59e0b';
  return '#ef4444';
};

interface GoalCardProps {
  goal: Goal;
  onDelete: () => void;
  onGeneratePlan: (goalId: string, goal: Goal) => void;
  onProgressUpdate: (goalId: string, newValue: number) => void;
  onSelectActionItem: (actionItem: ActionItem) => void;
  generatingPlanGoalIds: string[];
}

export default function GoalCard({
  goal,
  onDelete,
  onGeneratePlan,
  onProgressUpdate,
  onSelectActionItem,
  generatingPlanGoalIds,
}: GoalCardProps) {
  const { isDarkMode } = useTheme();
  return (
    <View key={goal.id} style={(isDarkMode ? commonStylesDark : commonStylesLight).displayCard}>
      <View style={{ marginBottom: 16 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              flex: 1,
              gap: 12,
            }}
          >
            <View
              style={{
                padding: 10,
                borderRadius: 24,
                backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 20 }}>{getCategoryIcon(goal.category)}</Text>
            </View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                flex: 1,
                color: isDarkMode ? '#f3f4f6' : '#1f2937',
              }}
            >
              {goal.title}
            </Text>
            <CircularProgressRing
              size={44}
              strokeWidth={4.5}
              progress={goal.completion_percentage || 0}
              color={getGoalProgressColor(goal.completion_percentage)}
              backgroundColor={isDarkMode ? '#374151' : '#e5e7eb'}
              showPercentage={true}
              textColor={isDarkMode ? '#d1d5db' : '#374151'}
            />
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Delete Goal',
                  'Are you sure you want to delete this goal?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: onDelete,
                    },
                  ],
                  { cancelable: true },
                );
              }}
              style={{
                padding: 11,
                borderRadius: 24,
                backgroundColor: isDarkMode ? '#ef4444' : '#fee2e2',
                alignItems: 'center',
                justifyContent: 'center',
                ...shadow.card,
              }}
              activeOpacity={0.7}
            >
              <Trash size={20} color={isDarkMode ? '#fff' : '#ef4444'} />
            </TouchableOpacity>
          </View>
        </View>
        {!(goal.action_items && goal.action_items.length > 0) && (
          <TouchableOpacity
            onPress={() => onGeneratePlan(goal.id, goal)}
            disabled={generatingPlanGoalIds.includes(goal.id)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: '#10b981',
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: generatingPlanGoalIds.includes(goal.id) ? 0.5 : 1,
              marginBottom: 8,
            }}
            activeOpacity={0.7}
          >
            {generatingPlanGoalIds.includes(goal.id) ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <View style={{ marginRight: 8 }}>
                <BarChart3 size={18} color="#ffffff" />
              </View>
            )}
            <Text
              style={{
                color: 'white',
                fontSize: 14,
                fontWeight: '600',
              }}
            >
              {generatingPlanGoalIds.includes(goal.id) ? 'Generating…' : 'Generate Plan'}
            </Text>
          </TouchableOpacity>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: goal.priority === 'high' ? '#ef4444' : goal.priority === 'medium' ? '#f59e0b' : '#10b981',
            }}
          >
            {goal.priority.toUpperCase()} PRIORITY
          </Text>
        </View>
      </View>

      {/* Action Items */}
      {(goal.action_items?.length ?? 0) > 0 && (
        <View className="mt-4">
          <Text className={`mb-2 text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            Action Items
          </Text>
          <View>
            {goal.action_items?.map((item: any) => (
              <ActionItemCard key={item.id} item={item} onPress={() => onSelectActionItem(item)} />
            ))}
          </View>
        </View>
      )}

      {/* Use GoalProgressTracker component for measurable goals */}
      {goal.target_value && (
        <GoalProgressTracker
          goalId={goal.id}
          title=""
          currentValue={goal.current_value || 0}
          targetValue={goal.target_value}
          unit={goal.unit || ''}
          onProgressUpdate={onProgressUpdate}
          showQuickActions={true}
        />
      )}
    </View>
  );
}
