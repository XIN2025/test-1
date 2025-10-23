import React, { useRef } from 'react';
import { TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { Mic, Send, SendHorizontal } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { shadow } from '@/utils/commonStyles';

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  onSendMessage: (text: string) => void;
}

export default function ChatInput({ inputText, setInputText, onSendMessage }: ChatInputProps) {
  const { isDarkMode } = useTheme();
  const inputRef = useRef<TextInput>(null);

  return (
    <View
      className="flex flex-row items-end gap-3"
      style={{
        borderTopWidth: 1,
        borderTopColor: isDarkMode ? '#374151' : '#e5e7eb',
        backgroundColor: isDarkMode ? '#111827' : '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 8,
        ...shadow.card,
      }}
    >
      <TextInput
        ref={inputRef}
        value={inputText}
        onChangeText={setInputText}
        placeholder="Ask me about health..."
        style={{
          fontSize: 14,
          color: isDarkMode ? '#F3F4F6' : '#1F2937',
          paddingVertical: 8,
          paddingHorizontal: 18,
          maxHeight: 88,
          borderRadius: 24,
          backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb',
          borderWidth: 0,
          ...shadow.card,
          justifyContent: 'center',
          flex: 1,
          alignItems: 'center',
          textAlign: 'left',
        }}
        placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
        multiline
        maxLength={500}
        scrollEnabled={false}
        returnKeyType="default"
        enablesReturnKeyAutomatically={false}
      />
      <TouchableOpacity
        onPress={() => {
          if (inputText.trim()) {
            onSendMessage(inputText);
          } else {
            console.log('Microphone pressed');
          }
        }}
        style={{
          width: 44,
          height: 44,
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb',
          ...shadow.card,
        }}
        activeOpacity={0.7}
      >
        {inputText.trim() ? (
          <SendHorizontal size={20} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
        ) : (
          <Mic size={20} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
        )}
      </TouchableOpacity>
    </View>
  );
}
