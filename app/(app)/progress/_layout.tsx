/**
 * Progress Stack Layout
 * 
 * Handles navigation for progress detail screens:
 * - /progress/analytics - Overview with all lifts + volume
 * - /progress/[exercise] - Per-exercise detail screen
 */

import { Stack } from "expo-router";
import { useTheme } from "@/src/context/ThemeContext";

export default function ProgressLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.bg,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontFamily: "Inter_600SemiBold",
          fontSize: 17,
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.bg,
        },
      }}
    >
      <Stack.Screen
        name="analytics"
        options={{
          title: "Analytics",
        }}
      />
      <Stack.Screen
        name="[exercise]"
        options={{
          title: "", // Will be set dynamically
        }}
      />
    </Stack>
  );
}
