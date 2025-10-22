import React, { useRef, useEffect } from 'react';
import { TextInput, TouchableOpacity, TouchableWithoutFeedback, View, Text } from 'react-native';
import { Mic, MicOff, Send } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useRealtimeTranscription } from '../../hooks/useRealtimeTranscription';

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
  const { isListening, fullTranscript, startListening, stopListening, resetTranscript } = useRealtimeTranscription();

  // Update input text with real-time transcription
  useEffect(() => {
    if (fullTranscript) {
      setInputText(fullTranscript);
    }
  }, [fullTranscript, setInputText]);

  const handleMicPress = async () => {
    if (isListening) {
      // Stop listening
      await stopListening();
    } else {
      // Clear previous transcript and start listening
      resetTranscript();
      setInputText('');
      await startListening();
    }
  };

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
            {/* Listening Indicator */}
            {isListening && (
              <View
                style={{
                  position: 'absolute',
                  top: -30,
                  right: 60,
                  backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#ef4444',
                  }}
                />
                <Text style={{ color: isDarkMode ? '#f3f4f6' : '#1f2937', fontSize: 12, fontWeight: '600' }}>
                  Listening...
                </Text>
              </View>
            )}

            {/* Microphone Button */}
            <TouchableOpacity
              onPress={handleMicPress}
              disabled={isTyping}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isListening ? '#ef4444' : isDarkMode ? '#374151' : '#f3f4f6',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
                opacity: isTyping ? 0.5 : 1,
              }}
              activeOpacity={0.7}
            >
              {isListening ? (
                <MicOff size={20} color="#ffffff" />
              ) : (
                <Mic size={20} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
              )}
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
