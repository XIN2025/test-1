import { Card } from '@/components/ui/card';
import { shadow } from '@/utils/commonStyles';
import { BookOpen, Star, Target } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { KeyboardAvoidingView, KeyboardAwareScrollView } from 'react-native-keyboard-controller';

interface WeeklyReflectionProps {
  weekStart: Date;
  weekEnd: Date;
  completedGoals: number;
  totalGoals: number;
  onSave: (reflection: string, rating: number, nextWeekGoals: string[]) => void;
  onClose: () => void;
  initialReflection?: string;
  initialRating?: number;
  initialGoals?: string[];
  isDarkMode: boolean;
  visible: boolean;
}

export default function WeeklyReflection({
  weekStart,
  weekEnd,
  completedGoals,
  totalGoals,
  onSave,
  onClose,
  initialReflection,
  initialRating,
  initialGoals,
  visible,
  isDarkMode,
}: WeeklyReflectionProps) {
  const [reflection, setReflection] = useState(initialReflection || '');
  const [rating, setRating] = useState(initialRating || 0);
  const [nextWeekGoals, setNextWeekGoals] = useState<string[]>(
    initialGoals && initialGoals.length > 0 ? initialGoals : [''],
  );
  const [error, setError] = useState<string | null>(null);
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleAddGoal = () => {
    setNextWeekGoals([...nextWeekGoals, '']);
  };

  const handleUpdateGoal = (index: number, value: string) => {
    const updated = [...nextWeekGoals];
    updated[index] = value;
    setNextWeekGoals(updated);
  };

  const handleRemoveGoal = (index: number) => {
    if (nextWeekGoals.length > 1) {
      const updated = nextWeekGoals.filter((_, i) => i !== index);
      setNextWeekGoals(updated);
    }
  };

  const handleSave = () => {
    if (rating === 0) {
      setError('You must add rating to save the reflection.');
      return;
    }
    const filteredGoals = nextWeekGoals.filter((goal) => goal.trim() !== '');
    onSave(reflection, rating, filteredGoals);
  };

  const handleSetRating = (rating: number) => {
    setRating(rating);
    setError(null);
  };

  const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 items-center justify-center bg-black/30">
          <TouchableWithoutFeedback onPress={() => {}}>
            <View
              className={`w-[90%] gap-4 rounded-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
              style={{
                ...shadow.card,
              }}
            >
              {/* Header */}
              <View className="flex-row items-center gap-2">
                <BookOpen size={22} color={isDarkMode ? '#60a5fa' : '#3b82f6'} />
                <Text className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                  Weekly Reflection
                </Text>
              </View>

              {/* Week Summary */}
              <Card className="border-0">
                <View className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                  <Text className={`mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-100' : 'text-blue-800'}`}>
                    Week of {formatDate(weekStart)} - {formatDate(weekEnd)}
                  </Text>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Target size={16} color={isDarkMode ? '#34d399' : '#3b82f6'} />
                      <Text className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-blue-700'}`}>
                        {completedGoals}/{totalGoals} goals completed
                      </Text>
                    </View>
                    <Text className={`text-sm font-semibold ${isDarkMode ? 'text-emerald-400' : 'text-blue-800'}`}>
                      {completionRate.toFixed(0)}%
                    </Text>
                  </View>
                </View>
              </Card>

              <KeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                className="max-h-[70%]"
                contentContainerClassName="gap-2"
                showsVerticalScrollIndicator={false}
              >
                {/* Week Rating */}
                <View>
                  <Text className={`mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    How would you rate this week?
                  </Text>
                  <View className="flex-row justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity key={star} onPress={() => handleSetRating(star)} className="mx-1">
                        <Star
                          size={24}
                          color={star <= rating ? '#fbbf24' : isDarkMode ? '#4b5563' : '#d1d5db'}
                          fill={star <= rating ? '#fbbf24' : 'none'}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text className={`mt-1 text-center text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {rating === 0 && 'Tap to rate'}
                    {rating === 1 && 'Very challenging'}
                    {rating === 2 && 'Somewhat difficult'}
                    {rating === 3 && 'Okay'}
                    {rating === 4 && 'Pretty good'}
                    {rating === 5 && 'Excellent!'}
                  </Text>
                </View>

                {/* Reflection */}
                <View>
                  <Text className={`mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    What went well this week?
                  </Text>
                  <TextInput
                    placeholder="Share your thoughts on your achievements, challenges, and learnings..."
                    placeholderTextColor={isDarkMode ? '#6b7280' : '#9ca3af'}
                    value={reflection}
                    onChangeText={setReflection}
                    multiline
                    numberOfLines={4}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-gray-100'
                        : 'border-gray-300 bg-white text-gray-800'
                    }`}
                    textAlignVertical="top"
                  />
                </View>

                {/* Next Week Goals */}
                <View className="gap-2">
                  <Text className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Goals for next week
                  </Text>
                  <View className="gap-2">
                    {nextWeekGoals.map((goal, index) => (
                      <View key={index} className="flex-row items-center">
                        <TextInput
                          placeholder={`Goal ${index + 1}`}
                          placeholderTextColor={isDarkMode ? '#6b7280' : '#9ca3af'}
                          value={goal}
                          onChangeText={(text) => handleUpdateGoal(index, text)}
                          className={`mr-2 flex-1 rounded-lg border px-3 py-2 text-sm ${
                            isDarkMode
                              ? 'border-gray-600 bg-gray-700 text-gray-100'
                              : 'border-gray-300 bg-white text-gray-800'
                          }`}
                        />
                        {nextWeekGoals.length > 1 && (
                          <TouchableOpacity
                            onPress={() => handleRemoveGoal(index)}
                            className={`h-8 w-8 items-center justify-center rounded-full ${
                              isDarkMode ? 'bg-red-900/30' : 'bg-red-100'
                            }`}
                          >
                            <Text className={isDarkMode ? 'text-red-400' : 'text-red-600'}>×</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity
                    onPress={handleAddGoal}
                    className={`self-start rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                  >
                    <Text className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>+ Add Goal</Text>
                  </TouchableOpacity>
                </View>
              </KeyboardAwareScrollView>

              {/* Action Buttons */}
              <View className="flex-row">
                <TouchableOpacity
                  onPress={onClose}
                  className={`mr-2 flex-1 rounded-lg px-4 py-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}
                >
                  <Text className={`text-center font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Skip
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  className={`ml-2 flex-1 rounded-lg px-4 py-2 ${isDarkMode ? 'bg-blue-900' : 'bg-blue-600'}`}
                >
                  <Text className="text-center font-medium text-white">Save Reflection</Text>
                </TouchableOpacity>
              </View>
              {error && (
                <Text className={`text-center text-sm ${isDarkMode ? 'text-red-400' : 'text-red-500'}`}>{error}</Text>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
