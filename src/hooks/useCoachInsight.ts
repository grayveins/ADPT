/**
 * useCoachInsight Hook
 *
 * Fetches stats about how much the AI coach "knows" about this user.
 * Queries workout history, exercises, PRs, and limitations to build
 * a dynamic "coach learning" message that increases switching cost.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type CoachInsight = {
  workoutCount: number;
  totalSets: number;
  daysSinceFirst: number;
  exercisesTracked: number;
  prsHit: number;
  limitationsTracked: number;
  loading: boolean;
  coachMessage: string;
};

const buildCoachMessage = (
  workoutCount: number,
  totalSets: number
): string => {
  if (workoutCount === 0) return "Start your first workout to train your coach";
  if (workoutCount < 5) return "Getting to know your strengths...";
  if (workoutCount < 20)
    return `Learning your patterns from ${workoutCount} workouts`;
  if (workoutCount < 50)
    return `Your coach has studied ${workoutCount} sessions and ${totalSets.toLocaleString()} sets`;
  if (workoutCount < 100)
    return `Deeply personalized \u2014 ${workoutCount} workouts of data`;
  return `Your coach knows you better than most trainers \u2014 ${workoutCount} sessions analyzed`;
};

export function useCoachInsight(): CoachInsight {
  const [workoutCount, setWorkoutCount] = useState(0);
  const [totalSets, setTotalSets] = useState(0);
  const [daysSinceFirst, setDaysSinceFirst] = useState(0);
  const [exercisesTracked, setExercisesTracked] = useState(0);
  const [prsHit, setPrsHit] = useState(0);
  const [limitationsTracked, setLimitationsTracked] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchInsight = useCallback(async () => {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const userId = user.id;

      // Run all queries in parallel
      const [
        sessionsResult,
        setsResult,
        firstSessionResult,
        exercisesResult,
        prsResult,
        limitationsResult,
      ] = await Promise.all([
        // Total workout sessions
        supabase
          .from("workout_sessions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),

        // Total sets (via workout_exercises join)
        supabase
          .from("workout_sets")
          .select(
            "id, workout_exercises!inner(session_id, workout_sessions!inner(user_id))",
            { count: "exact", head: true }
          )
          .eq("workout_exercises.workout_sessions.user_id", userId)
          .eq("is_warmup", false),

        // First workout date
        supabase
          .from("workout_sessions")
          .select("started_at")
          .eq("user_id", userId)
          .order("started_at", { ascending: true })
          .limit(1),

        // Distinct exercises used
        supabase
          .from("workout_exercises")
          .select(
            "exercise_name, workout_sessions!inner(user_id)"
          )
          .eq("workout_sessions.user_id", userId),

        // PRs hit
        supabase
          .from("workout_sets")
          .select(
            "id, workout_exercises!inner(session_id, workout_sessions!inner(user_id))",
            { count: "exact", head: true }
          )
          .eq("workout_exercises.workout_sessions.user_id", userId)
          .eq("is_pr", true),

        // Active limitations
        supabase
          .from("user_limitations")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .in("status", ["active", "monitoring"]),
      ]);

      // Process results
      setWorkoutCount(sessionsResult.count ?? 0);
      setTotalSets(setsResult.count ?? 0);

      // Days since first workout
      if (
        firstSessionResult.data &&
        firstSessionResult.data.length > 0 &&
        firstSessionResult.data[0].started_at
      ) {
        const firstDate = new Date(firstSessionResult.data[0].started_at);
        const now = new Date();
        const diffMs = now.getTime() - firstDate.getTime();
        setDaysSinceFirst(Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      } else {
        setDaysSinceFirst(0);
      }

      // Distinct exercise count
      if (exercisesResult.data) {
        const uniqueNames = new Set(
          exercisesResult.data.map((e: any) => e.exercise_name)
        );
        setExercisesTracked(uniqueNames.size);
      }

      setPrsHit(prsResult.count ?? 0);
      setLimitationsTracked(limitationsResult.count ?? 0);
    } catch (err) {
      console.error("Error fetching coach insight:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsight();
  }, [fetchInsight]);

  return {
    workoutCount,
    totalSets,
    daysSinceFirst,
    exercisesTracked,
    prsHit,
    limitationsTracked,
    loading,
    coachMessage: buildCoachMessage(workoutCount, totalSets),
  };
}

export default useCoachInsight;
