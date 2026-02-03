/**
 * useVolumeHistory Hook
 * 
 * Fetches weekly workout volume (total lbs lifted).
 * Returns data for volume bar chart and summary stats.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { subMonths, startOfWeek, format, parseISO } from "date-fns";
import { supabase } from "@/lib/supabase";
import { type TimeRange } from "./useStrengthHistory";

export type VolumeDataPoint = {
  week: string;        // Display label (e.g., "Jan 1" or "W1")
  weekStart: string;   // ISO date of week start
  volume: number;      // Total lbs lifted
  sessions: number;    // Number of workout sessions
};

type UseVolumeHistoryReturn = {
  data: VolumeDataPoint[];
  loading: boolean;
  error: string | null;
  thisWeekVolume: number;
  lastWeekVolume: number;
  averageVolume: number;
  totalVolume: number;
  trend: "up" | "down" | "flat";
  trendPercent: number;
  refresh: () => void;
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

export function useVolumeHistory(
  userId: string | null,
  timeRange: TimeRange = "3M"
): UseVolumeHistoryReturn {
  const [data, setData] = useState<VolumeDataPoint[]>([]);
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
      const dateCutoff = getDateCutoff(timeRange);

      // Build query for all workout sets
      let query = supabase
        .from("workout_sets")
        .select(`
          weight_lbs,
          reps,
          workout_exercises!inner(
            workout_sessions!inner(
              user_id,
              started_at
            )
          )
        `)
        .eq("workout_exercises.workout_sessions.user_id", userId)
        .eq("is_warmup", false);

      if (dateCutoff) {
        query = query.gte(
          "workout_exercises.workout_sessions.started_at",
          dateCutoff.toISOString()
        );
      }

      const { data: setsData, error: queryError } = await query;

      if (queryError) throw queryError;

      // Group by week and calculate volume
      const weekMap = new Map<string, { volume: number; sessions: Set<string> }>();

      (setsData || []).forEach((set: any) => {
        const sessionDate = set.workout_exercises?.workout_sessions?.started_at;
        if (!sessionDate) return;

        const weight = set.weight_lbs || 0;
        const reps = set.reps || 0;
        const volume = weight * reps;

        if (volume === 0) return;

        // Get week start (Monday)
        const weekStart = startOfWeek(parseISO(sessionDate), { weekStartsOn: 1 });
        const weekKey = format(weekStart, "yyyy-MM-dd");

        const existing = weekMap.get(weekKey);
        if (existing) {
          existing.volume += volume;
          existing.sessions.add(sessionDate);
        } else {
          weekMap.set(weekKey, {
            volume,
            sessions: new Set([sessionDate]),
          });
        }
      });

      // Convert to array
      const dataPoints: VolumeDataPoint[] = Array.from(weekMap.entries())
        .map(([weekStart, data]) => ({
          week: format(parseISO(weekStart), "MMM d"),
          weekStart,
          volume: Math.round(data.volume),
          sessions: data.sessions.size,
        }))
        .sort((a, b) => a.weekStart.localeCompare(b.weekStart));

      setData(dataPoints);

    } catch (err) {
      console.error("Error fetching volume history:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [userId, timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived values
  const thisWeekVolume = useMemo(() => {
    if (data.length === 0) return 0;
    return data[data.length - 1].volume;
  }, [data]);

  const lastWeekVolume = useMemo(() => {
    if (data.length < 2) return 0;
    return data[data.length - 2].volume;
  }, [data]);

  const averageVolume = useMemo(() => {
    if (data.length === 0) return 0;
    const total = data.reduce((sum, d) => sum + d.volume, 0);
    return Math.round(total / data.length);
  }, [data]);

  const totalVolume = useMemo(() => {
    return data.reduce((sum, d) => sum + d.volume, 0);
  }, [data]);

  const trend = useMemo((): "up" | "down" | "flat" => {
    if (data.length < 2) return "flat";
    const diff = thisWeekVolume - lastWeekVolume;
    if (diff > lastWeekVolume * 0.05) return "up";
    if (diff < -lastWeekVolume * 0.05) return "down";
    return "flat";
  }, [thisWeekVolume, lastWeekVolume, data.length]);

  const trendPercent = useMemo(() => {
    if (lastWeekVolume === 0) return 0;
    return ((thisWeekVolume - lastWeekVolume) / lastWeekVolume) * 100;
  }, [thisWeekVolume, lastWeekVolume]);

  return {
    data,
    loading,
    error,
    thisWeekVolume,
    lastWeekVolume,
    averageVolume,
    totalVolume,
    trend,
    trendPercent,
    refresh: fetchData,
  };
}

export default useVolumeHistory;
