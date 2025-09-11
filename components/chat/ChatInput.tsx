import React, { useRef } from 'react';
import { TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { Mic, Send } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  onSendMessage: (text: string) => void;
  isTyping: boolean;
  dismissKeyboard: () => void;
}

export default function ChatInput({
  inputText,
  setInputText,
  onSendMessage,
  isTyping,
  dismissKeyboard,
}: ChatInputProps) {
  const { isDarkMode } = useTheme();
  const inputRef = useRef<TextInput>(null);

  return (
    <TouchableWithoutFeedback>
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: isDarkMode ? '#374151' : '#e5e7eb',
          backgroundColor: isDarkMode ? '#111827' : '#ffffff',
          paddingHorizontal: 16,
          paddingVertical: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDarkMode ? 0.3 : 0.1,
          shadowRadius: 4,
          display: 'flex',

          // elevation: 5,
        }}
      >
        <View
          style={{
            minHeight: 48,
          }}
          className="flex flex-row gap-4"
        >
          {/* Text Input */}
          <TextInput
            ref={inputRef}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask me about health..."
            style={{
              fontSize: 16,
              color: isDarkMode ? '#F3F4F6' : '#1F2937',
              textAlignVertical: 'top',
              padding: 10,
              minHeight: 32,
              maxHeight: 88,
              borderRadius: 8,
              backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb',
              borderWidth: 1,
              borderColor: isDarkMode ? '#374151' : '#d1d5db',
              justifyContent: 'center',
              flex: 1,
              alignItems: 'center',
              textAlign: 'left',
            }}
            placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
            multiline
            maxLength={500}
            scrollEnabled={false}
            blurOnSubmit={false}
            returnKeyType="default"
            enablesReturnKeyAutomatically={false}
          />
          <View className="flex flex-row gap-1">
            {/* Microphone Button */}
            <TouchableOpacity
              onPress={() => {
                // Placeholder for future voice recording functionality
                console.log('Microphone pressed');
              }}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              }}
              activeOpacity={0.7}
            >
              <Mic size={20} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
            </TouchableOpacity>

            {/* Send Button */}
            <TouchableOpacity
              onPress={() => onSendMessage(inputText)}
              disabled={!inputText.trim() || isTyping}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: inputText.trim() && !isTyping ? '#10b981' : isDarkMode ? '#374151' : '#d1d5db',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              }}
              activeOpacity={0.7}
            >
              <Send size={20} color={inputText.trim() && !isTyping ? '#fff' : '#9ca3af'} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
