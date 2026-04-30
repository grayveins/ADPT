/**
 * useTodaysWorkout
 * Uses the smart scheduler to determine what the user should do today.
 * Single source of truth for "what's today's workout?"
 */

import { useState, useEffect, useCallback } from "react";
import { scheduleTodaysWorkout, type TodaysWorkout } from "@/lib/workout/scheduler";

export type { TodaysWorkout };

export function useTodaysWorkout(userId: string | null) {
  const [workout, setWorkout] = useState<TodaysWorkout | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await scheduleTodaysWorkout(userId);
      setWorkout(result);
    } catch (e) {
      console.error("Error scheduling workout:", e);
      // Fallback
      setWorkout({
        type: "Full Body",
        name: "Full Body",
        focus: "All Major Muscle Groups",
        isRest: false,
        reason: "Default",
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { workout, loading, refresh };
}
