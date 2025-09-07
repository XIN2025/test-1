import { Stack } from 'expo-router';

export default function LabTestsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[testId]" />
    </Stack>
  );
}
