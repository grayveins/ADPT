import { Stack } from "expo-router";

import { OnboardingProvider } from "@/src/context/OnboardingContext";

export default function RootLayout() {
  return (
    <OnboardingProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </OnboardingProvider>
  );
}
