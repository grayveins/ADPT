/**
 * useWorkoutLimit
 * Tracks how many workouts the user has completed this week.
 * Returns whether they've hit the free tier limit (3/week).
 */

import { useCallback, useEffect, useState } from "react";
import { startOfWeek, endOfWeek } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useSubscription } from "@/src/hooks/useSubscription";
import { useReverseTrial } from "@/src/hooks/useReverseTrial";

const FREE_WEEKLY_LIMIT = 3;

export function useWorkoutLimit() {
  const { isPro } = useSubscription();
  const { isTrialActive } = useReverseTrial();
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const weekBegin = startOfWeek(now, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

      const { count, error } = await supabase
        .from("workout_sessions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("started_at", weekBegin.toISOString())
        .lte("started_at", weekEnd.toISOString());

      if (!error && count !== null) {
        setWeeklyCount(count);
      }
    } catch {
      // Fail silently — don't block the user
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  const canStartWorkout = isPro || isTrialActive || weeklyCount < FREE_WEEKLY_LIMIT;
  const remaining = Math.max(FREE_WEEKLY_LIMIT - weeklyCount, 0);

  return {
    canStartWorkout,
    weeklyCount,
    remaining,
    limit: FREE_WEEKLY_LIMIT,
    isPro,
    loading,
    refresh: fetchCount,
  };
}
