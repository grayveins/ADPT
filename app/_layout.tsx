import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { ThemeProvider } from "@/src/context/ThemeContext";
import { OnboardingProvider } from "@/src/context/OnboardingContext";
import { SubscriptionProvider } from "@/src/context/SubscriptionContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SubscriptionProvider>
        <OnboardingProvider>
          <KeyboardProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
          {/* Auth screens - disable swipe-back to prevent returning to authenticated screens after logout */}
          <Stack.Screen name="index" options={{ gestureEnabled: false }} />
          <Stack.Screen name="welcome" options={{ gestureEnabled: false }} />
          <Stack.Screen name="sign-in" options={{ gestureEnabled: false }} />
          <Stack.Screen name="sign-up" options={{ gestureEnabled: false }} />
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
              fullScreenGestureEnabled: false,
            }}
          />

          {/* Workout modal stack - full screen modal for workout flow */}
          <Stack.Screen
            name="(workout)"
            options={{
              presentation: "modal",
              animation: "slide_from_bottom",
              gestureEnabled: true,
            }}
          />
        </Stack>
          </KeyboardProvider>
        </OnboardingProvider>
      </SubscriptionProvider>
    </ThemeProvider>
  );
}
