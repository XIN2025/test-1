import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { GoalFormData } from '@/types/goals';

interface AddGoalModalProps {
  showAddGoal: boolean;
  setShowAddGoal: (show: boolean) => void;
  formData: Partial<GoalFormData>;
  setFormData: (data: Partial<GoalFormData>) => void;
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  handleAddGoal: () => void;
}

const AddGoalModal = ({
  showAddGoal,
  setShowAddGoal,
  showSuggestions,
  setShowSuggestions,
  formData,
  setFormData,
  handleAddGoal,
}: AddGoalModalProps) => {
  const { isDarkMode } = useTheme();
  return (
    <Modal
      visible={showAddGoal}
      transparent
      animationType="fade"
      onRequestClose={() => {
        setShowAddGoal(false);
        setShowSuggestions(false);
      }}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
            setShowAddGoal(false);
            setShowSuggestions(false);
          }}
        >
          <View className="flex-1 items-center justify-center bg-black/70 px-4">
            <TouchableWithoutFeedback onPress={(e: any) => e.stopPropagation()}>
              <View className={`mx-4 w-full max-w-md rounded-lg shadow-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <ScrollView
                  contentContainerStyle={{ flexGrow: 1 }}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <View className="p-6">
                    <Text className={`mb-4 text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                      Add New Goal
                    </Text>

                    <TextInput
                      placeholder="Goal title"
                      value={formData.title}
                      onChangeText={(text: string) => setFormData({ ...formData, title: text })}
                      className={`mb-3 rounded-lg border px-3 py-2 ${
                        isDarkMode
                          ? 'border-gray-600 bg-gray-700 text-gray-100'
                          : 'border-gray-300 bg-white text-gray-800'
                      }`}
                      placeholderTextColor={isDarkMode ? '#9ca3af' : undefined}
                      returnKeyType="next"
                      onSubmitEditing={() => {
                        // Focus will automatically move to next input
                      }}
                    />

                    <TextInput
                      placeholder="Description (optional)"
                      value={formData.description}
                      onChangeText={(text: string) => setFormData({ ...formData, description: text })}
                      className={`mb-3 rounded-lg border px-3 py-2 ${
                        isDarkMode
                          ? 'border-gray-600 bg-gray-700 text-gray-100'
                          : 'border-gray-300 bg-white text-gray-800'
                      }`}
                      placeholderTextColor={isDarkMode ? '#9ca3af' : undefined}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                    />

                    {/* Show Suggestions Button */}
                    <TouchableOpacity
                      onPress={() => setShowSuggestions(!showSuggestions)}
                      className={`mb-3 rounded-lg p-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                    >
                      <Text className={`text-center text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`}>
                        {showSuggestions ? 'Hide Suggestions' : 'Show Suggestions'}
                      </Text>
                    </TouchableOpacity>

                    {/* Goal Suggestions */}
                    {showSuggestions && (
                      <View className="mb-4">
                        <Text className={`mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                          SUGGESTIONS
                        </Text>
                        <View className="space-y-2">
                          {[
                            'Sleep 8 hours a day',
                            'Follow recommended diet',
                            'Exercise 4 times a week for 75 min each',
                            'Meditate for 20 min daily',
                            'Connect with social group twice a week after work',
                          ].map((suggestion, index) => (
                            <TouchableOpacity
                              key={index}
                              onPress={() => {
                                setFormData({
                                  ...formData,
                                  title: suggestion,
                                });
                              }}
                              className={`rounded-lg border p-3 ${
                                isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              <Text className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                {suggestion}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}

                    <View className="mb-3 flex-row justify-between">
                      <Text className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        Priority:
                      </Text>
                      <View className="flex-row">
                        {(['low', 'medium', 'high'] as const).map((priority) => (
                          <TouchableOpacity
                            key={priority}
                            onPress={() => setFormData({ ...formData, priority })}
                            className={`mr-1 rounded px-3 py-1 ${
                              formData.priority === priority
                                ? isDarkMode
                                  ? 'bg-emerald-700'
                                  : 'bg-emerald-900'
                                : isDarkMode
                                  ? 'bg-gray-700'
                                  : 'bg-gray-200'
                            }`}
                          >
                            <Text
                              className={`text-xs ${
                                formData.priority === priority
                                  ? 'text-white'
                                  : isDarkMode
                                    ? 'text-gray-200'
                                    : 'text-gray-700'
                              }`}
                            >
                              {priority.toUpperCase()}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View className="mb-3 flex-row justify-between">
                      <Text className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        Category:
                      </Text>
                      <View className="flex-row">
                        {(['health', 'fitness', 'nutrition', 'mental', 'personal'] as const).map((category) => (
                          <TouchableOpacity
                            key={category}
                            onPress={() => setFormData({ ...formData, category })}
                            className={`mr-1 rounded px-2 py-1 ${
                              formData.category === category
                                ? isDarkMode
                                  ? 'bg-emerald-700'
                                  : 'bg-emerald-900'
                                : isDarkMode
                                  ? 'bg-gray-700'
                                  : 'bg-gray-200'
                            }`}
                          >
                            <Text
                              className={`text-xs ${
                                formData.category === category
                                  ? 'text-white'
                                  : isDarkMode
                                    ? 'text-gray-200'
                                    : 'text-gray-700'
                              }`}
                            >
                              {category}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View className="flex-row">
                      <TouchableOpacity
                        onPress={() => {
                          setShowAddGoal(false);
                          setShowSuggestions(false);
                        }}
                        className={`mr-2 flex-1 rounded-lg px-4 py-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}
                      >
                        <Text className={`text-center ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleAddGoal}
                        className="ml-2 flex-1 rounded-lg px-4 py-2"
                        style={{
                          backgroundColor: isDarkMode ? '#059669' : '#114131',
                        }}
                      >
                        <Text className="text-center text-white">Add Goal</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AddGoalModal;
