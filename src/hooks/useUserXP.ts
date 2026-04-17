/**
 * useUserXP
 * Reads the user's current XP, level, and rank from user_xp table.
 * Uses the unified rank system from lib/ranks.ts.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { type RankName, type RankDef, getRankByLevel, getRankByName } from "@/lib/ranks";

export type { RankName, RankDef };

// Re-export for backward compat
export type Rank = RankName;

export type UserXPData = {
  totalXP: number;
  level: number;
  rank: RankDef;
  rankName: RankName;
  xpToNextLevel: number;
  xpInCurrentLevel: number;
  levelProgress: number; // 0-1
};

/**
 * Calculate XP thresholds — must match the DB function logic.
 * Level N requires (N * 500) XP to complete.
 */
function calculateLevelInfo(totalXP: number): { level: number; xpInLevel: number; xpForLevel: number } {
  let level = 1;
  let remaining = totalXP;
  let needed = 500;

  while (remaining >= needed) {
    remaining -= needed;
    level++;
    needed = level * 500;
  }

  return { level, xpInLevel: remaining, xpForLevel: needed };
}

export function useUserXP(userId: string | null) {
  const [data, setData] = useState<UserXPData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) { setLoading(false); return; }

    try {
      const { data: row, error } = await supabase
        .from("user_xp")
        .select("total_xp, level, rank")
        .eq("user_id", userId)
        .single();

      if (error || !row) {
        // No XP row yet — user hasn't earned any XP
        const defaultRank = getRankByLevel(1);
        setData({
          totalXP: 0,
          level: 1,
          rank: defaultRank,
          rankName: defaultRank.name,
          xpToNextLevel: 500,
          xpInCurrentLevel: 0,
          levelProgress: 0,
        });
        return;
      }

      const { level, xpInLevel, xpForLevel } = calculateLevelInfo(row.total_xp);
      const rank = getRankByLevel(level);

      setData({
        totalXP: row.total_xp,
        level,
        rank,
        rankName: rank.name,
        xpToNextLevel: xpForLevel - xpInLevel,
        xpInCurrentLevel: xpInLevel,
        levelProgress: xpInLevel / xpForLevel,
      });
    } catch (e) {
      console.error("Error fetching user XP:", e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { data, loading, refresh };
}
