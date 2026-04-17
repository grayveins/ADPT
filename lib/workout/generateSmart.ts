/**
 * Smart Workout Generation
 *
 * Enhanced version of generateOnTheFly that uses behavioral data
 * (from useUserInsights) to override stale onboarding answers.
 *
 * Priority chain:
 * 1. Behavioral insights (actual training patterns)
 * 2. Onboarding data (self-reported)
 * 3. Sensible defaults
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
import type { GeneratedWorkout, GeneratedWorkoutExercise } from "./generateOnTheFly";
import type { UserInsights } from "@/src/hooks/useUserInsights";

// Re-use the mapping helpers
function mapGoal(goal: string | null | undefined): FitnessGoal {
  switch (goal) {
    case "build_muscle": return "hypertrophy";
    case "lose_weight":
    case "lose_fat": return "fat_loss";
    case "get_stronger": return "strength";
    case "get_toned":
    case "general_fitness": return "general_fitness";
    default: return "general_fitness";
  }
}

function mapExperience(exp: string | null | undefined): ExperienceLevel {
  if (!exp) return "intermediate";
  const lower = exp.toLowerCase();
  if (lower.includes("beginner") || lower.includes("new") || lower === "none") return "beginner";
  if (lower.includes("advanced") || lower.includes("expert")) return "advanced";
  return "intermediate";
}

function mapEquipment(equipment: string[] | null | undefined): UserEquipment[] {
  if (!equipment || equipment.length === 0) {
    return ["barbell", "dumbbells", "cables", "machines", "bench", "squat_rack", "pull_up_bar"];
  }

  const mapping: Record<string, UserEquipment> = {
    barbell: "barbell", dumbbells: "dumbbells", dumbbell: "dumbbells",
    cables: "cables", cable: "cables", machines: "machines", machine: "machines",
    kettlebells: "kettlebells", kettlebell: "kettlebells",
    "pull up bar": "pull_up_bar", "pull-up bar": "pull_up_bar", pull_up_bar: "pull_up_bar",
    "resistance bands": "resistance_bands", resistance_bands: "resistance_bands",
    bench: "bench", "squat rack": "squat_rack", squat_rack: "squat_rack", rack: "squat_rack",
    "leg press": "leg_press", leg_press: "leg_press",
    "lat pulldown": "lat_pulldown", lat_pulldown: "lat_pulldown",
    bodyweight: "bodyweight_only", bodyweight_only: "bodyweight_only",
  };

  const result: UserEquipment[] = [];
  for (const item of equipment) {
    const mapped = mapping[item.toLowerCase().trim()];
    if (mapped && !result.includes(mapped)) result.push(mapped);
  }
  if (result.includes("barbell") && !result.includes("bench")) result.push("bench");
  if (result.includes("barbell") && !result.includes("squat_rack")) result.push("squat_rack");
  return result.length > 0 ? result : ["bodyweight_only"];
}

function mapLimitations(limitations: string[] | null | undefined): PhysicalLimitation[] {
  if (!limitations || limitations.length === 0 || limitations.includes("none")) return [];
  const areaMapping: Record<string, JointArea> = {
    knees: "knee", knee: "knee", back: "lower_back", lower_back: "lower_back",
    shoulder: "shoulder", shoulders: "shoulder", hips: "hip", hip: "hip",
    wrists: "wrist", wrist: "wrist", elbow: "elbow", elbows: "elbow",
    ankle: "ankle", ankles: "ankle",
  };
  const result: PhysicalLimitation[] = [];
  for (const item of limitations) {
    const mapped = areaMapping[item.toLowerCase().trim()];
    if (mapped) result.push({ area: mapped, severity: "moderate" });
  }
  return result;
}

/**
 * Infer the best workout type for today based on behavioral data.
 * Looks at what muscle groups were trained recently to suggest the next one.
 */
function inferWorkoutType(
  insights: UserInsights | null,
  splitPreference: string | null,
  dayOfWeek: number
): "push" | "pull" | "legs" | "upper" | "lower" | "full" {
  // If user prefers a specific split, rotate through it by day of week
  if (splitPreference === "ppl") {
    const rotation: ("push" | "pull" | "legs")[] = ["push", "pull", "legs"];
    return rotation[dayOfWeek % 3];
  }
  if (splitPreference === "upper_lower") {
    return dayOfWeek % 2 === 0 ? "upper" : "lower";
  }
  // Default: full body
  return "full";
}

/**
 * Infer session duration from actual behavior instead of onboarding answer.
 */
function inferSessionDuration(
  insights: UserInsights | null,
  onboardingDuration: number | null
): 30 | 45 | 60 | 75 | 90 {
  // Prefer behavioral data
  if (insights?.averageSessionDuration) {
    const avg = insights.averageSessionDuration;
    if (avg <= 35) return 30;
    if (avg <= 50) return 45;
    if (avg <= 67) return 60;
    if (avg <= 82) return 75;
    return 90;
  }
  // Fall back to onboarding
  const d = onboardingDuration ?? 60;
  if (d <= 30) return 30;
  if (d <= 45) return 45;
  if (d <= 60) return 60;
  if (d <= 75) return 75;
  return 90;
}

// ============================================================================
// Main Export
// ============================================================================

export type SmartGenerateOptions = {
  userId: string;
  /** Behavioral insights — pass null if not yet loaded */
  insights: UserInsights | null;
  /** Override workout type (e.g., from weekly plan). If null, inferred from behavior. */
  workoutType?: string;
  /** Pre-workout pain areas */
  painAreas?: string[];
  /** Force a new seed (for "regenerate" / "shuffle" button) */
  forceSeed?: number;
};

export async function generateSmartWorkout({
  userId,
  insights,
  workoutType,
  painAreas = [],
  forceSeed,
}: SmartGenerateOptions): Promise<GeneratedWorkout> {
  try {
    // 1. Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_data, training_style, goal")
      .eq("id", userId)
      .single();

    const onboarding = (profile?.onboarding_data ?? {}) as Record<string, any>;

    // 2. Map with behavioral overrides
    const goal = mapGoal(onboarding.goal ?? profile?.goal);
    const experience = mapExperience(onboarding.experienceLevel ?? onboarding.experience);
    const equipment = mapEquipment(onboarding.equipment ?? onboarding.availableEquipment);

    const splitPref = onboarding.splitPreference ?? null;
    const dayOfWeek = new Date().getDay();

    const engineType = workoutType
      ? mapWorkoutTypeString(workoutType)
      : inferWorkoutType(insights, splitPref, dayOfWeek);

    const sessionDuration = inferSessionDuration(
      insights,
      onboarding.sessionDuration ?? onboarding.workoutDuration ?? null
    );

    // Combine limitations
    const baseLimitations = mapLimitations(onboarding.limitations);
    const painLimitations = mapLimitations(painAreas);
    const allLimitations = [...baseLimitations];
    for (const pain of painLimitations) {
      if (!allLimitations.some((l) => l.area === pain.area)) {
        allLimitations.push(pain);
      }
    }

    // 3. Generate with seed
    const seed = forceSeed ?? generateDailySeed(userId, new Date());

    const dayPlan = generateSingleWorkout({
      userId,
      experienceLevel: experience,
      fitnessGoal: goal,
      sessionDurationMinutes: sessionDuration,
      availableEquipment: equipment,
      physicalLimitations: allLimitations,
      splitPreference: "auto",
      seed,
      workoutType: engineType,
    });

    if (!dayPlan?.exercises?.length) {
      console.warn("[generateSmart] No exercises generated");
      return null;
    }

    // 4. Convert to active format
    const activeFormat = toActiveWorkoutFormat(dayPlan);

    const exercises: GeneratedWorkoutExercise[] = activeFormat.exercises.map((ex, i) => ({
      id: ex.id,
      name: ex.name,
      muscles: ex.muscleGroup ? [ex.muscleGroup] : [],
      sets: ex.sets.map((s) => ({
        id: s.id,
        weight: "",
        reps: "",
        completed: false,
      })),
      targetReps: dayPlan.exercises![i]?.reps ?? "8-10",
      targetRIR: dayPlan.exercises![i]?.rirTarget ?? 2,
      isExpanded: i === 0,
    }));

    return {
      id: `workout-${Date.now()}`,
      name: dayPlan.name || engineType,
      type: engineType,
      exercises,
    };
  } catch (err) {
    console.error("[generateSmart] Error:", err);
    return null;
  }
}

function mapWorkoutTypeString(type: string): "push" | "pull" | "legs" | "upper" | "lower" | "full" {
  const lower = type.toLowerCase();
  if (lower.includes("push")) return "push";
  if (lower.includes("pull")) return "pull";
  if (lower.includes("leg")) return "legs";
  if (lower.includes("upper")) return "upper";
  if (lower.includes("lower")) return "lower";
  return "full";
}
