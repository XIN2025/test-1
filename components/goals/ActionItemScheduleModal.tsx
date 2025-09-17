import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { X } from 'lucide-react-native';
import { ActionItem } from '@/types/goals';

interface ActionItemScheduleModalProps {
  selectedActionItem: ActionItem | null;
  setSelectedActionItem: (actionItem: ActionItem | null) => void;
}

const ActionItemScheduleModal: React.FC<ActionItemScheduleModalProps> = ({
  selectedActionItem,
  setSelectedActionItem,
}) => {
  const { isDarkMode } = useTheme();

  useEffect(() => {
    console.log('Selected Action Item:', JSON.stringify(selectedActionItem, null, 2));
  }, [selectedActionItem]);

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <View
        style={{
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          borderRadius: 16,
          padding: 0,
          margin: 16,
          width: '90%',
          maxWidth: 420,
          maxHeight: '85%',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDarkMode ? 0.4 : 0.2,
          shadowRadius: 8,
          elevation: 8,
          overflow: 'hidden',
        }}
      >
        {/* Fixed Header - Non-scrollable */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: isDarkMode ? '#374151' : '#e5e7eb',
          }}
        >
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '600',
                color: isDarkMode ? '#f3f4f6' : '#1f2937',
                lineHeight: 24,
              }}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {selectedActionItem?.title}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setSelectedActionItem(null)}
            style={{
              padding: 8,
              borderRadius: 8,
              backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
            }}
            activeOpacity={0.7}
          >
            <X size={20} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content Area */}
        <ScrollView
          style={{ maxHeight: 400 }}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Description Section - Collapsible for long content */}
          {selectedActionItem?.description && (
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontWeight: '500',
                  color: isDarkMode ? '#f3f4f6' : '#1f2937',
                  marginBottom: 8,
                  fontSize: 16,
                }}
              >
                Description
              </Text>
              <Text
                style={{
                  color: isDarkMode ? '#d1d5db' : '#6b7280',
                  fontSize: 14,
                  lineHeight: 20,
                }}
                numberOfLines={4}
                ellipsizeMode="tail"
              >
                {selectedActionItem?.description}
              </Text>
            </View>
          )}

          {/* Weekly Schedule Section - Main focus */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontWeight: '600',
                color: isDarkMode ? '#f3f4f6' : '#1f2937',
                marginBottom: 16,
                fontSize: 18,
              }}
            >
              Weekly Schedule
            </Text>

            {Object.entries(selectedActionItem?.weekly_schedule || {}).map(([day, schedule]: [string, any]) =>
              schedule ? (
                <View key={day} style={{ marginBottom: 16 }}>
                  <View
                    style={{
                      backgroundColor: isDarkMode ? '#065f46' : '#d1fae5',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: '600',
                        color: isDarkMode ? '#34d399' : '#059669',
                        fontSize: 15,
                        textAlign: 'center',
                      }}
                    >
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </Text>
                  </View>

                  <View
                    style={{
                      backgroundColor: isDarkMode ? '#374151' : '#f9fafb',
                      padding: 16,
                      borderRadius: 12,
                      marginBottom: 8,
                      borderLeftWidth: 4,
                      borderLeftColor: isDarkMode ? '#34d399' : '#10b981',
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          color: isDarkMode ? '#f3f4f6' : '#1f2937',
                          fontWeight: '600',
                        }}
                      >
                        {schedule.start_time} - {schedule.end_time}
                      </Text>
                    </View>

                    <View
                      style={{
                        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                        padding: 8,
                        borderRadius: 6,
                        marginTop: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: isDarkMode ? '#9ca3af' : '#6b7280',
                          fontStyle: 'italic',
                          lineHeight: 16,
                        }}
                      >
                        💡 {schedule.notes}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : null,
            )}
          </View>
        </ScrollView>

        {/* Fixed Footer - Non-scrollable */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingVertical: 16,
            borderTopWidth: 1,
            borderTopColor: isDarkMode ? '#374151' : '#e5e7eb',
            backgroundColor: isDarkMode ? '#111827' : '#f9fafb',
          }}
        >
          <TouchableOpacity
            onPress={() => setSelectedActionItem(null)}
            style={{
              backgroundColor: '#10b981',
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: 'center',
            }}
            activeOpacity={0.8}
          >
            <Text
              style={{
                color: '#ffffff',
                fontWeight: '600',
                fontSize: 16,
              }}
            >
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default ActionItemScheduleModal;
