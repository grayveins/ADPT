/**
 * Smart Workout Scheduler
 *
 * Decides what workout the user should do today based on:
 * 1. Their split preference (PPL, Upper/Lower, Full Body)
 * 2. What muscles they trained recently (recovery)
 * 3. How many workouts they've done this week vs their target
 * 4. Day of the week patterns
 *
 * Returns a workout type + name that gets passed to the generator.
 * The user never has to think about it — ADPT just decides.
 */

import { supabase } from "@/lib/supabase";
import { differenceInDays } from "date-fns";

// =============================================================================
// TYPES
// =============================================================================

export type TodaysWorkout = {
  type: string;        // "Push", "Pull", "Legs", "Upper", "Lower", "Full Body"
  name: string;        // Display name: "Push Day", "Upper Body", etc.
  focus: string;       // "Chest, Shoulders, Triceps"
  isRest: boolean;     // True if today should be a rest day
  reason: string;      // Why this was chosen (for transparency/debugging)
};

type MuscleRecoveryMap = Record<string, number>; // muscle → days since last trained

// =============================================================================
// SPLIT ROTATIONS
// =============================================================================

const SPLIT_ROTATIONS: Record<string, { type: string; name: string; focus: string }[]> = {
  ppl: [
    { type: "Push", name: "Push Day", focus: "Chest, Shoulders, Triceps" },
    { type: "Pull", name: "Pull Day", focus: "Back, Biceps, Rear Delts" },
    { type: "Legs", name: "Leg Day", focus: "Quads, Hamstrings, Glutes" },
  ],
  upper_lower: [
    { type: "Upper", name: "Upper Body", focus: "Chest, Back, Shoulders, Arms" },
    { type: "Lower", name: "Lower Body", focus: "Quads, Hamstrings, Glutes, Calves" },
  ],
  full_body: [
    { type: "Full Body", name: "Full Body", focus: "All Major Muscle Groups" },
  ],
};

// Muscle groups involved in each workout type
const TYPE_MUSCLES: Record<string, string[]> = {
  Push:       ["Chest", "Shoulders", "Arms"],
  Pull:       ["Back", "Arms"],
  Legs:       ["Legs"],
  Upper:      ["Chest", "Back", "Shoulders", "Arms"],
  Lower:      ["Legs"],
  "Full Body": ["Chest", "Back", "Shoulders", "Arms", "Legs", "Core"],
};

// =============================================================================
// MAIN FUNCTION
// =============================================================================

/**
 * Determine today's workout for a user.
 *
 * Logic:
 * 1. If they've hit their weekly target → rest day
 * 2. If they trained yesterday's muscle groups → pick a different group
 * 3. Follow their split rotation, advancing based on last workout type
 * 4. Default to the least-recently-trained muscle group
 */
export async function scheduleTodaysWorkout(userId: string): Promise<TodaysWorkout> {
  try {
    // Fetch user profile + recent sessions in parallel
    const [{ data: profile }, { data: recentSessions }] = await Promise.all([
      supabase
        .from("profiles")
        .select("onboarding_data, goal")
        .eq("id", userId)
        .single(),
      supabase
        .from("workout_sessions")
        .select(`
          id, title, started_at,
          workout_exercises ( exercise_name, muscle_group )
        `)
        .eq("user_id", userId)
        .order("started_at", { ascending: false })
        .limit(10),
    ]);

    const onboarding = (profile?.onboarding_data ?? {}) as Record<string, any>;
    const splitPref: string = onboarding.splitPreference || "auto";
    const workoutsPerWeek: number = onboarding.workoutsPerWeek || 4;

    // Count workouts this week
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
    startOfWeek.setHours(0, 0, 0, 0);

    const sessionsThisWeek = (recentSessions || []).filter(
      (s: any) => new Date(s.started_at) >= startOfWeek
    );

    // If they've hit their target, suggest rest
    if (sessionsThisWeek.length >= workoutsPerWeek) {
      return {
        type: "Rest",
        name: "Rest Day",
        focus: "Recovery",
        isRest: true,
        reason: `You've completed ${sessionsThisWeek.length}/${workoutsPerWeek} workouts this week`,
      };
    }

    // Build muscle recovery map — days since each muscle was last trained
    const muscleRecovery: MuscleRecoveryMap = {};
    for (const session of recentSessions || []) {
      const sessionDate = new Date(session.started_at);
      const daysSince = differenceInDays(now, sessionDate);
      for (const ex of (session as any).workout_exercises || []) {
        const muscle = ex.muscle_group;
        if (muscle && (muscleRecovery[muscle] === undefined || daysSince < muscleRecovery[muscle])) {
          muscleRecovery[muscle] = daysSince;
        }
      }
    }

    // Determine split type
    const split = resolveSplit(splitPref, workoutsPerWeek);
    const rotation = SPLIT_ROTATIONS[split];

    // Find the last workout type to advance the rotation
    const lastSession = recentSessions?.[0];
    const lastTitle = (lastSession?.title || "").toLowerCase();
    const lastType = guessLastType(lastTitle, split);

    // Pick next in rotation
    const nextWorkout = pickNextWorkout(rotation, lastType, muscleRecovery);

    return {
      ...nextWorkout,
      isRest: false,
      reason: `Next in your ${split.replace("_", "/")} rotation`,
    };
  } catch (e) {
    console.error("Error scheduling workout:", e);
    // Fallback: full body
    return {
      type: "Full Body",
      name: "Full Body",
      focus: "All Major Muscle Groups",
      isRest: false,
      reason: "Default fallback",
    };
  }
}

// =============================================================================
// HELPERS
// =============================================================================

/** Resolve "auto" split preference to a concrete split based on days/week */
function resolveSplit(pref: string, daysPerWeek: number): string {
  if (pref !== "auto") return pref;

  if (daysPerWeek <= 3) return "full_body";
  if (daysPerWeek <= 4) return "upper_lower";
  return "ppl";
}

/** Guess what type the last workout was based on its title */
function guessLastType(title: string, split: string): string | null {
  for (const day of SPLIT_ROTATIONS[split] || []) {
    if (title.includes(day.type.toLowerCase())) return day.type;
  }
  return null;
}

/** Pick the next workout in the rotation, considering recovery */
function pickNextWorkout(
  rotation: { type: string; name: string; focus: string }[],
  lastType: string | null,
  recovery: MuscleRecoveryMap
): { type: string; name: string; focus: string } {
  if (rotation.length === 1) return rotation[0];

  // Find where we are in the rotation
  let lastIndex = -1;
  if (lastType) {
    lastIndex = rotation.findIndex((r) => r.type === lastType);
  }

  // Next in rotation
  const nextIndex = (lastIndex + 1) % rotation.length;
  const candidate = rotation[nextIndex];

  // Check if the candidate's muscles are recovered enough (at least 1 day)
  const candidateMuscles = TYPE_MUSCLES[candidate.type] || [];
  const isTooSoon = candidateMuscles.some((m) => (recovery[m] ?? 99) < 1);

  if (isTooSoon && rotation.length > 2) {
    // Skip to the one after — find one that IS recovered
    for (let i = 1; i < rotation.length; i++) {
      const alt = rotation[(nextIndex + i) % rotation.length];
      const altMuscles = TYPE_MUSCLES[alt.type] || [];
      const altRecovered = !altMuscles.some((m) => (recovery[m] ?? 99) < 1);
      if (altRecovered) {
        return alt;
      }
    }
  }

  // Default: go with the next in rotation even if slightly under-recovered
  return candidate;
}
