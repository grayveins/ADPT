/**
 * Unified Rank System — Single Source of Truth
 *
 * Solo Leveling / anime-inspired progression ranks.
 * One rank system used everywhere: XP levels, strength score display,
 * share cards, celebrations, badges.
 *
 * 8 tiers: Bronze → Silver → Gold → Platinum → Elite → Titan → Apex → Evolved
 * Rank is determined by XP level (from user_xp table).
 */

import type { ImageSourcePropType } from "react-native";

// ─── Rank Images ────────────────────────────────────────────────────────────

const RANK_IMAGES = {
  bronze: require("@/assets/ranks/bronze.png"),
  silver: require("@/assets/ranks/silver.png"),
  gold: require("@/assets/ranks/gold.png"),
  platinum: require("@/assets/ranks/platinum.png"),
  elite: require("@/assets/ranks/elite.png"),
  titan: require("@/assets/ranks/titan.png"),
  apex: require("@/assets/ranks/apex.png"),
  evolved: require("@/assets/ranks/evolved.png"),
} as const;

// ─── Types ──────────────────────────────────────────────────────────────────

export type RankName =
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Platinum"
  | "Elite"
  | "Titan"
  | "Apex"
  | "Evolved";

export type RankDef = {
  name: RankName;
  key: keyof typeof RANK_IMAGES;
  color: string;
  glow: string;
  minLevel: number;
  image: ImageSourcePropType;
};

// ─── Rank Definitions ───────────────────────────────────────────────────────

export const RANKS: readonly RankDef[] = [
  { name: "Bronze",   key: "bronze",   color: "#CD7F32", glow: "#CD7F3225", minLevel: 1,  image: RANK_IMAGES.bronze },
  { name: "Silver",   key: "silver",   color: "#C0C0C0", glow: "#C0C0C020", minLevel: 5,  image: RANK_IMAGES.silver },
  { name: "Gold",     key: "gold",     color: "#FFD700", glow: "#FFD70025", minLevel: 10, image: RANK_IMAGES.gold },
  { name: "Platinum", key: "platinum", color: "#3B82F6", glow: "#3B82F620", minLevel: 20, image: RANK_IMAGES.platinum },
  { name: "Elite",    key: "elite",    color: "#8B5CF6", glow: "#8B5CF620", minLevel: 30, image: RANK_IMAGES.elite },
  { name: "Titan",    key: "titan",    color: "#EF4444", glow: "#EF444425", minLevel: 40, image: RANK_IMAGES.titan },
  { name: "Apex",     key: "apex",     color: "#F59E0B", glow: "#F59E0B25", minLevel: 55, image: RANK_IMAGES.apex },
  { name: "Evolved",  key: "evolved",  color: "#3B82F6", glow: "#3B82F630", minLevel: 75, image: RANK_IMAGES.evolved },
] as const;

// ─── Lookups ────────────────────────────────────────────────────────────────

/** Get rank for a given XP level (default: Bronze) */
export function getRankByLevel(level: number): RankDef {
  // Walk backwards — first rank whose minLevel <= level
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (level >= RANKS[i].minLevel) return RANKS[i];
  }
  return RANKS[0];
}

/** Get rank by name (case-insensitive) */
export function getRankByName(name: string): RankDef {
  const lower = name.toLowerCase();
  return RANKS.find(r => r.name.toLowerCase() === lower) || RANKS[0];
}

/** Get the next rank above the current level, or null if Evolved */
export function getNextRank(level: number): RankDef | null {
  const current = getRankByLevel(level);
  const idx = RANKS.indexOf(current);
  return idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
}

/** Get the next rank above a given rank name, or null if already top */
export function getNextRankByName(name: string): RankDef | null {
  const current = getRankByName(name);
  const idx = RANKS.indexOf(current);
  return idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
}

/** Levels remaining until next rank, or 0 if Evolved */
export function levelsToNextRank(level: number): number {
  const next = getNextRank(level);
  if (!next) return 0;
  return Math.max(next.minLevel - level, 0);
}
