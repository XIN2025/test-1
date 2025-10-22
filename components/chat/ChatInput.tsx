import React, { useRef, useEffect } from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import { Mic, Send } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useRawAudioTranscription } from '../../hooks/useRawAudioTranscription';

interface ChatInputProps {
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  onSendMessage: (text: string) => void;
  isTyping: boolean;
}

export default function ChatInput({ inputText, setInputText, onSendMessage, isTyping }: ChatInputProps) {
  const { isDarkMode } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [interimText, setInterimText] = React.useState('');

  const handleTranscript = (text: string, isFinal: boolean) => {
    if (isFinal) {
      setInputText((prev) => (prev ? prev + ' ' + text : text));
      setInterimText('');
    } else {
      setInterimText(text);
    }
  };

  const { isRecording, startTranscription, stopTranscription } = useRawAudioTranscription(handleTranscript);

  const handleMicPress = () => {
    if (isRecording) {
      stopTranscription();
    } else {
      startTranscription();
    }
  };

  const handleSendMessage = () => {
    if (isRecording) {
      stopTranscription();
    }
    onSendMessage(inputText);
  };

  useEffect(() => {
    return () => {
      if (isRecording) {
        stopTranscription();
      }
    };
  }, [isRecording, stopTranscription]);

  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: isDarkMode ? '#374151' : '#e5e7eb',
        backgroundColor: isDarkMode ? '#111827' : '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 8,
      }}
    >
      <View style={{ minHeight: 48, flexDirection: 'row', gap: 16 }}>
        <TextInput
          ref={inputRef}
          value={inputText + (interimText ? ` ${interimText}` : '')}
          onChangeText={(text) => {
            if (!isRecording) {
              setInputText(text);
            }
          }}
          placeholder={isRecording ? 'Listening...' : 'Ask me about health...'}
          style={{
            flex: 1,
            fontSize: 16,
            color: isDarkMode ? '#F3F4F6' : '#1F2937',
            padding: 10,
            borderRadius: 8,
            backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb',
            borderWidth: 1,
            borderColor: isRecording ? '#ef4444' : isDarkMode ? '#374151' : '#d1d5db',
          }}
          placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
          multiline
          editable={!isRecording}
        />
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <TouchableOpacity
            onPress={handleMicPress}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isRecording ? '#ef4444' : isDarkMode ? '#374151' : '#f3f4f6',
            }}
            activeOpacity={0.7}
          >
            <Mic size={20} color={isRecording ? '#ffffff' : isDarkMode ? '#9ca3af' : '#6b7280'} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isTyping || isRecording}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor:
                inputText.trim() && !isTyping && !isRecording ? '#10b981' : isDarkMode ? '#374151' : '#d1d5db',
            }}
            activeOpacity={0.7}
          >
            <Send size={20} color={inputText.trim() && !isTyping && !isRecording ? '#fff' : '#9ca3af'} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
