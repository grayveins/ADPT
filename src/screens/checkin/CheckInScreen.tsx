/**
 * CheckInScreen - Weekly Check-In Flow
 *
 * THE KILLER FEATURE for coach-client relationship.
 * Multi-step flow: Weight -> Photos -> Measurements -> Subjective -> Open Text -> Review & Submit
 *
 * Dark theme, step indicator at top, smooth transitions, celebration on submit.
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Animated, {
  FadeInRight,
  FadeOutLeft,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

import { useTheme } from "@/src/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { layout, spacing, shadows } from "@/src/theme";

// Check-in components
import { WeightInput } from "@/src/components/checkin/WeightInput";
import { PhotoCapture, type PoseType } from "@/src/components/checkin/PhotoCapture";
import {
  SubjectiveScales,
  type SubjectiveData,
} from "@/src/components/checkin/SubjectiveScales";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ============================================================================
// TYPES
// ============================================================================
type CheckInData = {
  weight: number;
  photos: {
    front: string | null;
    side: string | null;
    back: string | null;
  };
  measurements: {
    waist: string;
    chest: string;
    arms: string;
    thighs: string;
    hips: string;
  };
  subjective: SubjectiveData;
  openText: {
    biggestWin: string;
    biggestChallenge: string;
    questionsForCoach: string;
  };
};

const STEPS = [
  { key: "weight", label: "Weight", icon: "scale-outline" as const },
  { key: "photos", label: "Photos", icon: "camera-outline" as const },
  { key: "measurements", label: "Measures", icon: "resize-outline" as const },
  { key: "subjective", label: "Wellness", icon: "heart-outline" as const },
  { key: "text", label: "Notes", icon: "chatbubble-outline" as const },
  { key: "review", label: "Review", icon: "checkmark-circle-outline" as const },
];

const INITIAL_DATA: CheckInData = {
  weight: 170,
  photos: { front: null, side: null, back: null },
  measurements: { waist: "", chest: "", arms: "", thighs: "", hips: "" },
  subjective: { training: 5, nutrition: 5, energy: 5, sleep: 5, hunger: 5 },
  openText: { biggestWin: "", biggestChallenge: "", questionsForCoach: "" },
};

// ============================================================================
// STEP INDICATOR
// ============================================================================
function StepIndicator({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  const { colors } = useTheme();

  return (
    <View style={stepStyles.container}>
      {Array.from({ length: totalSteps }, (_, i) => {
        const isActive = i === currentStep;
        const isComplete = i < currentStep;
        return (
          <View
            key={i}
            style={[
              stepStyles.dot,
              {
                backgroundColor: isActive
                  ? colors.primary
                  : isComplete
                  ? colors.primaryMuted
                  : colors.border,
                width: isActive ? 24 : 8,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});

// ============================================================================
// MEASUREMENT INPUT
// ============================================================================
function MeasurementField({
  label,
  value,
  onChange,
  required,
  unit = "in",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  unit?: string;
}) {
  const { colors } = useTheme();

  return (
    <View style={measStyles.field}>
      <View style={measStyles.labelRow}>
        <Text
          allowFontScaling={false}
          style={[measStyles.label, { color: colors.text }]}
        >
          {label}
        </Text>
        {required && (
          <Text
            allowFontScaling={false}
            style={[measStyles.required, { color: colors.primary }]}
          >
            Required
          </Text>
        )}
      </View>
      <View
        style={[
          measStyles.inputRow,
          {
            backgroundColor: colors.inputBg,
            borderColor: value ? colors.inputBorderFocus : colors.inputBorder,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          placeholder="0.0"
          placeholderTextColor={colors.inputPlaceholder}
          style={[measStyles.input, { color: colors.text }]}
          allowFontScaling={false}
        />
        <Text
          allowFontScaling={false}
          style={[measStyles.unit, { color: colors.textMuted }]}
        >
          {unit}
        </Text>
      </View>
    </View>
  );
}

const measStyles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
  },
  required: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: spacing.base,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
  },
  unit: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: spacing.sm,
  },
});

// ============================================================================
// MAIN SCREEN
// ============================================================================
export default function CheckInScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [step, setStep] = useState(0);
  const [data, setData] = useState<CheckInData>(INITIAL_DATA);
  const [userId, setUserId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Photo sub-step for cycling through poses
  const [photoPose, setPhotoPose] = useState<PoseType>("front");

  // Weight history for sparkline
  const [weightHistory, setWeightHistory] = useState<number[]>([]);

  // Fetch user and previous data
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/sign-in");
        return;
      }
      setUserId(user.id);

      // Fetch last 4 weekly weights
      const { data: weights } = await supabase
        .from("check_ins")
        .select("weight")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(4);

      if (weights?.length) {
        const history = weights
          .map((w: any) => w.weight)
          .filter(Boolean)
          .reverse();
        setWeightHistory(history);
        // Pre-fill with last weight
        if (history.length > 0) {
          setData((prev) => ({ ...prev, weight: history[history.length - 1] }));
        }
      }
    })();
  }, []);

  const canGoNext = useCallback(() => {
    switch (step) {
      case 0: // Weight — always valid (has default)
        return data.weight > 0;
      case 1: // Photos — optional, can always proceed
        return true;
      case 2: // Measurements — waist required
        return data.measurements.waist.trim().length > 0;
      case 3: // Subjective — always valid (has defaults)
        return true;
      case 4: // Open text — optional
        return true;
      case 5: // Review — always can submit
        return true;
      default:
        return true;
    }
  }, [step, data]);

  const goNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(step + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [step]);

  const goBack = useCallback(() => {
    if (step > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(step - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [step]);

  const handleSubmit = useCallback(async () => {
    if (!userId || submitting) return;
    setSubmitting(true);

    try {
      const { error } = await supabase.from("check_ins").insert({
        user_id: userId,
        weight: data.weight,
        photo_front: data.photos.front,
        photo_side: data.photos.side,
        photo_back: data.photos.back,
        waist: data.measurements.waist ? parseFloat(data.measurements.waist) : null,
        chest: data.measurements.chest ? parseFloat(data.measurements.chest) : null,
        arms: data.measurements.arms ? parseFloat(data.measurements.arms) : null,
        thighs: data.measurements.thighs ? parseFloat(data.measurements.thighs) : null,
        hips: data.measurements.hips ? parseFloat(data.measurements.hips) : null,
        training_score: data.subjective.training,
        nutrition_score: data.subjective.nutrition,
        energy_score: data.subjective.energy,
        sleep_score: data.subjective.sleep,
        hunger_score: data.subjective.hunger,
        biggest_win: data.openText.biggestWin || null,
        biggest_challenge: data.openText.biggestChallenge || null,
        questions: data.openText.questionsForCoach || null,
        status: "pending",
      });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmitted(true);
    } catch (err) {
      console.error("Check-in submission error:", err);
      Alert.alert("Error", "Failed to submit check-in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [userId, data, submitting]);

  const handlePhotoCapture = useCallback(
    (url: string) => {
      setData((prev) => ({
        ...prev,
        photos: { ...prev.photos, [photoPose]: url },
      }));
      // Advance to next pose
      if (photoPose === "front") setPhotoPose("side");
      else if (photoPose === "side") setPhotoPose("back");
      // After back, stay on back (user can proceed with Next)
    },
    [photoPose]
  );

  // ========================================================================
  // SUCCESS STATE
  // ========================================================================
  if (submitted) {
    return (
      <View
        style={[
          styles.container,
          styles.centeredContainer,
          { backgroundColor: colors.bg, paddingTop: insets.top },
        ]}
      >
        <Animated.View
          entering={FadeInDown.duration(500)}
          style={styles.successContent}
        >
          <View style={[styles.successIcon, { backgroundColor: colors.primaryMuted }]}>
            <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
          </View>
          <Text
            allowFontScaling={false}
            style={[styles.successTitle, { color: colors.text }]}
          >
            Check-In Submitted!
          </Text>
          <Text
            allowFontScaling={false}
            style={[styles.successSubtitle, { color: colors.textSecondary }]}
          >
            Your coach will review your check-in and provide feedback. Great job staying consistent!
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={[styles.successButton, { backgroundColor: colors.primary }]}
          >
            <Text
              allowFontScaling={false}
              style={[styles.successButtonText, { color: colors.textOnPrimary }]}
            >
              Done
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  // ========================================================================
  // STEP CONTENT
  // ========================================================================
  const renderStep = () => {
    switch (step) {
      // ---- WEIGHT ----
      case 0:
        return (
          <Animated.View
            key="weight"
            entering={FadeInRight.duration(300)}
            exiting={FadeOutLeft.duration(200)}
          >
            <Text
              allowFontScaling={false}
              style={[styles.stepTitle, { color: colors.text }]}
            >
              Log Your Weight
            </Text>
            <Text
              allowFontScaling={false}
              style={[styles.stepSubtitle, { color: colors.textSecondary }]}
            >
              Weigh yourself first thing in the morning for consistency.
            </Text>
            <View style={{ marginTop: spacing.xl }}>
              <WeightInput
                value={data.weight}
                onChange={(v) => setData((prev) => ({ ...prev, weight: v }))}
                history={weightHistory}
              />
            </View>
          </Animated.View>
        );

      // ---- PHOTOS ----
      case 1:
        return (
          <Animated.View
            key="photos"
            entering={FadeInRight.duration(300)}
            exiting={FadeOutLeft.duration(200)}
            style={{ flex: 1 }}
          >
            <Text
              allowFontScaling={false}
              style={[styles.stepTitle, { color: colors.text }]}
            >
              Progress Photos
            </Text>
            <Text
              allowFontScaling={false}
              style={[styles.stepSubtitle, { color: colors.textSecondary }]}
            >
              Same lighting and positioning each week for accurate comparisons.
            </Text>

            {/* Photo status pills */}
            <View style={styles.photoPills}>
              {(["front", "side", "back"] as PoseType[]).map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setPhotoPose(p)}
                  style={[
                    styles.photoPill,
                    {
                      backgroundColor:
                        p === photoPose
                          ? colors.primaryMuted
                          : data.photos[p]
                          ? colors.successMuted
                          : colors.bgTertiary,
                      borderColor:
                        p === photoPose ? colors.primary : "transparent",
                    },
                  ]}
                >
                  {data.photos[p] && (
                    <Ionicons name="checkmark" size={14} color={colors.success} />
                  )}
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.photoPillText,
                      {
                        color:
                          p === photoPose
                            ? colors.primary
                            : data.photos[p]
                            ? colors.success
                            : colors.textMuted,
                      },
                    ]}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {userId && (
              <PhotoCapture
                pose={photoPose}
                userId={userId}
                onCapture={handlePhotoCapture}
                onSkip={goNext}
              />
            )}
          </Animated.View>
        );

      // ---- MEASUREMENTS ----
      case 2:
        return (
          <Animated.View
            key="measurements"
            entering={FadeInRight.duration(300)}
            exiting={FadeOutLeft.duration(200)}
          >
            <Text
              allowFontScaling={false}
              style={[styles.stepTitle, { color: colors.text }]}
            >
              Measurements
            </Text>
            <Text
              allowFontScaling={false}
              style={[styles.stepSubtitle, { color: colors.textSecondary }]}
            >
              Waist is required. Other measurements help track overall progress.
            </Text>
            <View style={styles.measurementsList}>
              <MeasurementField
                label="Waist"
                value={data.measurements.waist}
                onChange={(v) =>
                  setData((prev) => ({
                    ...prev,
                    measurements: { ...prev.measurements, waist: v },
                  }))
                }
                required
              />
              <MeasurementField
                label="Chest"
                value={data.measurements.chest}
                onChange={(v) =>
                  setData((prev) => ({
                    ...prev,
                    measurements: { ...prev.measurements, chest: v },
                  }))
                }
              />
              <MeasurementField
                label="Arms"
                value={data.measurements.arms}
                onChange={(v) =>
                  setData((prev) => ({
                    ...prev,
                    measurements: { ...prev.measurements, arms: v },
                  }))
                }
              />
              <MeasurementField
                label="Thighs"
                value={data.measurements.thighs}
                onChange={(v) =>
                  setData((prev) => ({
                    ...prev,
                    measurements: { ...prev.measurements, thighs: v },
                  }))
                }
              />
              <MeasurementField
                label="Hips"
                value={data.measurements.hips}
                onChange={(v) =>
                  setData((prev) => ({
                    ...prev,
                    measurements: { ...prev.measurements, hips: v },
                  }))
                }
              />
            </View>
          </Animated.View>
        );

      // ---- SUBJECTIVE SCALES ----
      case 3:
        return (
          <Animated.View
            key="subjective"
            entering={FadeInRight.duration(300)}
            exiting={FadeOutLeft.duration(200)}
          >
            <Text
              allowFontScaling={false}
              style={[styles.stepTitle, { color: colors.text }]}
            >
              How Was Your Week?
            </Text>
            <Text
              allowFontScaling={false}
              style={[styles.stepSubtitle, { color: colors.textSecondary }]}
            >
              Rate each area from 1-10. This helps your coach adjust your plan.
            </Text>
            <View style={{ marginTop: spacing.lg }}>
              <SubjectiveScales
                values={data.subjective}
                onChange={(v) => setData((prev) => ({ ...prev, subjective: v }))}
              />
            </View>
          </Animated.View>
        );

      // ---- OPEN TEXT ----
      case 4:
        return (
          <Animated.View
            key="text"
            entering={FadeInRight.duration(300)}
            exiting={FadeOutLeft.duration(200)}
          >
            <Text
              allowFontScaling={false}
              style={[styles.stepTitle, { color: colors.text }]}
            >
              Weekly Notes
            </Text>
            <Text
              allowFontScaling={false}
              style={[styles.stepSubtitle, { color: colors.textSecondary }]}
            >
              Share what's on your mind. Your coach reads every word.
            </Text>
            <View style={styles.textFields}>
              <View>
                <Text
                  allowFontScaling={false}
                  style={[styles.textFieldLabel, { color: colors.text }]}
                >
                  Biggest win this week
                </Text>
                <TextInput
                  value={data.openText.biggestWin}
                  onChangeText={(v) =>
                    setData((prev) => ({
                      ...prev,
                      openText: { ...prev.openText, biggestWin: v },
                    }))
                  }
                  placeholder="Hit a new PR, stuck to my meals..."
                  placeholderTextColor={colors.inputPlaceholder}
                  style={[
                    styles.textInput,
                    {
                      color: colors.text,
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                    },
                  ]}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  allowFontScaling={false}
                />
              </View>

              <View>
                <Text
                  allowFontScaling={false}
                  style={[styles.textFieldLabel, { color: colors.text }]}
                >
                  Biggest challenge
                </Text>
                <TextInput
                  value={data.openText.biggestChallenge}
                  onChangeText={(v) =>
                    setData((prev) => ({
                      ...prev,
                      openText: { ...prev.openText, biggestChallenge: v },
                    }))
                  }
                  placeholder="Missed a session, cravings..."
                  placeholderTextColor={colors.inputPlaceholder}
                  style={[
                    styles.textInput,
                    {
                      color: colors.text,
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                    },
                  ]}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  allowFontScaling={false}
                />
              </View>

              <View>
                <Text
                  allowFontScaling={false}
                  style={[styles.textFieldLabel, { color: colors.text }]}
                >
                  Questions for your coach
                </Text>
                <TextInput
                  value={data.openText.questionsForCoach}
                  onChangeText={(v) =>
                    setData((prev) => ({
                      ...prev,
                      openText: { ...prev.openText, questionsForCoach: v },
                    }))
                  }
                  placeholder="Should I increase calories? Why is my squat stalling?"
                  placeholderTextColor={colors.inputPlaceholder}
                  style={[
                    styles.textInput,
                    {
                      color: colors.text,
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                    },
                  ]}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  allowFontScaling={false}
                />
              </View>
            </View>
          </Animated.View>
        );

      // ---- REVIEW & SUBMIT ----
      case 5:
        return (
          <Animated.View
            key="review"
            entering={FadeInRight.duration(300)}
            exiting={FadeOutLeft.duration(200)}
          >
            <Text
              allowFontScaling={false}
              style={[styles.stepTitle, { color: colors.text }]}
            >
              Review Your Check-In
            </Text>
            <Text
              allowFontScaling={false}
              style={[styles.stepSubtitle, { color: colors.textSecondary }]}
            >
              Make sure everything looks good before submitting.
            </Text>

            <View style={styles.reviewCards}>
              {/* Weight */}
              <View style={[styles.reviewCard, { backgroundColor: colors.card }]}>
                <View style={styles.reviewCardHeader}>
                  <Ionicons name="scale-outline" size={18} color={colors.primary} />
                  <Text
                    allowFontScaling={false}
                    style={[styles.reviewCardTitle, { color: colors.text }]}
                  >
                    Weight
                  </Text>
                </View>
                <Text
                  allowFontScaling={false}
                  style={[styles.reviewCardValue, { color: colors.text }]}
                >
                  {data.weight.toFixed(1)} lbs
                </Text>
              </View>

              {/* Photos */}
              <View style={[styles.reviewCard, { backgroundColor: colors.card }]}>
                <View style={styles.reviewCardHeader}>
                  <Ionicons name="camera-outline" size={18} color={colors.primary} />
                  <Text
                    allowFontScaling={false}
                    style={[styles.reviewCardTitle, { color: colors.text }]}
                  >
                    Photos
                  </Text>
                </View>
                <Text
                  allowFontScaling={false}
                  style={[styles.reviewCardValue, { color: colors.textSecondary }]}
                >
                  {[data.photos.front, data.photos.side, data.photos.back].filter(Boolean).length}/3 captured
                </Text>
              </View>

              {/* Measurements */}
              <View style={[styles.reviewCard, { backgroundColor: colors.card }]}>
                <View style={styles.reviewCardHeader}>
                  <Ionicons name="resize-outline" size={18} color={colors.primary} />
                  <Text
                    allowFontScaling={false}
                    style={[styles.reviewCardTitle, { color: colors.text }]}
                  >
                    Measurements
                  </Text>
                </View>
                {data.measurements.waist ? (
                  <Text
                    allowFontScaling={false}
                    style={[styles.reviewCardValue, { color: colors.textSecondary }]}
                  >
                    Waist: {data.measurements.waist} in
                    {data.measurements.chest ? ` | Chest: ${data.measurements.chest} in` : ""}
                  </Text>
                ) : (
                  <Text
                    allowFontScaling={false}
                    style={[styles.reviewCardValue, { color: colors.textMuted }]}
                  >
                    Not recorded
                  </Text>
                )}
              </View>

              {/* Subjective */}
              <View style={[styles.reviewCard, { backgroundColor: colors.card }]}>
                <View style={styles.reviewCardHeader}>
                  <Ionicons name="heart-outline" size={18} color={colors.primary} />
                  <Text
                    allowFontScaling={false}
                    style={[styles.reviewCardTitle, { color: colors.text }]}
                  >
                    Wellness Scores
                  </Text>
                </View>
                <View style={styles.reviewScoresRow}>
                  {(Object.entries(data.subjective) as [string, number][]).map(([key, val]) => (
                    <View key={key} style={styles.reviewScoreItem}>
                      <Text
                        allowFontScaling={false}
                        style={[styles.reviewScoreValue, { color: colors.primary }]}
                      >
                        {val}
                      </Text>
                      <Text
                        allowFontScaling={false}
                        style={[styles.reviewScoreLabel, { color: colors.textMuted }]}
                      >
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Notes */}
              {(data.openText.biggestWin || data.openText.biggestChallenge || data.openText.questionsForCoach) && (
                <View style={[styles.reviewCard, { backgroundColor: colors.card }]}>
                  <View style={styles.reviewCardHeader}>
                    <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
                    <Text
                      allowFontScaling={false}
                      style={[styles.reviewCardTitle, { color: colors.text }]}
                    >
                      Notes
                    </Text>
                  </View>
                  {data.openText.biggestWin ? (
                    <Text
                      allowFontScaling={false}
                      style={[styles.reviewNoteText, { color: colors.textSecondary }]}
                      numberOfLines={2}
                    >
                      Win: {data.openText.biggestWin}
                    </Text>
                  ) : null}
                  {data.openText.biggestChallenge ? (
                    <Text
                      allowFontScaling={false}
                      style={[styles.reviewNoteText, { color: colors.textSecondary }]}
                      numberOfLines={2}
                    >
                      Challenge: {data.openText.biggestChallenge}
                    </Text>
                  ) : null}
                  {data.openText.questionsForCoach ? (
                    <Text
                      allowFontScaling={false}
                      style={[styles.reviewNoteText, { color: colors.textSecondary }]}
                      numberOfLines={2}
                    >
                      Q: {data.openText.questionsForCoach}
                    </Text>
                  ) : null}
                </View>
              )}
            </View>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[
          styles.container,
          { backgroundColor: colors.bg, paddingTop: insets.top },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={step > 0 ? goBack : () => router.back()} style={styles.headerButton}>
            <Ionicons
              name={step > 0 ? "arrow-back" : "close"}
              size={24}
              color={colors.text}
            />
          </Pressable>
          <Text
            allowFontScaling={false}
            style={[styles.headerTitle, { color: colors.text }]}
          >
            Weekly Check-In
          </Text>
          <View style={styles.headerButton} />
        </View>

        {/* Step indicator */}
        <StepIndicator currentStep={step} totalSteps={STEPS.length} />

        {/* Step content */}
        <ScrollView
          ref={scrollRef}
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStep()}
        </ScrollView>

        {/* Bottom nav buttons */}
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: colors.bg,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + spacing.sm,
            },
          ]}
        >
          {step === STEPS.length - 1 ? (
            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={({ pressed }) => [
                styles.submitButton,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                submitting && { opacity: 0.6 },
              ]}
            >
              <Text
                allowFontScaling={false}
                style={[styles.submitButtonText, { color: colors.textOnPrimary }]}
              >
                {submitting ? "Submitting..." : "Submit Check-In"}
              </Text>
              {!submitting && (
                <Ionicons name="send" size={18} color={colors.textOnPrimary} />
              )}
            </Pressable>
          ) : (
            <Pressable
              onPress={goNext}
              disabled={!canGoNext()}
              style={({ pressed }) => [
                styles.nextButton,
                {
                  backgroundColor: canGoNext() ? colors.primary : colors.disabled,
                },
                pressed && canGoNext() && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text
                allowFontScaling={false}
                style={[
                  styles.nextButtonText,
                  {
                    color: canGoNext() ? colors.textOnPrimary : colors.disabledText,
                  },
                ]}
              >
                {step === 1 ? "Next (or skip photos)" : "Next"}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={18}
                color={canGoNext() ? colors.textOnPrimary : colors.disabledText}
              />
            </Pressable>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    height: 52,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.base,
    paddingBottom: spacing.xxxl,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.3,
  },
  stepSubtitle: {
    fontSize: 15,
    fontWeight: "400",
    marginTop: 4,
    lineHeight: 22,
  },
  // Photos
  photoPills: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.base,
    marginBottom: spacing.md,
  },
  photoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  photoPillText: {
    fontSize: 13,
    fontWeight: "600",
  },
  // Measurements
  measurementsList: {
    gap: spacing.base,
    marginTop: spacing.xl,
  },
  // Text fields
  textFields: {
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  textFieldLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.base,
    fontSize: 15,
    minHeight: 80,
    lineHeight: 22,
  },
  // Review
  reviewCards: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  reviewCard: {
    borderRadius: 16,
    padding: spacing.base,
    ...shadows.card,
  },
  reviewCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  reviewCardTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  reviewCardValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  reviewScoresRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  reviewScoreItem: {
    alignItems: "center",
    gap: 2,
  },
  reviewScoreValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  reviewScoreLabel: {
    fontSize: 10,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  reviewNoteText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  // Bottom bar
  bottomBar: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 56,
    borderRadius: 14,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: "600",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 56,
    borderRadius: 14,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: "600",
  },
  // Success
  successContent: {
    alignItems: "center",
    padding: spacing.xxl,
    gap: spacing.base,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Inter_600SemiBold",
  },
  successSubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  successButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: spacing.base,
  },
  successButtonText: {
    fontSize: 17,
    fontWeight: "600",
  },
});
