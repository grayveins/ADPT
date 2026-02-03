/**
 * Workout Index
 * Redirects to workout tab (prevents navigation issues on swipe back)
 */

import { Redirect } from "expo-router";

export default function WorkoutIndex() {
  return <Redirect href="/(app)/(tabs)/workout" />;
}
