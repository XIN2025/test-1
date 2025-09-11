import { useTheme } from '@/context/ThemeContext';
import { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';

interface DeleteFileButtonProps {
  onDelete: () => Promise<void>;
}

const DeleteFileButton: React.FC<DeleteFileButtonProps> = ({ onDelete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { isDarkMode } = useTheme();

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDelete();
      // Don't set isLoading to false - stays in loading state forever as requested
    } catch {
      setIsLoading(false); // Only reset on error
    }
  };

  return (
    <TouchableOpacity
      onPress={handleDelete}
      disabled={isLoading}
      className={`rounded px-2 py-1 ${
        isLoading ? (isDarkMode ? 'bg-gray-700' : 'bg-gray-100') : isDarkMode ? 'bg-red-900/50' : 'bg-red-100'
      }`}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={isDarkMode ? '#f87171' : '#dc2626'} />
      ) : (
        <Text className={`text-[10px] font-semibold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>Delete</Text>
      )}
    </TouchableOpacity>
  );
};

export default DeleteFileButton;
