export type StrengthScoreResult = { totalScore: number };
export type MilestoneRarity = "common" | "rare" | "epic" | "legendary";
export type Milestone = { id: string; name: string; rarity: MilestoneRarity };
export const TOTAL_MILESTONES = 0;
export function calculateStrengthScore() { return { totalScore: 0 }; }
export function checkMilestones() { return []; }
export function getUnlockedMilestones() { return []; }
