/**
 * useMonthlyRecap Hook
 *
 * Fetches training stats for the previous calendar month:
 * total workouts, volume, sets, PRs, top muscle, longest streak,
 * total training time, favorite exercise, and SR change.
 *
 * Used by MonthlyRecapCard for the "Spotify Wrapped for training" feature.
 */

import { useState, useEffect, useCallback } from "react";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  parseISO,
  differenceInMinutes,
  differenceInCalendarDays,
  format,
} from "date-fns";
import { supabase } from "@/lib/supabase";

export type MonthlyRecap = {
  month: string; // "March 2026"
  workouts: number;
  totalVolume: number;
  totalSets: number;
  prs: number;
  topMuscle: string;
  longestStreak: number;
  totalMinutes: number;
  favoriteExercise: string;
  srChange: number; // delta from start to end of month
  loading: boolean;
};

const EMPTY_RECAP: MonthlyRecap = {
  month: "",
  workouts: 0,
  totalVolume: 0,
  totalSets: 0,
  prs: 0,
  topMuscle: "--",
  longestStreak: 0,
  totalMinutes: 0,
  favoriteExercise: "--",
  srChange: 0,
  loading: true,
};

/**
 * Compute the longest consecutive-day workout streak within a set of dates.
 * Dates should be ISO strings; only the calendar date portion is used.
 */
function computeLongestStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  // Deduplicate to calendar dates and sort ascending
  const unique = [...new Set(dates.map((d) => d.slice(0, 10)))].sort();

  let longest = 1;
  let current = 1;

  for (let i = 1; i < unique.length; i++) {
    const diff = differenceInCalendarDays(
      parseISO(unique[i]),
      parseISO(unique[i - 1])
    );
    if (diff === 1) {
      current += 1;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }

  return longest;
}

export function useMonthlyRecap() {
  const [recap, setRecap] = useState<MonthlyRecap>(EMPTY_RECAP);

  const fetchRecap = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setRecap({ ...EMPTY_RECAP, loading: false });
        return;
      }

      const userId = user.id;
      const now = new Date();
      const prevMonth = subMonths(now, 1);
      const monthStart = startOfMonth(prevMonth);
      const monthEnd = endOfMonth(prevMonth);
      const monthLabel = format(prevMonth, "MMMM yyyy"); // e.g. "March 2026"

      // ── 1. Fetch sessions for the month ──────────────────────────────────
      const { data: sessions, error: sessionsErr } = await supabase
        .from("workout_sessions")
        .select("id, started_at, ended_at")
        .eq("user_id", userId)
        .gte("started_at", monthStart.toISOString())
        .lte("started_at", monthEnd.toISOString())
        .order("started_at", { ascending: true });

      if (sessionsErr) throw sessionsErr;

      const workouts = sessions?.length ?? 0;

      // Total training time
      const totalMinutes = (sessions || []).reduce((sum, s) => {
        if (s.started_at && s.ended_at) {
          return sum + differenceInMinutes(parseISO(s.ended_at), parseISO(s.started_at));
        }
        return sum + 45; // Default if no end time
      }, 0);

      // Longest streak from session dates
      const sessionDates = (sessions || []).map((s) => s.started_at);
      const longestStreak = computeLongestStreak(sessionDates);

      // ── 2. Fetch all sets for the month (with exercise + muscle info) ────
      const { data: setsData, error: setsErr } = await supabase
        .from("workout_sets")
        .select(
          `
          weight_lbs,
          reps,
          is_pr,
          is_warmup,
          workout_exercises!inner(
            exercise_name,
            muscle_group,
            workout_sessions!inner(
              user_id,
              started_at
            )
          )
        `
        )
        .eq("workout_exercises.workout_sessions.user_id", userId)
        .gte(
          "workout_exercises.workout_sessions.started_at",
          monthStart.toISOString()
        )
        .lte(
          "workout_exercises.workout_sessions.started_at",
          monthEnd.toISOString()
        );

      if (setsErr) throw setsErr;

      let totalVolume = 0;
      let totalSets = 0;
      let prs = 0;
      const muscleCount: Record<string, number> = {};
      const exerciseCount: Record<string, number> = {};

      (setsData || []).forEach((set: any) => {
        const weight = set.weight_lbs || 0;
        const reps = set.reps || 0;
        const isWarmup = set.is_warmup || false;

        if (!isWarmup) {
          totalSets += 1;
          totalVolume += weight * reps;

          if (set.is_pr) prs += 1;
        }

        // Count muscle group and exercise frequency (including warmups for frequency)
        const muscle = set.workout_exercises?.muscle_group;
        const exercise = set.workout_exercises?.exercise_name;

        if (muscle) {
          muscleCount[muscle] = (muscleCount[muscle] || 0) + 1;
        }
        if (exercise) {
          exerciseCount[exercise] = (exerciseCount[exercise] || 0) + 1;
        }
      });

      // Top muscle group
      const topMuscle =
        Object.entries(muscleCount).sort((a, b) => b[1] - a[1])[0]?.[0] ||
        "--";

      // Favorite exercise
      const favoriteExercise =
        Object.entries(exerciseCount).sort((a, b) => b[1] - a[1])[0]?.[0] ||
        "--";

      // ── 3. SR change (strength_scores table or compute from PRs) ─────────
      // Try to fetch strength_score snapshots if they exist; fall back to 0
      let srChange = 0;
      try {
        const { data: srData } = await supabase
          .from("strength_scores")
          .select("score, created_at")
          .eq("user_id", userId)
          .gte("created_at", monthStart.toISOString())
          .lte("created_at", monthEnd.toISOString())
          .order("created_at", { ascending: true });

        if (srData && srData.length >= 2) {
          const first = srData[0].score as number;
          const last = srData[srData.length - 1].score as number;
          srChange = last - first;
        }
      } catch {
        // Table may not exist yet — that's fine, default 0
      }

      setRecap({
        month: monthLabel,
        workouts,
        totalVolume: Math.round(totalVolume),
        totalSets,
        prs,
        topMuscle,
        longestStreak,
        totalMinutes,
        favoriteExercise,
        srChange,
        loading: false,
      });
    } catch (err) {
      console.error("Error fetching monthly recap:", err);
      setRecap({ ...EMPTY_RECAP, loading: false });
    }
  }, []);

  useEffect(() => {
    fetchRecap();
  }, [fetchRecap]);

  return recap;
}

export default useMonthlyRecap;
