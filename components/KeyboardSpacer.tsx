import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef } from 'react';
import { Platform, View, Keyboard, Dimensions } from 'react-native';

interface KeyboardSpacerProps {
  topSpacing?: number;
  onToggle?: (isVisible: boolean, keyboardHeight: number) => void;
}

const KeyboardSpacer: React.FC<KeyboardSpacerProps> = ({ topSpacing = 0, onToggle }) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [shouldShowSpacer, setShouldShowSpacer] = useState(false);
  const insets = useSafeAreaInsets();
  const initialWindowHeight = useRef(Dimensions.get('window').height);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onKeyboardShow = (event: any) => {
      const { height } = event.endCoordinates;
      const currentWindowHeight = Dimensions.get('window').height;
      const screenHeight = Dimensions.get('screen').height;

      let adjustedHeight = height;

      if (Platform.OS === 'ios') {
        adjustedHeight = height - insets.bottom;
      }

      adjustedHeight = Math.max(0, Math.min(adjustedHeight, screenHeight * 0.5));

      const heightDifference = initialWindowHeight.current - currentWindowHeight;
      const isOverlapping = heightDifference < adjustedHeight * 0.7;

      setKeyboardHeight(adjustedHeight);
      setIsKeyboardVisible(true);
      setShouldShowSpacer(isOverlapping);

      onToggle?.(isOverlapping, isOverlapping ? adjustedHeight : 0);
    };

    const onKeyboardHide = () => {
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
      setShouldShowSpacer(false);
      onToggle?.(false, 0);
    };

    const showSubscription = Keyboard.addListener(showEvent, onKeyboardShow);
    const hideSubscription = Keyboard.addListener(hideEvent, onKeyboardHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [insets.bottom, onToggle]);

  if (!isKeyboardVisible || keyboardHeight === 0 || !shouldShowSpacer) {
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
