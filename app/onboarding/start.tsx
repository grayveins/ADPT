import { Redirect } from "expo-router";

export default function OnboardingStart() {
  return <Redirect href={"/onboarding/editorial" as any} />;
}
