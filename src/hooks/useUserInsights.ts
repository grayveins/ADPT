/**
 * useUserInsights Hook
 *
 * Reads aggregated behavioral insights from the user_events table.
 * Used to power smart workout recommendations based on actual habits
 * rather than self-reported onboarding data.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type UserInsights = {
  /** "morning" | "afternoon" | "evening" based on workout_started events */
  preferredWorkoutTime: "morning" | "afternoon" | "evening" | null;
  /** Days of the week the user actually trains (0 = Sunday, 6 = Saturday) */
  preferredDays: number[];
  /** Average app session length in minutes */
  averageSessionDuration: number | null;
  /** Percentage of target days they actually trained (last 4 weeks) */
  consistencyScore: number | null;
  /** Days since their most recent workout_completed event */
  daysSinceLastWorkout: number | null;
};

type UseUserInsightsReturn = {
  insights: UserInsights;
  loading: boolean;
  refresh: () => void;
};

const EMPTY_INSIGHTS: UserInsights = {
  preferredWorkoutTime: null,
  preferredDays: [],
  averageSessionDuration: null,
  consistencyScore: null,
  daysSinceLastWorkout: null,
};

function classifyTimeOfDay(hour: number): "morning" | "afternoon" | "evening" {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function useUserInsights(userId: string | null): UseUserInsightsReturn {
  const [insights, setInsights] = useState<UserInsights>(EMPTY_INSIGHTS);
  const [loading, setLoading] = useState(true);

  const fetchInsights = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      // Fetch workout_started events (last 4 weeks) for time/day preferences
      const { data: workoutEvents } = await supabase
        .from("user_events")
        .select("metadata, created_at")
        .eq("user_id", userId)
        .eq("event", "workout_started")
        .gte("created_at", fourWeeksAgo.toISOString())
        .order("created_at", { ascending: false });

      // Fetch session_duration events for average session length
      const { data: sessionEvents } = await supabase
        .from("user_events")
        .select("metadata")
        .eq("user_id", userId)
        .eq("event", "session_duration")
        .gte("created_at", fourWeeksAgo.toISOString());

      // Fetch most recent workout_completed for days since last workout
      const { data: lastWorkout } = await supabase
        .from("user_events")
        .select("created_at")
        .eq("user_id", userId)
        .eq("event", "workout_completed")
        .order("created_at", { ascending: false })
        .limit(1);

      // Fetch user's target days from profile for consistency score
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_data")
        .eq("id", userId)
        .single();

      // --- Preferred workout time ---
      let preferredWorkoutTime: UserInsights["preferredWorkoutTime"] = null;
      if (workoutEvents && workoutEvents.length > 0) {
        const buckets = { morning: 0, afternoon: 0, evening: 0 };
        for (const e of workoutEvents) {
          const meta = e.metadata as Record<string, unknown>;
          // Use metadata.hour if available, otherwise fall back to created_at
          const hour =
            typeof meta?.hour === "number"
              ? meta.hour
              : new Date(e.created_at).getHours();
          buckets[classifyTimeOfDay(hour)]++;
        }
        const sorted = Object.entries(buckets).sort((a, b) => b[1] - a[1]);
        if (sorted[0][1] > 0) {
          preferredWorkoutTime = sorted[0][0] as "morning" | "afternoon" | "evening";
        }
      }

      // --- Preferred days ---
      const dayCounts: Record<number, number> = {};
      if (workoutEvents) {
        for (const e of workoutEvents) {
          const meta = e.metadata as Record<string, unknown>;
          const day =
            typeof meta?.dayOfWeek === "number"
              ? meta.dayOfWeek
              : new Date(e.created_at).getDay();
          dayCounts[day] = (dayCounts[day] || 0) + 1;
        }
      }
      // Consider a day "preferred" if they trained on it at least twice in 4 weeks
      const preferredDays = Object.entries(dayCounts)
        .filter(([, count]) => count >= 2)
        .map(([day]) => Number(day))
        .sort((a, b) => a - b);

      // --- Average session duration ---
      let averageSessionDuration: number | null = null;
      if (sessionEvents && sessionEvents.length > 0) {
        const totalSeconds = sessionEvents.reduce((sum, e) => {
          const meta = e.metadata as Record<string, unknown>;
          return sum + (typeof meta?.durationSeconds === "number" ? meta.durationSeconds : 0);
        }, 0);
        averageSessionDuration = Math.round(totalSeconds / sessionEvents.length / 60);
      }

      // --- Consistency score ---
      let consistencyScore: number | null = null;
      const onboardingData = (profile?.onboarding_data as Record<string, unknown>) || {};
      const targetPerWeek =
        typeof onboardingData.workoutsPerWeek === "number"
          ? onboardingData.workoutsPerWeek
          : null;
      if (targetPerWeek && workoutEvents) {
        const targetTotal = targetPerWeek * 4; // 4 weeks
        const actual = workoutEvents.length;
        consistencyScore = Math.min(100, Math.round((actual / targetTotal) * 100));
      }

      // --- Days since last workout ---
      let daysSinceLastWorkout: number | null = null;
      if (lastWorkout && lastWorkout.length > 0) {
        const lastDate = new Date(lastWorkout[0].created_at);
        const now = new Date();
        daysSinceLastWorkout = Math.floor(
          (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );
      }

      setInsights({
        preferredWorkoutTime,
        preferredDays,
        averageSessionDuration,
        consistencyScore,
        daysSinceLastWorkout,
      });
    } catch (err) {
      console.error("Error fetching user insights:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return {
    insights,
    loading,
    refresh: fetchInsights,
  };
}

export default useUserInsights;
