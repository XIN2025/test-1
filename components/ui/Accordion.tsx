import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  isExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  isDarkMode?: boolean;
}

export function Accordion({ title, children, isExpanded = false, onToggle, isDarkMode = false }: AccordionProps) {
  const [expanded, setExpanded] = useState(isExpanded);
  const [animation] = useState(new Animated.Value(isExpanded ? 1 : 0));

  const toggleExpanded = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    onToggle?.(newExpanded);

    Animated.timing(animation, {
      toValue: newExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const maxHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1000],
  });

  const iconRotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <View
      style={{
        borderRadius: 12,
        backgroundColor: isDarkMode ? '#374151' : '#f9fafb',
        overflow: 'hidden',
      }}
    >
      <TouchableOpacity
        onPress={toggleExpanded}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 16,
          backgroundColor: isDarkMode ? '#4b5563' : '#ffffff',
        }}
        activeOpacity={0.7}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: isDarkMode ? '#f3f4f6' : '#1f2937',
            flex: 1,
          }}
        >
          {title}
        </Text>
        <Animated.View
          style={{
            transform: [{ rotate: iconRotation }],
          }}
        >
          <ChevronRight size={20} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View
        style={{
          maxHeight,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            padding: 16,
            paddingTop: 0,
            backgroundColor: isDarkMode ? '#374151' : '#f9fafb',
          }}
        >
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

export default Accordion;
