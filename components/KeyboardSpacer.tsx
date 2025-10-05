import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { Platform, View, Keyboard, Dimensions } from 'react-native';

interface KeyboardSpacerProps {
  topSpacing?: number;
  onToggle?: (isVisible: boolean, keyboardHeight: number) => void;
}

const KeyboardSpacer: React.FC<KeyboardSpacerProps> = ({ topSpacing = 0, onToggle }) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onKeyboardShow = (event: any) => {
      const { height } = event.endCoordinates;
      const screenHeight = Dimensions.get('window').height;

      let adjustedHeight = height;

      if (Platform.OS === 'ios') {
        adjustedHeight = height - insets.bottom;
      }

      adjustedHeight = Math.max(0, Math.min(adjustedHeight, screenHeight * 0.5));

      setKeyboardHeight(adjustedHeight);
      setIsKeyboardVisible(true);
      onToggle?.(true, adjustedHeight);
    };

    const onKeyboardHide = () => {
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
      onToggle?.(false, 0);
    };

    const showSubscription = Keyboard.addListener(showEvent, onKeyboardShow);
    const hideSubscription = Keyboard.addListener(hideEvent, onKeyboardHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [insets.bottom, onToggle]);

  if (!isKeyboardVisible || keyboardHeight === 0) {
    return null;
  }

  return (
    <View
      style={{
        height: keyboardHeight + topSpacing,
        backgroundColor: 'transparent',
      }}
    />
  );
};

export default KeyboardSpacer;
