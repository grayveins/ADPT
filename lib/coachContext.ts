/**
 * Coach Context System
 * 
 * Builds context for the AI coach based on user's workout history,
 * preferences, streaks, PRs, and recent events.
 * 
 * Generates minimal, direct opening messages and suggested prompts
 * based on user state.
 */

import { supabase } from './supabase';
import { generateWeeklyPlan, PlannedWorkout } from './workoutPlan';
import { format, differenceInDays, parseISO, isToday } from 'date-fns';

// ============================================================================
// Types
// ============================================================================

export type ActionType = 
  | 'start_workout'
  | 'view_session'
  | 'recovery_tips'
  | 'adjust_weights'
  | 'pain_better'
  | 'pain_same'
  | 'pain_worse'
  | 'start_first_workout';

export type Action = {
  type: ActionType;
  label: string;
  route?: string;
  params?: Record<string, string>;
};

export type CoachContext = {
  userName: string;
  todayWorkout: PlannedWorkout | null;
  isRestDay: boolean;
  lastWorkout: {
    id: string;
    title: string;
    date: string;
    feeling?: 'easy' | 'good' | 'hard' | 'pain';
    painLocation?: 'shoulder' | 'back' | 'knee' | 'elbow' | 'other';
  } | null;
  daysSinceLastWorkout: number | null;
  currentStreak: number;
  longestStreak: number;
  recentPRs: Array<{
    exercise: string;
    weight: number;
    reps: number;
    date: string;
  }>;
  recentEvents: Array<{
    type: string;
    data: Record<string, unknown>;
    date: string;
  }>;
  weeklyProgress: {
    completed: number;
    target: number;
  };
  isFirstTimeUser: boolean;
  onboardingData: {
    goal?: string;
    workoutsPerWeek?: number;
    preferredDays?: string[];
    splitPreference?: string;
    workoutDuration?: number;
  } | null;
};

export type OpenerMessage = {
  text: string;
  prompts: string[];
  actions: Action[];
};

// ============================================================================
// Action Keyword Detection
// ============================================================================

const ACTION_KEYWORDS: Record<ActionType, string[]> = {
  start_workout: [
    'start your workout',
    'begin your session',
    'start training',
    "let's begin",
    "let's get started",
    'ready to start',
    'start now',
  ],
  view_session: [
    'view your session',
    'see your workout',
    'check your progress',
    'view details',
    'see how you did',
  ],
  recovery_tips: [
    'recovery tips',
    'rest day tips',
    'how to recover',
    'recovery advice',
    'rest day advice',
  ],
  adjust_weights: [
    'reduce the weight',
    'go lighter',
    'lower the intensity',
    'take it easy',
    'ease up',
  ],
  pain_better: ['feeling better', 'improved', 'better now'],
  pain_same: ['still the same', 'no change', 'about the same'],
  pain_worse: ['feeling worse', 'gotten worse', 'more pain'],
  start_first_workout: [
    'start first workout',
    'begin first session',
    'first workout',
  ],
};

/**
 * Detect action from AI response text using keyword matching
 */
export function detectActionFromResponse(text: string): Action | null {
  const lowerText = text.toLowerCase();

  for (const [type, keywords] of Object.entries(ACTION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return createAction(type as ActionType);
      }
    }
  }

  return null;
}

/**
 * Create an action object with proper label and route
 */
export function createAction(type: ActionType): Action {
  switch (type) {
    case 'start_workout':
      return {
        type,
        label: 'Start Workout',
        route: '/(workout)/active',
      };
    case 'start_first_workout':
      return {
        type,
        label: 'Start First Workout',
        route: '/(workout)/active',
      };
    case 'view_session':
      return {
        type,
        label: 'View Session',
        route: '/(app)/(tabs)/progress',
      };
    case 'recovery_tips':
      return {
        type,
        label: 'Recovery Tips',
      };
    case 'adjust_weights':
      return {
        type,
        label: 'Go Lighter Today',
        route: '/(workout)/active',
        params: { adjustIntensity: 'lower' },
      };
    case 'pain_better':
      return { type, label: 'Better' };
    case 'pain_same':
      return { type, label: 'Same' };
    case 'pain_worse':
      return { type, label: 'Worse' };
    default:
      return { type, label: type };
  }
}

// ============================================================================
// Context Builder
// ============================================================================

/**
 * Build complete coach context for a user
 * Fetches all relevant data from Supabase
 */
export async function buildCoachContext(userId: string): Promise<CoachContext> {
  try {
    // Call the database function that aggregates all context
    const { data: dbContext, error: contextError } = await supabase
      .rpc('get_coach_context', { p_user_id: userId });

    if (contextError) {
      console.error('Error fetching coach context:', contextError);
      // Return minimal context on error
      return getDefaultContext();
    }

    // Get profile for onboarding data
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, onboarding_data')
      .eq('id', userId)
      .single();

    const onboardingData = profile?.onboarding_data as CoachContext['onboardingData'];

    // Generate today's workout plan
    const weeklyPlan = generateWeeklyPlan({
      goal: onboardingData?.goal,
      workoutsPerWeek: onboardingData?.workoutsPerWeek,
      splitPreference: onboardingData?.splitPreference,
    });

    const today = format(new Date(), 'yyyy-MM-dd');
    const todayWorkout = weeklyPlan.find(w => w.date === today) || null;

    // Calculate days since last workout
    let daysSinceLastWorkout: number | null = null;
    if (dbContext?.lastWorkout?.date) {
      const lastDate = parseISO(dbContext.lastWorkout.date);
      daysSinceLastWorkout = differenceInDays(new Date(), lastDate);
    }

    // Calculate weekly progress
    const weeklyCompleted = await getWeeklyWorkoutCount(userId);
    const weeklyTarget = onboardingData?.workoutsPerWeek ?? 3;

    // Check if first-time user (no workout history)
    const isFirstTimeUser = !dbContext?.lastWorkout;

    return {
      userName: dbContext?.userName ?? profile?.first_name ?? 'there',
      todayWorkout,
      isRestDay: dbContext?.isRestDay ?? todayWorkout?.isRest ?? false,
      lastWorkout: dbContext?.lastWorkout ? {
        id: dbContext.lastWorkout.id,
        title: dbContext.lastWorkout.title,
        date: dbContext.lastWorkout.date,
        feeling: dbContext.lastWorkout.feeling,
        painLocation: dbContext.lastWorkout.painLocation,
      } : null,
      daysSinceLastWorkout,
      currentStreak: dbContext?.streak?.current ?? 0,
      longestStreak: dbContext?.streak?.longest ?? 0,
      recentPRs: dbContext?.recentPRs ?? [],
      recentEvents: dbContext?.recentEvents ?? [],
      weeklyProgress: {
        completed: weeklyCompleted,
        target: weeklyTarget,
      },
      isFirstTimeUser,
      onboardingData,
    };
  } catch (err) {
    console.error('Error building coach context:', err);
    return getDefaultContext();
  }
}

/**
 * Get count of workouts completed this week
 */
async function getWeeklyWorkoutCount(userId: string): Promise<number> {
  const startOfWeek = getStartOfWeek();
  
  const { count, error } = await supabase
    .from('workout_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('started_at', startOfWeek.toISOString());

  if (error) {
    console.error('Error fetching weekly workout count:', error);
    return 0;
  }

  return count ?? 0;
}

function getStartOfWeek(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getDefaultContext(): CoachContext {
  return {
    userName: 'there',
    todayWorkout: null,
    isRestDay: false,
    lastWorkout: null,
    daysSinceLastWorkout: null,
    currentStreak: 0,
    longestStreak: 0,
    recentPRs: [],
    recentEvents: [],
    weeklyProgress: { completed: 0, target: 3 },
    isFirstTimeUser: true,
    onboardingData: null,
  };
}

// ============================================================================
// Opener Message Generation
// ============================================================================

/**
 * Generate contextual opening message based on user state
 * Uses minimal, direct tone
 */
export function generateOpenerMessage(context: CoachContext): OpenerMessage {
  // First-time user
  if (context.isFirstTimeUser) {
    return {
      text: "Welcome. First week is ready.",
      prompts: generateSuggestedPrompts(context),
      actions: [createAction('start_first_workout')],
    };
  }

  // Check for pain from last session - highest priority
  if (context.lastWorkout?.painLocation) {
    const location = formatPainLocation(context.lastWorkout.painLocation);
    return {
      text: `You mentioned ${location} pain. How's it feeling?`,
      prompts: generateSuggestedPrompts(context),
      actions: [
        createAction('pain_better'),
        createAction('pain_same'),
        createAction('pain_worse'),
      ],
    };
  }

  // Rest day
  if (context.isRestDay) {
    const recoveringMuscle = getRecoveringMuscle(context);
    const restMessage = recoveringMuscle 
      ? `Rest day. ${recoveringMuscle} recovering.`
      : "Rest day. Recovery matters.";
    
    return {
      text: restMessage,
      prompts: generateSuggestedPrompts(context),
      actions: [createAction('recovery_tips')],
    };
  }

  // Missed multiple days (3+)
  if (context.daysSinceLastWorkout && context.daysSinceLastWorkout >= 3) {
    return {
      text: "Been a few days. Ready when you are.",
      prompts: generateSuggestedPrompts(context),
      actions: [createAction('start_workout')],
    };
  }

  // Missed yesterday (but not 3+ days)
  if (context.daysSinceLastWorkout === 1 && !wasYesterdayRestDay(context)) {
    return {
      text: "Yesterday didn't happen. Fresh start?",
      prompts: generateSuggestedPrompts(context),
      actions: [createAction('start_workout')],
    };
  }

  // Already worked out today
  if (context.lastWorkout && isToday(parseISO(context.lastWorkout.date))) {
    return {
      text: "Done for today. Nice work.",
      prompts: generateSuggestedPrompts(context),
      actions: [createAction('view_session')],
    };
  }

  // Workout day, not started - default case
  if (context.todayWorkout && !context.todayWorkout.isRest) {
    const workout = context.todayWorkout;
    const exerciseCount = 5; // Default, could be dynamic
    return {
      text: `${workout.type} Day \u2022 ${workout.durationMinutes} min \u2022 ${exerciseCount} exercises`,
      prompts: generateSuggestedPrompts(context),
      actions: [createAction('start_workout')],
    };
  }

  // Fallback
  return {
    text: "Ready when you are.",
    prompts: generateSuggestedPrompts(context),
    actions: [createAction('start_workout')],
  };
}

/**
 * Generate suggested prompts based on context
 */
export function generateSuggestedPrompts(context: CoachContext): string[] {
  const prompts: string[] = [];

  // Always include workout-related prompts
  if (context.todayWorkout && !context.todayWorkout.isRest) {
    prompts.push("What's my workout today?");
  }

  // PR-related
  if (context.recentPRs.length > 0) {
    prompts.push("Show my recent PRs");
  }

  // Progress-related
  if (context.currentStreak > 0) {
    prompts.push("How am I doing this week?");
  }

  // Pain/recovery related
  if (context.lastWorkout?.painLocation) {
    prompts.push("Exercises to avoid with this pain");
  }

  // General helpful prompts
  const generalPrompts = [
    "What should I eat today?",
    "How can I improve my form?",
    "Am I progressing well?",
    "Tips for better sleep",
  ];

  // Fill up to 4 prompts
  for (const prompt of generalPrompts) {
    if (prompts.length >= 4) break;
    if (!prompts.includes(prompt)) {
      prompts.push(prompt);
    }
  }

  return prompts.slice(0, 4);
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatPainLocation(location: string): string {
  const locations: Record<string, string> = {
    shoulder: 'shoulder',
    back: 'lower back',
    knee: 'knee',
    elbow: 'elbow',
    other: 'some',
  };
  return locations[location] ?? location;
}

function getRecoveringMuscle(context: CoachContext): string | null {
  if (!context.lastWorkout?.title) return null;
  
  const title = context.lastWorkout.title.toLowerCase();
  
  if (title.includes('push') || title.includes('chest')) return 'Chest and triceps';
  if (title.includes('pull') || title.includes('back')) return 'Back and biceps';
  if (title.includes('legs') || title.includes('lower')) return 'Legs';
  if (title.includes('upper')) return 'Upper body';
  if (title.includes('full')) return 'Full body';
  
  return null;
}

function wasYesterdayRestDay(context: CoachContext): boolean {
  if (!context.onboardingData?.preferredDays) return false;
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dayName = format(yesterday, 'EEEE').toLowerCase();
  
  return !context.onboardingData.preferredDays.includes(dayName);
}

// ============================================================================
// Coach Events
// ============================================================================

export type CoachEventType = 'pr' | 'pain' | 'missed' | 'fatigue' | 'hard_session' | 'program_change';

/**
 * Record a coach event for context tracking
 */
export async function recordCoachEvent(
  userId: string,
  eventType: CoachEventType,
  eventData: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from('coach_events')
    .insert({
      user_id: userId,
      event_type: eventType,
      event_data: eventData,
    });

  if (error) {
    console.error('Error recording coach event:', error);
  }
}

/**
 * Mark coach messages as read (clear unread indicator)
 */
export async function markCoachAsRead(): Promise<void> {
  // Uses AsyncStorage - will be implemented in the chat screen
  // This is a placeholder for the interface
}

/**
 * Check if there are unread coach messages
 */
export async function hasUnreadCoachMessages(): Promise<boolean> {
  // Uses AsyncStorage - will be implemented in the chat screen
  // This is a placeholder for the interface
  return false;
}
