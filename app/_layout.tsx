import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { ThemeProvider } from "@/src/context/ThemeContext";
import { OnboardingProvider } from "@/src/context/OnboardingContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <OnboardingProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </OnboardingProvider>
    </ThemeProvider>
  );
}
