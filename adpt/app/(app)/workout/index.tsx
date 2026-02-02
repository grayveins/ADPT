/**
 * Workout Index
 * Redirects to active workout screen with params
 */

import { Redirect, useLocalSearchParams } from "expo-router";

export default function WorkoutIndex() {
  const params = useLocalSearchParams();
  
  return (
    <Redirect 
      href={{
        pathname: "/(app)/workout/active",
        params,
      }} 
    />
  );
}
