/**
 * AI Program Generator Screen
 * 
 * Generate a personalized workout program using AI based on user profile.
 */

import React, { useState, useEffect } from "react";
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

// Types
type GeneratedExercise = {
  name: string;
  sets: number;
  reps: string;
  rir: number;
  notes?: string;
};

type GeneratedWorkout = {
  day: number;
  name: string;
  type: string;
  focus: string;
  exercises: GeneratedExercise[];
  estimatedDuration: number;
};

type GeneratedProgram = {
  name: string;
  description: string;
  workoutsPerWeek: number;
  workouts: GeneratedWorkout[];
  tips: string[];
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

export default function GenerateProgramScreen() {
  const { colors } = useTheme();
  
  // Form state
  const [goal, setGoal] = useState("build_muscle");
  const [experience, setExperience] = useState("intermediate");
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  
  // User profile data (for equipment/limitations)
  const [userEquipment, setUserEquipment] = useState<string[]>(["full_gym"]);
  const [userLimitations, setUserLimitations] = useState<string[]>([]);
  
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

  const generateProgram = async () => {
    hapticPress();
    setLoading(true);
    setProgram(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-program", {
        body: {
          goal: goalOptions.find((g) => g.id === goal)?.label || goal,
          experience,
          workoutsPerWeek: daysPerWeek,
          equipment: userEquipment,
          limitations: userLimitations,
          trainingStyle: goal === "get_stronger" ? "strength" : "hypertrophy",
        },
      });

      if (error) {
        console.error("Generate program error:", error);
        Alert.alert("Error", "Failed to generate program. Please try again.");
        return;
      }

      if (data?.program) {
        hapticSuccess();
        setProgram(data.program);
        setExpandedDay(data.program.workouts[0]?.day || null);
      } else if (data?.error) {
        Alert.alert("Error", data.error);
      }
    } catch (e) {
      console.error("Unexpected error:", e);
      Alert.alert("Error", "Something went wrong. Please try again.");
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
        "Saving programs is a Pro feature. Upgrade to save unlimited programs and access all features.",
        [
          { text: "Maybe Later", style: "cancel" },
          { 
            text: "Upgrade to Pro", 
            onPress: () => router.push("/onboarding/editorial"),
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

      // Save the program to the database
      const { data, error } = await supabase
        .from("saved_programs")
        .insert({
          user_id: user.id,
          name: program.name,
          description: program.description,
          goal: goal,
          experience: experience,
          workouts_per_week: daysPerWeek,
          program_data: {
            workouts: program.workouts,
            tips: program.tips,
          },
          is_ai_generated: true,
          is_active: false,
        })
        .select("id")
        .single();

      if (error) {
        console.error("Save program error:", error);
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
            onPress: () => router.push("/(app)/workout/programs"),
          },
          { text: "OK" },
        ]
      );
    } catch (e) {
      console.error("Unexpected error:", e);
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
                What's your main goal?
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

            {/* Generate Button */}
            <Animated.View entering={FadeInDown.delay(200).duration(300)} style={styles.section}>
              <Pressable
                onPress={generateProgram}
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
                <View style={[styles.programBadge, { backgroundColor: colors.primaryMuted }]}>
                  <Ionicons name="sparkles" size={16} color={colors.primary} />
                  <Text allowFontScaling={false} style={[styles.programBadgeText, { color: colors.primary }]}>
                    AI Generated
                  </Text>
                </View>
                <Text allowFontScaling={false} style={[styles.programName, { color: colors.text }]}>
                  {program.name}
                </Text>
                <Text allowFontScaling={false} style={[styles.programDesc, { color: colors.textMuted }]}>
                  {program.description}
                </Text>
                <View style={styles.programMeta}>
                  <View style={styles.programMetaItem}>
                    <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                    <Text allowFontScaling={false} style={[styles.programMetaText, { color: colors.textMuted }]}>
                      {program.workoutsPerWeek} days/week
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
  programBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 12,
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
  programMeta: {
    flexDirection: "row",
    gap: 16,
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
