/**
 * Onboarding Stack Layout
 * Defines the onboarding route group for Expo Router
 */

import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false, 
        gestureEnabled: false,
        animation: "fade",
      }}
    >
      <Stack.Screen name="start" />
      <Stack.Screen name="editorial" />
    </Stack>
  );
}
