/**
 * Coach Context Types
 * 
 * Defines the structure of user context passed to the AI coach.
 * Supports two modes:
 * - Lite: Minimal context for quick questions (~300 tokens)
 * - Full: Comprehensive context for personalized advice (~800 tokens)
 */

// ============================================================================
// Core Types
// ============================================================================

export type ContextMode = "lite" | "full";

export type PainLocation = "shoulder" | "back" | "knee" | "elbow" | "wrists" | "hips" | "other";

export type PostWorkoutFeeling = "easy" | "good" | "hard" | "pain";

export type ExperienceLevel = "none" | "beginner" | "intermediate" | "advanced";

export type Goal = "build_muscle" | "lose_fat" | "get_stronger" | "general_fitness";

export type Sex = "male" | "female" | "other";

// ============================================================================
// Limitations Context (ALWAYS included for safety)
// ============================================================================

export interface LimitationsContext {
  /** Body areas with known limitations from onboarding */
  areas: string[];
  /** Free-text description of limitations/injuries */
  details: string | null;
  /** Recent pain reports from workouts */
  recentPainReports: {
    location: PainLocation;
    date: string;
    exerciseName?: string;
  }[];
}

// ============================================================================
// Lite Context (~300 tokens)
// Used for: greetings, quick questions, motivation
// ============================================================================

export interface LiteCoachContext {
  mode: "lite";
  
  /** User's first name */
  name: string;
  
  /** Primary fitness goal */
  goal: Goal | null;
  
  /** Training experience level */
  experienceLevel: ExperienceLevel | null;
  
  /** CRITICAL: Limitations for safety (always included) */
  limitations: LimitationsContext;
  
  /** Current workout streak */
  currentStreak: number;
  
  /** Days since last workout */
  daysSinceLastWorkout: number | null;
  
  /** Whether today is a scheduled rest day */
  isRestDay: boolean;
}

// ============================================================================
// Full Context (~800 tokens)
// Used for: workout recommendations, progress review, program questions
// ============================================================================

export interface UserProfile {
  name: string;
  /** Calculated from birth_year */
  age: number | null;
  sex: Sex | null;
  /** Weight in kg */
  weightKg: number | null;
  /** Weight in lbs (converted) */
  weightLbs: number | null;
  /** Height in cm */
  heightCm: number | null;
}

export interface TrainingPreferences {
  goal: Goal | null;
  goalTimeline: string | null;
  experienceLevel: ExperienceLevel | null;
  workoutsPerWeek: number | null;
  workoutDuration: number | null; // minutes
  splitPreference: string | null;
  preferredDays: string[];
}

export interface EquipmentContext {
  gymType: string | null;
  available: string[];
}

export interface PRData {
  weight: number;
  reps: number;
  /** Estimated 1RM using Epley formula */
  e1RM: number;
  date: string | null;
}

export interface StrengthContext {
  benchPR: PRData | null;
  squatPR: PRData | null;
  deadliftPR: PRData | null;
  ohpPR: PRData | null;
}

export interface RecentWorkout {
  date: string;
  title: string;
  feeling: PostWorkoutFeeling | null;
  painLocation: PainLocation | null;
  exercises: string[];
  durationMinutes: number | null;
}

export interface ProgressContext {
  currentStreak: number;
  longestStreak: number;
  workoutsThisWeek: number;
  workoutsLastWeek: number;
  totalWorkouts: number;
  recentPRs: {
    exercise: string;
    weight: number;
    date: string;
  }[];
}

export interface TodayContext {
  isRestDay: boolean;
  scheduledWorkout: string | null;
  daysSinceLastWorkout: number | null;
  /** Muscles that have had 48+ hours rest */
  musclesRecovered: string[];
  /** Muscles trained recently (< 48 hours) */
  musclesFatigued: string[];
}

export interface FullCoachContext {
  mode: "full";
  
  /** User profile data */
  profile: UserProfile;
  
  /** Training preferences and goals */
  training: TrainingPreferences;
  
  /** CRITICAL: Limitations for safety */
  limitations: LimitationsContext;
  
  /** Equipment availability */
  equipment: EquipmentContext;
  
  /** Current strength levels */
  strength: StrengthContext;
  
  /** Recent workout history (last 5) */
  recentWorkouts: RecentWorkout[];
  
  /** Progress metrics */
  progress: ProgressContext;
  
  /** Today's context */
  today: TodayContext;
}

// ============================================================================
// Union Type
// ============================================================================

export type CoachContext = LiteCoachContext | FullCoachContext;

// ============================================================================
// Cache Types
// ============================================================================

export interface CachedCoachContext {
  data: FullCoachContext;
  timestamp: number;
  userId: string;
}

// ============================================================================
// Chat Request Types (for Edge Function)
// ============================================================================

export interface ChatRequest {
  /** User's message */
  text: string;
  /** Conversation history (last 8 messages) */
  history?: { role: "user" | "assistant"; content: string }[];
  /** User context for personalization */
  context?: LiteCoachContext | FullCoachContext;
}

export interface ChatResponse {
  reply: string;
  error?: boolean;
  debug?: {
    code?: string;
    contextMode?: ContextMode;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate estimated 1RM using Epley formula
 * e1RM = weight × (1 + reps/30)
 */
export function calculateE1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps <= 0 || weight <= 0) return 0;
  return Math.round(weight * (1 + reps / 30));
}

/**
 * Convert kg to lbs
 */
export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.205);
}

/**
 * Calculate age from birth year
 */
export function calculateAge(birthYear: number | null): number | null {
  if (!birthYear) return null;
  const currentYear = new Date().getFullYear();
  return currentYear - birthYear;
}

/**
 * Type guard to check if context is full
 */
export function isFullContext(context: CoachContext): context is FullCoachContext {
  return context.mode === "full";
}

/**
 * Type guard to check if context is lite
 */
export function isLiteContext(context: CoachContext): context is LiteCoachContext {
  return context.mode === "lite";
}
