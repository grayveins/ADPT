/**
 * ActiveWorkoutContext
 * Central state management for active workout sessions.
 * Replaces the 25+ useState calls in the old active.tsx monolith.
 * Uses useReducer for predictable state updates.
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  type ReactNode,
} from "react";
import { Alert } from "react-native";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { haptic, hapticPress, hapticSuccess, hapticCelebration } from "@/src/animations/feedback/haptics";
import { showToast } from "@/src/animations/celebrations";
import { invalidateAndNotify } from "@/lib/coachContextCache";
// EffortLevel may be used later for RIR tracking per set

// =============================================================================
// TYPES
// =============================================================================

export type ActiveSet = {
  id: string;
  weight: string;
  reps: string;
  completed: boolean;
  isWarmup: boolean;
  isPR: boolean;
};

export type ActiveExercise = {
  id: string;
  exerciseId?: string;
  name: string;
  muscles: string[];
  sets: ActiveSet[];
  targetReps: string;
  targetRIR: number;
  notes: string;
  previousNotes?: string;
  groupId: string | null;
  orderIndex: number;
  isExpanded: boolean;
  restTimerSeconds: number;
};

export type RestTimerState = {
  active: boolean;
  afterExerciseId: string | null;
  secondsLeft: number;
  defaultDuration: number;
};

export type SourceType = "empty" | "template" | "program" | "rerun";

export type ActiveWorkoutState = {
  // Core
  title: string;
  sourceType: SourceType;
  sourceId?: string;

  // Exercises
  exercises: ActiveExercise[];

  // Timer
  startTime: number; // Date.now() for serialization safety
  elapsedSeconds: number;

  // Rest timer
  restTimer: RestTimerState;

  // UI
  showCelebration: boolean;
  showPRCelebration: boolean;
  prData: { exercise: string; previousValue: string; newValue: string } | null;

  // User
  userId: string | null;

  // Anti-cheat: timestamps of set completions for pacing validation
  setCompletionTimestamps: number[];
};

// =============================================================================
// ACTIONS
// =============================================================================

type Action =
  // Exercise management
  | { type: "ADD_EXERCISE"; exercise: Omit<ActiveExercise, "orderIndex" | "id" | "isExpanded"> }
  | { type: "REMOVE_EXERCISE"; exerciseId: string }
  | { type: "SWAP_EXERCISE"; exerciseId: string; newExercise: { name: string; muscles: string[] } }
  | { type: "REORDER_EXERCISES"; fromIndex: number; toIndex: number }
  | { type: "TOGGLE_EXPAND"; exerciseId: string }
  | { type: "UPDATE_NOTES"; exerciseId: string; notes: string }
  // Superset
  | { type: "ADD_TO_SUPERSET"; exerciseId: string; groupId?: string }
  | { type: "REMOVE_FROM_SUPERSET"; exerciseId: string }
  // Set management
  | { type: "ADD_SET"; exerciseId: string }
  | { type: "REMOVE_SET"; exerciseId: string }
  | { type: "UPDATE_SET"; exerciseId: string; setId: string; field: "weight" | "reps"; value: string }
  | { type: "TOGGLE_SET_COMPLETE"; exerciseId: string; setId: string }
  | { type: "TOGGLE_WARMUP"; exerciseId: string; setId: string }
  | { type: "MARK_SET_PR"; exerciseId: string; setId: string }
  // Rest timer
  | { type: "START_REST"; afterExerciseId: string; duration?: number }
  | { type: "TICK_REST" }
  | { type: "SKIP_REST" }
  | { type: "ADJUST_REST"; delta: number }
  // Timer
  | { type: "TICK_ELAPSED" }
  // Lifecycle
  | { type: "SET_USER_ID"; userId: string }
  | { type: "UPDATE_TITLE"; title: string }
  | { type: "SHOW_CELEBRATION"; show: boolean }
  | { type: "SHOW_PR_CELEBRATION"; show: boolean; data?: ActiveWorkoutState["prData"] }
  // Auto-advance: expand next exercise after current completes
  | { type: "AUTO_ADVANCE"; nextExerciseId: string };

// =============================================================================
// HELPERS
// =============================================================================

let setIdCounter = 0;
const generateSetId = () => `set-${Date.now()}-${++setIdCounter}`;

let exerciseIdCounter = 0;
const generateExerciseId = () => `ex-${Date.now()}-${++exerciseIdCounter}`;

const generateGroupId = () => `group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const WORKOUT_DRAFT_KEY = "adpt:workout-draft";

type WorkoutDraft = Pick<ActiveWorkoutState, "title" | "sourceType" | "sourceId" | "exercises" | "startTime" | "elapsedSeconds" | "setCompletionTimestamps">;

async function saveDraft(state: ActiveWorkoutState): Promise<void> {
  try {
    const draft: WorkoutDraft = {
      title: state.title,
      sourceType: state.sourceType,
      sourceId: state.sourceId,
      exercises: state.exercises,
      startTime: state.startTime,
      elapsedSeconds: state.elapsedSeconds,
      setCompletionTimestamps: state.setCompletionTimestamps,
    };
    await AsyncStorage.setItem(WORKOUT_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Silent — don't crash a workout over a failed checkpoint
  }
}

async function clearDraft(): Promise<void> {
  try {
    await AsyncStorage.removeItem(WORKOUT_DRAFT_KEY);
  } catch {
    // Silent
  }
}

export async function loadDraft(): Promise<WorkoutDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(WORKOUT_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WorkoutDraft;
  } catch {
    await clearDraft();
    return null;
  }
}

// =============================================================================
// REDUCER
// =============================================================================

function workoutReducer(state: ActiveWorkoutState, action: Action): ActiveWorkoutState {
  switch (action.type) {
    case "ADD_EXERCISE": {
      const newExercise: ActiveExercise = {
        ...action.exercise,
        id: generateExerciseId(),
        orderIndex: state.exercises.length,
        isExpanded: state.exercises.length === 0, // expand first one
      };
      return { ...state, exercises: [...state.exercises, newExercise] };
    }

    case "REMOVE_EXERCISE": {
      const exercises = state.exercises
        .filter((ex) => ex.id !== action.exerciseId)
        .map((ex, i) => ({ ...ex, orderIndex: i }));
      // Clean up any superset groups that now have < 2 members
      return { ...state, exercises: cleanupSupersets(exercises) };
    }

    case "SWAP_EXERCISE": {
      return {
        ...state,
        exercises: state.exercises.map((ex) => {
          if (ex.id !== action.exerciseId) return ex;
          return {
            ...ex,
            name: action.newExercise.name,
            muscles: action.newExercise.muscles,
            sets: ex.sets.map((s) => ({ ...s, weight: "", reps: "", completed: false, isPR: false })),
            notes: "",
          };
        }),
      };
    }

    case "REORDER_EXERCISES": {
      const exercises = [...state.exercises];
      const [moved] = exercises.splice(action.fromIndex, 1);
      exercises.splice(action.toIndex, 0, moved);
      return {
        ...state,
        exercises: exercises.map((ex, i) => ({ ...ex, orderIndex: i })),
      };
    }

    case "TOGGLE_EXPAND": {
      return {
        ...state,
        exercises: state.exercises.map((ex) => ({
          ...ex,
          isExpanded: ex.id === action.exerciseId ? !ex.isExpanded : ex.isExpanded,
        })),
      };
    }

    case "UPDATE_NOTES": {
      return {
        ...state,
        exercises: state.exercises.map((ex) =>
          ex.id === action.exerciseId ? { ...ex, notes: action.notes } : ex
        ),
      };
    }

    // Superset
    case "ADD_TO_SUPERSET": {
      const groupId = action.groupId || generateGroupId();
      return {
        ...state,
        exercises: state.exercises.map((ex) =>
          ex.id === action.exerciseId ? { ...ex, groupId } : ex
        ),
      };
    }

    case "REMOVE_FROM_SUPERSET": {
      const exercises = state.exercises.map((ex) =>
        ex.id === action.exerciseId ? { ...ex, groupId: null } : ex
      );
      return { ...state, exercises: cleanupSupersets(exercises) };
    }

    // Set management
    case "ADD_SET": {
      return {
        ...state,
        exercises: state.exercises.map((ex) => {
          if (ex.id !== action.exerciseId) return ex;
          const newSet: ActiveSet = {
            id: generateSetId(),
            weight: "",
            reps: "",
            completed: false,
            isWarmup: false,
            isPR: false,
          };
          return { ...ex, sets: [...ex.sets, newSet] };
        }),
      };
    }

    case "REMOVE_SET": {
      return {
        ...state,
        exercises: state.exercises.map((ex) => {
          if (ex.id !== action.exerciseId || ex.sets.length <= 1) return ex;
          const lastSet = ex.sets[ex.sets.length - 1];
          if (lastSet.completed) return ex;
          return { ...ex, sets: ex.sets.slice(0, -1) };
        }),
      };
    }

    case "UPDATE_SET": {
      return {
        ...state,
        exercises: state.exercises.map((ex) => {
          if (ex.id !== action.exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s) =>
              s.id === action.setId ? { ...s, [action.field]: action.value } : s
            ),
          };
        }),
      };
    }

    case "TOGGLE_SET_COMPLETE": {
      // Track completion timestamp for anti-cheat pacing validation
      const set = state.exercises
        .find((ex) => ex.id === action.exerciseId)
        ?.sets.find((s) => s.id === action.setId);
      const isCompleting = set && !set.completed;

      return {
        ...state,
        exercises: state.exercises.map((ex) => {
          if (ex.id !== action.exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s) =>
              s.id === action.setId ? { ...s, completed: !s.completed } : s
            ),
          };
        }),
        setCompletionTimestamps: isCompleting
          ? [...state.setCompletionTimestamps, Date.now()]
          : state.setCompletionTimestamps,
      };
    }

    case "TOGGLE_WARMUP": {
      return {
        ...state,
        exercises: state.exercises.map((ex) => {
          if (ex.id !== action.exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s) =>
              s.id === action.setId ? { ...s, isWarmup: !s.isWarmup } : s
            ),
          };
        }),
      };
    }

    case "MARK_SET_PR": {
      return {
        ...state,
        exercises: state.exercises.map((ex) => {
          if (ex.id !== action.exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s) =>
              s.id === action.setId ? { ...s, isPR: true } : s
            ),
          };
        }),
      };
    }

    // Rest timer
    case "START_REST": {
      return {
        ...state,
        restTimer: {
          active: true,
          afterExerciseId: action.afterExerciseId,
          secondsLeft: action.duration ?? state.restTimer.defaultDuration,
          defaultDuration: state.restTimer.defaultDuration,
        },
      };
    }

    case "TICK_REST": {
      if (!state.restTimer.active) return state;
      const next = state.restTimer.secondsLeft - 1;
      if (next <= 0) {
        return {
          ...state,
          restTimer: { ...state.restTimer, active: false, afterExerciseId: null, secondsLeft: 0 },
        };
      }
      return { ...state, restTimer: { ...state.restTimer, secondsLeft: next } };
    }

    case "SKIP_REST": {
      return {
        ...state,
        restTimer: { ...state.restTimer, active: false, afterExerciseId: null, secondsLeft: 0 },
      };
    }

    case "ADJUST_REST": {
      return {
        ...state,
        restTimer: {
          ...state.restTimer,
          secondsLeft: Math.max(0, state.restTimer.secondsLeft + action.delta),
        },
      };
    }

    // Elapsed timer
    case "TICK_ELAPSED": {
      return { ...state, elapsedSeconds: Math.floor((Date.now() - state.startTime) / 1000) };
    }

    // Lifecycle
    case "SET_USER_ID":
      return { ...state, userId: action.userId };

    case "UPDATE_TITLE":
      return { ...state, title: action.title };

    case "SHOW_CELEBRATION":
      return { ...state, showCelebration: action.show };

    case "SHOW_PR_CELEBRATION":
      return {
        ...state,
        showPRCelebration: action.show,
        prData: action.data ?? state.prData,
      };

    case "AUTO_ADVANCE": {
      return {
        ...state,
        exercises: state.exercises.map((ex) => ({
          ...ex,
          isExpanded: ex.id === action.nextExerciseId ? true : ex.isExpanded,
        })),
      };
    }

    default:
      return state;
  }
}

// Clean up superset groups with < 2 members
function cleanupSupersets(exercises: ActiveExercise[]): ActiveExercise[] {
  const groupCounts = new Map<string, number>();
  for (const ex of exercises) {
    if (ex.groupId) {
      groupCounts.set(ex.groupId, (groupCounts.get(ex.groupId) || 0) + 1);
    }
  }
  return exercises.map((ex) => {
    if (ex.groupId && (groupCounts.get(ex.groupId) || 0) < 2) {
      return { ...ex, groupId: null };
    }
    return ex;
  });
}

// =============================================================================
// CONTEXT TYPES
// =============================================================================

export type ActiveWorkoutActions = {
  // Exercises
  addExercise: (exercise: Omit<ActiveExercise, "orderIndex" | "id" | "isExpanded">) => void;
  removeExercise: (exerciseId: string) => void;
  swapExercise: (exerciseId: string, newExercise: { name: string; muscles: string[] }) => void;
  reorderExercises: (fromIndex: number, toIndex: number) => void;
  toggleExpand: (exerciseId: string) => void;
  updateNotes: (exerciseId: string, notes: string) => void;
  // Superset
  addToSuperset: (exerciseId: string, groupId?: string) => void;
  removeFromSuperset: (exerciseId: string) => void;
  // Sets
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string) => void;
  updateSet: (exerciseId: string, setId: string, field: "weight" | "reps", value: string) => void;
  toggleSetComplete: (exerciseId: string, setId: string) => void;
  toggleWarmup: (exerciseId: string, setId: string) => void;
  // Rest timer
  startRestTimer: (afterExerciseId: string, duration?: number) => void;
  skipRestTimer: () => void;
  adjustRestTimer: (delta: number) => void;
  // Lifecycle
  finishWorkout: () => Promise<void>;
  discardWorkout: () => void;
  saveAsTemplate: (name: string) => Promise<void>;
  updateTitle: (title: string) => void;
};

export type ActiveWorkoutProgress = {
  totalSets: number;
  completedSets: number;
  percentage: number;
};

type ContextValue = {
  state: ActiveWorkoutState;
  actions: ActiveWorkoutActions;
  progress: ActiveWorkoutProgress;
  formatTime: (seconds: number) => string;
};

const ActiveWorkoutContext = createContext<ContextValue | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

type ProviderProps = {
  initialExercises?: ActiveExercise[];
  initialTitle?: string;
  sourceType?: SourceType;
  sourceId?: string;
  sessionDate?: string;
  children: ReactNode;
};

export function ActiveWorkoutProvider({
  initialExercises = [],
  initialTitle = "Workout",
  sourceType = "empty",
  sourceId,
  sessionDate,
  children,
}: ProviderProps) {
  const sessionDateRef = useRef(sessionDate);
  useEffect(() => {
    sessionDateRef.current = sessionDate;
  }, [sessionDate]);

  const initialState: ActiveWorkoutState = {
    title: initialTitle,
    sourceType,
    sourceId,
    exercises: initialExercises.map((ex, i) => ({ ...ex, orderIndex: i })),
    startTime: Date.now(),
    elapsedSeconds: 0,
    restTimer: { active: false, afterExerciseId: null, secondsLeft: 0, defaultDuration: 90 },
    showCelebration: false,
    showPRCelebration: false,
    prData: null,
    userId: null,
    setCompletionTimestamps: [],
  };

  const [state, dispatch] = useReducer(workoutReducer, initialState);

  // Get user ID on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) dispatch({ type: "SET_USER_ID", userId: user.id });
    };
    getUser();
  }, []);

  // Elapsed timer
  useEffect(() => {
    const interval = setInterval(() => dispatch({ type: "TICK_ELAPSED" }), 1000);
    return () => clearInterval(interval);
  }, []);

  // Rest timer countdown
  useEffect(() => {
    if (!state.restTimer.active) return;
    const interval = setInterval(() => {
      dispatch({ type: "TICK_REST" });
    }, 1000);
    return () => clearInterval(interval);
  }, [state.restTimer.active]);

  // Haptic when rest timer finishes
  const prevRestActive = useRef(state.restTimer.active);
  useEffect(() => {
    if (prevRestActive.current && !state.restTimer.active) {
      haptic("success");
      showToast({ type: "motivation" });
    }
    prevRestActive.current = state.restTimer.active;
  }, [state.restTimer.active]);

  // Haptic at 5 seconds remaining
  useEffect(() => {
    if (state.restTimer.active && state.restTimer.secondsLeft === 5) {
      haptic("light");
    }
  }, [state.restTimer.active, state.restTimer.secondsLeft]);

  // Checkpoint to AsyncStorage after every set change
  const completedSetCount = useMemo(
    () => state.exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0),
    [state.exercises]
  );
  useEffect(() => {
    if (completedSetCount > 0) saveDraft(state);
  }, [completedSetCount]);

  // Checkpoint on app background
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "background" || next === "inactive") saveDraft(state);
    });
    return () => sub.remove();
  }, [state]);

  // Progress
  const progress = useMemo<ActiveWorkoutProgress>(() => {
    const totalSets = state.exercises.reduce((acc, ex) => acc + ex.sets.filter((s) => !s.isWarmup).length, 0);
    const completedSets = state.exercises.reduce(
      (acc, ex) => acc + ex.sets.filter((s) => s.completed && !s.isWarmup).length,
      0
    );
    return {
      totalSets,
      completedSets,
      percentage: totalSets > 0 ? completedSets / totalSets : 0,
    };
  }, [state.exercises]);

  // Format time helper
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // ==========================================================================
  // ACTIONS
  // ==========================================================================

  const actions = useMemo<ActiveWorkoutActions>(() => ({
    addExercise: (exercise) => {
      hapticPress();
      dispatch({ type: "ADD_EXERCISE", exercise });
    },

    removeExercise: (exerciseId) => {
      hapticPress();
      dispatch({ type: "REMOVE_EXERCISE", exerciseId });
    },

    swapExercise: (exerciseId, newExercise) => {
      dispatch({ type: "SWAP_EXERCISE", exerciseId, newExercise });
      showToast({ message: `Swapped to ${newExercise.name}`, type: "motivation" });
    },

    reorderExercises: (fromIndex, toIndex) => {
      hapticPress();
      dispatch({ type: "REORDER_EXERCISES", fromIndex, toIndex });
    },

    toggleExpand: (exerciseId) => {
      hapticPress();
      dispatch({ type: "TOGGLE_EXPAND", exerciseId });
    },

    updateNotes: (exerciseId, notes) => {
      dispatch({ type: "UPDATE_NOTES", exerciseId, notes });
    },

    addToSuperset: (exerciseId, groupId) => {
      hapticPress();
      dispatch({ type: "ADD_TO_SUPERSET", exerciseId, groupId });
    },

    removeFromSuperset: (exerciseId) => {
      hapticPress();
      dispatch({ type: "REMOVE_FROM_SUPERSET", exerciseId });
    },

    addSet: (exerciseId) => {
      hapticPress();
      dispatch({ type: "ADD_SET", exerciseId });
    },

    removeSet: (exerciseId) => {
      hapticPress();
      dispatch({ type: "REMOVE_SET", exerciseId });
    },

    updateSet: (exerciseId, setId, field, value) => {
      dispatch({ type: "UPDATE_SET", exerciseId, setId, field, value });
    },

    toggleSetComplete: (exerciseId, setId) => {
      const exercise = state.exercises.find((ex) => ex.id === exerciseId);
      const set = exercise?.sets.find((s) => s.id === setId);
      if (!set) return;

      if (set.completed) {
        // Uncomplete
        hapticPress();
        dispatch({ type: "TOGGLE_SET_COMPLETE", exerciseId, setId });
      } else {
        // Complete — require weight & reps
        if (!set.weight || !set.reps) {
          showToast({ message: "Enter weight & reps first", type: "motivation" });
          return;
        }
        hapticSuccess();
        dispatch({ type: "TOGGLE_SET_COMPLETE", exerciseId, setId });

        const messages = ["Nice!", "Strong!", "Solid!", "Keep it up!", "Crushed it!"];
        showToast({ message: messages[Math.floor(Math.random() * messages.length)], type: "setComplete" });

        // Check if exercise is now complete, auto-advance
        setTimeout(() => {
          const currentExercise = state.exercises.find((ex) => ex.id === exerciseId);
          if (!currentExercise) return;

          // Recount after the toggle (set was just completed)
          const allComplete = currentExercise.sets.every((s) =>
            s.id === setId ? true : s.completed
          );

          if (allComplete) {
            const idx = state.exercises.findIndex((ex) => ex.id === exerciseId);
            const isLast = idx === state.exercises.length - 1;
            if (isLast) {
              hapticCelebration();
              dispatch({ type: "SHOW_CELEBRATION", show: true });
            } else {
              const nextId = state.exercises[idx + 1]?.id;
              if (nextId) dispatch({ type: "AUTO_ADVANCE", nextExerciseId: nextId });
            }
          } else {
            // Start rest timer
            dispatch({ type: "START_REST", afterExerciseId: exerciseId });
          }
        }, 800);
      }
    },

    toggleWarmup: (exerciseId, setId) => {
      hapticPress();
      dispatch({ type: "TOGGLE_WARMUP", exerciseId, setId });
    },

    startRestTimer: (afterExerciseId, duration) => {
      dispatch({ type: "START_REST", afterExerciseId, duration });
    },

    skipRestTimer: () => {
      hapticPress();
      dispatch({ type: "SKIP_REST" });
      showToast({ type: "motivation" });
    },

    adjustRestTimer: (delta) => {
      hapticPress();
      dispatch({ type: "ADJUST_REST", delta });
    },

    finishWorkout: async () => {
      dispatch({ type: "SHOW_CELEBRATION", show: false });

      if (!state.userId) {
        router.dismissTo("/(app)/(tabs)/workout");
        return;
      }

      try {
        // 1. Create session — backfill to selected day if user logged for a past date
        const elapsedMs = Date.now() - state.startTime;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const ymd = sessionDateRef.current;
        const backfillDate = ymd ? new Date(`${ymd}T00:00:00`) : null;
        const isBackfill =
          backfillDate &&
          !isNaN(backfillDate.getTime()) &&
          backfillDate.getTime() < today.getTime();

        let startedAt: Date;
        let endedAt: Date;
        if (isBackfill) {
          // Place the session at noon of the chosen day so it's unambiguously "that day"
          startedAt = new Date(backfillDate);
          startedAt.setHours(12, 0, 0, 0);
          endedAt = new Date(startedAt.getTime() + elapsedMs);
        } else {
          startedAt = new Date(state.startTime);
          endedAt = now;
        }

        const { data: sessionData, error: sessionError } = await supabase
          .from("workout_sessions")
          .insert({
            user_id: state.userId,
            title: state.title,
            started_at: startedAt.toISOString(),
            ended_at: endedAt.toISOString(),
          })
          .select("id")
          .single();

        if (sessionError) throw sessionError;
        const sessionId = sessionData.id;

        // 2. Save exercises
        const exercisesToSave = state.exercises
          .map((exercise, i) => ({
            exercise,
            index: i,
            completedSets: exercise.sets.filter((s) => s.completed),
          }))
          .filter(({ completedSets }) => completedSets.length > 0);

        const exerciseInserts = exercisesToSave.map(({ exercise, index }) => ({
          session_id: sessionId,
          exercise_name: exercise.name,
          muscle_group: exercise.muscles[0] || null,
          order_index: index,
          notes: exercise.notes || null,
        }));

        const { data: exerciseRows, error: exerciseError } = await supabase
          .from("workout_exercises")
          .insert(exerciseInserts)
          .select("id");

        if (exerciseError || !exerciseRows) {
          await supabase.from("workout_sessions").delete().eq("id", sessionId);
          throw new Error("Failed to save exercises");
        }

        // 3. Save sets
        const allSets: {
          workout_exercise_id: string;
          set_number: number;
          weight_lbs: number | null;
          reps: number | null;
          rir: number | null;
          is_warmup: boolean;
          is_pr: boolean;
        }[] = [];

        exercisesToSave.forEach(({ exercise, completedSets }, idx) => {
          const dbExerciseId = exerciseRows[idx]?.id;
          if (!dbExerciseId) return;

          completedSets.forEach((set, setIndex) => {
            const weight = set.weight ? parseFloat(set.weight) : 0;
            const reps = set.reps ? parseInt(set.reps, 10) : 0;
            allSets.push({
              workout_exercise_id: dbExerciseId,
              set_number: setIndex + 1,
              weight_lbs: weight || null,
              reps: reps || null,
              rir: exercise.targetRIR,
              is_warmup: set.isWarmup,
              is_pr: set.isPR,
            });
          });
        });

        if (allSets.length > 0) {
          const { error: setsError } = await supabase.from("workout_sets").insert(allSets);
          if (setsError) {
            await supabase.from("workout_sessions").delete().eq("id", sessionId);
            throw new Error("Failed to save sets");
          }
        }

        // 4. Update streak
        const { error: streakError } = await supabase.rpc("update_user_streak", { p_user_id: state.userId });
        if (streakError) console.error(streakError);

        // 5. Clear draft — workout saved successfully
        await clearDraft();

        // 6. Invalidate coach cache
        await invalidateAndNotify(state.userId, "workout_complete").catch(console.error);
      } catch (e) {
        console.error("Error saving workout:", e);
        Alert.alert("Error", "Failed to save workout. Please try again.");
        throw e; // Re-throw so caller knows it failed
      }

      // NOTE: Do NOT navigate here — caller handles navigation
      // after any post-save actions (XP award, save-as-template, etc.)
    },

    discardWorkout: () => {
      const completedSets = state.exercises.reduce(
        (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
        0
      );

      if (completedSets > 0) {
        Alert.alert(
          "End Workout?",
          `You've completed ${completedSets} sets. Save and exit?`,
          [
            { text: "Continue", style: "cancel" },
            {
              text: "Save & Exit",
              onPress: async () => {
                try {
                  await actions.finishWorkout();
                } catch {
                  // Error already shown by finishWorkout
                  return;
                }
                router.dismissTo("/(app)/(tabs)/workout");
              },
            },
            {
              text: "Discard",
              style: "destructive",
              onPress: () => {
                clearDraft();
                router.dismissTo("/(app)/(tabs)/workout");
              },
            },
          ]
        );
      } else {
        router.back();
      }
    },

    saveAsTemplate: async (name) => {
      if (!state.userId) return;

      const exercises = state.exercises.map((ex) => ({
        name: ex.name,
        sets: ex.sets.length,
        reps: ex.targetReps,
        rir: ex.targetRIR,
        notes: ex.notes || undefined,
        muscleGroup: ex.muscles[0] || undefined,
      }));

      const { error } = await supabase.from("workout_templates").insert({
        user_id: state.userId,
        name,
        exercises,
      });

      if (error) {
        console.error("Error saving template:", error);
        Alert.alert("Error", "Failed to save template.");
      } else {
        showToast({ message: "Template saved!", type: "motivation" });
      }
    },

    updateTitle: (title) => {
      dispatch({ type: "UPDATE_TITLE", title });
    },
  }), [state.exercises, state.userId, state.startTime, state.title]);

  const value = useMemo<ContextValue>(
    () => ({ state, actions, progress, formatTime }),
    [state, actions, progress, formatTime]
  );

  return (
    <ActiveWorkoutContext.Provider value={value}>
      {children}
    </ActiveWorkoutContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Validate the current workout session for anti-cheat.
 * Call this before awarding XP to check for suspicious activity.
 */
export { validateSession, validateWeight, validatePRJump } from "@/lib/workout/validation";

export function useActiveWorkout(): ContextValue {
  const ctx = useContext(ActiveWorkoutContext);
  if (!ctx) {
    throw new Error("useActiveWorkout must be used within ActiveWorkoutProvider");
  }
  return ctx;
}

/** Safe version — returns null when outside the provider instead of throwing */
export function useActiveWorkoutSafe(): ContextValue | null {
  return useContext(ActiveWorkoutContext);
}
