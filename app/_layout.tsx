import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { ThemeProvider } from "@/src/context/ThemeContext";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";

export default function RootLayout() {
  return (
    <ErrorBoundary label="App">
    <ThemeProvider>
      <KeyboardProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ gestureEnabled: false }} />
        <Stack.Screen name="welcome" options={{ gestureEnabled: false }} />
        <Stack.Screen name="sign-in" options={{ gestureEnabled: false }} />
        <Stack.Screen name="sign-up" options={{ gestureEnabled: false }} />
        <Stack.Screen name="settings" />

        <Stack.Screen
          name="(app)"
          options={{ gestureEnabled: false, animation: "fade" }}
        />

        <Stack.Screen
          name="onboarding"
          options={{ gestureEnabled: false, fullScreenGestureEnabled: false }}
        />

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
    </ThemeProvider>
    </ErrorBoundary>
  );
}
