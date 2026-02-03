/**
 * Progress Index
 * Redirects to progress tab (prevents navigation issues on swipe back)
 */

import { Redirect } from "expo-router";

export default function ProgressIndex() {
  return <Redirect href="/(app)/(tabs)/progress" />;
}
