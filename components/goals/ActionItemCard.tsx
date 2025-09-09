import { useTheme } from '@/context/ThemeContext';
import { ActionItem } from '@/types/goals';
import { TouchableOpacity, View, Text } from 'react-native';

interface ActionItemCardProps {
  item: ActionItem;
  onPress: () => void;
}

const ActionItemCard: React.FC<ActionItemCardProps> = ({ item, onPress }) => {
  const { isDarkMode } = useTheme();
  const scheduledDays = Object.entries(item.weekly_schedule || {})
    .filter(
      ([key, value]: [string, any]) =>
        ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(key) &&
        value &&
        value.time_slots &&
        value.time_slots.length > 0,
    )
    .map(([day]) => day);

  return (
    <TouchableOpacity className="mt-3" onPress={onPress}>
      <View className={`rounded-lg p-4 shadow ${isDarkMode ? 'border border-gray-700 bg-gray-800' : 'bg-white'}`}>
        <Text className={`mb-1 text-base font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
          {item.title}
        </Text>
        <Text className={`mb-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{item.description}</Text>
        {scheduledDays.length > 0 && (
          <View className="mt-1 flex-row flex-wrap">
            {scheduledDays.map((day) => (
              <View key={day} className={`mb-1 mr-1 rounded px-2 py-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <Text className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default ActionItemCard;
