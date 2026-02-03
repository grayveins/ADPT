/**
 * Active Workout Screen
 * Clean, focused workout experience
 * Cal AI meets Trainerize/Fitbod with Duolingo playfulness
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
  Alert,
  BackHandler,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { 
  FadeIn, 
  FadeInDown, 
  FadeInUp,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

import { useTheme } from "@/src/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { AnimatedCheckbox } from "@/src/animations/components";
import { MicroConfetti } from "@/src/animations/components/Confetti";
import { WorkoutComplete, ToastContainer, showToast, PRCelebration } from "@/src/animations/celebrations";
import { haptic, hapticPress, hapticSuccess, hapticCelebration } from "@/src/animations/feedback/haptics";
import { SPRING_CONFIG } from "@/src/animations/constants";
import { usePRs } from "@/src/hooks/usePRs";
import { usePreviousWorkout } from "@/src/hooks/usePreviousWorkout";
import { calculateTarget, type PreviousSetInfo } from "@/src/hooks/useTargetCalculation";
import { readinessScale, effortScale, type ReadinessLevel, type EffortLevel, layout, spacing } from "@/src/theme";
import { 
  ExerciseInfo, 
  PostWorkoutCheckin, 
  type PostWorkoutData,
  PainFollowUpModal,
  type PainFeedback,
  ExerciseCardNew,
  ExerciseSwapModal,
} from "@/src/components/workout";
import { useActiveLimitations } from "@/src/hooks/useActiveLimitations";
import { type BodyRegion } from "@/src/theme";
import { recordCoachEvent } from "@/lib/coachContext";
import { markCoachAsUnreadGlobal } from "@/src/hooks/useCoachUnread";
import { useWeeklySummary } from "@/src/hooks/useWeeklySummary";
import { invalidateAndNotify } from "@/lib/coachContextCache";

// Types
type SetData = {
  id: string;
  weight: string;
  reps: string;
  completed: boolean;
};

type ExerciseData = {
  id: string;
  name: string;
  muscles: string[];
  sets: SetData[];
  targetReps: string;
  targetRIR: number;
  previousBest?: { weight: string; reps: string };
  isExpanded: boolean;
};

type WorkoutData = {
  id: string;
  name: string;
  type: string;
  exercises: ExerciseData[];
};

// Generate sample workout based on type
const getSampleWorkout = (type: string): WorkoutData => {
  const exercises: Record<string, ExerciseData[]> = {
    "Push": [
      { id: "1", name: "Bench Press", muscles: ["Chest"], sets: createSets(3), targetReps: "8-10", targetRIR: 2, previousBest: { weight: "185", reps: "8" }, isExpanded: true },
      { id: "2", name: "Overhead Press", muscles: ["Shoulders"], sets: createSets(3), targetReps: "8-10", targetRIR: 2, previousBest: { weight: "95", reps: "10" }, isExpanded: false },
      { id: "3", name: "Incline DB Press", muscles: ["Upper Chest"], sets: createSets(3), targetReps: "10-12", targetRIR: 1, isExpanded: false },
      { id: "4", name: "Lateral Raises", muscles: ["Side Delts"], sets: createSets(3), targetReps: "12-15", targetRIR: 1, isExpanded: false },
      { id: "5", name: "Tricep Pushdowns", muscles: ["Triceps"], sets: createSets(3), targetReps: "12-15", targetRIR: 1, isExpanded: false },
    ],
    "Pull": [
      { id: "1", name: "Barbell Rows", muscles: ["Back"], sets: createSets(3), targetReps: "8-10", targetRIR: 2, previousBest: { weight: "155", reps: "8" }, isExpanded: true },
      { id: "2", name: "Pull-ups", muscles: ["Lats"], sets: createSets(3), targetReps: "6-10", targetRIR: 2, isExpanded: false },
      { id: "3", name: "Face Pulls", muscles: ["Rear Delts"], sets: createSets(3), targetReps: "15-20", targetRIR: 1, isExpanded: false },
      { id: "4", name: "Bicep Curls", muscles: ["Biceps"], sets: createSets(3), targetReps: "10-12", targetRIR: 1, isExpanded: false },
    ],
    "Legs": [
      { id: "1", name: "Squats", muscles: ["Quads"], sets: createSets(4), targetReps: "6-8", targetRIR: 2, previousBest: { weight: "225", reps: "6" }, isExpanded: true },
      { id: "2", name: "Romanian Deadlift", muscles: ["Hamstrings"], sets: createSets(3), targetReps: "8-10", targetRIR: 2, isExpanded: false },
      { id: "3", name: "Leg Press", muscles: ["Quads"], sets: createSets(3), targetReps: "10-12", targetRIR: 1, isExpanded: false },
      { id: "4", name: "Leg Curls", muscles: ["Hamstrings"], sets: createSets(3), targetReps: "12-15", targetRIR: 1, isExpanded: false },
      { id: "5", name: "Calf Raises", muscles: ["Calves"], sets: createSets(4), targetReps: "15-20", targetRIR: 1, isExpanded: false },
    ],
  };

  const defaultExercises = [
    { id: "1", name: "Squats", muscles: ["Quads"], sets: createSets(3), targetReps: "8-10", targetRIR: 2, isExpanded: true },
    { id: "2", name: "Bench Press", muscles: ["Chest"], sets: createSets(3), targetReps: "8-10", targetRIR: 2, isExpanded: false },
    { id: "3", name: "Barbell Rows", muscles: ["Back"], sets: createSets(3), targetReps: "8-10", targetRIR: 2, isExpanded: false },
    { id: "4", name: "Overhead Press", muscles: ["Shoulders"], sets: createSets(3), targetReps: "8-10", targetRIR: 2, isExpanded: false },
  ];

  return {
    id: `workout-${Date.now()}`,
    name: type,
    type,
    exercises: exercises[type] || defaultExercises,
  };
};

const createSets = (count: number): SetData[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `set-${i}`,
    weight: "",
    reps: "",
    completed: false,
  }));
};

// Type for program exercise data (from saved_programs)
type ProgramExercise = {
  name: string;
  sets: number;
  reps: string;
  rir: number;
  notes?: string;
};

// Transform program exercises to active workout format
const transformProgramExercises = (programExercises: ProgramExercise[]): ExerciseData[] => {
  return programExercises.map((ex, index) => ({
    id: `ex-${index}`,
    name: ex.name,
    muscles: [], // Will be populated by exercise lookup if needed
    sets: createSets(ex.sets),
    targetReps: ex.reps,
    targetRIR: ex.rir,
    isExpanded: index === 0, // First exercise expanded by default
  }));
};

// Create workout from program data
const createWorkoutFromProgram = (
  name: string,
  type: string,
  exercises: ProgramExercise[]
): WorkoutData => {
  return {
    id: `workout-${Date.now()}`,
    name,
    type,
    exercises: transformProgramExercises(exercises),
  };
};

// Motivational messages for set completion
const SET_MESSAGES = ["Nice!", "Strong!", "Solid!", "Keep it up!", "Crushed it!"];
const EXERCISE_MESSAGES = ["Exercise done!", "Moving on!", "Great work!"];

// Convert EffortLevel to RIR number for database storage
const effortToRIR = (effort: EffortLevel | undefined): number | null => {
  if (!effort) return null;
  const mapping: Record<EffortLevel, number> = {
    easy: 4,
    moderate: 3,
    hard: 2,
    veryHard: 1,
    failure: 0,
  };
  return mapping[effort] ?? null;
};

// Calculate adjusted weight based on readiness
const getAdjustedWeight = (baseWeight: number, adjustmentPercent: number): number => {
  if (!baseWeight || baseWeight === 0) return 0;
  const adjusted = baseWeight * (1 + adjustmentPercent / 100);
  // Round to nearest 5 for barbell, 2.5 for dumbbells (simplified to 5)
  return Math.round(adjusted / 5) * 5;
};

// Get readiness indicator for header
const getReadinessIndicator = (readiness: ReadinessLevel) => {
  const level = readinessScale[readiness];
  return {
    label: level.shortLabel,
    color: readiness === "low" ? "#FF6B35" : readiness === "high" ? "#7FA07F" : "#00C9B7",
  };
};

export default function ActiveWorkoutScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const params = useLocalSearchParams<{ 
    type?: string; 
    name?: string;
    readiness?: ReadinessLevel;
    adjustmentPercent?: string;
    painAreas?: string;
    programId?: string;
    exercises?: string; // JSON stringified program exercises
  }>();
  const workoutType = params.type || "Full Body";
  const workoutName = params.name || workoutType;
  
  // Pre-workout check-in data
  const readiness = (params.readiness as ReadinessLevel) || "moderate";
  const adjustmentPercent = params.adjustmentPercent ? parseFloat(params.adjustmentPercent) : 0;
  const painAreas = params.painAreas ? params.painAreas.split(",").filter(Boolean) : [];
  
  // State - use program exercises if provided, otherwise fall back to sample workout
  const [workout, setWorkout] = useState<WorkoutData>(() => {
    if (params.exercises) {
      try {
        const programExercises = JSON.parse(params.exercises) as ProgramExercise[];
        return createWorkoutFromProgram(workoutName, workoutType, programExercises);
      } catch (e) {
        console.error("Failed to parse program exercises:", e);
        return getSampleWorkout(workoutType);
      }
    }
    return getSampleWorkout(workoutType);
  });
  const [startTime] = useState(() => new Date());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restSecondsLeft, setRestSecondsLeft] = useState(90);
  const [showCelebration, setShowCelebration] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [showSetConfetti, setShowSetConfetti] = useState<string | null>(null);
  
  // Exercise swap modal
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapExerciseId, setSwapExerciseId] = useState<string | null>(null);
  
  // Exercise info modal
  const [showExerciseInfo, setShowExerciseInfo] = useState<string | null>(null);
  
  // PR State
  const [showPRCelebration, setShowPRCelebration] = useState(false);
  const [prData, setPRData] = useState<{
    exercise: string;
    previousValue: string;
    newValue: string;
  } | null>(null);
  
  // "Something off?" feedback
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false);
  const [feedbackExerciseId, setFeedbackExerciseId] = useState<string | null>(null);
  
  // Post-workout checkin
  const [showPostWorkoutCheckin, setShowPostWorkoutCheckin] = useState(false);
  
  // Pain follow-up modal (shows after workout if pain areas were selected pre-workout)
  const [showPainFollowUp, setShowPainFollowUp] = useState(false);
  
  // Active limitations hook
  const { markCheckedToday, recordFeedback, limitations } = useActiveLimitations(userId);
  
  // Effort tracking per set
  const [setEfforts, setSetEfforts] = useState<Record<string, EffortLevel>>({});
  
  // PR tracking hook
  const { checkPR, getPR, updateLocalPR } = usePRs(userId);
  
  // Previous workout data for PREVIOUS column
  const exerciseNames = useMemo(() => workout.exercises.map(ex => ex.name), [workout.exercises]);
  const { getPreviousSet } = usePreviousWorkout(userId, exerciseNames);
  
  // Weekly summary for workouts count (add 1 for current workout being completed)
  const { data: weeklySummary } = useWeeklySummary(userId);
  const workoutsThisWeek = (weeklySummary?.workoutsCompleted || 0) + 1;

  // Get user ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  // Timer for elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Rest timer countdown
  useEffect(() => {
    if (!showRestTimer) return;
    
    if (restSecondsLeft <= 0) {
      setShowRestTimer(false);
      haptic("success");
      showToast({ type: "motivation" });
      return;
    }

    const interval = setInterval(() => {
      setRestSecondsLeft((prev) => {
        if (prev <= 1) {
          setShowRestTimer(false);
          haptic("success");
          showToast({ type: "motivation" });
          return 0;
        }
        // Haptic at 5 seconds
        if (prev === 6) haptic("light");
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showRestTimer, restSecondsLeft]);

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      handleExit();
      return true;
    });
    return () => backHandler.remove();
  }, [workout]);

  // Calculate progress
  const progress = useMemo(() => {
    const totalSets = workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
    const completedSets = workout.exercises.reduce(
      (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
      0
    );
    return { totalSets, completedSets, percentage: totalSets > 0 ? completedSets / totalSets : 0 };
  }, [workout]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle set completion
  const handleSetComplete = useCallback((exerciseId: string, setId: string) => {
    // Get the exercise and set data for PR check
    const exercise = workout.exercises.find((ex) => ex.id === exerciseId);
    const set = exercise?.sets.find((s) => s.id === setId);
    
    let hitPR = false;
    
    if (exercise && set && set.weight && set.reps) {
      const weight = parseFloat(set.weight);
      const reps = parseInt(set.reps, 10);
      
      if (weight > 0 && reps > 0) {
        const { isPR, previousBest } = checkPR(exercise.name, weight, reps);
        
        if (isPR) {
          // It's a new PR!
          hitPR = true;
          updateLocalPR(exercise.name, weight, reps);
          
          // Show PR celebration after a short delay
          setTimeout(() => {
            setPRData({
              exercise: exercise.name,
              previousValue: previousBest 
                ? `${previousBest.max_weight_lbs} x ${previousBest.reps_at_max_weight}`
                : "First time!",
              newValue: `${weight} x ${reps}`,
            });
            setShowPRCelebration(true);
          }, 500);
        }
      }
    }
    
    // Update state
    setWorkout((prev) => {
      const updated = { ...prev };
      updated.exercises = prev.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const newSets = ex.sets.map((s) => 
          s.id === setId ? { ...s, completed: true } : s
        );
        return { ...ex, sets: newSets };
      });
      return updated;
    });

    // Trigger feedback
    hapticSuccess();
    
    // Show encouraging message
    const message = SET_MESSAGES[Math.floor(Math.random() * SET_MESSAGES.length)];
    showToast({ message, type: "setComplete" });

    // Check if exercise is complete - delay longer if PR to let celebration show first
    const delayMs = hitPR ? 2500 : 800;
    setTimeout(() => {
      setWorkout((current) => {
        const exercise = current.exercises.find((ex) => ex.id === exerciseId);
        const allSetsComplete = exercise?.sets.every((s) => s.completed);
        
        if (allSetsComplete) {
          const exerciseIndex = current.exercises.findIndex((ex) => ex.id === exerciseId);
          const isLastExercise = exerciseIndex === current.exercises.length - 1;
          
          if (isLastExercise) {
            // Workout complete!
            hapticCelebration();
            setShowCelebration(true);
          } else {
            // Move to next exercise
            const nextIndex = exerciseIndex + 1;
            setActiveExerciseIndex(nextIndex);
            
            // Auto-expand next exercise
            return {
              ...current,
              exercises: current.exercises.map((ex, i) => ({
                ...ex,
                isExpanded: i === nextIndex,
              })),
            };
          }
        } else {
          // Show rest timer only if PR celebration is not showing
          if (!showPRCelebration) {
            setRestSecondsLeft(90);
            setShowRestTimer(true);
          }
        }
        
        return current;
      });
    }, delayMs);
  }, [workout.exercises, checkPR, updateLocalPR, showPRCelebration]);

  // Handle set value change
  const handleSetChange = useCallback(
    (exerciseId: string, setId: string, field: "weight" | "reps", value: string) => {
      setWorkout((prev) => ({
        ...prev,
        exercises: prev.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((set) =>
              set.id === setId ? { ...set, [field]: value } : set
            ),
          };
        }),
      }));
    },
    []
  );

  // Toggle exercise expand
  const toggleExercise = useCallback((exerciseId: string) => {
    hapticPress();
    setWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => ({
        ...ex,
        isExpanded: ex.id === exerciseId ? !ex.isExpanded : ex.isExpanded,
      })),
    }));
  }, []);

  // Open swap modal for an exercise
  const openSwapModal = useCallback((exerciseId: string) => {
    setSwapExerciseId(exerciseId);
    setShowSwapModal(true);
  }, []);

  // Handle exercise swap
  const handleSwapExercise = useCallback((newExercise: { name: string; muscles: string[]; equipment: string }) => {
    if (!swapExerciseId) return;
    
    setWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => {
        if (ex.id !== swapExerciseId) return ex;
        // Keep the same sets structure but update exercise details
        return {
          ...ex,
          name: newExercise.name,
          muscles: newExercise.muscles,
          // Reset sets when swapping
          sets: ex.sets.map(s => ({ ...s, weight: "", reps: "", completed: false })),
        };
      }),
    }));
    
    setSwapExerciseId(null);
    showToast({ message: `Swapped to ${newExercise.name}`, type: "motivation" });
  }, [swapExerciseId]);

  // Handle workout finish - shows post-workout checkin first, then pain follow-up if needed
  const handleFinish = useCallback(async () => {
    setShowCelebration(false);
    setShowPostWorkoutCheckin(true);
  }, []);

  // Session ID ref for pain feedback recording
  const sessionIdRef = useRef<string | null>(null);

  // Handle post-workout checkin completion
  const handlePostWorkoutComplete = useCallback(async (checkinData: PostWorkoutData) => {
    setShowPostWorkoutCheckin(false);
    
    // Save complete workout to Supabase
    if (userId) {
      try {
        // 1. Create workout session with feeling data
        const { data: sessionData, error: sessionError } = await supabase
          .from("workout_sessions")
          .insert({
            user_id: userId,
            title: workout.name,
            started_at: startTime.toISOString(),
            ended_at: new Date().toISOString(),
            post_workout_feeling: checkinData.feeling,
            pain_location: checkinData.painLocation,
          })
          .select("id")
          .single();

        if (sessionError) throw sessionError;
        const sessionId = sessionData.id;

        // 2. If pain was reported, create coach event and mark coach as unread
        if (checkinData.feeling === "pain" && checkinData.painLocation) {
          await recordCoachEvent(userId, "pain", {
            location: checkinData.painLocation,
            workout: workout.name,
            date: new Date().toISOString(),
          });
          // Show red dot on Coach tab for pain follow-up
          await markCoachAsUnreadGlobal();
        }

        // 3. If it was a hard session, create coach event
        if (checkinData.feeling === "hard") {
          await recordCoachEvent(userId, "hard_session", {
            workout: workout.name,
            date: new Date().toISOString(),
          });
        }

        // 4. Save exercises and sets
        for (let i = 0; i < workout.exercises.length; i++) {
          const exercise = workout.exercises[i];
          const completedSets = exercise.sets.filter((s) => s.completed);
          
          // Skip exercises with no completed sets
          if (completedSets.length === 0) continue;

          // Insert exercise
          const { data: exerciseData, error: exerciseError } = await supabase
            .from("workout_exercises")
            .insert({
              session_id: sessionId,
              exercise_name: exercise.name,
              muscle_group: exercise.muscles[0] || null,
              order_index: i,
            })
            .select("id")
            .single();

          if (exerciseError) {
            console.error("Error saving exercise:", exerciseError);
            continue;
          }

          // Insert sets for this exercise with PR detection and actual RIR
          const setsToInsert = completedSets.map((set, setIndex) => {
            const weight = set.weight ? parseFloat(set.weight) : 0;
            const reps = set.reps ? parseInt(set.reps, 10) : 0;
            const { isPR } = checkPR(exercise.name, weight, reps);
            
            // Use actual effort/RIR if recorded, otherwise fall back to target RIR
            const setKey = `${exercise.id}-${set.id}`;
            const actualRIR = effortToRIR(setEfforts[setKey]) ?? exercise.targetRIR;
            
            return {
              workout_exercise_id: exerciseData.id,
              set_number: setIndex + 1,
              weight_lbs: weight || null,
              reps: reps || null,
              rir: actualRIR,
              is_warmup: false,
              is_pr: isPR && weight > 0 && reps > 0,
            };
          });

          const { error: setsError } = await supabase
            .from("workout_sets")
            .insert(setsToInsert);

          if (setsError) {
            console.error("Error saving sets:", setsError);
          }
        }

        // 5. Update user streak
        const { error: streakError } = await supabase.rpc("update_user_streak", {
          p_user_id: userId,
        });

        if (streakError) {
          console.error("Error updating streak:", streakError);
        }

        console.log("Workout saved successfully!");
        
        // Store session ID for pain feedback
        sessionIdRef.current = sessionId;
        
        // Invalidate coach context cache so AI has fresh data
        const invalidationReason = checkinData.feeling === "pain" 
          ? "pain_reported" 
          : "workout_complete";
        await invalidateAndNotify(userId, invalidationReason);
        
        // Mark limitations as checked for this session
        if (painAreas.length > 0) {
          await markCheckedToday(painAreas as BodyRegion[]);
        }
      } catch (e) {
        console.error("Error saving workout:", e);
        Alert.alert("Error", "Failed to save workout. Please try again.");
      }
    }

    // Show pain follow-up if user had pain areas selected
    if (painAreas.length > 0) {
      setShowPainFollowUp(true);
    } else {
      // Navigate to Home tab
      router.replace("/(app)/(tabs)" as any);
    }
  }, [userId, workout, startTime, checkPR, painAreas, markCheckedToday, setEfforts]);

  // Handle pain follow-up completion
  const handlePainFollowUpComplete = useCallback(async (feedback: Record<BodyRegion, PainFeedback>) => {
    setShowPainFollowUp(false);
    
    // Record feedback for each pain area
    if (sessionIdRef.current) {
      for (const [area, feedbackValue] of Object.entries(feedback)) {
        const limitation = limitations.find(l => l.area === area);
        if (limitation) {
          await recordFeedback(limitation.id, sessionIdRef.current, feedbackValue);
        }
      }
    }
    
    // Navigate to Home tab
    router.replace("/(app)/(tabs)" as any);
  }, [limitations, recordFeedback]);

  // Handle skipping pain follow-up
  const handlePainFollowUpSkip = useCallback(() => {
    setShowPainFollowUp(false);
    router.replace("/(app)/(tabs)" as any);
  }, []);

  // Handle exit with confirmation
  const handleExit = useCallback(() => {
    if (progress.completedSets > 0) {
      Alert.alert(
        "End Workout?",
        `You've completed ${progress.completedSets} sets. Save and exit?`,
        [
          { text: "Continue", style: "cancel" },
          { 
            text: "End Workout", 
            style: "destructive",
            onPress: handleFinish,
          },
        ]
      );
    } else {
      router.back();
    }
  }, [progress.completedSets, handleFinish]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleExit} style={styles.headerButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        
        <View style={styles.headerCenter}>
          <Text allowFontScaling={false} style={styles.workoutName}>
            {workout.name}
          </Text>
          <View style={styles.timerRow}>
            <Ionicons name="time-outline" size={14} color={colors.primary} />
            <Text allowFontScaling={false} style={styles.timer}>
              {formatTime(elapsedTime)}
            </Text>
          </View>
        </View>

        <Pressable 
          onPress={progress.completedSets === progress.totalSets ? () => setShowCelebration(true) : handleExit}
          style={styles.headerButton}
        >
          <Text allowFontScaling={false} style={styles.finishText}>
            {progress.completedSets === progress.totalSets ? "Done" : "End"}
          </Text>
        </Pressable>
      </View>

      {/* Progress bar + Readiness indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View 
            style={[
              styles.progressFill, 
              { width: `${progress.percentage * 100}%` }
            ]} 
          />
        </View>
        <View style={styles.progressMeta}>
          <Text allowFontScaling={false} style={styles.progressText}>
            {progress.completedSets} / {progress.totalSets} sets
          </Text>
          {adjustmentPercent !== 0 && (
            <View style={[styles.readinessBadge, { backgroundColor: getReadinessIndicator(readiness).color + "20" }]}>
              <Text allowFontScaling={false} style={[styles.readinessBadgeText, { color: getReadinessIndicator(readiness).color }]}>
                {adjustmentPercent > 0 ? "+" : ""}{adjustmentPercent}% intensity
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Exercises */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {workout.exercises.map((exercise, exerciseIndex) => {
            const completedSets = exercise.sets.filter((s) => s.completed).length;
            const isComplete = completedSets === exercise.sets.length;
            
            return (
              <Animated.View 
                key={exercise.id}
                entering={FadeInDown.delay(exerciseIndex * 50).duration(300)}
                style={[
                  styles.exerciseCard,
                  isComplete && styles.exerciseCardComplete,
                ]}
              >
                {/* Exercise Header */}
                <View style={styles.exerciseHeader}>
                  <Pressable 
                    onPress={() => toggleExercise(exercise.id)}
                    style={styles.exerciseHeaderContent}
                  >
                    <View style={styles.exerciseInfo}>
                      <View style={styles.exerciseNameRow}>
                        <Text allowFontScaling={false} style={styles.exerciseName}>
                          {exercise.name}
                        </Text>
                        {isComplete && (
                          <View style={styles.completeBadge}>
                            <Ionicons name="checkmark" size={12} color="#000" />
                          </View>
                        )}
                      </View>
                      <Text allowFontScaling={false} style={styles.exerciseMeta}>
                        {exercise.muscles.join(", ")} · {exercise.targetReps} reps · RIR {exercise.targetRIR}
                      </Text>
                    </View>
                    <View style={styles.exerciseProgress}>
                      <Text allowFontScaling={false} style={styles.progressCount}>
                        {completedSets}/{exercise.sets.length}
                      </Text>
                      <Ionicons 
                        name={exercise.isExpanded ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color={colors.textMuted} 
                      />
                    </View>
                  </Pressable>
                  {/* Swap button */}
                  <Pressable
                    onPress={() => {
                      hapticPress();
                      openSwapModal(exercise.id);
                    }}
                    style={[styles.infoButton, { backgroundColor: colors.primaryMuted, marginRight: 8 }]}
                    hitSlop={8}
                  >
                    <Ionicons name="swap-horizontal" size={18} color={colors.primary} />
                  </Pressable>
                  {/* Info button */}
                  <Pressable
                    onPress={() => {
                      hapticPress();
                      setShowExerciseInfo(exercise.name);
                    }}
                    style={[styles.infoButton, { backgroundColor: colors.primaryMuted }]}
                    hitSlop={8}
                  >
                    <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
                  </Pressable>
                </View>

                {/* Sets */}
                {exercise.isExpanded && (
                  <Animated.View 
                    entering={FadeIn.duration(200)}
                    style={styles.setsContainer}
                  >
                    {/* Weight suggestion based on PR and readiness */}
                    {(() => {
                      const pr = getPR(exercise.name);
                      const baseWeight = pr?.max_weight_lbs || (exercise.previousBest ? parseFloat(exercise.previousBest.weight) : 0);
                      const adjustedWeight = getAdjustedWeight(baseWeight, adjustmentPercent);
                      
                      if (pr) {
                        return (
                          <View style={styles.weightHintContainer}>
                            <Text allowFontScaling={false} style={styles.previousBest}>
                              PR: {pr.max_weight_lbs} lbs × {pr.reps_at_max_weight}
                            </Text>
                            {adjustmentPercent !== 0 && adjustedWeight > 0 && (
                              <Text allowFontScaling={false} style={[
                                styles.adjustedHint,
                                { color: adjustmentPercent > 0 ? colors.success : colors.intensity }
                              ]}>
                                Today: ~{adjustedWeight} lbs ({adjustmentPercent > 0 ? "+" : ""}{adjustmentPercent}%)
                              </Text>
                            )}
                          </View>
                        );
                      } else if (exercise.previousBest) {
                        return (
                          <View style={styles.weightHintContainer}>
                            <Text allowFontScaling={false} style={styles.previousBest}>
                              Last: {exercise.previousBest.weight} lbs × {exercise.previousBest.reps}
                            </Text>
                            {adjustmentPercent !== 0 && adjustedWeight > 0 && (
                              <Text allowFontScaling={false} style={[
                                styles.adjustedHint,
                                { color: adjustmentPercent > 0 ? colors.success : colors.intensity }
                              ]}>
                                Today: ~{adjustedWeight} lbs
                              </Text>
                            )}
                          </View>
                        );
                      }
                      return null;
                    })()}

                    {/* TARGET Row - Progressive Overload Suggestion */}
                    {(() => {
                      const prevSet = getPreviousSet(exercise.name, 1);
                      if (!prevSet) return null;
                      
                      const target = calculateTarget({
                        weight: prevSet.weight,
                        reps: prevSet.reps,
                        rir: null, // We could pass RIR from last session if available
                      });
                      
                      if (!target) return null;
                      
                      return (
                        <View style={[styles.targetRow, { backgroundColor: colors.cardAlt }]}>
                          <Text allowFontScaling={false} style={[styles.targetLabel, { color: colors.textMuted }]}>
                            TARGET
                          </Text>
                          <Text allowFontScaling={false} style={[styles.targetValue, { color: colors.text }]}>
                            {target.weight} lbs × {target.reps} reps
                          </Text>
                          {target.insight && (
                            <Text allowFontScaling={false} style={[styles.targetInsight, { color: colors.textSecondary }]}>
                              {target.insight}
                            </Text>
                          )}
                        </View>
                      );
                    })()}

                    {/* Column Headers */}
                    <View style={styles.columnHeaderRow}>
                      <Text allowFontScaling={false} style={[styles.columnHeader, styles.columnHeaderSet, { color: colors.textMuted }]}>
                        Set
                      </Text>
                      <Text allowFontScaling={false} style={[styles.columnHeader, styles.columnHeaderPrev, { color: colors.textMuted }]}>
                        Prev
                      </Text>
                      <Text allowFontScaling={false} style={[styles.columnHeader, styles.columnHeaderWeight, { color: colors.textMuted }]}>
                        Weight
                      </Text>
                      <Text allowFontScaling={false} style={[styles.columnHeader, styles.columnHeaderReps, { color: colors.textMuted }]}>
                        Reps
                      </Text>
                      <View style={styles.columnHeaderCheck} />
                    </View>

                    {/* Set rows */}
                    {exercise.sets.map((set, setIndex) => {
                        // Get previous workout data for this set
                        const prevSet = getPreviousSet(exercise.name, setIndex + 1);
                        
                        return (
                        <View 
                          key={set.id} 
                          style={[
                            styles.setRow,
                            set.completed && styles.setRowComplete,
                          ]}
                        >
                          {/* Set number */}
                          <View style={[
                            styles.setNumber,
                            set.completed && styles.setNumberComplete,
                          ]}>
                            <Text allowFontScaling={false} style={[
                              styles.setNumberText,
                              set.completed && styles.setNumberTextComplete,
                            ]}>
                              {setIndex + 1}
                            </Text>
                          </View>

                          {/* PREV column - previous workout weight */}
                          <View style={styles.prevColumn}>
                            <Text 
                              allowFontScaling={false} 
                              style={[styles.prevText, { color: colors.textMuted }]}
                            >
                              {prevSet?.weight || "--"}
                            </Text>
                          </View>

                          {/* Weight input */}
                          <View style={styles.inputColumn}>
                            <TextInput
                              value={set.weight}
                              onChangeText={(value) => handleSetChange(exercise.id, set.id, "weight", value)}
                              placeholder={exercise.previousBest?.weight || "0"}
                              placeholderTextColor={colors.inputPlaceholder}
                              keyboardType="numeric"
                              keyboardAppearance="light"
                              style={[styles.input, set.completed && styles.inputComplete]}
                              editable={!set.completed}
                              selectTextOnFocus
                            />
                          </View>

                          {/* Reps input */}
                          <View style={styles.inputColumn}>
                            <TextInput
                              value={set.reps}
                              onChangeText={(value) => handleSetChange(exercise.id, set.id, "reps", value)}
                              placeholder={exercise.targetReps.split("-")[0]}
                              placeholderTextColor={colors.inputPlaceholder}
                              keyboardType="numeric"
                              keyboardAppearance="light"
                              style={[styles.input, set.completed && styles.inputComplete]}
                              editable={!set.completed}
                              selectTextOnFocus
                            />
                          </View>

                          {/* Complete checkbox */}
                          <AnimatedCheckbox
                            checked={set.completed}
                            onToggle={() => !set.completed && handleSetComplete(exercise.id, set.id)}
                            size={32}
                          />
                        </View>
                      );
                    })}
                  </Animated.View>
                )}
              </Animated.View>
            );
          })}

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* "Something off?" prompt - appears after 2+ sets */}
      {progress.completedSets >= 2 && progress.completedSets < progress.totalSets && (
        <Animated.View 
          entering={FadeInUp.delay(500).duration(300)}
          style={styles.feedbackPromptContainer}
        >
          <Pressable
            onPress={() => {
              hapticPress();
              Alert.alert(
                "Something Off?",
                "Let us know what's happening so we can adjust.",
                [
                  { text: "Weight too heavy", onPress: () => showToast({ message: "Try reducing 5-10%", type: "motivation" }) },
                  { text: "Feeling pain", onPress: () => showToast({ message: "Consider swapping this exercise", type: "motivation" }) },
                  { text: "Too fatigued", onPress: () => showToast({ message: "Take a longer rest", type: "motivation" }) },
                  { text: "All good!", style: "cancel" },
                ]
              );
            }}
            style={[styles.feedbackPromptButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.textMuted} />
            <Text allowFontScaling={false} style={[styles.feedbackPromptText, { color: colors.textMuted }]}>
              Something off?
            </Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Rest Timer Modal */}
      <Modal
        visible={showRestTimer}
        animationType="fade"
        transparent
        onRequestClose={() => setShowRestTimer(false)}
      >
        <View style={styles.restModal}>
          <Animated.View 
            entering={FadeInUp.duration(300)}
            style={styles.restContent}
          >
            <Text allowFontScaling={false} style={styles.restLabel}>
              Rest
            </Text>
            
            {/* Timer with +/- buttons */}
            <View style={styles.restTimerRow}>
              <Pressable
                onPress={() => {
                  hapticPress();
                  setRestSecondsLeft((prev) => Math.max(0, prev - 15));
                }}
                style={[styles.restAdjustButton, { backgroundColor: colors.card }]}
              >
                <Text allowFontScaling={false} style={[styles.restAdjustText, { color: colors.text }]}>
                  -15
                </Text>
              </Pressable>
              
              <Text allowFontScaling={false} style={[
                styles.restTime,
                restSecondsLeft <= 10 && styles.restTimeUrgent,
              ]}>
                {formatTime(restSecondsLeft)}
              </Text>
              
              <Pressable
                onPress={() => {
                  hapticPress();
                  setRestSecondsLeft((prev) => prev + 15);
                }}
                style={[styles.restAdjustButton, { backgroundColor: colors.card }]}
              >
                <Text allowFontScaling={false} style={[styles.restAdjustText, { color: colors.text }]}>
                  +15
                </Text>
              </Pressable>
            </View>
            
            {/* Rest duration presets */}
            <View style={styles.restPresets}>
              {[60, 90, 120, 180].map((seconds) => (
                <Pressable
                  key={seconds}
                  onPress={() => {
                    hapticPress();
                    setRestSecondsLeft(seconds);
                  }}
                  style={[
                    styles.restPreset,
                    restSecondsLeft >= seconds - 5 && restSecondsLeft <= seconds + 5 && styles.restPresetActive,
                  ]}
                >
                  <Text allowFontScaling={false} style={styles.restPresetText}>
                    {seconds >= 60 ? `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}` : `${seconds}s`}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={() => {
                hapticPress();
                setShowRestTimer(false);
                showToast({ type: "motivation" });
              }}
              style={styles.skipButton}
            >
              <Text allowFontScaling={false} style={styles.skipButtonText}>
                Skip Rest
              </Text>
              <Ionicons name="play-forward" size={16} color={colors.textMuted} />
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      {/* Workout Complete Celebration */}
      <WorkoutComplete
        visible={showCelebration}
        stats={{
          duration: formatTime(elapsedTime),
          exercises: workout.exercises.length,
          sets: progress.completedSets,
          workoutsThisWeek: workoutsThisWeek,
        }}
        onContinue={handleFinish}
      />

      {/* PR Celebration */}
      {prData && (
        <PRCelebration
          visible={showPRCelebration}
          exercise={prData.exercise}
          previousValue={prData.previousValue}
          newValue={prData.newValue}
          onDismiss={() => {
            setShowPRCelebration(false);
            setPRData(null);
          }}
        />
      )}

      {/* Exercise Info Modal */}
      <Modal
        visible={!!showExerciseInfo}
        animationType="slide"
        transparent
        onRequestClose={() => setShowExerciseInfo(null)}
      >
        <View style={styles.exerciseInfoModal}>
          <Pressable 
            style={styles.exerciseInfoBackdrop} 
            onPress={() => setShowExerciseInfo(null)} 
          />
          <View style={styles.exerciseInfoSheet}>
            {showExerciseInfo && (
              <ExerciseInfo 
                exerciseName={showExerciseInfo} 
                onClose={() => setShowExerciseInfo(null)}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Post-Workout Checkin */}
      <PostWorkoutCheckin
        visible={showPostWorkoutCheckin}
        onComplete={handlePostWorkoutComplete}
        onSkip={() => {
          setShowPostWorkoutCheckin(false);
          handlePostWorkoutComplete({ feeling: "good", painLocation: null });
        }}
        workoutTitle={workout.name}
        duration={elapsedTime}
      />

      {/* Pain Follow-Up Modal (shown if pre-workout pain areas were selected) */}
      <PainFollowUpModal
        visible={showPainFollowUp}
        painAreas={painAreas as BodyRegion[]}
        onComplete={handlePainFollowUpComplete}
        onSkip={handlePainFollowUpSkip}
      />

      {/* Exercise Swap Modal */}
      {swapExerciseId && (
        <ExerciseSwapModal
          visible={showSwapModal}
          onClose={() => {
            setShowSwapModal(false);
            setSwapExerciseId(null);
          }}
          onSelectExercise={handleSwapExercise}
          currentExercise={workout.exercises.find(ex => ex.id === swapExerciseId)?.name || ""}
          currentMuscles={workout.exercises.find(ex => ex.id === swapExerciseId)?.muscles || []}
        />
      )}

      <ToastContainer />
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    // Header
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    headerCenter: {
      alignItems: "center",
    },
    workoutName: {
      color: colors.text,
      fontSize: 17,
      fontFamily: "Inter_600SemiBold",
    },
    timerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 2,
    },
    timer: {
      color: colors.primary,
      fontSize: 14,
      fontFamily: "Inter_500Medium",
    },
    finishText: {
      color: colors.primary,
      fontSize: 16,
      fontFamily: "Inter_500Medium",
    },
    // Progress
    progressContainer: {
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    progressBar: {
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    progressText: {
      color: colors.textMuted,
      fontSize: 12,
      fontFamily: "Inter_400Regular",
    },
    progressMeta: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 8,
    },
    readinessBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    readinessBadgeText: {
      fontSize: 11,
      fontFamily: "Inter_500Medium",
    },
    // Content
    scrollContent: {
      padding: 16,
    },
    // Exercise Card
    exerciseCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      marginBottom: 12,
      overflow: "hidden",
    },
    exerciseCardComplete: {
      borderColor: colors.primary,
      borderWidth: 1,
      opacity: 0.8,
    },
    exerciseHeader: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      gap: 8,
    },
    exerciseHeaderContent: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
    },
    infoButton: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    exerciseInfo: {
      flex: 1,
    },
    exerciseNameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    exerciseName: {
      color: colors.text,
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
    },
    completeBadge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    exerciseMeta: {
      color: colors.textMuted,
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      marginTop: 2,
    },
    exerciseProgress: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    progressCount: {
      color: colors.text,
      fontSize: 14,
      fontFamily: "Inter_500Medium",
    },
    // Sets
    setsContainer: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    weightHintContainer: {
      alignItems: "center",
      marginBottom: 12,
      gap: 4,
    },
    previousBest: {
      color: colors.inputPlaceholder,
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
    },
    adjustedHint: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      textAlign: "center",
    },
    targetRow: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 12,
      borderRadius: 12,
    },
    targetLabel: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    targetValue: {
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
    },
    targetInsight: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      marginTop: 4,
      lineHeight: 18,
    },
    // Column Headers
    columnHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingBottom: 8,
      gap: 8,
    },
    columnHeader: {
      fontSize: 11,
      fontFamily: "Inter_500Medium",
      textTransform: "uppercase" as const,
      letterSpacing: 0.5,
    },
    columnHeaderSet: {
      width: 28,
      textAlign: "center",
    },
    columnHeaderPrev: {
      width: 36,
      textAlign: "center",
    },
    columnHeaderWeight: {
      flex: 1,
      textAlign: "center",
    },
    columnHeaderReps: {
      flex: 1,
      textAlign: "center",
    },
    columnHeaderCheck: {
      width: 32,
    },
    // Set Rows
    setRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.cardAlt,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      gap: 8,
    },
    setRowComplete: {
      opacity: 0.6,
    },
    setNumber: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    setNumberComplete: {
      backgroundColor: colors.primary,
    },
    setNumberText: {
      color: colors.textMuted,
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
    },
    setNumberTextComplete: {
      color: colors.textOnPrimary,
    },
    prevColumn: {
      width: 36,
      alignItems: "center",
    },
    prevText: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
    },
    inputColumn: {
      flex: 1,
    },
    input: {
      backgroundColor: colors.card,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 8,
      color: colors.text,
      fontSize: 18,
      fontFamily: "Inter_600SemiBold",
      textAlign: "center",
    },
    inputComplete: {
      backgroundColor: colors.border,
      color: colors.textMuted,
    },
    // Rest Modal
    restModal: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.85)",
      justifyContent: "center",
      alignItems: "center",
    },
    restContent: {
      alignItems: "center",
      padding: 32,
    },
    restLabel: {
      color: colors.textMuted,
      fontSize: 16,
      fontFamily: "Inter_500Medium",
      marginBottom: 8,
    },
    restTimerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 24,
    },
    restAdjustButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
    },
    restAdjustText: {
      fontSize: 18,
      fontFamily: "Inter_600SemiBold",
    },
    restTime: {
      color: colors.text,
      fontSize: 72,
      fontFamily: "Inter_600SemiBold",
    },
    restTimeUrgent: {
      color: colors.intensity,
    },
    restPresets: {
      flexDirection: "row",
      gap: 12,
      marginTop: 32,
      marginBottom: 24,
    },
    restPreset: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    restPresetActive: {
      borderColor: colors.primary,
      backgroundColor: colors.selected,
    },
    restPresetText: {
      color: colors.text,
      fontSize: 14,
      fontFamily: "Inter_500Medium",
    },
    skipButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 24,
      backgroundColor: colors.card,
      borderRadius: 24,
    },
    skipButtonText: {
      color: colors.textMuted,
      fontSize: 14,
      fontFamily: "Inter_500Medium",
    },
    // Feedback Prompt
    feedbackPromptContainer: {
      position: "absolute",
      bottom: 24,
      left: 20,
      right: 20,
      alignItems: "center",
    },
    feedbackPromptButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1,
    },
    feedbackPromptText: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
    },
    // Exercise Info Modal
    exerciseInfoModal: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      justifyContent: "flex-end",
    },
    exerciseInfoBackdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    exerciseInfoSheet: {
      backgroundColor: colors.bg,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: 40,
      maxHeight: "80%",
    },
  });
