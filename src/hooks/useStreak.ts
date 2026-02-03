/**
 * useStreak Hook
 * Fetches and manages user workout streak data
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type StreakData = {
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string | null;
  streakFreezeAvailable: boolean;
};

export function useStreak(userId: string | null) {
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastWorkoutDate: null,
    streakFreezeAvailable: true,
  });
  const [loading, setLoading] = useState(true);

  // Fetch streak data
  const fetchStreak = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_streaks")
        .select("current_streak, longest_streak, last_workout_date, streak_freeze_available")
        .eq("user_id", userId)
        .single();

      if (error) {
        // No streak record yet - that's okay
        if (error.code === "PGRST116") {
          setStreak({
            currentStreak: 0,
            longestStreak: 0,
            lastWorkoutDate: null,
            streakFreezeAvailable: true,
          });
        } else {
          console.error("Error fetching streak:", error);
        }
        return;
      }

      setStreak({
        currentStreak: data.current_streak || 0,
        longestStreak: data.longest_streak || 0,
        lastWorkoutDate: data.last_workout_date,
        streakFreezeAvailable: data.streak_freeze_available ?? true,
      });
    } catch (error) {
      console.error("Error fetching streak:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  // Check if streak is at risk (no workout yesterday or today)
  const isStreakAtRisk = useCallback(() => {
    if (!streak.lastWorkoutDate || streak.currentStreak === 0) return false;
    
    const lastDate = new Date(streak.lastWorkoutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    lastDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Streak is at risk if last workout was more than 1 day ago
    return diffDays > 1;
  }, [streak.lastWorkoutDate, streak.currentStreak]);

  // Check if worked out today
  const workedOutToday = useCallback(() => {
    if (!streak.lastWorkoutDate) return false;
    
    const lastDate = new Date(streak.lastWorkoutDate);
    const today = new Date();
    
    return (
      lastDate.getFullYear() === today.getFullYear() &&
      lastDate.getMonth() === today.getMonth() &&
      lastDate.getDate() === today.getDate()
    );
  }, [streak.lastWorkoutDate]);

  return {
    ...streak,
    loading,
    refreshStreak: fetchStreak,
    isStreakAtRisk: isStreakAtRisk(),
    workedOutToday: workedOutToday(),
  };
}

export default useStreak;
