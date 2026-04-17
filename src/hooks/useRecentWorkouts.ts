/**
 * useRecentWorkouts
 * Fetches last N workout sessions with exercise summaries.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type RecentExercise = {
  name: string;
  muscle_group: string | null;
  set_count: number;
};

export type RecentWorkout = {
  id: string;
  title: string | null;
  started_at: string;
  ended_at: string | null;
  exercises: RecentExercise[];
};

export function useRecentWorkouts(userId: string | null, limit = 10) {
  const [workouts, setWorkouts] = useState<RecentWorkout[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Fetch sessions with exercises
      const { data: sessions, error } = await supabase
        .from("workout_sessions")
        .select(`
          id,
          title,
          started_at,
          ended_at,
          workout_exercises (
            exercise_name,
            muscle_group,
            workout_sets ( id )
          )
        `)
        .eq("user_id", userId)
        .order("started_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching recent workouts:", error);
        setWorkouts([]);
        return;
      }

      const mapped: RecentWorkout[] = (sessions ?? []).map((s: any) => ({
        id: s.id,
        title: s.title,
        started_at: s.started_at,
        ended_at: s.ended_at,
        exercises: (s.workout_exercises ?? []).map((ex: any) => ({
          name: ex.exercise_name,
          muscle_group: ex.muscle_group,
          set_count: ex.workout_sets?.length ?? 0,
        })),
      }));

      setWorkouts(mapped);
    } catch (e) {
      console.error("Error fetching recent workouts:", e);
      setWorkouts([]);
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { workouts, loading, refresh };
}
