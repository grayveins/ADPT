/**
 * BuildingPlanScreen
 *
 * THE most important conversion screen (research: highest impact on trial-to-paid).
 * Redesigned with Cal AI / Fastic-inspired visual theater:
 * - Step-by-step analysis with animated checkmarks (not just dots)
 * - Personalized labels referencing the user's actual data
 * - Teal scan line effect behind the steps
 * - Completion celebration with confetti + haptics
 * - Rotating testimonials for social proof during wait
 */

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { StyleSheet, Text, View, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
  FadeIn,
  FadeInUp,
  FadeOut,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { theme } from "@/src/theme";
import { useOnboarding } from "@/src/context/OnboardingContext";
import { haptic, hapticCelebration } from "@/src/animations/feedback/haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type BuildingPlanScreenProps = {
  onNext: () => void;
};

// Generate personalized analysis steps from user's onboarding data
function getPersonalizedSteps(form: Record<string, any>) {
  const steps: { icon: string; label: string }[] = [];

  // Step 1: Profile analysis — reference their experience
  const expLabel = form.experienceLevel === "none" || form.experienceLevel === "beginner"
    ? "Setting up beginner-friendly progressions"
    : form.experienceLevel === "advanced"
      ? "Calibrating for advanced lifter"
      : "Analyzing your training history";
  steps.push({ icon: "body-outline", label: expLabel });

  // Step 2: Exercise selection — reference their equipment
  const gymLabel = form.gymType === "home_gym"
    ? "Selecting exercises for your home setup"
    : form.gymType === "small_gym"
      ? "Optimizing for your gym's equipment"
      : "Choosing from 200+ exercises";
  steps.push({ icon: "fitness-outline", label: gymLabel });

  // Step 3: Schedule — reference their actual days
  const days = form.workoutsPerWeek || form.preferredDays?.length || 3;
  const dur = form.workoutDuration || 45;
  steps.push({ icon: "calendar-outline", label: `Building your ${days}x/week, ${dur}-min schedule` });

  // Step 4: Split/intensity — reference their split choice
  const splitLabels: Record<string, string> = {
    ppl: "Structuring Push/Pull/Legs split",
    upper_lower: "Structuring Upper/Lower split",
    full_body: "Structuring full body sessions",
    auto: "Optimizing your training split",
  };
  const splitLabel = splitLabels[form.splitPreference || "auto"] || "Optimizing your training split";
  steps.push({ icon: "analytics-outline", label: splitLabel });

  // Step 5: Finalize — reference their goal
  const goalLabels: Record<string, string> = {
    build_muscle: "Finalizing your muscle-building plan",
    lose_fat: "Finalizing your fat loss program",
    get_stronger: "Finalizing your strength program",
    general_fitness: "Finalizing your fitness program",
  };
  steps.push({ icon: "flash-outline", label: goalLabels[form.goal || ""] || "Finalizing your plan" });

  return steps;
}

// Testimonials that rotate during loading
const TESTIMONIALS = [
  { text: "Lost 20 lbs and gained so much strength!", author: "Mike T.", highlight: "20 lbs" },
  { text: "Finally found a program I can stick to.", author: "Sarah K.", highlight: "stick to" },
  { text: "The AI adjustments are game-changing.", author: "James R.", highlight: "game-changing" },
  { text: "Best fitness app I've ever used.", author: "Emily L.", highlight: "Best" },
];

// ─── Animated step row ────────────────────────────────────────────────────────
function StepRow({
  icon,
  label,
  status,
  index,
  colors,
}: {
  icon: string;
  label: string;
  status: "pending" | "active" | "done";
  index: number;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(20);
  const checkScale = useSharedValue(0);

  useEffect(() => {
    if (status === "active" || status === "done") {
      opacity.value = withTiming(1, { duration: 300 });
      translateX.value = withTiming(0, { duration: 300 });
    }
    if (status === "done") {
      checkScale.value = withSequence(
        withTiming(1.15, { duration: 120 }),
        withTiming(1, { duration: 100 })
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const rowStyle = useAnimatedStyle(() => ({
    opacity: status === "pending" ? 0.3 : opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  return (
    <Animated.View style={[styles_.stepRow, rowStyle]}>
      {/* Status indicator */}
      <View style={styles_.stepIndicator}>
        {status === "done" ? (
          <Animated.View style={[styles_.stepCheckCircle, { backgroundColor: colors.primary }, checkStyle]}>
            <Ionicons name="checkmark" size={14} color={colors.textOnPrimary} />
          </Animated.View>
        ) : status === "active" ? (
          <View style={[styles_.stepActiveCircle, { borderColor: colors.primary }]}>
            <View style={[styles_.stepActiveDot, { backgroundColor: colors.primary }]} />
          </View>
        ) : (
          <View style={[styles_.stepPendingCircle, { borderColor: colors.border }]} />
        )}
      </View>

      {/* Icon + Label */}
      <Ionicons
        name={icon as any}
        size={18}
        color={status === "done" ? colors.primary : status === "active" ? colors.text : colors.textMuted}
        style={styles_.stepIcon}
      />
      <Text
        allowFontScaling={false}
        style={[
          styles_.stepLabel,
          {
            color: status === "done" ? colors.primary : status === "active" ? colors.text : colors.textMuted,
            fontFamily: status === "active" ? theme.fonts.bodySemiBold : theme.fonts.body,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Animated.View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function BuildingPlanScreen({ onNext }: BuildingPlanScreenProps) {
  const { colors } = useTheme();
  const { form } = useOnboarding();
  const ANALYSIS_STEPS = useMemo(() => getPersonalizedSteps(form), [form]);

  const [activeStep, setActiveStep] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const testimonialOpacity = useSharedValue(1);
  const completeBadgeScale = useSharedValue(0);

  const s = useMemo(() => createStyles(colors), [colors]);

  // Rotate testimonials
  const rotateTestimonial = useCallback(() => {
    testimonialOpacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(setCurrentTestimonial)((prev: number) => (prev + 1) % TESTIMONIALS.length);
      testimonialOpacity.value = withTiming(1, { duration: 300 });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const STEP_DURATION = 1200; // ms per step — slower = feels more real
    const total = ANALYSIS_STEPS.length;

    // Advance steps
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= total; i++) {
      timers.push(
        setTimeout(() => {
          haptic("light");
          setActiveStep(i);
        }, i * STEP_DURATION)
      );
    }

    // Testimonial rotation
    const testInterval = setInterval(rotateTestimonial, 3000);

    // Completion
    timers.push(
      setTimeout(async () => {
        clearInterval(testInterval);
        setIsComplete(true);
        await hapticCelebration();
        completeBadgeScale.value = withSequence(
          withTiming(1.1, { duration: 200, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 150 })
        );
        setTimeout(() => onNext(), 1800);
      }, (total + 0.5) * STEP_DURATION)
    );

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(testInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const testimonialStyle = useAnimatedStyle(() => ({
    opacity: testimonialOpacity.value,
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: completeBadgeScale.value }],
    opacity: completeBadgeScale.value,
  }));

  const getTitle = () => {
    const name = form.firstName;
    if (isComplete) return name ? `${name}, your plan is ready` : "Your plan is ready";
    const { goal } = form;
    if (goal === "build_muscle") return "Building your muscle plan";
    if (goal === "lose_fat") return "Creating your fat loss program";
    if (goal === "get_stronger") return "Designing your strength program";
    return "Personalizing your program";
  };

  const currentTest = TESTIMONIALS[currentTestimonial];

  return (
    <View style={s.container}>
      {/* Title */}
      <Animated.Text
        entering={FadeInUp.duration(400)}
        allowFontScaling={false}
        style={s.title}
      >
        {getTitle()}
      </Animated.Text>

      {!isComplete && (
        <Animated.Text
          entering={FadeIn.delay(200).duration(400)}
          allowFontScaling={false}
          style={s.subtitle}
        >
          Analyzing {form.firstName ? `${form.firstName}'s` : "your"} profile...
        </Animated.Text>
      )}

      {/* Step list — the main visual */}
      <View style={s.stepsContainer}>
        {/* Vertical line connecting steps */}
        <View style={[s.verticalLine, { backgroundColor: colors.border }]} />
        <View
          style={[
            s.verticalLineFill,
            {
              backgroundColor: colors.primary,
              height: `${Math.min(100, (activeStep / ANALYSIS_STEPS.length) * 100)}%` as any,
            },
          ]}
        />

        {ANALYSIS_STEPS.map((step, index) => {
          const status: "pending" | "active" | "done" =
            index < activeStep ? "done" : index === activeStep ? "active" : "pending";
          return (
            <StepRow
              key={index}
              icon={step.icon}
              label={step.label}
              status={status}
              index={index}
              colors={colors}
            />
          );
        })}
      </View>

      {/* Completion badge */}
      {isComplete && (
        <Animated.View style={[s.completeBadge, badgeStyle]}>
          <View style={[s.completeBadgeInner, { backgroundColor: colors.primary }]}>
            <Ionicons name="checkmark" size={32} color={colors.textOnPrimary} />
          </View>
          <Text allowFontScaling={false} style={s.completeText}>
            {form.workoutsPerWeek || 3}x per week &middot; {form.workoutDuration || 45} min
          </Text>
        </Animated.View>
      )}

      {/* Testimonial — social proof during wait */}
      {!isComplete && (
        <Animated.View style={[s.testimonialCard, testimonialStyle]}>
          <View style={s.testimonialQuoteBar} />
          <View style={s.testimonialContent}>
            <Text allowFontScaling={false} style={s.testimonialText}>
              &ldquo;{currentTest.text}&rdquo;
            </Text>
            <Text allowFontScaling={false} style={s.testimonialAuthor}>
              {currentTest.author}
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Static styles for StepRow (can't use createStyles inside nested component) ──
const styles_ = StyleSheet.create({
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingLeft: 4,
    gap: 12,
  },
  stepIndicator: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  stepActiveCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  stepActiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepPendingCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
  },
  stepIcon: {
    width: 20,
  },
  stepLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
  },
});

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 28,
    },
    title: {
      color: colors.text,
      fontSize: 26,
      fontFamily: theme.fonts.heading,
      textAlign: "center",
      marginBottom: 6,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 14,
      fontFamily: theme.fonts.body,
      textAlign: "center",
      marginBottom: 32,
    },
    // Steps
    stepsContainer: {
      position: "relative",
      marginBottom: 32,
      paddingLeft: 12,
    },
    verticalLine: {
      position: "absolute",
      left: 23, // center of the 24px indicator + padding
      top: 14,
      bottom: 14,
      width: 2,
      borderRadius: 1,
    },
    verticalLineFill: {
      position: "absolute",
      left: 23,
      top: 14,
      width: 2,
      borderRadius: 1,
    },
    // Completion
    completeBadge: {
      alignItems: "center",
      gap: 12,
      marginBottom: 24,
    },
    completeBadgeInner: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    completeText: {
      color: colors.textMuted,
      fontSize: 14,
      fontFamily: theme.fonts.bodyMedium,
      textAlign: "center",
    },
    // Testimonial
    testimonialCard: {
      flexDirection: "row",
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      marginTop: 8,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    testimonialQuoteBar: {
      width: 3,
      borderRadius: 2,
      backgroundColor: colors.primary,
      marginRight: 14,
    },
    testimonialContent: {
      flex: 1,
      gap: 6,
    },
    testimonialText: {
      color: colors.text,
      fontSize: 14,
      fontFamily: theme.fonts.body,
      lineHeight: 20,
      fontStyle: "italic",
    },
    testimonialAuthor: {
      color: colors.textMuted,
      fontSize: 12,
      fontFamily: theme.fonts.bodyMedium,
    },
  });
