/**
 * Workout Stack Layout
 * Stack navigator for workout-related screens
 */

import { Stack } from "expo-router";
import { useTheme } from "@/src/context/ThemeContext";

export default function WorkoutLayout() {
  const { colors } = useTheme();
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="active" />
      <Stack.Screen name="history" />
      <Stack.Screen name="exercises" />
      <Stack.Screen name="programs" />
      <Stack.Screen name="generate" />
    </Stack>
  );
}
