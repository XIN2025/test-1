import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useGoals } from '@/hooks/useGoals';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View, ActivityIndicator, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';

// Helper to format time into HH:MM
const formatTimeHM = (t?: string): string => {
  if (!t) return '';
  const parts = `${t}`.trim().split(':');
  if (parts.length >= 2) {
    const hh = (parts[0] ?? '0').padStart(2, '0');
    const mm = (parts[1] ?? '0').padStart(2, '0');
    return `${hh}:${mm}`;
  }
  const h = parts[0];
  if (h && /^\d{1,2}$/.test(h)) return `${h.padStart(2, '0')}:00`;
  return t;
};

// Color scheme
const getColors = (isDarkMode: boolean) => ({
  checkboxBorderCompleted: isDarkMode ? '#10b981' : '#059669',
  checkboxBackgroundCompleted: isDarkMode ? '#10b981' : '#059669',
  checkboxBorderUncompleted: isDarkMode ? '#4b5563' : '#d1d5db',
  titleCompleted: isDarkMode ? '#6b7280' : '#6b7280',
  goalTitle: isDarkMode ? '#9ca3af' : '#6b7280',
  timeText: isDarkMode ? '#9ca3af' : '#6b7280',
  emptyText: isDarkMode ? '#9ca3af' : '#6b7280',
  titleUncompleted: isDarkMode ? '#f3f4f6' : '#1f2937',
  headerText: isDarkMode ? '#f3f4f6' : '#1f2937',
  buttonBackground: isDarkMode ? '#064e3b' : '#e6f4f1',
  buttonText: isDarkMode ? '#34d399' : '#114131',
});

// Styles
const styles = StyleSheet.create({
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  checkboxContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
  },
  goalTitle: {
    fontSize: 12,
    marginTop: 2,
  },
  timeContainer: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
  },
  showMoreButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
    borderRadius: 20,
  },
  showMoreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activityIndicator: {
    transform: [{ scale: 0.45 }],
  },
});

const Checkbox = ({
  item,
  togglePending,
  onTogglePress,
}: {
  item: {
    id: string;
    title: string;
    goalTitle: string;
    start_time: string;
    end_time: string;
    completed: boolean;
  };
  togglePending: boolean;
  onTogglePress: () => void;
}) => {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);

  return (
    <TouchableOpacity
      key={item.id}
      style={styles.checkboxContainer}
      onPress={onTogglePress}
      activeOpacity={0.5}
      disabled={togglePending}
    >
      <View style={styles.checkboxContent}>
        <View
          style={[
            styles.checkbox,
            {
              borderColor:
                togglePending || item.completed ? colors.checkboxBorderCompleted : colors.checkboxBorderUncompleted,
              backgroundColor: togglePending || item.completed ? colors.checkboxBackgroundCompleted : 'transparent',
            },
          ]}
        >
          {!togglePending && item.completed && <Check size={16} strokeWidth={2.5} color="white" />}
          {togglePending && <ActivityIndicator size="large" color="white" style={styles.activityIndicator} />}
          {/* {togglePending && <LoaderCircle size={16} strokeWidth={2.5} color="white" />} */}
        </View>
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.title,
              {
                color: item.completed ? colors.titleCompleted : colors.titleUncompleted,
                textDecorationLine: item.completed ? 'line-through' : 'none',
              },
            ]}
          >
            {item.title}
          </Text>
          {item.goalTitle && (
            <Text
              style={[
                styles.goalTitle,
                {
                  color: colors.goalTitle,
                },
              ]}
            >
              {item.goalTitle}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.timeContainer}>
        <Text
          style={[
            styles.timeText,
            {
              color: colors.timeText,
            },
          ]}
        >
          {item.start_time && item.end_time
            ? `${formatTimeHM(item.start_time)} - ${formatTimeHM(item.end_time)}`
            : formatTimeHM(item.start_time) || formatTimeHM(item.end_time) || ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function TodaysActionItems() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const userEmail = user?.email || '';
  const { todaysItems, markCompletion } = useGoals({ userEmail });
  const [togglePendingItemIds, setTogglePendingItemIds] = useState<string[]>([]);
  const [showAllTodayItems, setShowAllTodayItems] = useState(false);

  const colors = getColors(isDarkMode);

  const toggleItemCompleted = async (id: string) => {
    const actionItem = todaysItems.find((item: any) => item.id === id);
    if (!actionItem) {
      console.error('Action item not found:', id);
      return;
    }
    setTogglePendingItemIds((prev) => [...(prev || []), id]);
    try {
      const ok = await markCompletion(id, !actionItem.completed);
      if (ok) actionItem.completed = !actionItem.completed;
    } catch (error) {
      console.error('Failed to mark completion:', error);
    } finally {
      setTogglePendingItemIds((prev) => prev?.filter((item) => item !== id));
    }
  };

  return (
    <View className="flex-col gap-2">
      <Text
        style={[
          styles.headerText,
          {
            color: colors.headerText,
          },
        ]}
      >
        Today&apos;s Action Items
      </Text>
      {todaysItems.length === 0 ? (
        <Text
          style={[
            styles.emptyText,
            {
              color: colors.emptyText,
            },
          ]}
        >
          No scheduled items for today.
        </Text>
      ) : (
        (showAllTodayItems ? todaysItems : todaysItems.slice(0, 3)).map((item) => (
          <Checkbox
            key={item.id}
            item={item}
            togglePending={togglePendingItemIds.includes(item.id)}
            onTogglePress={() => toggleItemCompleted(item.id)}
          />
        ))
      )}

      {todaysItems.length > 3 && (
        <TouchableOpacity
          onPress={() => setShowAllTodayItems((v) => !v)}
          style={[
            styles.showMoreButton,
            {
              backgroundColor: colors.buttonBackground,
            },
          ]}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.showMoreText,
              {
                color: colors.buttonText,
              },
            ]}
          >
            {showAllTodayItems ? 'Show less' : `Show all (${todaysItems.length})`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
