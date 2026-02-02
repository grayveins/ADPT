/**
 * Workout Stack Layout
 * Stack navigator for workout-related screens
 */

import { Stack } from "expo-router";
import { darkColors } from "@/src/theme";

export default function WorkoutLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: darkColors.bg },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="active" />
    </Stack>
  );
}
