/**
 * useActiveLimitations Hook
 * 
 * Manages user's active pain/injury limitations.
 * - Fetches active limitations from Supabase
 * - Provides methods to report, update, and resolve limitations
 * - Tracks feedback history for workout modifications
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { type BodyRegion } from "@/src/theme";

export type LimitationStatus = "active" | "monitoring" | "resolved";

export type LimitationFeedback = "better" | "same" | "worse";

export type ActiveLimitation = {
  id: string;
  area: BodyRegion;
  reportedAt: Date;
  lastCheckedAt: Date;
  status: LimitationStatus;
  workoutsModified: number;
  notes?: string;
};

type UseActiveLimitationsReturn = {
  limitations: ActiveLimitation[];
  loading: boolean;
  error: string | null;
  
  // Actions
  reportLimitation: (area: BodyRegion, notes?: string) => Promise<void>;
  updateLimitationStatus: (limitationId: string, status: LimitationStatus) => Promise<void>;
  resolveLimitation: (limitationId: string) => Promise<void>;
  recordFeedback: (limitationId: string, sessionId: string, feedback: LimitationFeedback) => Promise<void>;
  markCheckedToday: (areas: BodyRegion[]) => Promise<void>;
  
  // Helpers
  hasActiveLimitation: (area: BodyRegion) => boolean;
  getActiveLimitationAreas: () => BodyRegion[];
  refresh: () => void;
};

export function useActiveLimitations(userId: string | null): UseActiveLimitationsReturn {
  const [limitations, setLimitations] = useState<ActiveLimitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLimitations = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from("user_limitations")
        .select("*")
        .eq("user_id", userId)
        .in("status", ["active", "monitoring"])
        .order("reported_at", { ascending: false });

      if (queryError) throw queryError;

      const mapped: ActiveLimitation[] = (data || []).map((row: any) => ({
        id: row.id,
        area: row.area as BodyRegion,
        reportedAt: new Date(row.reported_at),
        lastCheckedAt: new Date(row.last_checked_at),
        status: row.status as LimitationStatus,
        workoutsModified: row.workouts_modified || 0,
        notes: row.notes,
      }));

      setLimitations(mapped);
    } catch (err) {
      console.error("Error fetching limitations:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch limitations");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchLimitations();
  }, [fetchLimitations]);

  const reportLimitation = useCallback(async (area: BodyRegion, notes?: string) => {
    if (!userId) return;

    try {
      // Check if already exists and is active
      const existing = limitations.find((l) => l.area === area && l.status !== "resolved");
      
      if (existing) {
        // Update last checked date
        await supabase
          .from("user_limitations")
          .update({ last_checked_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        // Create new limitation
        await supabase.from("user_limitations").insert({
          user_id: userId,
          area,
          status: "active",
          reported_at: new Date().toISOString(),
          last_checked_at: new Date().toISOString(),
          workouts_modified: 0,
          notes,
        });
      }

      await fetchLimitations();
    } catch (err) {
      console.error("Error reporting limitation:", err);
    }
  }, [userId, limitations, fetchLimitations]);

  const updateLimitationStatus = useCallback(async (limitationId: string, status: LimitationStatus) => {
    try {
      await supabase
        .from("user_limitations")
        .update({ status, last_checked_at: new Date().toISOString() })
        .eq("id", limitationId);

      await fetchLimitations();
    } catch (err) {
      console.error("Error updating limitation status:", err);
    }
  }, [fetchLimitations]);

  const resolveLimitation = useCallback(async (limitationId: string) => {
    await updateLimitationStatus(limitationId, "resolved");
  }, [updateLimitationStatus]);

  const recordFeedback = useCallback(async (
    limitationId: string, 
    sessionId: string, 
    feedback: LimitationFeedback
  ) => {
    try {
      // Record feedback
      await supabase.from("limitation_feedback").insert({
        limitation_id: limitationId,
        workout_session_id: sessionId,
        feedback,
        created_at: new Date().toISOString(),
      });

      // Update limitation based on feedback
      const limitation = limitations.find((l) => l.id === limitationId);
      if (limitation) {
        let newStatus: LimitationStatus = limitation.status;
        
        // If consistently better, move to monitoring
        if (feedback === "better" && limitation.status === "active") {
          newStatus = "monitoring";
        }
        // If worse, ensure it's active
        if (feedback === "worse") {
          newStatus = "active";
        }

        await supabase
          .from("user_limitations")
          .update({
            status: newStatus,
            last_checked_at: new Date().toISOString(),
            workouts_modified: (limitation.workoutsModified || 0) + 1,
          })
          .eq("id", limitationId);
      }

      await fetchLimitations();
    } catch (err) {
      console.error("Error recording feedback:", err);
    }
  }, [limitations, fetchLimitations]);

  const markCheckedToday = useCallback(async (areas: BodyRegion[]) => {
    if (!userId || areas.length === 0) return;

    try {
      // For each area, either update existing or create new
      for (const area of areas) {
        const existing = limitations.find((l) => l.area === area && l.status !== "resolved");
        
        if (existing) {
          await supabase
            .from("user_limitations")
            .update({ 
              last_checked_at: new Date().toISOString(),
              workouts_modified: (existing.workoutsModified || 0) + 1,
            })
            .eq("id", existing.id);
        } else {
          await supabase.from("user_limitations").insert({
            user_id: userId,
            area,
            status: "active",
            reported_at: new Date().toISOString(),
            last_checked_at: new Date().toISOString(),
            workouts_modified: 1,
          });
        }
      }

      await fetchLimitations();
    } catch (err) {
      console.error("Error marking limitations checked:", err);
    }
  }, [userId, limitations, fetchLimitations]);

  const hasActiveLimitation = useCallback((area: BodyRegion) => {
    return limitations.some((l) => l.area === area && l.status !== "resolved");
  }, [limitations]);

  const getActiveLimitationAreas = useCallback(() => {
    return limitations
      .filter((l) => l.status !== "resolved")
      .map((l) => l.area);
  }, [limitations]);

  return {
    limitations,
    loading,
    error,
    reportLimitation,
    updateLimitationStatus,
    resolveLimitation,
    recordFeedback,
    markCheckedToday,
    hasActiveLimitation,
    getActiveLimitationAreas,
    refresh: fetchLimitations,
  };
}

export default useActiveLimitations;
