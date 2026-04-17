/**
 * useXPAward Hook
 * Awards XP when users complete workouts, hit PRs, or reach milestones.
 * Calls POST /xp/award on the API server.
 */

import { useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? "http://localhost:3001";

type XPReason =
  | "workout_complete"
  | "pr_hit"
  | "streak_7"
  | "streak_30"
  | "program_week"
  | "first_workout";

type XPAwardResponse = {
  awarded: number;
  reason: XPReason;
  totalXP: number;
  level: number;
  rank: string;
  xpToNextLevel: number;
};

type XPState = {
  totalXP: number;
  level: number;
  rank: string;
};

/**
 * Sends an authenticated request to the API server.
 * Attaches the Supabase JWT as a Bearer token.
 */
async function authedFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    // 409 = duplicate award, not a real error
    if (res.status === 409) {
      return body as T;
    }
    throw new Error(body.error ?? `API error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export function useXPAward() {
  const [xpState, setXPState] = useState<XPState | null>(null);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  /**
   * Award XP for a specific reason.
   * Returns the API response with updated totals, or null on failure.
   */
  const awardXP = useCallback(
    async (
      reason: XPReason,
      metadata?: Record<string, unknown>
    ): Promise<XPAwardResponse | null> => {
      try {
        const body: Record<string, unknown> = { reason };
        if (metadata) body.metadata = metadata;

        const result = await authedFetch<XPAwardResponse>("/xp/award", {
          method: "POST",
          body: JSON.stringify(body),
        });

        // Update local state if we got valid data back
        if (result.totalXP !== undefined) {
          setXPState({
            totalXP: result.totalXP,
            level: result.level,
            rank: result.rank,
          });
        }

        return result;
      } catch (error) {
        console.error(`[useXPAward] Failed to award XP (${reason}):`, error);
        return null;
      }
    },
    []
  );

  /**
   * Convenience method for workout completion.
   * Awards workout_complete + per-PR bonuses + first_workout if applicable.
   * Returns the final XP state after all awards.
   */
  const awardWorkoutXP = useCallback(
    async (
      sessionId: string,
      prsHit: number = 0
    ): Promise<XPAwardResponse | null> => {
      if (loadingRef.current) return null;
      loadingRef.current = true;
      setLoading(true);

      try {
        // Check if this is the user's first workout
        const { data: { session } } = await supabase.auth.getSession();
        let isFirstWorkout = false;

        if (session) {
          const { count } = await supabase
            .from("workout_sessions")
            .select("id", { count: "exact", head: true })
            .eq("user_id", session.user.id);

          isFirstWorkout = count === 1;
        }

        let lastResult: XPAwardResponse | null = null;

        // Award first_workout bonus (250 XP)
        if (isFirstWorkout) {
          lastResult = await awardXP("first_workout", { session_id: sessionId });
        }

        // Award workout_complete (100 XP)
        lastResult =
          (await awardXP("workout_complete", { session_id: sessionId })) ??
          lastResult;

        // Award pr_hit (50 XP each)
        for (let i = 0; i < prsHit; i++) {
          lastResult =
            (await awardXP("pr_hit", {
              session_id: sessionId,
              pr_index: i,
            })) ?? lastResult;
        }

        return lastResult;
      } catch (error) {
        console.error("[useXPAward] Failed to award workout XP:", error);
        return null;
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [awardXP]
  );

  return {
    awardXP,
    awardWorkoutXP,
    xpState,
    loading,
  };
}

export default useXPAward;
