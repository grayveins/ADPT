import type { WorkoutSet } from "@/lib/workout/types";

export const getSetVolume = (set: WorkoutSet) => {
  if (set.weight == null || set.reps == null) return 0;
  return set.weight * set.reps;
};

export const getMaxVolume = (sets: WorkoutSet[]) =>
  sets.reduce((max, set) => Math.max(max, getSetVolume(set)), 0);

export const getTotalVolume = (sets: WorkoutSet[]) =>
  sets.reduce((total, set) => total + getSetVolume(set), 0);

export const getVolumePercent = (volume: number, max: number) => {
  if (!max) return 0;
  return Math.max(0, Math.min(1, volume / max));
};

export const formatVolume = (volume: number) => volume.toLocaleString("en-US");

export const formatRestTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const mm = String(mins).padStart(2, "0");
  const ss = String(secs).padStart(2, "0");
  return `${mm}:${ss}`;
};
