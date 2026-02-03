import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { ThemeProvider } from "@/src/context/ThemeContext";
import { OnboardingProvider } from "@/src/context/OnboardingContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <OnboardingProvider>
        <KeyboardProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
          {/* Auth screens - allow normal navigation */}
          <Stack.Screen name="index" />
          <Stack.Screen name="welcome" />
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="sign-up" />
          <Stack.Screen name="settings" />
          
          {/* Authenticated app - disable swipe back to prevent returning to welcome */}
          <Stack.Screen 
            name="(app)" 
            options={{ 
              gestureEnabled: false,
              animation: "fade",
            }} 
          />
          
          {/* Onboarding - disable swipe back */}
          <Stack.Screen 
            name="onboarding" 
            options={{ 
              gestureEnabled: false,
            }} 
          />
        </Stack>
        </KeyboardProvider>
      </OnboardingProvider>
    </ThemeProvider>
  );
}
