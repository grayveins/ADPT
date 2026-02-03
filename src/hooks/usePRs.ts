/**
 * usePRs Hook
 * Fetches and manages personal records for exercises
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type PersonalRecord = {
  exercise_name: string;
  max_weight_lbs: number;
  reps_at_max_weight: number;
};

type PRMap = Map<string, PersonalRecord>;

export function usePRs(userId: string | null) {
  const [prs, setPRs] = useState<PRMap>(new Map());
  const [loading, setLoading] = useState(true);

  // Fetch all PRs for user
  const fetchPRs = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // Query the personal records view we created
      const { data, error } = await supabase
        .from("user_personal_records")
        .select("exercise_name, max_weight_lbs, reps_at_max_weight")
        .eq("user_id", userId);

      if (error) {
        // If view doesn't exist yet, fall back to manual query
        console.warn("PR view not available, using fallback query");
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("workout_sets")
          .select(`
            weight_lbs,
            reps,
            workout_exercises!inner(
              exercise_name,
              session_id,
              workout_sessions!inner(user_id)
            )
          `)
          .eq("workout_exercises.workout_sessions.user_id", userId)
          .eq("is_warmup", false)
          .order("weight_lbs", { ascending: false });

        if (fallbackError) throw fallbackError;

        // Process fallback data into PR map
        const prMap = new Map<string, PersonalRecord>();
        fallbackData?.forEach((set: any) => {
          const exerciseName = set.workout_exercises?.exercise_name;
          if (!exerciseName) return;
          
          const existing = prMap.get(exerciseName);
          const weight = set.weight_lbs || 0;
          const reps = set.reps || 0;
          
          if (!existing || weight > existing.max_weight_lbs) {
            prMap.set(exerciseName, {
              exercise_name: exerciseName,
              max_weight_lbs: weight,
              reps_at_max_weight: reps,
            });
          }
        });
        
        setPRs(prMap);
        return;
      }

      // Process view data into PR map
      const prMap = new Map<string, PersonalRecord>();
      data?.forEach((pr) => {
        prMap.set(pr.exercise_name, {
          exercise_name: pr.exercise_name,
          max_weight_lbs: pr.max_weight_lbs || 0,
          reps_at_max_weight: pr.reps_at_max_weight || 0,
        });
      });

      setPRs(prMap);
    } catch (error) {
      console.error("Error fetching PRs:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPRs();
  }, [fetchPRs]);

  // Check if a set is a new PR
  const checkPR = useCallback(
    (exerciseName: string, weight: number, reps: number): { isPR: boolean; previousBest: PersonalRecord | null } => {
      const currentPR = prs.get(exerciseName);
      
      if (!currentPR) {
        // First time doing this exercise - it's a PR!
        return { isPR: true, previousBest: null };
      }

      // PR if weight is higher (regardless of reps)
      if (weight > currentPR.max_weight_lbs) {
        return { isPR: true, previousBest: currentPR };
      }

      // PR if same weight but more reps
      if (weight === currentPR.max_weight_lbs && reps > currentPR.reps_at_max_weight) {
        return { isPR: true, previousBest: currentPR };
      }

      return { isPR: false, previousBest: currentPR };
    },
    [prs]
  );

  // Get PR for a specific exercise
  const getPR = useCallback(
    (exerciseName: string): PersonalRecord | null => {
      return prs.get(exerciseName) || null;
    },
    [prs]
  );

  // Update local PR cache after a new PR is set
  const updateLocalPR = useCallback(
    (exerciseName: string, weight: number, reps: number) => {
      setPRs((prev) => {
        const newMap = new Map(prev);
        newMap.set(exerciseName, {
          exercise_name: exerciseName,
          max_weight_lbs: weight,
          reps_at_max_weight: reps,
        });
        return newMap;
      });
    },
    []
  );

  return {
    prs,
    loading,
    checkPR,
    getPR,
    updateLocalPR,
    refreshPRs: fetchPRs,
  };
}

export default usePRs;
