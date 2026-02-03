/**
 * BuildingPlanScreen
 * Premium plan generation with smooth animations and rotating testimonials
 */

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { StyleSheet, Text, View, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
  cancelAnimation,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import { useTheme } from "@/src/context/ThemeContext";
import { theme } from "@/src/theme";
import { useOnboarding } from "@/src/context/OnboardingContext";
import { haptic, hapticCelebration } from "@/src/animations/feedback/haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const RING_SIZE = 160;
const STROKE_WIDTH = 5;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type BuildingPlanScreenProps = {
  onNext: () => void;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Analyzing steps
const ANALYSIS_STEPS = [
  { icon: "body-outline", label: "Analyzing your profile" },
  { icon: "fitness-outline", label: "Selecting exercises" },
  { icon: "calendar-outline", label: "Building your schedule" },
  { icon: "analytics-outline", label: "Calibrating intensity" },
  { icon: "flash-outline", label: "Finalizing your plan" },
];

// Testimonials that rotate during loading
const TESTIMONIALS = [
  { text: "Lost 20 lbs and gained so much strength!", author: "Mike T.", highlight: "20 lbs" },
  { text: "Finally found a program I can stick to.", author: "Sarah K.", highlight: "stick to" },
  { text: "The AI adjustments are game-changing.", author: "James R.", highlight: "game-changing" },
  { text: "Best fitness app I've ever used.", author: "Emily L.", highlight: "Best" },
];

export default function BuildingPlanScreen({ onNext }: BuildingPlanScreenProps) {
  const { colors } = useTheme();
  const { form } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const styles = useMemo(() => createStyles(colors), [colors]);

  // Animation values
  const progress = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const iconScale = useSharedValue(1);
  const checkScale = useSharedValue(0);
  const stepOpacity = useSharedValue(1);
  const testimonialOpacity = useSharedValue(1);

  // Animate through steps
  const advanceStep = useCallback(() => {
    if (currentStep < ANALYSIS_STEPS.length - 1) {
      haptic("light");
      stepOpacity.value = withTiming(0, { duration: 150 }, () => {
        runOnJS(setCurrentStep)(currentStep + 1);
        stepOpacity.value = withTiming(1, { duration: 200 });
      });
      iconScale.value = withSequence(
        withTiming(0.9, { duration: 100 }),
        withTiming(1, { duration: 200, easing: Easing.out(Easing.back(1.5)) })
      );
    }
  }, [currentStep]);

  // Rotate testimonials
  const rotateTestimonial = useCallback(() => {
    testimonialOpacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(setCurrentTestimonial)((currentTestimonial + 1) % TESTIMONIALS.length);
      testimonialOpacity.value = withTiming(1, { duration: 300 });
    });
  }, [currentTestimonial]);

  useEffect(() => {
    // Pulse animation
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Progress animation
    const stepDuration = 800;
    const totalDuration = ANALYSIS_STEPS.length * stepDuration;

    progress.value = withTiming(1, {
      duration: totalDuration,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    // Step through each analysis phase
    const stepInterval = setInterval(advanceStep, stepDuration);

    // Rotate testimonials
    const testimonialInterval = setInterval(rotateTestimonial, 2500);

    // Complete after all steps
    const completeTimeout = setTimeout(async () => {
      clearInterval(stepInterval);
      clearInterval(testimonialInterval);
      setIsComplete(true);
      await hapticCelebration();
      
      checkScale.value = withTiming(1, { 
        duration: 400, 
        easing: Easing.out(Easing.back(1.5)) 
      });
      
      cancelAnimation(pulseScale);
      
      setTimeout(() => {
        onNext();
      }, 1500);
    }, totalDuration + 300);

    return () => {
      clearInterval(stepInterval);
      clearInterval(testimonialInterval);
      clearTimeout(completeTimeout);
    };
  }, []);

  // Animated styles
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const progressAnimatedProps = useAnimatedProps(() => {
    const offset = CIRCUMFERENCE * (1 - progress.value);
    return {
      strokeDashoffset: offset,
    };
  });

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const stepStyle = useAnimatedStyle(() => ({
    opacity: stepOpacity.value,
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  const testimonialStyle = useAnimatedStyle(() => ({
    opacity: testimonialOpacity.value,
  }));

  const currentAnalysis = ANALYSIS_STEPS[currentStep];
  const currentTest = TESTIMONIALS[currentTestimonial];

  // Generate personalized message
  const getPersonalizedTitle = () => {
    if (isComplete) return "Your plan is ready!";
    
    const { goal, experienceLevel } = form;
    if (goal === "build_muscle") return "Building your muscle plan";
    if (goal === "lose_fat") return "Creating your fat loss program";
    if (goal === "get_stronger") return "Designing your strength program";
    if (goal === "general_fitness") return "Creating your fitness program";
    if (experienceLevel === "beginner" || experienceLevel === "none") return "Crafting your starter program";
    return "Personalizing your workout plan";
  };

  return (
    <View style={styles.container}>
      {/* Progress ring */}
      <View style={styles.ringContainer}>
        {/* Pulsing background */}
        <Animated.View style={[styles.pulseRing, pulseStyle]}>
          <View style={[styles.pulseGradient, { backgroundColor: `${colors.primary}12` }]} />
        </Animated.View>

        {/* SVG Ring */}
        <View style={styles.svgContainer}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Defs>
              <SvgGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={colors.primary} />
                <Stop offset="100%" stopColor={colors.primary} />
              </SvgGradient>
            </Defs>
            {/* Background ring */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={colors.border}
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
            />
            {/* Progress ring */}
            <AnimatedCircle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke="url(#progressGradient)"
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              animatedProps={progressAnimatedProps}
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            />
          </Svg>
        </View>

        {/* Center icon */}
        <View style={styles.centerIcon}>
          {!isComplete ? (
            <Animated.View style={iconStyle}>
              <View style={[styles.iconCircle, { backgroundColor: colors.card }]}>
                <Ionicons 
                  name={currentAnalysis?.icon as any || "barbell-outline"} 
                  size={32} 
                  color={colors.primary} 
                />
              </View>
            </Animated.View>
          ) : (
            <Animated.View style={[styles.checkCircle, checkStyle]}>
              <View style={[styles.checkGradient, { backgroundColor: colors.primary }]}>
                <Ionicons name="checkmark" size={44} color={colors.textOnPrimary} />
              </View>
            </Animated.View>
          )}
        </View>
      </View>

      {/* Title */}
      <Text allowFontScaling={false} style={styles.title}>
        {getPersonalizedTitle()}
      </Text>

      {/* Current step indicator */}
      {!isComplete ? (
        <Animated.View style={[styles.stepContainer, stepStyle]}>
          <Text allowFontScaling={false} style={styles.stepLabel}>
            {currentAnalysis?.label}
          </Text>
          <View style={styles.progressDots}>
            {ANALYSIS_STEPS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index <= currentStep && styles.progressDotActive,
                  index === currentStep && styles.progressDotCurrent,
                ]}
              />
            ))}
          </View>
        </Animated.View>
      ) : (
        <View style={styles.stepContainer}>
          <Text allowFontScaling={false} style={styles.completeLabel}>
            Tailored to your goals
          </Text>
          <Text allowFontScaling={false} style={styles.completeSublabel}>
            {form.workoutsPerWeek || 3}x per week • {form.workoutDuration || 45} min sessions
          </Text>
        </View>
      )}

      {/* Rotating testimonials */}
      {!isComplete && (
        <Animated.View style={[styles.testimonialCard, testimonialStyle]}>
          <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
          <View style={styles.testimonialContent}>
            <Text allowFontScaling={false} style={styles.testimonialText}>
              "{currentTest.text}"
            </Text>
            <Text allowFontScaling={false} style={styles.testimonialAuthor}>
              — {currentTest.author}
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    ringContainer: {
      position: "relative",
      width: RING_SIZE + 40,
      height: RING_SIZE + 40,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 32,
    },
    pulseRing: {
      position: "absolute",
      width: RING_SIZE + 40,
      height: RING_SIZE + 40,
      borderRadius: (RING_SIZE + 40) / 2,
      overflow: "hidden",
    },
    pulseGradient: {
      flex: 1,
      borderRadius: (RING_SIZE + 40) / 2,
    },
    svgContainer: {
      position: "absolute",
    },
    centerIcon: {
      position: "absolute",
      alignItems: "center",
      justifyContent: "center",
    },
    iconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    checkCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      overflow: "hidden",
    },
    checkGradient: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      color: colors.text,
      fontSize: 26,
      fontFamily: theme.fonts.heading,
      textAlign: "center",
      marginBottom: 12,
    },
    stepContainer: {
      alignItems: "center",
      gap: 12,
      minHeight: 60,
    },
    stepLabel: {
      color: colors.textMuted,
      fontSize: 15,
      fontFamily: theme.fonts.body,
      textAlign: "center",
    },
    progressDots: {
      flexDirection: "row",
      gap: 6,
    },
    progressDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border,
    },
    progressDotActive: {
      backgroundColor: colors.primary,
    },
    progressDotCurrent: {
      width: 18,
      borderRadius: 3,
    },
    completeLabel: {
      color: colors.primary,
      fontSize: 16,
      fontFamily: theme.fonts.bodySemiBold,
      textAlign: "center",
    },
    completeSublabel: {
      color: colors.textMuted,
      fontSize: 14,
      fontFamily: theme.fonts.body,
      textAlign: "center",
    },
    testimonialCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      marginTop: 40,
      maxWidth: 320,
      borderWidth: 1,
      borderColor: colors.border,
    },
    testimonialContent: {
      flex: 1,
      gap: 4,
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
