/**
 * Coach Context Builder
 * 
 * Builds comprehensive user context for the AI coach from Supabase data.
 * Supports two modes:
 * - Lite: Minimal context for quick questions
 * - Full: Complete context for personalized recommendations
 * 
 * Uses caching to reduce database load.
 */

import { supabase } from "./supabase";
import { 
  getCachedContext, 
  setCachedContext 
} from "./coachContextCache";
import {
  type LiteCoachContext,
  type FullCoachContext,
  type LimitationsContext,
  type UserProfile,
  type TrainingPreferences,
  type EquipmentContext,
  type StrengthContext,
  type RecentWorkout,
  type ProgressContext,
  type TodayContext,
  type PRData,
  type PainLocation,
  type PostWorkoutFeeling,
  type Goal,
  type ExperienceLevel,
  type Sex,
  calculateE1RM,
  kgToLbs,
  calculateAge,
} from "@/src/types/coachContext";
import { differenceInDays, differenceInHours, parseISO, startOfWeek, subWeeks } from "date-fns";

// ============================================================================
// Main Builder Functions
// ============================================================================

/**
 * Get full coach context for a user
 * Uses cache if available and not expired
 */
export async function getFullCoachContext(userId: string): Promise<FullCoachContext> {
  // Check cache first
  const cached = await getCachedContext(userId);
  if (cached) {
    return cached;
  }
  
  // Build fresh context
  const context = await buildFullContext(userId);
  
  // Store in cache
  await setCachedContext(userId, context);
  
  return context;
}

/**
 * Get lite coach context for a user
 * Extracts minimal data from full context
 */
export async function getLiteCoachContext(userId: string): Promise<LiteCoachContext> {
  const full = await getFullCoachContext(userId);
  
  return {
    mode: "lite",
    name: full.profile.name,
    goal: full.training.goal,
    experienceLevel: full.training.experienceLevel,
    limitations: full.limitations,
    currentStreak: full.progress.currentStreak,
    daysSinceLastWorkout: full.today.daysSinceLastWorkout,
    isRestDay: full.today.isRestDay,
  };
}

// ============================================================================
// Internal Builder Functions
// ============================================================================

/**
 * Build complete context from database
 */
async function buildFullContext(userId: string): Promise<FullCoachContext> {
  // Fetch all data in parallel for performance
  const [
    profileData,
    streakData,
    recentWorkoutsData,
    prData,
    painReportsData,
    workoutCountsData,
  ] = await Promise.all([
    fetchProfileData(userId),
    fetchStreakData(userId),
    fetchRecentWorkouts(userId, 5),
    fetchPRData(userId),
    fetchRecentPainReports(userId),
    fetchWorkoutCounts(userId),
  ]);

  // Build sub-contexts
  const profile = buildUserProfile(profileData);
  const training = buildTrainingPreferences(profileData);
  const limitations = buildLimitationsContext(profileData, painReportsData);
  const equipment = buildEquipmentContext(profileData);
  const strength = buildStrengthContext(prData);
  const recentWorkouts = buildRecentWorkouts(recentWorkoutsData);
  const progress = buildProgressContext(streakData, workoutCountsData, prData);
  const today = buildTodayContext(profileData, recentWorkoutsData);

  return {
    mode: "full",
    profile,
    training,
    limitations,
    equipment,
    strength,
    recentWorkouts,
    progress,
    today,
  };
}

// ============================================================================
// Data Fetching Functions
// ============================================================================

interface ProfileRow {
  first_name: string | null;
  sex: string | null;
  birth_year: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  goal: string | null;
  activity_level: string | null;
  onboarding_data: {
    goal?: string;
    goalTimeline?: string;
    experienceLevel?: string;
    workoutsPerWeek?: number;
    workoutDuration?: number;
    splitPreference?: string;
    preferredDays?: string[];
    limitations?: string[];
    limitationsOtherText?: string;
    gymType?: string;
    availableEquipment?: string[];
    bestLifts?: {
      bench?: { weight?: number; reps?: number };
      squat?: { weight?: number; reps?: number };
      deadlift?: { weight?: number; reps?: number };
      ohp?: { weight?: number; reps?: number };
    };
  } | null;
}

async function fetchProfileData(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("first_name, sex, birth_year, height_cm, weight_kg, goal, activity_level, onboarding_data")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("[CoachContextBuilder] Error fetching profile:", error);
    return null;
  }

  return data as ProfileRow;
}

interface StreakRow {
  current_streak: number;
  longest_streak: number;
  last_workout_date: string | null;
}

async function fetchStreakData(userId: string): Promise<StreakRow | null> {
  const { data, error } = await supabase
    .from("user_streaks")
    .select("current_streak, longest_streak, last_workout_date")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") { // PGRST116 = no rows
    console.error("[CoachContextBuilder] Error fetching streak:", error);
  }

  return data;
}

interface WorkoutSessionRow {
  id: string;
  title: string;
  started_at: string;
  ended_at: string | null;
  post_workout_feeling: string | null;
  pain_location: string | null;
}

interface WorkoutExerciseRow {
  exercise_name: string;
  muscle_group: string;
}

async function fetchRecentWorkouts(
  userId: string, 
  limit: number
): Promise<(WorkoutSessionRow & { exercises: WorkoutExerciseRow[] })[]> {
  // Fetch sessions
  const { data: sessions, error: sessionsError } = await supabase
    .from("workout_sessions")
    .select("id, title, started_at, ended_at, post_workout_feeling, pain_location")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (sessionsError) {
    console.error("[CoachContextBuilder] Error fetching workouts:", sessionsError);
    return [];
  }

  if (!sessions || sessions.length === 0) {
    return [];
  }

  // Fetch exercises for each session
  const sessionIds = sessions.map(s => s.id);
  const { data: exercises, error: exercisesError } = await supabase
    .from("workout_exercises")
    .select("session_id, exercise_name, muscle_group")
    .in("session_id", sessionIds);

  if (exercisesError) {
    console.error("[CoachContextBuilder] Error fetching exercises:", exercisesError);
  }

  // Map exercises to sessions
  const exerciseMap = new Map<string, WorkoutExerciseRow[]>();
  for (const ex of exercises || []) {
    const sessionExercises = exerciseMap.get(ex.session_id) || [];
    sessionExercises.push({ exercise_name: ex.exercise_name, muscle_group: ex.muscle_group });
    exerciseMap.set(ex.session_id, sessionExercises);
  }

  return sessions.map(session => ({
    ...session,
    exercises: exerciseMap.get(session.id) || [],
  }));
}

interface PRRow {
  exercise_name: string;
  max_weight_lbs: number;
  reps_at_max_weight: number;
  last_pr_date: string | null;
}

async function fetchPRData(userId: string): Promise<PRRow[]> {
  const { data, error } = await supabase
    .from("user_personal_records")
    .select("exercise_name, max_weight_lbs, reps_at_max_weight, last_pr_date")
    .eq("user_id", userId);

  if (error) {
    console.error("[CoachContextBuilder] Error fetching PRs:", error);
    return [];
  }

  return data || [];
}

interface PainReportRow {
  pain_location: string;
  started_at: string;
  title: string;
}

async function fetchRecentPainReports(userId: string): Promise<PainReportRow[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from("workout_sessions")
    .select("pain_location, started_at, title")
    .eq("user_id", userId)
    .not("pain_location", "is", null)
    .gte("started_at", thirtyDaysAgo.toISOString())
    .order("started_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("[CoachContextBuilder] Error fetching pain reports:", error);
    return [];
  }

  return data || [];
}

interface WorkoutCountsData {
  thisWeek: number;
  lastWeek: number;
  total: number;
}

async function fetchWorkoutCounts(userId: string): Promise<WorkoutCountsData> {
  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const lastWeekStart = subWeeks(thisWeekStart, 1);

  // Fetch all counts in parallel
  const [thisWeekResult, lastWeekResult, totalResult] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("started_at", thisWeekStart.toISOString()),
    supabase
      .from("workout_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("started_at", lastWeekStart.toISOString())
      .lt("started_at", thisWeekStart.toISOString()),
    supabase
      .from("workout_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  return {
    thisWeek: thisWeekResult.count || 0,
    lastWeek: lastWeekResult.count || 0,
    total: totalResult.count || 0,
  };
}

// ============================================================================
// Context Building Functions
// ============================================================================

function buildUserProfile(profile: ProfileRow | null): UserProfile {
  const weightKg = profile?.weight_kg ?? null;
  
  return {
    name: profile?.first_name || "there",
    age: calculateAge(profile?.birth_year ?? null),
    sex: (profile?.sex as Sex) || null,
    weightKg,
    weightLbs: weightKg ? kgToLbs(weightKg) : null,
    heightCm: profile?.height_cm ?? null,
  };
}

function buildTrainingPreferences(profile: ProfileRow | null): TrainingPreferences {
  const onboarding = profile?.onboarding_data;
  
  return {
    goal: (profile?.goal as Goal) || (onboarding?.goal as Goal) || null,
    goalTimeline: onboarding?.goalTimeline || null,
    experienceLevel: (onboarding?.experienceLevel as ExperienceLevel) || null,
    workoutsPerWeek: onboarding?.workoutsPerWeek || null,
    workoutDuration: onboarding?.workoutDuration || null,
    splitPreference: onboarding?.splitPreference || null,
    preferredDays: onboarding?.preferredDays || [],
  };
}

function buildLimitationsContext(
  profile: ProfileRow | null,
  painReports: PainReportRow[]
): LimitationsContext {
  const onboarding = profile?.onboarding_data;
  
  return {
    areas: onboarding?.limitations || [],
    details: onboarding?.limitationsOtherText || null,
    recentPainReports: painReports.map(pr => ({
      location: pr.pain_location as PainLocation,
      date: pr.started_at,
      exerciseName: pr.title,
    })),
  };
}

function buildEquipmentContext(profile: ProfileRow | null): EquipmentContext {
  const onboarding = profile?.onboarding_data;
  
  return {
    gymType: onboarding?.gymType || null,
    available: onboarding?.availableEquipment || [],
  };
}

function buildStrengthContext(prs: PRRow[]): StrengthContext {
  const findPR = (exerciseName: string): PRData | null => {
    // Try exact match first, then partial match
    const pr = prs.find(p => 
      p.exercise_name.toLowerCase() === exerciseName.toLowerCase() ||
      p.exercise_name.toLowerCase().includes(exerciseName.toLowerCase())
    );
    
    if (!pr) return null;
    
    return {
      weight: pr.max_weight_lbs,
      reps: pr.reps_at_max_weight,
      e1RM: calculateE1RM(pr.max_weight_lbs, pr.reps_at_max_weight),
      date: pr.last_pr_date,
    };
  };

  return {
    benchPR: findPR("bench press"),
    squatPR: findPR("squat"),
    deadliftPR: findPR("deadlift"),
    ohpPR: findPR("overhead press") || findPR("ohp"),
  };
}

function buildRecentWorkouts(
  workouts: (WorkoutSessionRow & { exercises: WorkoutExerciseRow[] })[]
): RecentWorkout[] {
  return workouts.map(w => {
    let durationMinutes: number | null = null;
    if (w.started_at && w.ended_at) {
      const start = parseISO(w.started_at);
      const end = parseISO(w.ended_at);
      durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
    }

    return {
      date: w.started_at,
      title: w.title,
      feeling: w.post_workout_feeling as PostWorkoutFeeling | null,
      painLocation: w.pain_location as PainLocation | null,
      exercises: w.exercises.map(e => e.exercise_name),
      durationMinutes,
    };
  });
}

function buildProgressContext(
  streak: StreakRow | null,
  counts: WorkoutCountsData,
  prs: PRRow[]
): ProgressContext {
  // Get recent PRs (last 14 days)
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  
  const recentPRs = prs
    .filter(pr => pr.last_pr_date && new Date(pr.last_pr_date) >= fourteenDaysAgo)
    .map(pr => ({
      exercise: pr.exercise_name,
      weight: pr.max_weight_lbs,
      date: pr.last_pr_date!,
    }))
    .slice(0, 5);

  return {
    currentStreak: streak?.current_streak || 0,
    longestStreak: streak?.longest_streak || 0,
    workoutsThisWeek: counts.thisWeek,
    workoutsLastWeek: counts.lastWeek,
    totalWorkouts: counts.total,
    recentPRs,
  };
}

function buildTodayContext(
  profile: ProfileRow | null,
  recentWorkouts: (WorkoutSessionRow & { exercises: WorkoutExerciseRow[] })[]
): TodayContext {
  const onboarding = profile?.onboarding_data;
  const preferredDays = onboarding?.preferredDays || [];
  
  // Check if today is a rest day
  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  const isRestDay = preferredDays.length > 0 && !preferredDays.includes(todayName);
  
  // Days since last workout
  let daysSinceLastWorkout: number | null = null;
  if (recentWorkouts.length > 0) {
    const lastWorkoutDate = parseISO(recentWorkouts[0].started_at);
    daysSinceLastWorkout = differenceInDays(new Date(), lastWorkoutDate);
  }
  
  // Determine scheduled workout (based on split and day)
  let scheduledWorkout: string | null = null;
  if (!isRestDay && onboarding?.splitPreference) {
    scheduledWorkout = getScheduledWorkoutType(onboarding.splitPreference, todayName, preferredDays);
  }
  
  // Calculate muscle recovery status
  const { recovered, fatigued } = calculateMuscleRecoveryStatus(recentWorkouts);

  return {
    isRestDay,
    scheduledWorkout,
    daysSinceLastWorkout,
    musclesRecovered: recovered,
    musclesFatigued: fatigued,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function getScheduledWorkoutType(
  split: string,
  todayName: string,
  preferredDays: string[]
): string | null {
  // Find index of today in preferred days
  const dayIndex = preferredDays.indexOf(todayName);
  if (dayIndex === -1) return null;
  
  switch (split) {
    case "ppl": {
      const types = ["Push", "Pull", "Legs"];
      return types[dayIndex % 3];
    }
    case "upper_lower": {
      const types = ["Upper Body", "Lower Body"];
      return types[dayIndex % 2];
    }
    case "full_body":
      return "Full Body";
    default:
      return "Workout";
  }
}

function calculateMuscleRecoveryStatus(
  recentWorkouts: (WorkoutSessionRow & { exercises: WorkoutExerciseRow[] })[]
): { recovered: string[]; fatigued: string[] } {
  const now = new Date();
  const muscleLastTrained = new Map<string, Date>();
  
  // Find when each muscle group was last trained
  for (const workout of recentWorkouts) {
    const workoutDate = parseISO(workout.started_at);
    
    for (const exercise of workout.exercises) {
      const muscle = exercise.muscle_group;
      if (!muscleLastTrained.has(muscle) || muscleLastTrained.get(muscle)! < workoutDate) {
        muscleLastTrained.set(muscle, workoutDate);
      }
    }
  }
  
  const recovered: string[] = [];
  const fatigued: string[] = [];
  
  // 48 hours recovery threshold
  const recoveryThresholdHours = 48;
  
  for (const [muscle, lastTrained] of muscleLastTrained) {
    const hoursSinceTraining = differenceInHours(now, lastTrained);
    
    if (hoursSinceTraining >= recoveryThresholdHours) {
      recovered.push(muscle);
    } else {
      fatigued.push(muscle);
    }
  }
  
  return { recovered, fatigued };
}
