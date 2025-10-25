import React, { useEffect, useRef, useState } from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import { LucideIcon, Mic, SendHorizontal } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { shadow } from '@/utils/commonStyles';
import { useRawAudioTranscription } from '../../hooks/useRawAudioTranscription';

interface ChatInputProps {
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  onSendMessage: (text: string) => void;
}

const ActionButton = ({
  isDarkMode,
  onPress,
  icon,
  disabled = false,
  highlighted = false,
}: {
  isDarkMode: boolean;
  onPress: () => void;
  icon: LucideIcon;
  disabled?: boolean;
  highlighted?: boolean;
}) => {
  const Icon = icon;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: 44,
        height: 44,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: highlighted ? '#059669' : isDarkMode ? '#1f2937' : '#f9fafb',
        ...shadow.card,
      }}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <Icon size={20} color={highlighted ? '#fff' : isDarkMode ? '#9ca3af' : '#6b7280'} opacity={disabled ? 0.5 : 1} />
    </TouchableOpacity>
  );
};

export default function ChatInput({ inputText, setInputText, onSendMessage }: ChatInputProps) {
  const { isDarkMode } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [interimText, setInterimText] = useState('');

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
    if (inputText.trim()) {
      onSendMessage(inputText);
    }
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
        value={inputText + (interimText ? ` ${interimText}` : '')}
        onChangeText={(text) => {
          if (!isRecording) {
            setInputText(text);
          }
        }}
        placeholder={isRecording ? 'Listening...' : 'Ask me about health...'}
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
          flex: 1,
          textAlignVertical: 'center',
        }}
        placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
        multiline
        maxLength={500}
        returnKeyType="default"
        enablesReturnKeyAutomatically={false}
        editable={!isRecording}
        autoCorrect={true}
        autoCapitalize="sentences"
        spellCheck={false}
        textContentType="none"
        keyboardType="default"
        blurOnSubmit={false}
      />
      <ActionButton isDarkMode={isDarkMode} onPress={handleMicPress} icon={Mic} highlighted={isRecording} />
      <ActionButton
        isDarkMode={isDarkMode}
        onPress={handleSendMessage}
        icon={SendHorizontal}
        disabled={!inputText.trim() || isRecording}
      />
    </View>
  );
}
