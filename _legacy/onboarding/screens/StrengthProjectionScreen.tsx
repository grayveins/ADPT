/**
 * StrengthProjectionScreen
 * Concrete motivation — shows projected gains with real numbers.
 * Animated count-up for projections, teal progress bars.
 * NOT auto-advance — user taps "See My Plan".
 */

import React, { useEffect, useMemo } from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  useDerivedValue,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { theme } from "@/src/theme";
import { useOnboarding, type OnboardingForm, type BestLifts } from "@/src/context/OnboardingContext";
import { hapticPress } from "@/src/animations/feedback/haptics";
import Button from "@/src/components/Button";

type StrengthProjectionScreenProps = {
  onNext: () => void;
};

type Projection = {
  exercise: string;
  current: number;
  projected: number;
  unit: string;
};

function buildProjections(form: OnboardingForm): Projection[] {
  const lifts = form.bestLifts;
  const bodyweight = form.weightKg || 75; // fallback
  const unit = form.units?.weight === "lb" ? "lb" : "kg";
  const projections: Projection[] = [];

  // Convert kg to lb if imperial
  const toDisplay = (kg: number) =>
    unit === "lb" ? Math.round(kg * 2.205) : Math.round(kg);

  if (lifts?.bench?.weight) {
    const current = lifts.bench.weight;
    const projected = Math.round(current * 1.2);
    projections.push({
      exercise: "Bench Press",
      current: toDisplay(current),
      projected: toDisplay(projected),
      unit,
    });
  }

  if (lifts?.squat?.weight) {
    const current = lifts.squat.weight;
    const projected = Math.round(current * 1.2);
    projections.push({
      exercise: "Squat",
      current: toDisplay(current),
      projected: toDisplay(projected),
      unit,
    });
  }

  if (lifts?.deadlift?.weight) {
    const current = lifts.deadlift.weight;
    const projected = Math.round(current * 1.15);
    projections.push({
      exercise: "Deadlift",
      current: toDisplay(current),
      projected: toDisplay(projected),
      unit,
    });
  }

  // If no lifts entered, use bodyweight-based estimates
  if (projections.length === 0) {
    const isBeginner =
      !form.experienceLevel ||
      form.experienceLevel === "none" ||
      form.experienceLevel === "beginner";

    if (isBeginner) {
      projections.push({
        exercise: "Bench Press",
        current: toDisplay(bodyweight * 0.5),
        projected: toDisplay(bodyweight * 0.75),
        unit,
      });
      projections.push({
        exercise: "Squat",
        current: toDisplay(bodyweight * 0.65),
        projected: toDisplay(bodyweight * 1.0),
        unit,
      });
    } else {
      projections.push({
        exercise: "Bench Press",
        current: toDisplay(bodyweight * 0.8),
        projected: toDisplay(bodyweight * 1.0),
        unit,
      });
      projections.push({
        exercise: "Squat",
        current: toDisplay(bodyweight * 1.2),
        projected: toDisplay(bodyweight * 1.5),
        unit,
      });
      projections.push({
        exercise: "Deadlift",
        current: toDisplay(bodyweight * 1.4),
        projected: toDisplay(bodyweight * 1.7),
        unit,
      });
    }
  }

  return projections;
}

// ─── Animated projection card ─────────────────────────────────────────────────
function ProjectionCard({
  projection,
  index,
  colors,
}: {
  projection: Projection;
  index: number;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const animProgress = useSharedValue(0);
  const animNumber = useSharedValue(projection.current);

  const delta = Math.round(
    ((projection.projected - projection.current) / projection.current) * 100
  );

  useEffect(() => {
    const delay = 600 + index * 300;
    animProgress.value = withDelay(
      delay,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) })
    );
    animNumber.value = withDelay(
      delay,
      withTiming(projection.projected, {
        duration: 800,
        easing: Easing.out(Easing.ease),
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const barStyle = useAnimatedStyle(() => ({
    width: `${animProgress.value * 100}%` as any,
  }));

  // Round the animated number for display
  const displayNumber = useDerivedValue(() => Math.round(animNumber.value));

  const s = useMemo(() => cardStyles(colors), [colors]);

  return (
    <Animated.View
      entering={FadeInDown.delay(400 + index * 200).duration(400)}
      style={s.card}
    >
      {/* Header row */}
      <View style={s.cardHeader}>
        <Text allowFontScaling={false} style={s.exerciseName}>
          {projection.exercise}
        </Text>
        <View style={s.deltaBadge}>
          <Ionicons name="arrow-up" size={12} color={colors.primary} />
          <Text allowFontScaling={false} style={s.deltaText}>
            +{delta}%
          </Text>
        </View>
      </View>

      {/* Current → Projected */}
      <View style={s.numbersRow}>
        <Text allowFontScaling={false} style={s.currentValue}>
          {projection.current} {projection.unit}
        </Text>
        <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
        <AnimatedNumber
          value={displayNumber}
          unit={projection.unit}
          colors={colors}
        />
      </View>

      {/* Progress bar */}
      <View style={s.progressBg}>
        <Animated.View style={[s.progressFill, barStyle]} />
      </View>
    </Animated.View>
  );
}

// Animated number display using Reanimated text
function AnimatedNumber({
  value,
  unit,
  colors,
}: {
  value: { value: number };
  unit: string;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const animStyle = useAnimatedStyle(() => ({
    // just used for reactivity
    opacity: 1,
  }));

  // We use a ReText-style approach: derive text from shared value
  const displayText = useDerivedValue(() => `${Math.round(value.value)} ${unit}`);

  return (
    <Animated.Text
      allowFontScaling={false}
      style={[
        {
          color: colors.primary,
          fontSize: 18,
          fontFamily: theme.fonts.heading,
          fontWeight: "700",
        },
        animStyle,
      ]}
    >
      {/* Static fallback — the count-up is mostly visual via rerender */}
      <ProjectedValue sharedValue={value} unit={unit} />
    </Animated.Text>
  );
}

// Component that re-renders with the animated value
function ProjectedValue({
  sharedValue,
  unit,
}: {
  sharedValue: { value: number };
  unit: string;
}) {
  const derived = useDerivedValue(() => Math.round(sharedValue.value));

  // Fallback: since we can't directly read shared values in JSX without
  // Reanimated's <ReText>, we show the final projected value.
  // The progress bar provides the animated visual effect.
  const [displayVal, setDisplayVal] = React.useState(0);

  useEffect(() => {
    // Animate via JS for text display
    const start = Date.now();
    const duration = 1200;
    const startVal = displayVal || 0;
    // We read a rough "current" from the shared value context
    let frame: number;

    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
      const current = Math.round(startVal + (derived.value - startVal) * eased);
      setDisplayVal(current);
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{displayVal} {unit}</>;
}

const cardStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      gap: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    exerciseName: {
      color: colors.text,
      fontSize: 16,
      fontFamily: theme.fonts.bodySemiBold,
    },
    deltaBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      backgroundColor: colors.primaryMuted,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    deltaText: {
      color: colors.primary,
      fontSize: 12,
      fontFamily: theme.fonts.bodySemiBold,
    },
    numbersRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    currentValue: {
      color: colors.textMuted,
      fontSize: 16,
      fontFamily: theme.fonts.body,
    },
    progressBg: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.progressBg,
      overflow: "hidden",
    },
    progressFill: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
    },
  });

// ─── Main component ───────────────────────────────────────────────────────────
export default function StrengthProjectionScreen({ onNext }: StrengthProjectionScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { form } = useOnboarding();

  const projections = useMemo(() => buildProjections(form), [form]);

  const title = form.firstName
    ? `${form.firstName}, here\u2019s what 12 weeks looks like`
    : "Here\u2019s what\u2019s ahead";

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInUp.duration(400)} style={styles.header}>
        <Text allowFontScaling={false} style={styles.title}>
          {title}
        </Text>
      </Animated.View>

      {/* Projection cards */}
      <View style={styles.cards}>
        {projections.map((projection, index) => (
          <ProjectionCard
            key={projection.exercise}
            projection={projection}
            index={index}
            colors={colors}
          />
        ))}
      </View>

      {/* Motivational line */}
      <Animated.View
        entering={FadeInDown.delay(1200).duration(400)}
        style={styles.motivationCard}
      >
        <Ionicons name="analytics-outline" size={18} color={colors.primary} />
        <Text allowFontScaling={false} style={styles.motivationText}>
          These projections are based on users like you. Consistent training + smart programming = real results.
        </Text>
      </Animated.View>

      {/* CTA */}
      <Animated.View
        entering={FadeInDown.delay(1500).duration(400)}
        style={styles.footer}
      >
        <Button title="See My Plan" onPress={onNext} />
      </Animated.View>
    </ScrollView>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      paddingVertical: 16,
      gap: 24,
    },
    header: {
      gap: 8,
    },
    title: {
      color: colors.text,
      fontSize: 26,
      fontFamily: theme.fonts.heading,
      lineHeight: 34,
    },
    cards: {
      gap: 14,
    },
    motivationCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      backgroundColor: colors.selected,
      borderRadius: 12,
      padding: 14,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    motivationText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontFamily: theme.fonts.body,
      lineHeight: 20,
      flex: 1,
    },
    footer: {
      marginTop: "auto",
      paddingTop: 16,
    },
  });
