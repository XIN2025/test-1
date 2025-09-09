import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { X } from 'lucide-react-native';
import { PillarType, TimePreference } from '@/types/preferences';

interface PreferencesModalProps {
  showPreferencesModal: boolean;
  setShowPreferencesModal: (show: boolean) => void;
  isDarkMode: boolean;
  preferencesLoading: boolean;
  timePreferences: Record<string, TimePreference>;
  updatePrefField: (pillar: PillarType, field: keyof TimePreference, value: any) => void;
  toggleDay: (pillar: PillarType, day: number) => void;
  savePreferences: () => void;
}

const PreferencesModal: React.FC<PreferencesModalProps> = ({
  showPreferencesModal,
  setShowPreferencesModal,
  isDarkMode,
  preferencesLoading,
  timePreferences,
  updatePrefField,
  toggleDay,
  savePreferences,
}) => {
  return (
    <Modal
      visible={showPreferencesModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowPreferencesModal(false)}
    >
      <View
        style={{
          flex: 1,
          paddingHorizontal: 16,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View
          className={`mx-4 w-full max-w-md rounded-xl p-5 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}
          style={{ elevation: 20 }}
        >
          <View className="mb-4 flex-row items-center justify-between">
            <Text className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              Weekly Preferences
            </Text>
            <TouchableOpacity onPress={() => setShowPreferencesModal(false)} className="p-1">
              <X size={20} color={isDarkMode ? '#d1d5db' : '#6b7280'} />
            </TouchableOpacity>
          </View>

          {preferencesLoading ? (
            <View className="items-center py-6">
              <ActivityIndicator color={isDarkMode ? '#34d399' : '#059669'} />
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 420 }}>
              {Object.values(PillarType).map((pillar) => (
                <View
                  key={pillar}
                  className={`mb-4 rounded-lg border p-3 ${
                    isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <Text className={`mb-2 font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                    {pillar}
                  </Text>
                  <View className="mb-2 flex-row">
                    <View className="mr-2 flex-1">
                      <Text className={`mb-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Preferred Time (HH:mm)
                      </Text>
                      <TextInput
                        className={`rounded border px-2 py-1 ${
                          isDarkMode
                            ? 'border-gray-700 bg-gray-900 text-gray-100'
                            : 'border-gray-300 bg-white text-gray-800'
                        }`}
                        value={timePreferences[pillar]?.preferred_time || ''}
                        onChangeText={(t) => updatePrefField(pillar, 'preferred_time', t)}
                        placeholder="07:00"
                        placeholderTextColor={isDarkMode ? '#9ca3af' : undefined}
                      />
                    </View>
                    <View className="w-28">
                      <Text className={`mb-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Duration (min)
                      </Text>
                      <TextInput
                        className={`rounded border px-2 py-1 ${
                          isDarkMode
                            ? 'border-gray-700 bg-gray-900 text-gray-100'
                            : 'border-gray-300 bg-white text-gray-800'
                        }`}
                        keyboardType="numeric"
                        value={String(timePreferences[pillar]?.duration_minutes ?? 30)}
                        onChangeText={(t) => updatePrefField(pillar, 'duration_minutes', parseInt(t || '0'))}
                        placeholder="30"
                        placeholderTextColor={isDarkMode ? '#9ca3af' : undefined}
                      />
                    </View>
                  </View>

                  <View className="mb-2 flex-row">
                    <View className="w-40">
                      <Text className={`mb-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Reminder (min)
                      </Text>
                      <TextInput
                        className={`rounded border px-2 py-1 ${
                          isDarkMode
                            ? 'border-gray-700 bg-gray-900 text-gray-100'
                            : 'border-gray-300 bg-white text-gray-800'
                        }`}
                        keyboardType="numeric"
                        value={String(timePreferences[pillar]?.reminder_before_minutes ?? 10)}
                        onChangeText={(t) => updatePrefField(pillar, 'reminder_before_minutes', parseInt(t || '0'))}
                        placeholder="10"
                        placeholderTextColor={isDarkMode ? '#9ca3af' : undefined}
                      />
                    </View>
                  </View>

                  <Text className={`mb-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Days of Week</Text>
                  <View className="flex-row">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, idx) => {
                      const active = (timePreferences[pillar]?.days_of_week || []).includes(idx);
                      return (
                        <TouchableOpacity
                          key={`${pillar}-${idx}`}
                          onPress={() => toggleDay(pillar, idx)}
                          className={`mr-2 rounded px-2 py-1 ${
                            active
                              ? isDarkMode
                                ? 'bg-emerald-700'
                                : 'bg-emerald-600'
                              : isDarkMode
                                ? 'bg-gray-700'
                                : 'bg-gray-200'
                          }`}
                        >
                          <Text
                            className={`text-xs ${
                              active ? 'text-white' : isDarkMode ? 'text-gray-200' : 'text-gray-700'
                            }`}
                          >
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          <View className="mt-3 flex-row justify-end">
            <TouchableOpacity
              onPress={() => setShowPreferencesModal(false)}
              className={`rounded-lg px-4 py-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} mr-2`}
            >
              <Text className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={preferencesLoading}
              onPress={savePreferences}
              className={`rounded-lg px-4 py-2 ${
                preferencesLoading
                  ? isDarkMode
                    ? 'bg-emerald-900'
                    : 'bg-emerald-300'
                  : isDarkMode
                    ? 'bg-emerald-700'
                    : 'bg-emerald-600'
              }`}
            >
              <Text className="text-sm font-medium text-white">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PreferencesModal;
