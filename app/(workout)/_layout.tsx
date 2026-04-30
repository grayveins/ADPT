/**
 * Workout Modal Stack Layout
 * Full-screen modal stack for workout flow (separate from main app tabs)
 */

import { Stack, router } from "expo-router";
import { useTheme } from "@/src/context/ThemeContext";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";

export default function WorkoutModalLayout() {
  const { colors } = useTheme();

  return (
    <ErrorBoundary label="Workout" onReset={() => router.back()}>
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="preview" />
      <Stack.Screen name="active" />
      <Stack.Screen name="history" />
      <Stack.Screen name="exercises" />
      <Stack.Screen name="programs" />
      <Stack.Screen name="generate" />
      <Stack.Screen name="templates" />
    </Stack>
    </ErrorBoundary>
  );
}
