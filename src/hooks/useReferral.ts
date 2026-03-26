/**
 * useReferral Hook
 * Manages the referral/invite system — generates codes, tracks referrals, shares invites.
 */

import { useState, useEffect, useCallback } from "react";
import { Share } from "react-native";
import { supabase } from "@/lib/supabase";

export type ReferralData = {
  referralCode: string;
  referralUrl: string;
  totalReferred: number;
  xpEarned: number;
  loading: boolean;
};

const XP_PER_REFERRAL = 500;

function generateCode(name: string): string {
  const prefix = (name || "USER").slice(0, 4).toUpperCase();
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const suffix =
    chars[Math.floor(Math.random() * chars.length)] +
    chars[Math.floor(Math.random() * chars.length)];
  return `ADPT-${prefix}-${suffix}`;
}

export function useReferral(userId: string | null) {
  const [referralCode, setReferralCode] = useState("");
  const [totalReferred, setTotalReferred] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchOrCreateCode = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // Check if user already has a referral code
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("referral_code, display_name, full_name")
        .eq("id", userId)
        .single();

      if (profileError) {
        if (profileError.code !== "PGRST116") {
          console.error("Error fetching referral code:", profileError);
        }
        setLoading(false);
        return;
      }

      if (profile.referral_code) {
        setReferralCode(profile.referral_code);
      } else {
        // Generate and save a new code
        const name = profile.display_name || profile.full_name || "USER";
        const code = generateCode(name);

        const { error: updateError } = await supabase
          .from("profiles")
          .update({ referral_code: code })
          .eq("id", userId);

        if (updateError) {
          console.error("Error saving referral code:", updateError);
        } else {
          setReferralCode(code);
        }
      }

      // Fetch referral count
      const { count, error: countError } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (countError) {
        // Table might not exist yet — silently return 0
        setTotalReferred(0);
      } else {
        setTotalReferred(count ?? 0);
      }
    } catch (error) {
      console.error("Error in useReferral:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchOrCreateCode();
  }, [fetchOrCreateCode]);

  const xpEarned = totalReferred * XP_PER_REFERRAL;

  const referralUrl = referralCode
    ? `https://adpt.fit/invite/${referralCode}`
    : "";

  const shareReferral = useCallback(async () => {
    if (!referralCode) return;

    try {
      await Share.share({
        message: `Train smarter with ADPT. Use my code ${referralCode} for a free week of Pro. ${referralUrl}`,
      });
    } catch {
      // User cancelled or share failed — no action needed
    }
  }, [referralCode, referralUrl]);

  const referral: ReferralData = {
    referralCode,
    referralUrl,
    totalReferred,
    xpEarned,
    loading,
  };

  return {
    referral,
    shareReferral,
    refresh: fetchOrCreateCode,
  };
}

export default useReferral;
