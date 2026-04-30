/**
 * useWeeklySummary Hook
 * 
 * Provides weekly workout summary data:
 * - Workouts completed (X/Y)
 * - Total volume with trend
 * - Total time spent
 * - Coach insights based on data
 */

import { useState, useEffect, useCallback } from "react";
import { startOfWeek, endOfWeek, subWeeks, parseISO, differenceInMinutes } from "date-fns";
import { supabase } from "@/lib/supabase";

export type WeeklySummaryData = {
  // This week stats
  workoutsCompleted: number;
  workoutsTarget: number; // From user settings or default 4
  totalVolume: number;
  totalTimeMinutes: number;
  
  // Last week comparison
  lastWeekWorkouts: number;
  lastWeekVolume: number;
  lastWeekTimeMinutes: number;
  
  // Trends
  volumeTrend: number; // Percentage change
  timeTrend: number; // Percentage change
  
  // Muscle-specific data for recovery
  muscleLastTrained: Record<string, Date | null>;
  muscleWeeklyVolume: Record<string, number>;
};

type UseWeeklySummaryReturn = {
  data: WeeklySummaryData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

export function useWeeklySummary(userId: string | null): UseWeeklySummaryReturn {
  const [data, setData] = useState<WeeklySummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
      const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const lastWeekStart = subWeeks(thisWeekStart, 1);
      const lastWeekEnd = subWeeks(thisWeekEnd, 1);

      // Fetch user's workout target from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_data")
        .eq("id", userId)
        .single();
      
      const onboardingData = profile?.onboarding_data as Record<string, any> || {};
      const workoutsTarget = onboardingData.workoutsPerWeek || 4;

      // Fetch sessions for this week and last week
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("workout_sessions")
        .select("id, started_at, ended_at")
        .eq("user_id", userId)
        .gte("started_at", lastWeekStart.toISOString())
        .lte("started_at", thisWeekEnd.toISOString());

      if (sessionsError) throw sessionsError;

      // Fetch sets data with exercise names for muscle tracking
      const { data: setsData, error: setsError } = await supabase
        .from("workout_sets")
        .select(`
          weight_lbs,
          reps,
          workout_exercises!inner(
            exercise_name,
            muscle_group,
            workout_sessions!inner(
              user_id,
              started_at
            )
          )
        `)
        .eq("workout_exercises.workout_sessions.user_id", userId)
        .gte("workout_exercises.workout_sessions.started_at", lastWeekStart.toISOString())
        .eq("is_warmup", false);

      if (setsError) throw setsError;

      // Process sessions
      const thisWeekSessions = (sessionsData || []).filter((s) => {
        const date = parseISO(s.started_at);
        return date >= thisWeekStart && date <= thisWeekEnd;
      });

      const lastWeekSessions = (sessionsData || []).filter((s) => {
        const date = parseISO(s.started_at);
        return date >= lastWeekStart && date <= lastWeekEnd;
      });

      // Calculate time
      const calcTotalTime = (sessions: typeof sessionsData) => {
        return (sessions || []).reduce((sum, s) => {
          if (s.started_at && s.ended_at) {
            return sum + differenceInMinutes(parseISO(s.ended_at), parseISO(s.started_at));
          }
          return sum + 45; // Default 45 min if no end time
        }, 0);
      };

      const thisWeekTime = calcTotalTime(thisWeekSessions);
      const lastWeekTime = calcTotalTime(lastWeekSessions);

      // Process sets for volume
      let thisWeekVolume = 0;
      let lastWeekVolume = 0;
      const muscleLastTrained: Record<string, Date | null> = {};
      const muscleWeeklyVolume: Record<string, number> = {};

      (setsData || []).forEach((set: any) => {
        const sessionDate = set.workout_exercises?.workout_sessions?.started_at;
        if (!sessionDate) return;

        const date = parseISO(sessionDate);
        const weight = set.weight_lbs || 0;
        const reps = set.reps || 0;
        const volume = weight * reps;
        const muscle = set.workout_exercises?.muscle_group;

        if (volume === 0) return;

        // Track by week
        if (date >= thisWeekStart && date <= thisWeekEnd) {
          thisWeekVolume += volume;
          
          // Track muscle volume this week
          if (muscle) {
            muscleWeeklyVolume[muscle] = (muscleWeeklyVolume[muscle] || 0) + volume;
          }
        } else if (date >= lastWeekStart && date <= lastWeekEnd) {
          lastWeekVolume += volume;
        }

        // Track last trained date per muscle
        if (muscle) {
          const existing = muscleLastTrained[muscle];
          if (!existing || date > existing) {
            muscleLastTrained[muscle] = date;
          }
        }
      });

      // Calculate trends
      const volumeTrend = lastWeekVolume > 0 
        ? ((thisWeekVolume - lastWeekVolume) / lastWeekVolume) * 100 
        : 0;
      
      const timeTrend = lastWeekTime > 0 
        ? ((thisWeekTime - lastWeekTime) / lastWeekTime) * 100 
        : 0;

      setData({
        workoutsCompleted: thisWeekSessions.length,
        workoutsTarget: workoutsTarget,
        totalVolume: Math.round(thisWeekVolume),
        totalTimeMinutes: thisWeekTime,
        lastWeekWorkouts: lastWeekSessions.length,
        lastWeekVolume: Math.round(lastWeekVolume),
        lastWeekTimeMinutes: lastWeekTime,
        volumeTrend: Math.round(volumeTrend),
        timeTrend: Math.round(timeTrend),
        muscleLastTrained,
        muscleWeeklyVolume,
      });

    } catch (err) {
      console.error("Error fetching weekly summary:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh: fetchData,
  };
}

export default useWeeklySummary;
