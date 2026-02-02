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

import { darkColors, theme } from "@/src/theme";
import { supabase } from "@/lib/supabase";
import { AnimatedCheckbox } from "@/src/animations/components";
import { MicroConfetti } from "@/src/animations/components/Confetti";
import { WorkoutComplete, ToastContainer, showToast } from "@/src/animations/celebrations";
import { haptic, hapticPress, hapticSuccess, hapticCelebration } from "@/src/animations/feedback/haptics";
import { SPRING_CONFIG } from "@/src/animations/constants";

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

// Motivational messages for set completion
const SET_MESSAGES = ["Nice!", "Strong!", "Solid!", "Keep it up!", "Crushed it!"];
const EXERCISE_MESSAGES = ["Exercise done!", "Moving on!", "Great work!"];

export default function ActiveWorkoutScreen() {
  const params = useLocalSearchParams<{ type?: string; name?: string }>();
  const workoutType = params.type || "Full Body";
  
  // State
  const [workout, setWorkout] = useState<WorkoutData>(() => getSampleWorkout(workoutType));
  const [startTime] = useState(() => new Date());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restSecondsLeft, setRestSecondsLeft] = useState(90);
  const [showCelebration, setShowCelebration] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [showSetConfetti, setShowSetConfetti] = useState<string | null>(null);

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
    // Update state
    setWorkout((prev) => {
      const updated = { ...prev };
      updated.exercises = prev.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const newSets = ex.sets.map((set) => 
          set.id === setId ? { ...set, completed: true } : set
        );
        return { ...ex, sets: newSets };
      });
      return updated;
    });

    // Trigger feedback
    hapticSuccess();
    setShowSetConfetti(setId);
    setTimeout(() => setShowSetConfetti(null), 1000);
    
    // Show encouraging message
    const message = SET_MESSAGES[Math.floor(Math.random() * SET_MESSAGES.length)];
    showToast({ message, type: "setComplete" });

    // Check if exercise is complete
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
          // Show rest timer
          setRestSecondsLeft(90);
          setShowRestTimer(true);
        }
        
        return current;
      });
    }, 800);
  }, []);

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

  // Handle workout finish
  const handleFinish = useCallback(async () => {
    setShowCelebration(false);
    
    // Save to Supabase
    if (userId) {
      try {
        await supabase.from("workout_sessions").insert({
          user_id: userId,
          title: workout.name,
          started_at: startTime.toISOString(),
          ended_at: new Date().toISOString(),
        });
      } catch (e) {
        console.error("Error saving workout:", e);
      }
    }

    router.back();
  }, [userId, workout, startTime]);

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
          <Ionicons name="close" size={24} color={darkColors.text} />
        </Pressable>
        
        <View style={styles.headerCenter}>
          <Text allowFontScaling={false} style={styles.workoutName}>
            {workout.name}
          </Text>
          <View style={styles.timerRow}>
            <Ionicons name="time-outline" size={14} color={darkColors.primary} />
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

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View 
            style={[
              styles.progressFill, 
              { width: `${progress.percentage * 100}%` }
            ]} 
          />
        </View>
        <Text allowFontScaling={false} style={styles.progressText}>
          {progress.completedSets} / {progress.totalSets} sets
        </Text>
      </View>

      {/* Exercises */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
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
                <Pressable 
                  onPress={() => toggleExercise(exercise.id)}
                  style={styles.exerciseHeader}
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
                      color={darkColors.muted} 
                    />
                  </View>
                </Pressable>

                {/* Sets */}
                {exercise.isExpanded && (
                  <Animated.View 
                    entering={FadeIn.duration(200)}
                    style={styles.setsContainer}
                  >
                    {/* Previous best hint */}
                    {exercise.previousBest && (
                      <Text allowFontScaling={false} style={styles.previousBest}>
                        Last time: {exercise.previousBest.weight} lbs × {exercise.previousBest.reps}
                      </Text>
                    )}

                    {/* Set rows */}
                    {exercise.sets.map((set, setIndex) => (
                      <View 
                        key={set.id} 
                        style={[
                          styles.setRow,
                          set.completed && styles.setRowComplete,
                        ]}
                      >
                        {/* Confetti */}
                        {showSetConfetti === set.id && (
                          <MicroConfetti active={true} origin={{ x: 40, y: 20 }} />
                        )}

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

                        {/* Weight input */}
                        <View style={styles.inputGroup}>
                          <TextInput
                            value={set.weight}
                            onChangeText={(value) => handleSetChange(exercise.id, set.id, "weight", value)}
                            placeholder={exercise.previousBest?.weight || "0"}
                            placeholderTextColor={darkColors.muted2}
                            keyboardType="numeric"
                            keyboardAppearance="dark"
                            style={[styles.input, set.completed && styles.inputComplete]}
                            editable={!set.completed}
                            selectTextOnFocus
                          />
                          <Text allowFontScaling={false} style={styles.inputLabel}>
                            lbs
                          </Text>
                        </View>

                        <Text allowFontScaling={false} style={styles.times}>×</Text>

                        {/* Reps input */}
                        <View style={styles.inputGroup}>
                          <TextInput
                            value={set.reps}
                            onChangeText={(value) => handleSetChange(exercise.id, set.id, "reps", value)}
                            placeholder={exercise.targetReps.split("-")[0]}
                            placeholderTextColor={darkColors.muted2}
                            keyboardType="numeric"
                            keyboardAppearance="dark"
                            style={[styles.input, set.completed && styles.inputComplete]}
                            editable={!set.completed}
                            selectTextOnFocus
                          />
                          <Text allowFontScaling={false} style={styles.inputLabel}>
                            reps
                          </Text>
                        </View>

                        {/* Complete checkbox */}
                        <AnimatedCheckbox
                          checked={set.completed}
                          onToggle={() => !set.completed && handleSetComplete(exercise.id, set.id)}
                          size={32}
                        />
                      </View>
                    ))}
                  </Animated.View>
                )}
              </Animated.View>
            );
          })}

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Rest Timer Modal */}
      <Modal
        visible={showRestTimer}
        animationType="fade"
        transparent
        onRequestClose={() => setShowRestTimer(false)}
      >
        <View style={styles.restModal}>
          <Animated.View 
            entering={FadeInUp.springify()}
            style={styles.restContent}
          >
            <Text allowFontScaling={false} style={styles.restLabel}>
              Rest
            </Text>
            <Text allowFontScaling={false} style={[
              styles.restTime,
              restSecondsLeft <= 10 && styles.restTimeUrgent,
            ]}>
              {formatTime(restSecondsLeft)}
            </Text>
            
            {/* Rest duration presets */}
            <View style={styles.restPresets}>
              {[60, 90, 120].map((seconds) => (
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
                    {seconds}s
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
              <Ionicons name="play-forward" size={16} color={darkColors.muted} />
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
          workoutsThisWeek: 3,
        }}
        onContinue={handleFinish}
      />

      <ToastContainer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.bg,
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: darkColors.border,
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
    color: darkColors.text,
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
    color: darkColors.primary,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  finishText: {
    color: darkColors.primary,
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
    backgroundColor: darkColors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: darkColors.primary,
    borderRadius: 2,
  },
  progressText: {
    color: darkColors.muted,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 6,
    textAlign: "center",
  },
  // Content
  scrollContent: {
    padding: 16,
  },
  // Exercise Card
  exerciseCard: {
    backgroundColor: darkColors.card,
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
  },
  exerciseCardComplete: {
    borderColor: darkColors.primary,
    borderWidth: 1,
    opacity: 0.8,
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
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
    color: darkColors.text,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  completeBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: darkColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseMeta: {
    color: darkColors.muted,
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
    color: darkColors.text,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  // Sets
  setsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  previousBest: {
    color: darkColors.muted2,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
    textAlign: "center",
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: darkColors.cardAlt,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  setRowComplete: {
    opacity: 0.6,
  },
  setNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: darkColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  setNumberComplete: {
    backgroundColor: darkColors.primary,
  },
  setNumberText: {
    color: darkColors.muted,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  setNumberTextComplete: {
    color: "#000",
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  input: {
    backgroundColor: darkColors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: darkColors.text,
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    minWidth: 56,
    textAlign: "center",
  },
  inputComplete: {
    backgroundColor: darkColors.border,
    color: darkColors.muted,
  },
  inputLabel: {
    color: darkColors.muted,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  times: {
    color: darkColors.muted,
    fontSize: 16,
  },
  // Rest Modal
  restModal: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  restContent: {
    alignItems: "center",
    padding: 32,
  },
  restLabel: {
    color: darkColors.muted,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    marginBottom: 8,
  },
  restTime: {
    color: darkColors.text,
    fontSize: 72,
    fontFamily: "Inter_600SemiBold",
  },
  restTimeUrgent: {
    color: "#FF6B35",
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
    backgroundColor: darkColors.card,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  restPresetActive: {
    borderColor: darkColors.primary,
    backgroundColor: darkColors.selectedBg,
  },
  restPresetText: {
    color: darkColors.text,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  skipButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: darkColors.card,
    borderRadius: 24,
  },
  skipButtonText: {
    color: darkColors.muted,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
