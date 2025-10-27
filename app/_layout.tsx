import { Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { GoalsProvider } from '../context/GoalsContext';
import { useFonts } from '../hooks/useFonts';
import './global.css';
import { HeadlessBackgroundSync } from '../components/HeadlessBackgroundSync';
import { IOSHealthDataSync } from '../components/IOSHealthDataSync';
import { KeyboardProvider } from 'react-native-keyboard-controller';

export default function RootLayout() {
  const fontsLoaded = useFonts();

  if (!fontsLoaded) {
    return (
      <ThemeProvider>
        <AuthProvider>
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#059669', fontSize: 18 }}>Loading...</Text>
          </View>
        </AuthProvider>
      </ThemeProvider>
    );
  }

  return (
    <KeyboardProvider>
      <ThemeProvider>
        <AuthProvider>
          <GoalsProvider>
            <>
              <HeadlessBackgroundSync />
              <IOSHealthDataSync />
              <Stack screenOptions={{ headerShown: false }} />
            </>
          </GoalsProvider>
        </AuthProvider>
      </ThemeProvider>
    </KeyboardProvider>
  );
}
