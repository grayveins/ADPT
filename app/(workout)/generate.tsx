/**
 * Program Generator Screen
 * 
 * Generate a personalized workout program using the local workout engine.
 * No AI/OpenAI required - instant generation!
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

import { useTheme } from "@/src/context/ThemeContext";
import { useSubscription } from "@/src/hooks/useSubscription";
import { supabase } from "@/lib/supabase";
import { hapticPress, hapticSuccess } from "@/src/animations/feedback/haptics";

// Import the local workout generator
import {
  generateProgram as localGenerateProgram,
  generateProgramName,
  toLegacyPlannedWorkouts,
  PHASE_COLORS,
  type GeneratorInput,
  type GeneratorOutput,
  type FitnessGoal,
  type ExperienceLevel,
  type UserEquipment,
  type PhysicalLimitation,
  type SplitPreference,
} from "@/lib/workout/generator";

// Types - now using generator output
type GeneratedExercise = {
  name: string;
  sets: number;
  reps: string;
  rir: number;
  notes?: string;
  muscleGroup?: string;
};

type GeneratedWorkout = {
  day: number;
  name: string;
  type: string;
  focus: string;
  exercises: GeneratedExercise[];
  estimatedDuration: number;
  phase?: string;
};

type GeneratedProgram = {
  name: string;
  description: string;
  workoutsPerWeek: number;
  workouts: GeneratedWorkout[];
  tips: string[];
  // New fields from local generator
  generatorOutput?: GeneratorOutput;
  phasesInfo?: {
    week1: string;
    week2: string;
    week3: string;
    week4: string;
  };
};

// Goal options
const goalOptions = [
  { id: "build_muscle", label: "Build Muscle", icon: "barbell-outline" },
  { id: "lose_fat", label: "Lose Fat", icon: "flame-outline" },
  { id: "get_stronger", label: "Get Stronger", icon: "trophy-outline" },
  { id: "improve_fitness", label: "General Fitness", icon: "fitness-outline" },
];

// Experience options
const experienceOptions = [
  { id: "beginner", label: "Beginner", desc: "<1 year" },
  { id: "intermediate", label: "Intermediate", desc: "1-3 years" },
  { id: "advanced", label: "Advanced", desc: "3+ years" },
];

// Days per week options
const daysOptions = [2, 3, 4, 5, 6];

// Split options based on days per week
type SplitOption = {
  id: string;
  label: string;
  description: string;
  minDays: number;
  maxDays: number;
};

const splitOptions: SplitOption[] = [
  { id: "auto", label: "Auto", description: "Best for your days", minDays: 2, maxDays: 6 },
  { id: "full_body", label: "Full Body", description: "All muscles each session", minDays: 2, maxDays: 3 },
  { id: "upper_lower", label: "Upper/Lower", description: "Split by body half", minDays: 4, maxDays: 4 },
  { id: "push_pull_legs", label: "Push/Pull/Legs", description: "Classic 3-way split", minDays: 5, maxDays: 6 },
  { id: "bro_split", label: "Body Part", description: "One muscle group/day", minDays: 5, maxDays: 5 },
];

// Get available splits for selected days
function getAvailableSplits(days: number): SplitOption[] {
  return splitOptions.filter(s => 
    s.id === "auto" || (days >= s.minDays && days <= s.maxDays)
  );
}

// =============================================================================
// HELPER FUNCTIONS - Map UI values to generator types
// =============================================================================

function mapGoalToFitnessGoal(goalId: string): FitnessGoal {
  switch (goalId) {
    case "build_muscle":
      return "hypertrophy";
    case "lose_fat":
      return "fat_loss";
    case "get_stronger":
      return "strength";
    case "improve_fitness":
    default:
      return "general_fitness";
  }
}

function mapEquipmentToUserEquipment(equipment: string[]): UserEquipment[] {
  // If full gym, return comprehensive equipment list
  if (equipment.includes("full_gym")) {
    return [
      "barbell",
      "dumbbells",
      "cables",
      "machines",
      "pull_up_bar",
      "bench",
      "squat_rack",
      "leg_press",
      "lat_pulldown",
    ];
  }
  
  // Map individual equipment items
  const mapping: Record<string, UserEquipment[]> = {
    "barbell": ["barbell", "squat_rack", "bench"],
    "dumbbells": ["dumbbells"],
    "cables": ["cables"],
    "machines": ["machines", "leg_press", "lat_pulldown"],
    "pull_up_bar": ["pull_up_bar"],
    "kettlebells": ["kettlebells"],
    "bands": ["resistance_bands"],
    "bodyweight": ["bodyweight_only"],
    "home_basic": ["dumbbells", "resistance_bands", "bodyweight_only"],
    "home_gym": ["dumbbells", "barbell", "bench", "pull_up_bar"],
  };
  
  const result: UserEquipment[] = [];
  for (const item of equipment) {
    const mapped = mapping[item];
    if (mapped) {
      result.push(...mapped);
    }
  }
  
  // Always include bodyweight_only if nothing else
  if (result.length === 0) {
    result.push("bodyweight_only");
  }
  
  // Deduplicate
  return [...new Set(result)];
}

function mapLimitations(limitations: string[]): PhysicalLimitation[] {
  const limitationMapping: Record<string, PhysicalLimitation> = {
    "lower_back": { area: "lower_back", severity: "moderate" },
    "back": { area: "lower_back", severity: "moderate" },
    "knee": { area: "knee", severity: "moderate" },
    "knees": { area: "knee", severity: "moderate" },
    "shoulder": { area: "shoulder", severity: "moderate" },
    "shoulders": { area: "shoulder", severity: "moderate" },
    "wrist": { area: "wrist", severity: "moderate" },
    "wrists": { area: "wrist", severity: "moderate" },
    "hip": { area: "hip", severity: "moderate" },
    "hips": { area: "hip", severity: "moderate" },
    "ankle": { area: "ankle", severity: "moderate" },
    "ankles": { area: "ankle", severity: "moderate" },
    "elbow": { area: "elbow", severity: "moderate" },
    "elbows": { area: "elbow", severity: "moderate" },
    // "neck" is not a valid JointArea, so map to shoulder as closest
    "neck": { area: "shoulder", severity: "moderate" },
  };
  
  return limitations
    .filter(l => l !== "none" && limitationMapping[l.toLowerCase()])
    .map(l => limitationMapping[l.toLowerCase()]);
}

function convertToDisplayFormat(
  output: GeneratorOutput,
  fitnessGoal: FitnessGoal
): GeneratedProgram {
  // Generate a smart program name that includes the split type
  const programName = generateProgramName({ 
    goal: fitnessGoal,
    splitId: output.metadata.split,
  });
  
  // Get workouts from week 1 as the display template
  const legacyWorkouts = toLegacyPlannedWorkouts(output, 1);
  
  // Convert to display format
  const workouts: GeneratedWorkout[] = legacyWorkouts.map((workout, index) => ({
    day: workout.day,
    name: workout.title, // e.g., "Push", "Pull", "Legs", "Upper Body A"
    type: workout.title, // Use workout name as type (not split ID)
    focus: workout.exercises.length > 0 
      ? workout.exercises.slice(0, 2).map(e => e.muscleGroup).join(", ")
      : "Full Body",
    exercises: workout.exercises.map(ex => ({
      name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      rir: ex.rirTarget ?? 2, // Use generator's RIR target, fallback to 2
      muscleGroup: ex.muscleGroup,
    })),
    estimatedDuration: Math.round(workout.exercises.reduce((total, ex) => {
      const setsTime = ex.sets * 1.5;
      const restTime = (ex.sets - 1) * ((ex.restSeconds || 90) / 60);
      return total + setsTime + restTime;
    }, 0)),
    phase: "accumulation", // Week 1 is always accumulation
  }));
  
  // Generate tips based on goal
  const tips = generateTips(fitnessGoal, output);
  
  return {
    name: programName,
    description: output.programRationale || getDescriptionForGoal(fitnessGoal),
    workoutsPerWeek: workouts.length,
    workouts,
    tips,
    generatorOutput: output,
    phasesInfo: {
      week1: "accumulation",
      week2: "accumulation", 
      week3: "intensification",
      week4: "deload",
    },
  };
}

function getDescriptionForGoal(goal: FitnessGoal): string {
  switch (goal) {
    case "hypertrophy":
      return "A science-backed program optimized for muscle growth with progressive overload across a 4-week mesocycle.";
    case "strength":
      return "Build maximal strength with lower rep ranges and longer rest periods, progressing through a structured mesocycle.";
    case "fat_loss":
      return "Metabolic conditioning with higher volume and shorter rest to maximize calorie burn while preserving muscle.";
    default:
      return "A balanced program for overall fitness, combining strength, muscle building, and conditioning.";
  }
}

function generateTips(goal: FitnessGoal, output: GeneratorOutput): string[] {
  const tips: string[] = [];
  
  // Goal-specific tips
  switch (goal) {
    case "hypertrophy":
      tips.push("Focus on the 8-12 rep range for most exercises to maximize muscle growth.");
      tips.push("Leave 1-2 reps in reserve (RIR) - train hard but avoid failure on most sets.");
      break;
    case "strength":
      tips.push("Rest 3-5 minutes between heavy compound sets for full recovery.");
      tips.push("Focus on progressive overload - add weight or reps each week.");
      break;
    case "fat_loss":
      tips.push("Keep rest periods shorter (45-90 seconds) to maintain elevated heart rate.");
      tips.push("Pair this program with a moderate calorie deficit for best results.");
      break;
    default:
      tips.push("Listen to your body and adjust intensity as needed.");
  }
  
  // Phase tips
  tips.push("Weeks 1-2 build volume, Week 3 intensifies, Week 4 is a recovery deload.");
  
  // Safety flags as tips
  if (output.safetyFlags && output.safetyFlags.length > 0) {
    tips.push(...output.safetyFlags.slice(0, 2));
  }
  
  return tips;
}

export default function GenerateProgramScreen() {
  const { colors } = useTheme();
  
  // Form state
  const [goal, setGoal] = useState("build_muscle");
  const [experience, setExperience] = useState("intermediate");
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [splitPreference, setSplitPreference] = useState("auto");
  
  // User profile data (for equipment/limitations)
  const [userEquipment, setUserEquipment] = useState<string[]>(["full_gym"]);
  const [userLimitations, setUserLimitations] = useState<string[]>([]);
  
  // Available splits based on days selected
  const availableSplits = useMemo(() => getAvailableSplits(daysPerWeek), [daysPerWeek]);
  
  // Reset split preference if no longer valid for selected days
  useEffect(() => {
    if (splitPreference !== "auto") {
      const stillValid = availableSplits.some(s => s.id === splitPreference);
      if (!stillValid) {
        setSplitPreference("auto");
      }
    }
  }, [daysPerWeek, availableSplits, splitPreference]);
  
  // Generation state
  const [loading, setLoading] = useState(false);
  const [program, setProgram] = useState<GeneratedProgram | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_data, goal")
        .eq("id", user.id)
        .single();

      if (profile) {
        const onboarding = profile.onboarding_data as Record<string, any> || {};
        
        // Pre-fill form with user's saved preferences
        if (profile.goal || onboarding.goal) {
          const savedGoal = profile.goal || onboarding.goal;
          // Map to our goal IDs
          if (savedGoal.toLowerCase().includes("muscle")) setGoal("build_muscle");
          else if (savedGoal.toLowerCase().includes("fat") || savedGoal.toLowerCase().includes("lose")) setGoal("lose_fat");
          else if (savedGoal.toLowerCase().includes("strength")) setGoal("get_stronger");
        }
        
        if (onboarding.workoutsPerWeek) {
          setDaysPerWeek(onboarding.workoutsPerWeek);
        }
        
        if (onboarding.experienceLevel) {
          setExperience(onboarding.experienceLevel);
        }
        
        // Load equipment from onboarding data
        if (onboarding.availableEquipment && onboarding.availableEquipment.length > 0) {
          setUserEquipment(onboarding.availableEquipment);
        } else if (onboarding.gymType) {
          // Fall back to gym type if no specific equipment selected
          setUserEquipment([onboarding.gymType]);
        }
        
        // Load limitations from onboarding data
        if (onboarding.limitations && onboarding.limitations.length > 0) {
          // Filter out "none" if present
          const limitations = onboarding.limitations.filter((l: string) => l !== "none");
          setUserLimitations(limitations);
        }
      }
    };

    loadProfile();
  }, []);

  const handleGenerateProgram = async () => {
    hapticPress();
    setLoading(true);
    setProgram(null);

    try {
      // Get user ID for the generator
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || "local-user";
      
      // Map UI values to generator types
      const fitnessGoal = mapGoalToFitnessGoal(goal);
      const mappedEquipment = mapEquipmentToUserEquipment(userEquipment);
      const mappedLimitations = mapLimitations(userLimitations);
      
      // Build generator input
      const input: GeneratorInput = {
        userId,
        experienceLevel: experience as ExperienceLevel,
        fitnessGoal,
        daysPerWeek: daysPerWeek as 2 | 3 | 4 | 5 | 6,
        sessionDurationMinutes: 60,
        availableEquipment: mappedEquipment,
        physicalLimitations: mappedLimitations,
        splitPreference: splitPreference === "auto" ? undefined : splitPreference as SplitPreference,
      };

      const output = localGenerateProgram(input, { generateRationale: true });
      
      // Convert to display format
      const displayProgram = convertToDisplayFormat(output, fitnessGoal);
      
      hapticSuccess();
      setProgram(displayProgram);
      setExpandedDay(displayProgram.workouts[0]?.day || null);
      
      // Auto-save for Pro users
      if (isPro && user) {
        try {
          await supabase
            .from("saved_programs")
            .insert({
              user_id: user.id,
              name: displayProgram.name,
              description: displayProgram.description,
              goal: goal,
              experience: experience,
              workouts_per_week: daysPerWeek,
              program_data: {
                workouts: displayProgram.workouts,
                tips: displayProgram.tips,
                mesocycle: output.mesocycle,
                metadata: output.metadata,
                volumeSummary: output.volumeSummary,
                substitutions: output.substitutions,
                safetyFlags: output.safetyFlags,
                phasesInfo: displayProgram.phasesInfo,
              },
              is_ai_generated: true,
              is_active: true, // Auto-activate the first generated program
            });
          
        } catch {
          // Don't show error to user - they can still manually save
        }
      }
    } catch {
      Alert.alert("Error", "Failed to generate program. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const [saving, setSaving] = useState(false);
  const { isPro } = useSubscription();

  const saveProgram = async () => {
    if (!program) return;
    
    // Check if user has Pro subscription
    if (!isPro) {
      Alert.alert(
        "Pro Feature",
        "Saving programs is a Pro feature. Upgrade to Pro in Settings to save unlimited programs and access all features.",
        [
          { text: "Maybe Later", style: "cancel" },
          { 
            text: "Go to Settings", 
            onPress: () => router.push("/settings"),
          },
        ]
      );
      return;
    }
    
    hapticPress();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Error", "Please sign in to save programs.");
        return;
      }

      // Save the program to the database with full mesocycle data
      const { error } = await supabase
        .from("saved_programs")
        .insert({
          user_id: user.id,
          name: program.name,
          description: program.description,
          goal: goal,
          experience: experience,
          workouts_per_week: daysPerWeek,
          program_data: {
            // Legacy format for backward compatibility
            workouts: program.workouts,
            tips: program.tips,
            // New mesocycle data for phase-aware training
            mesocycle: program.generatorOutput?.mesocycle,
            metadata: program.generatorOutput?.metadata,
            volumeSummary: program.generatorOutput?.volumeSummary,
            substitutions: program.generatorOutput?.substitutions,
            safetyFlags: program.generatorOutput?.safetyFlags,
            phasesInfo: program.phasesInfo,
          },
          is_ai_generated: true,
          is_active: false,
        })
        .select("id")
        .single();

      if (error) {
        Alert.alert("Error", "Failed to save program. Please try again.");
        return;
      }

      hapticSuccess();
      Alert.alert(
        "Program Saved!",
        `"${program.name}" has been saved to your programs.`,
        [
          { 
            text: "View My Programs", 
            onPress: () => router.push("/(workout)/programs"),
          },
          { text: "OK" },
        ]
      );
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text allowFontScaling={false} style={[styles.title, { color: colors.text }]}>
          AI Program Generator
        </Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {!program ? (
          // Configuration form
          <>
            <Animated.View entering={FadeInDown.delay(0).duration(300)}>
              <View style={[styles.introCard, { backgroundColor: colors.card }]}>
                <View style={[styles.introIcon, { backgroundColor: colors.primaryMuted }]}>
                  <Ionicons name="sparkles" size={28} color={colors.primary} />
                </View>
                <Text allowFontScaling={false} style={[styles.introTitle, { color: colors.text }]}>
                  Personalized Workouts
                </Text>
                <Text allowFontScaling={false} style={[styles.introDesc, { color: colors.textMuted }]}>
                  Our AI will create a science-backed program tailored to your goals, experience, and schedule.
                </Text>
              </View>
            </Animated.View>

            {/* Goal Selection */}
            <Animated.View entering={FadeInDown.delay(50).duration(300)} style={styles.section}>
              <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text }]}>
                What&apos;s your main goal?
              </Text>
              <View style={styles.optionsGrid}>
                {goalOptions.map((option) => (
                  <Pressable
                    key={option.id}
                    onPress={() => {
                      hapticPress();
                      setGoal(option.id);
                    }}
                    style={[
                      styles.goalOption,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      goal === option.id && { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
                    ]}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={24}
                      color={goal === option.id ? colors.primary : colors.textMuted}
                    />
                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.goalOptionText,
                        { color: colors.text },
                        goal === option.id && { color: colors.primary },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>

            {/* Experience Selection */}
            <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.section}>
              <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text }]}>
                Experience level
              </Text>
              <View style={styles.experienceRow}>
                {experienceOptions.map((option) => (
                  <Pressable
                    key={option.id}
                    onPress={() => {
                      hapticPress();
                      setExperience(option.id);
                    }}
                    style={[
                      styles.experienceOption,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      experience === option.id && { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
                    ]}
                  >
                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.experienceLabel,
                        { color: colors.text },
                        experience === option.id && { color: colors.primary },
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={[styles.experienceDesc, { color: colors.textMuted }]}
                    >
                      {option.desc}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>

            {/* Days per Week */}
            <Animated.View entering={FadeInDown.delay(150).duration(300)} style={styles.section}>
              <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text }]}>
                Days per week
              </Text>
              <View style={styles.daysRow}>
                {daysOptions.map((days) => (
                  <Pressable
                    key={days}
                    onPress={() => {
                      hapticPress();
                      setDaysPerWeek(days);
                    }}
                    style={[
                      styles.dayOption,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      daysPerWeek === days && { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
                    ]}
                  >
                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.dayOptionText,
                        { color: colors.text },
                        daysPerWeek === days && { color: colors.primary },
                      ]}
                    >
                      {days}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>

            {/* Split Preference (only show if multiple options available) */}
            {availableSplits.length > 1 && (
              <Animated.View entering={FadeInDown.delay(175).duration(300)} style={styles.section}>
                <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text }]}>
                  Training Split
                </Text>
                <View style={styles.splitOptionsGrid}>
                  {availableSplits.map((split) => (
                    <Pressable
                      key={split.id}
                      onPress={() => {
                        hapticPress();
                        setSplitPreference(split.id);
                      }}
                      style={[
                        styles.splitOption,
                        { backgroundColor: colors.card, borderColor: colors.border },
                        splitPreference === split.id && { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
                      ]}
                    >
                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.splitOptionLabel,
                          { color: colors.text },
                          splitPreference === split.id && { color: colors.primary },
                        ]}
                      >
                        {split.label}
                      </Text>
                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.splitOptionDesc,
                          { color: colors.textMuted },
                        ]}
                      >
                        {split.description}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Generate Button */}
            <Animated.View entering={FadeInDown.delay(200).duration(300)} style={styles.section}>
              <Pressable
                onPress={handleGenerateProgram}
                disabled={loading}
                style={[
                  styles.generateButton,
                  { backgroundColor: colors.primary },
                  loading && { opacity: 0.7 },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={colors.textOnPrimary} />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={20} color={colors.textOnPrimary} />
                    <Text allowFontScaling={false} style={[styles.generateButtonText, { color: colors.textOnPrimary }]}>
                      Generate My Program
                    </Text>
                  </>
                )}
              </Pressable>
              {loading && (
                <Text allowFontScaling={false} style={[styles.loadingText, { color: colors.textMuted }]}>
                  Creating your personalized program...
                </Text>
              )}
            </Animated.View>
          </>
        ) : (
          // Generated Program View
          <>
            <Animated.View entering={FadeIn.duration(300)}>
              {/* Program Header */}
              <View style={[styles.programHeader, { backgroundColor: colors.card }]}>
                <View style={styles.badgeRow}>
                  <View style={[styles.programBadge, { backgroundColor: colors.primaryMuted }]}>
                    <Ionicons name="sparkles" size={16} color={colors.primary} />
                    <Text allowFontScaling={false} style={[styles.programBadgeText, { color: colors.primary }]}>
                      AI Generated
                    </Text>
                  </View>
                  <View style={[styles.programBadge, { backgroundColor: `${PHASE_COLORS.accumulation}20` }]}>
                    <Ionicons name="layers-outline" size={14} color={PHASE_COLORS.accumulation} />
                    <Text allowFontScaling={false} style={[styles.programBadgeText, { color: PHASE_COLORS.accumulation }]}>
                      4-Week Mesocycle
                    </Text>
                  </View>
                </View>
                <Text allowFontScaling={false} style={[styles.programName, { color: colors.text }]}>
                  {program.name}
                </Text>
                <Text allowFontScaling={false} style={[styles.programDesc, { color: colors.textMuted }]}>
                  {program.description}
                </Text>
                
                {/* Phase Overview */}
                <View style={styles.phaseOverview}>
                  <Text allowFontScaling={false} style={[styles.phaseOverviewTitle, { color: colors.text }]}>
                    Training Phases
                  </Text>
                  <View style={styles.phaseRow}>
                    <View style={[styles.phaseItem, { borderLeftColor: PHASE_COLORS.accumulation }]}>
                      <Text allowFontScaling={false} style={[styles.phaseWeek, { color: colors.textMuted }]}>W1-2</Text>
                      <Text allowFontScaling={false} style={[styles.phaseName, { color: PHASE_COLORS.accumulation }]}>Build</Text>
                    </View>
                    <View style={[styles.phaseItem, { borderLeftColor: PHASE_COLORS.intensification }]}>
                      <Text allowFontScaling={false} style={[styles.phaseWeek, { color: colors.textMuted }]}>W3</Text>
                      <Text allowFontScaling={false} style={[styles.phaseName, { color: PHASE_COLORS.intensification }]}>Push</Text>
                    </View>
                    <View style={[styles.phaseItem, { borderLeftColor: PHASE_COLORS.deload }]}>
                      <Text allowFontScaling={false} style={[styles.phaseWeek, { color: colors.textMuted }]}>W4</Text>
                      <Text allowFontScaling={false} style={[styles.phaseName, { color: PHASE_COLORS.deload }]}>Recover</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.programMeta}>
                  <View style={styles.programMetaItem}>
                    <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                    <Text allowFontScaling={false} style={[styles.programMetaText, { color: colors.textMuted }]}>
                      {program.workoutsPerWeek} days/week
                    </Text>
                  </View>
                  <View style={styles.programMetaItem}>
                    <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                    <Text allowFontScaling={false} style={[styles.programMetaText, { color: colors.textMuted }]}>
                      ~{Math.round(program.workouts.reduce((sum, w) => sum + w.estimatedDuration, 0) / program.workouts.length)} min/session
                    </Text>
                  </View>
                </View>
              </View>

              {/* Workouts */}
              {program.workouts.map((workout, index) => (
                <Animated.View
                  key={workout.day}
                  entering={FadeInDown.delay(index * 50).duration(300)}
                >
                  <Pressable
                    onPress={() => {
                      hapticPress();
                      setExpandedDay(expandedDay === workout.day ? null : workout.day);
                    }}
                    style={[styles.workoutCard, { backgroundColor: colors.card }]}
                  >
                    <View style={styles.workoutHeader}>
                      <View style={[styles.workoutDayBadge, { backgroundColor: colors.primaryMuted }]}>
                        <Text allowFontScaling={false} style={[styles.workoutDayText, { color: colors.primary }]}>
                          Day {workout.day}
                        </Text>
                      </View>
                      <View style={styles.workoutInfo}>
                        <Text allowFontScaling={false} style={[styles.workoutName, { color: colors.text }]}>
                          {workout.name}
                        </Text>
                        <Text allowFontScaling={false} style={[styles.workoutFocus, { color: colors.textMuted }]}>
                          {workout.focus} - ~{workout.estimatedDuration} min
                        </Text>
                      </View>
                      <Ionicons
                        name={expandedDay === workout.day ? "chevron-up" : "chevron-down"}
                        size={20}
                        color={colors.textMuted}
                      />
                    </View>

                    {expandedDay === workout.day && (
                      <Animated.View entering={FadeIn.duration(200)} style={styles.exerciseList}>
                        {workout.exercises.map((exercise, exIndex) => (
                          <View
                            key={exIndex}
                            style={[
                              styles.exerciseItem,
                              exIndex < workout.exercises.length - 1 && {
                                borderBottomWidth: 1,
                                borderBottomColor: colors.border,
                              },
                            ]}
                          >
                            <View style={styles.exerciseMain}>
                              <Text allowFontScaling={false} style={[styles.exerciseName, { color: colors.text }]}>
                                {exercise.name}
                              </Text>
                              <Text allowFontScaling={false} style={[styles.exerciseDetails, { color: colors.textMuted }]}>
                                {exercise.sets} x {exercise.reps} @ RIR {exercise.rir}
                              </Text>
                            </View>
                            {exercise.notes && (
                              <Text allowFontScaling={false} style={[styles.exerciseNotes, { color: colors.textSecondary }]}>
                                {exercise.notes}
                              </Text>
                            )}
                          </View>
                        ))}
                      </Animated.View>
                    )}
                  </Pressable>
                </Animated.View>
              ))}

              {/* Tips */}
              {program.tips && program.tips.length > 0 && (
                <View style={[styles.tipsCard, { backgroundColor: colors.card }]}>
                  <Text allowFontScaling={false} style={[styles.tipsTitle, { color: colors.text }]}>
                    Coach Tips
                  </Text>
                  {program.tips.map((tip, index) => (
                    <View key={index} style={styles.tipRow}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                      <Text allowFontScaling={false} style={[styles.tipText, { color: colors.textMuted }]}>
                        {tip}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <Pressable
                  onPress={() => {
                    hapticPress();
                    setProgram(null);
                  }}
                  style={[styles.regenerateButton, { borderColor: colors.border }]}
                >
                  <Ionicons name="refresh" size={18} color={colors.text} />
                  <Text allowFontScaling={false} style={[styles.regenerateButtonText, { color: colors.text }]}>
                    Regenerate
                  </Text>
                </Pressable>
                <Pressable
                  onPress={saveProgram}
                  disabled={saving}
                  style={[
                    styles.saveButton, 
                    { backgroundColor: colors.primary },
                    saving && { opacity: 0.7 },
                  ]}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={colors.textOnPrimary} />
                  ) : (
                    <>
                      <Ionicons name="bookmark" size={18} color={colors.textOnPrimary} />
                      <Text allowFontScaling={false} style={[styles.saveButtonText, { color: colors.textOnPrimary }]}>
                        Save Program
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </Animated.View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  
  // Intro
  introCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  introIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
  },
  introDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  
  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  
  // Goals
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  goalOption: {
    width: "47%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  goalOptionText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  
  // Experience
  experienceRow: {
    flexDirection: "row",
    gap: 12,
  },
  experienceOption: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  experienceLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  experienceDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  
  // Split options
  splitOptionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  splitOption: {
    width: "48%",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  splitOptionLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  splitOptionDesc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  
  // Days
  daysRow: {
    flexDirection: "row",
    gap: 10,
  },
  dayOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  dayOptionText: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  
  // Generate button
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 56,
    borderRadius: 28,
  },
  generateButtonText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 12,
  },
  
  // Program header
  programHeader: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  programBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  programBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  programName: {
    fontSize: 22,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
  },
  programDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginBottom: 12,
  },
  phaseOverview: {
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  phaseOverviewTitle: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 10,
  },
  phaseRow: {
    flexDirection: "row",
    gap: 12,
  },
  phaseItem: {
    flex: 1,
    paddingLeft: 10,
    borderLeftWidth: 3,
  },
  phaseWeek: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  phaseName: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  programMeta: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
  programMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  programMetaText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  
  // Workout cards
  workoutCard: {
    borderRadius: 14,
    marginBottom: 12,
    overflow: "hidden",
  },
  workoutHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  workoutDayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  workoutDayText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  workoutFocus: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  
  // Exercise list
  exerciseList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  exerciseItem: {
    paddingVertical: 12,
  },
  exerciseMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exerciseName: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  exerciseDetails: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  exerciseNotes: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    marginTop: 4,
  },
  
  // Tips
  tipsCard: {
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 18,
  },
  
  // Action buttons
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  regenerateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  regenerateButtonText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  saveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveButtonText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
