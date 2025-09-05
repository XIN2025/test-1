import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { getInitials } from '../utils/string';

interface UserAvatarProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  imageUrl?: string;
  userName?: string;
  userEmail?: string;
  onPress?: () => void;
  showBorder?: boolean;
  customStyle?: any;
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  size = 'medium',
  imageUrl,
  userName,
  userEmail,
  onPress,
  showBorder = false,
  customStyle,
  className,
}) => {
  const { userName: contextUserName, userEmail: contextUserEmail } = useUser();
  const { isDarkMode } = useTheme();

  // Use props first, then context values
  const displayName = userName || contextUserName || '';
  const displayEmail = userEmail || contextUserEmail || '';
  const displayText = displayName || displayEmail;

  // Size configurations
  const sizeConfig = {
    small: { container: 32, text: 12 },
    medium: { container: 40, text: 14 },
    large: { container: 56, text: 18 },
    xlarge: { container: 80, text: 24 },
  };

  const { container: containerSize, text: textSize } = sizeConfig[size];

  // Generate initials and background color
  const initials = getInitials(displayText);

  const containerStyle = {
    width: containerSize,
    height: containerSize,
    borderRadius: containerSize / 2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: showBorder ? 2 : 0,
    borderColor: isDarkMode ? '#374151' : '#E5E7EB',
    overflow: 'hidden' as const,
    ...customStyle,
  };

  // Text styles
  const textStyle = {
    fontSize: textSize,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    textAlign: 'center' as const,
  };

  const renderContent = () => {
    if (imageUrl) {
      return (
        <Image
          source={{ uri: imageUrl }}
          style={{
            width: containerSize,
            height: containerSize,
            borderRadius: containerSize / 2,
          }}
          resizeMode="cover"
        />
      );
    }

    return <Text style={textStyle}>{initials}</Text>;
  };

  if (onPress) {
    return (
      <TouchableOpacity className={className} style={containerStyle} onPress={onPress} activeOpacity={0.7}>
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return (
    <View className={className} style={containerStyle}>
      {renderContent()}
    </View>
  );
};

export default UserAvatar;
