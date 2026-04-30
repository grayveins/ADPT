/**
 * On-The-Fly Workout Generation
 *
 * Generates a personalized single-day workout using the full engine
 * when the user doesn't have a saved program. Uses their profile data
 * (goal, experience, equipment, limitations) to produce a tailored session.
 *
 * Seeded by userId + today's date so the same user gets the same workout
 * if they re-open on the same day, but a different one tomorrow.
 */

import { supabase } from "@/lib/supabase";
import { generateSingleWorkout } from "./engine/generator";
import { toActiveWorkoutFormat } from "./adapters/legacyAdapter";
import { generateDailySeed } from "./utils/seededRandom";
import type {
  ExperienceLevel,
  FitnessGoal,
  UserEquipment,
  PhysicalLimitation,
  JointArea,
} from "./generator/types";

// ============================================================================
// Types
// ============================================================================

type GeneratedSet = { id: string; weight: string; reps: string; completed: boolean };

export type GeneratedWorkoutExercise = {
  id: string;
  name: string;
  muscles: string[];
  sets: GeneratedSet[];
  targetReps: string;
  targetRIR: number;
  isExpanded: boolean;
};

export type GeneratedWorkout = {
  id: string;
  name: string;
  type: string;
  exercises: GeneratedWorkoutExercise[];
} | null;

// ============================================================================
// Mapping Helpers
// ============================================================================

/**
 * Map onboarding/profile goal strings to generator FitnessGoal
 */
function mapGoal(goal: string | null | undefined): FitnessGoal {
  switch (goal) {
    case "build_muscle": return "hypertrophy";
    case "lose_weight":
    case "lose_fat": return "fat_loss";
    case "get_stronger": return "strength";
    case "get_toned":
    case "general_fitness": return "general_fitness";
    case "endurance": return "general_fitness";
    default: return "general_fitness";
  }
}

/**
 * Map onboarding experience strings to generator ExperienceLevel
 */
function mapExperience(exp: string | null | undefined): ExperienceLevel {
  if (!exp) return "intermediate";
  const lower = exp.toLowerCase();
  if (lower.includes("beginner") || lower.includes("new") || lower === "none") return "beginner";
  if (lower.includes("advanced") || lower.includes("expert")) return "advanced";
  return "intermediate";
}

/**
 * Map workout type string (from weekly plan) to generator workout type
 */
function mapWorkoutType(type: string): "push" | "pull" | "legs" | "upper" | "lower" | "full" {
  const lower = type.toLowerCase();
  if (lower.includes("push")) return "push";
  if (lower.includes("pull")) return "pull";
  if (lower.includes("leg")) return "legs";
  if (lower.includes("upper")) return "upper";
  if (lower.includes("lower")) return "lower";
  return "full";
}

/**
 * Map onboarding equipment selections to generator UserEquipment
 */
function mapEquipment(equipment: string[] | null | undefined): UserEquipment[] {
  if (!equipment || equipment.length === 0) {
    // Default: assume a standard gym
    return ["barbell", "dumbbells", "cables", "machines", "bench", "squat_rack", "pull_up_bar"];
  }

  const mapping: Record<string, UserEquipment> = {
    barbell: "barbell",
    dumbbells: "dumbbells",
    dumbbell: "dumbbells",
    cables: "cables",
    cable: "cables",
    machines: "machines",
    machine: "machines",
    kettlebells: "kettlebells",
    kettlebell: "kettlebells",
    "pull up bar": "pull_up_bar",
    "pull-up bar": "pull_up_bar",
    pullup_bar: "pull_up_bar",
    pull_up_bar: "pull_up_bar",
    "resistance bands": "resistance_bands",
    resistance_bands: "resistance_bands",
    bench: "bench",
    "squat rack": "squat_rack",
    squat_rack: "squat_rack",
    rack: "squat_rack",
    "leg press": "leg_press",
    leg_press: "leg_press",
    "lat pulldown": "lat_pulldown",
    lat_pulldown: "lat_pulldown",
    bodyweight: "bodyweight_only",
    bodyweight_only: "bodyweight_only",
    "bodyweight only": "bodyweight_only",
  };

  const result: UserEquipment[] = [];
  for (const item of equipment) {
    const mapped = mapping[item.toLowerCase().trim()];
    if (mapped && !result.includes(mapped)) {
      result.push(mapped);
    }
  }

  // If user selected gym equipment, also include bench (it's implied)
  if (result.includes("barbell") && !result.includes("bench")) {
    result.push("bench");
  }
  if (result.includes("barbell") && !result.includes("squat_rack")) {
    result.push("squat_rack");
  }

  return result.length > 0 ? result : ["bodyweight_only"];
}

/**
 * Map onboarding limitation strings to generator PhysicalLimitation
 */
function mapLimitations(limitations: string[] | null | undefined): PhysicalLimitation[] {
  if (!limitations || limitations.length === 0 || limitations.includes("none")) {
    return [];
  }

  const areaMapping: Record<string, JointArea> = {
    knees: "knee",
    knee: "knee",
    back: "lower_back",
    lower_back: "lower_back",
    shoulder: "shoulder",
    shoulders: "shoulder",
    hips: "hip",
    hip: "hip",
    wrists: "wrist",
    wrist: "wrist",
    elbow: "elbow",
    elbows: "elbow",
    ankle: "ankle",
    ankles: "ankle",
  };

  const result: PhysicalLimitation[] = [];
  for (const item of limitations) {
    const mapped = areaMapping[item.toLowerCase().trim()];
    if (mapped) {
      result.push({ area: mapped, severity: "moderate" });
    }
  }
  return result;
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Generate a personalized workout on-the-fly for a user.
 *
 * Fetches the user's profile/onboarding data from Supabase, maps it to
 * the generator's input format, generates a single-day workout, and
 * converts it to the format active.tsx expects.
 *
 * @param userId - Supabase user ID
 * @param workoutType - The type of workout (Push, Pull, Legs, Upper, Lower, Full Body)
 * @param painAreas - Pain areas from pre-workout check-in (optional)
 * @returns A WorkoutData-compatible object, or null if generation fails
 */
export async function generateWorkoutOnTheFly(
  userId: string,
  workoutType: string,
  painAreas: string[] = [],
): Promise<GeneratedWorkout> {
  try {
    // 1. Fetch profile + onboarding data
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_data, training_style, goal")
      .eq("id", userId)
      .single();

    const onboarding = (profile?.onboarding_data ?? {}) as Record<string, any>;

    // 2. Build generator input from profile data
    const goal = mapGoal(onboarding.goal ?? profile?.goal);
    const experience = mapExperience(onboarding.experienceLevel ?? onboarding.experience);
    const equipment = mapEquipment(onboarding.equipment ?? onboarding.availableEquipment);
    const engineType = mapWorkoutType(workoutType);

    // Combine onboarding limitations with pre-workout pain areas
    const baseLimitations = mapLimitations(onboarding.limitations);
    const painLimitations = mapLimitations(painAreas);
    const allLimitations = [...baseLimitations];
    for (const pain of painLimitations) {
      if (!allLimitations.some((l) => l.area === pain.area)) {
        allLimitations.push(pain);
      }
    }

    // 3. Generate seeded workout (same user + same day = same workout)
    const seed = generateDailySeed(userId, new Date());

    const dayPlan = generateSingleWorkout({
      userId,
      experienceLevel: experience,
      fitnessGoal: goal,
      sessionDurationMinutes: (onboarding.sessionDuration as 30 | 45 | 60 | 75 | 90) ?? 60,
      availableEquipment: equipment,
      physicalLimitations: allLimitations,
      splitPreference: "auto",
      seed,
      workoutType: engineType,
    });

    if (!dayPlan || !dayPlan.exercises || dayPlan.exercises.length === 0) {
      console.warn("[generateOnTheFly] Generator returned no exercises, falling back");
      return null;
    }

    // 4. Convert to active workout format
    const activeFormat = toActiveWorkoutFormat(dayPlan);

    // 5. Map to the ExerciseData shape that active.tsx uses
    const exercises: GeneratedWorkoutExercise[] = activeFormat.exercises.map((ex, index) => ({
      id: ex.id,
      name: ex.name,
      muscles: ex.muscleGroup ? [ex.muscleGroup] : [],
      sets: ex.sets.map((s) => ({
        id: s.id,
        weight: "",
        reps: "",
        completed: false,
      })),
      targetReps: dayPlan.exercises![index]?.reps ?? "8-10",
      targetRIR: dayPlan.exercises![index]?.rirTarget ?? 2,
      isExpanded: index === 0,
    }));

    return {
      id: `workout-${Date.now()}`,
      name: dayPlan.name || workoutType,
      type: workoutType,
      exercises,
    };
  } catch (err) {
    console.error("[generateOnTheFly] Error:", err);
    return null;
  }
}
