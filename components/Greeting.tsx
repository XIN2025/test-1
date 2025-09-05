import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface GreetingProps {
  name: string;
}

const Greeting = ({ name }: GreetingProps) => {
  const { isDarkMode } = useTheme();
  return (
    <Text className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
      Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {name}!
    </Text>
  );
};

export default Greeting;
