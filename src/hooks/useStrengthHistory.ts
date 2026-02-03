/**
 * useStrengthHistory Hook
 * 
 * Fetches historical strength data for a specific exercise.
 * Returns max weight per session, PR history, and progress calculations.
 * Used for the per-exercise analytics screen.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { subDays, subMonths, parseISO, format } from "date-fns";
import { supabase } from "@/lib/supabase";

export type TimeRange = "1M" | "3M" | "6M" | "ALL";

export type StrengthDataPoint = {
  date: string;
  weight: number;
  reps: number;
  estimated1RM: number;
};

export type PRRecord = {
  date: string;
  weight: number;
  reps: number;
  estimated1RM: number;
};

type UseStrengthHistoryReturn = {
  data: StrengthDataPoint[];
  loading: boolean;
  error: string | null;
  currentPR: PRRecord | null;
  startingMax: number;
  progressAbsolute: number;
  progressPercent: number;
  prHistory: PRRecord[];
  bestSets: PRRecord[];
  refresh: () => void;
};

// Epley formula for estimated 1RM
const calculate1RM = (weight: number, reps: number): number => {
  if (reps === 0 || weight === 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
};

// Get date cutoff based on time range
const getDateCutoff = (range: TimeRange): Date | null => {
  const now = new Date();
  switch (range) {
    case "1M":
      return subMonths(now, 1);
    case "3M":
      return subMonths(now, 3);
    case "6M":
      return subMonths(now, 6);
    case "ALL":
      return null;
  }
};

export function useStrengthHistory(
  userId: string | null,
  exerciseName: string,
  timeRange: TimeRange = "3M"
): UseStrengthHistoryReturn {
  const [data, setData] = useState<StrengthDataPoint[]>([]);
  const [prHistory, setPRHistory] = useState<PRRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId || !exerciseName) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const dateCutoff = getDateCutoff(timeRange);
      
      // Build query for workout sets with this exercise
      let query = supabase
        .from("workout_sets")
        .select(`
          weight_lbs,
          reps,
          is_pr,
          completed_at,
          workout_exercises!inner(
            exercise_name,
            workout_sessions!inner(
              user_id,
              started_at
            )
          )
        `)
        .eq("workout_exercises.workout_sessions.user_id", userId)
        .eq("workout_exercises.exercise_name", exerciseName)
        .eq("is_warmup", false)
        .order("completed_at", { ascending: true });

      if (dateCutoff) {
        query = query.gte(
          "workout_exercises.workout_sessions.started_at",
          dateCutoff.toISOString()
        );
      }

      const { data: setsData, error: queryError } = await query;

      if (queryError) throw queryError;

      // Process data: group by session date, find max weight per session
      const sessionMap = new Map<string, { weight: number; reps: number; date: string }>();
      const allPRs: PRRecord[] = [];

      (setsData || []).forEach((set: any) => {
        const sessionDate = set.workout_exercises?.workout_sessions?.started_at;
        if (!sessionDate) return;

        const dateKey = format(parseISO(sessionDate), "yyyy-MM-dd");
        const weight = set.weight_lbs || 0;
        const reps = set.reps || 0;

        // Track max weight per session
        const existing = sessionMap.get(dateKey);
        if (!existing || weight > existing.weight) {
          sessionMap.set(dateKey, { weight, reps, date: dateKey });
        }

        // Track PRs
        if (set.is_pr) {
          allPRs.push({
            date: dateKey,
            weight,
            reps,
            estimated1RM: calculate1RM(weight, reps),
          });
        }
      });

      // Convert to array and calculate e1RM
      const dataPoints: StrengthDataPoint[] = Array.from(sessionMap.values())
        .map((item) => ({
          date: item.date,
          weight: item.weight,
          reps: item.reps,
          estimated1RM: calculate1RM(item.weight, item.reps),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setData(dataPoints);

      // Sort PRs by date descending (most recent first)
      const sortedPRs = allPRs.sort((a, b) => b.date.localeCompare(a.date));
      setPRHistory(sortedPRs);

    } catch (err) {
      console.error("Error fetching strength history:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [userId, exerciseName, timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived values
  const currentPR = useMemo((): PRRecord | null => {
    if (data.length === 0) return null;
    
    // Find the highest weight ever lifted
    const maxWeightPoint = data.reduce((max, point) => 
      point.weight > max.weight ? point : max
    , data[0]);

    return {
      date: maxWeightPoint.date,
      weight: maxWeightPoint.weight,
      reps: maxWeightPoint.reps,
      estimated1RM: maxWeightPoint.estimated1RM,
    };
  }, [data]);

  const startingMax = useMemo(() => {
    if (data.length === 0) return 0;
    return data[0].weight;
  }, [data]);

  const progressAbsolute = useMemo(() => {
    if (!currentPR) return 0;
    return currentPR.weight - startingMax;
  }, [currentPR, startingMax]);

  const progressPercent = useMemo(() => {
    if (startingMax === 0 || !currentPR) return 0;
    return ((currentPR.weight - startingMax) / startingMax) * 100;
  }, [currentPR, startingMax]);

  // Best sets by estimated 1RM (top 5)
  const bestSets = useMemo((): PRRecord[] => {
    if (data.length === 0) return [];
    
    return [...data]
      .sort((a, b) => b.estimated1RM - a.estimated1RM)
      .slice(0, 5)
      .map((point) => ({
        date: point.date,
        weight: point.weight,
        reps: point.reps,
        estimated1RM: point.estimated1RM,
      }));
  }, [data]);

  return {
    data,
    loading,
    error,
    currentPR,
    startingMax,
    progressAbsolute,
    progressPercent,
    prHistory,
    bestSets,
    refresh: fetchData,
  };
}

export default useStrengthHistory;
