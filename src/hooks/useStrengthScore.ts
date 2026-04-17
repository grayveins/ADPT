/**
 * useStrengthScore Hook
 * Combines PR data with user profile to calculate the ADPT Strength Score
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { usePRs } from "@/src/hooks/usePRs";
import {
  calculateStrengthScore,
  type StrengthScoreResult,
  type Sex,
} from "@/lib/strengthScore";

type ProfileData = {
  weight_kg: number | null;
  sex: Sex;
};

export function useStrengthScore(userId: string | null) {
  const { prs, loading: prsLoading } = usePRs(userId);
  const [profile, setProfile] = useState<ProfileData>({
    weight_kg: null,
    sex: null,
  });
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfileLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("weight_kg, sex")
        .eq("id", userId)
        .single();

      if (error) {
        if (error.code !== "PGRST116") {
          console.error("Error fetching profile for strength score:", error);
        }
        return;
      }

      setProfile({
        weight_kg: data.weight_kg,
        sex: data.sex as Sex,
      });
    } catch (error) {
      console.error("Error fetching profile for strength score:", error);
    } finally {
      setProfileLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const score = useMemo<StrengthScoreResult | null>(() => {
    if (prsLoading || profileLoading) return null;

    const bodyweightLbs = profile.weight_kg
      ? profile.weight_kg * 2.20462
      : 0;

    return calculateStrengthScore({
      prs,
      bodyweightLbs,
      sex: profile.sex,
    });
  }, [prs, prsLoading, profileLoading, profile.weight_kg, profile.sex]);

  const loading = prsLoading || profileLoading;

  const refreshScore = useCallback(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    score,
    loading,
    refreshScore,
  };
}

export default useStrengthScore;
