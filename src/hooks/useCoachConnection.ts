/**
 * useCoachConnection Hook
 * Manages the client's connection to their personal trainer/coach.
 * Fetches coach info from Supabase (coach_clients joined with coaches table).
 * Returns null if no coach is connected (prompts client to enter invite code).
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type CoachInfo = {
  coachId: string;
  coachName: string;
  coachAvatar: string | null;
  connectionStatus: "active" | "pending" | "inactive";
  connectedAt: string;
};

export function useCoachConnection(userId: string | null) {
  const [coach, setCoach] = useState<CoachInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCoach = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from("coach_clients")
        .select(`
          coach_id,
          status,
          connected_at,
          coaches (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq("client_id", userId)
        .eq("status", "active")
        .single();

      if (fetchError) {
        // No connection found — that's okay
        if (fetchError.code === "PGRST116") {
          setCoach(null);
        } else {
          console.error("Error fetching coach connection:", fetchError);
          setError("Failed to load coach info");
        }
        return;
      }

      if (data?.coaches) {
        const c = data.coaches as any;
        setCoach({
          coachId: data.coach_id,
          coachName: c.display_name ?? "Your Coach",
          coachAvatar: c.avatar_url ?? null,
          connectionStatus: data.status as CoachInfo["connectionStatus"],
          connectedAt: data.connected_at,
        });
      }
    } catch (err) {
      console.error("Error in useCoachConnection:", err);
      setError("Failed to load coach info");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCoach();
  }, [fetchCoach]);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchCoach();
  }, [fetchCoach]);

  /**
   * Connect to a coach using an invite code.
   * Returns true on success, throws on failure.
   */
  const connectWithCode = useCallback(async (code: string): Promise<boolean> => {
    if (!userId) throw new Error("Not authenticated");

    const { data, error: lookupError } = await supabase
      .from("coach_invite_codes")
      .select("coach_id")
      .eq("code", code.trim().toUpperCase())
      .eq("is_active", true)
      .single();

    if (lookupError || !data) {
      throw new Error("Invalid or expired invite code");
    }

    const { error: insertError } = await supabase
      .from("coach_clients")
      .insert({
        coach_id: data.coach_id,
        client_id: userId,
        status: "active",
        connected_at: new Date().toISOString(),
      });

    if (insertError) {
      if (insertError.code === "23505") {
        throw new Error("You are already connected to this coach");
      }
      throw new Error("Failed to connect. Please try again.");
    }

    await fetchCoach();
    return true;
  }, [userId, fetchCoach]);

  return {
    coach,
    loading,
    error,
    refresh,
    connectWithCode,
    isConnected: !!coach,
  };
}
