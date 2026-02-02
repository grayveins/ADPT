/**
 * BuildingPlanScreen
 * Premium plan generation screen with sophisticated animations
 * Inspired by Fitbod/MacroFactor loading states
 */

import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, Text, View, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  runOnJS,
  cancelAnimation,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import { darkColors, theme } from "@/src/theme";
import { useOnboarding } from "@/src/context/OnboardingContext";
import { haptic, hapticCelebration } from "@/src/animations/feedback/haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const RING_SIZE = 180;
const STROKE_WIDTH = 6;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type BuildingPlanScreenProps = {
  onNext: () => void;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Analyzing steps
const ANALYSIS_STEPS = [
  { icon: "body", label: "Analyzing your profile", sublabel: "Understanding your body metrics" },
  { icon: "fitness", label: "Selecting exercises", sublabel: "Matching movements to your goals" },
  { icon: "calendar", label: "Building your schedule", sublabel: "Optimizing workout frequency" },
  { icon: "analytics", label: "Calibrating intensity", sublabel: "Setting your starting weights" },
  { icon: "flash", label: "Finalizing your plan", sublabel: "Putting it all together" },
];

// Floating orb component
function FloatingOrb({ delay, size, color, x, duration }: { 
  delay: number; 
  size: number; 
  color: string;
  x: number;
  duration: number;
}) {
  const translateY = useSharedValue(300);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(0.4, { duration: 500 }));
    scale.value = withDelay(delay, withSpring(1));
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-100, { duration, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: x,
          bottom: 0,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

export default function BuildingPlanScreen({ onNext }: BuildingPlanScreenProps) {
  const { form } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Animation values
  const progress = useSharedValue(0);
  const ringRotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const iconScale = useSharedValue(1);
  const checkScale = useSharedValue(0);
  const stepOpacity = useSharedValue(1);

  // Animate through steps
  const advanceStep = useCallback(() => {
    if (currentStep < ANALYSIS_STEPS.length - 1) {
      haptic("light");
      // Fade out current step
      stepOpacity.value = withTiming(0, { duration: 150 }, () => {
        runOnJS(setCurrentStep)(currentStep + 1);
        stepOpacity.value = withTiming(1, { duration: 200 });
      });
      iconScale.value = withSequence(
        withTiming(0.8, { duration: 100 }),
        withSpring(1, { damping: 10 })
      );
    }
  }, [currentStep]);

  useEffect(() => {
    // Start ring rotation
    ringRotation.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );

    // Pulse animation
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Progress animation
    const stepDuration = 900;
    const totalDuration = ANALYSIS_STEPS.length * stepDuration;

    progress.value = withTiming(1, {
      duration: totalDuration,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    // Step through each analysis phase
    const stepInterval = setInterval(() => {
      advanceStep();
    }, stepDuration);

    // Complete after all steps
    const completeTimeout = setTimeout(async () => {
      clearInterval(stepInterval);
      setIsComplete(true);
      await hapticCelebration();
      
      // Animate check mark
      checkScale.value = withSpring(1, { damping: 10, stiffness: 100 });
      
      // Cancel other animations
      cancelAnimation(ringRotation);
      cancelAnimation(pulseScale);
      
      // Auto-advance after showing completion
      setTimeout(() => {
        onNext();
      }, 1800);
    }, totalDuration + 500);

    return () => {
      clearInterval(stepInterval);
      clearTimeout(completeTimeout);
    };
  }, []);

  // Animated styles
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringRotation.value}deg` }],
  }));

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

  const currentAnalysis = ANALYSIS_STEPS[currentStep];

  // Generate personalized message
  const getPersonalizedTitle = () => {
    if (isComplete) return "Your plan is ready";
    
    const { goal, experienceLevel } = form;
    if (goal === "build_muscle") return "Building your muscle plan";
    if (goal === "lose_weight") return "Creating your fat loss program";
    if (goal === "get_toned") return "Designing your toning routine";
    if (experienceLevel === "beginner") return "Crafting your starter program";
    return "Personalizing your workout plan";
  };

  return (
    <View style={styles.container}>
      {/* Floating orbs background */}
      <View style={styles.orbsContainer}>
        <FloatingOrb delay={0} size={20} color={`${darkColors.primary}40`} x={SCREEN_WIDTH * 0.1} duration={4000} />
        <FloatingOrb delay={500} size={14} color={`${darkColors.primary}30`} x={SCREEN_WIDTH * 0.8} duration={5000} />
        <FloatingOrb delay={1000} size={24} color={`${darkColors.primary}25`} x={SCREEN_WIDTH * 0.4} duration={4500} />
        <FloatingOrb delay={1500} size={16} color={`${darkColors.primary}35`} x={SCREEN_WIDTH * 0.65} duration={3500} />
      </View>

      {/* Progress ring */}
      <View style={styles.ringContainer}>
        {/* Pulsing background */}
        <Animated.View style={[styles.pulseRing, pulseStyle]}>
          <LinearGradient
            colors={[`${darkColors.primary}15`, `${darkColors.primary}05`]}
            style={styles.pulseGradient}
          />
        </Animated.View>

        {/* SVG Ring */}
        <Animated.View style={[styles.svgContainer, ringStyle]}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Defs>
              <SvgGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={darkColors.primary} />
                <Stop offset="100%" stopColor={darkColors.primaryDark} />
              </SvgGradient>
            </Defs>
            {/* Background ring */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={darkColors.border}
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
        </Animated.View>

        {/* Center icon */}
        <View style={styles.centerIcon}>
          {!isComplete ? (
            <Animated.View style={iconStyle}>
              <View style={styles.iconCircle}>
                <Ionicons 
                  name={currentAnalysis?.icon as any || "barbell"} 
                  size={36} 
                  color={darkColors.primary} 
                />
              </View>
            </Animated.View>
          ) : (
            <Animated.View style={[styles.checkCircle, checkStyle]}>
              <LinearGradient
                colors={[darkColors.primary, darkColors.primaryDark]}
                style={styles.checkGradient}
              >
                <Ionicons name="checkmark" size={48} color="#000" />
              </LinearGradient>
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
          <Text allowFontScaling={false} style={styles.stepSublabel}>
            {currentAnalysis?.sublabel}
          </Text>
        </Animated.View>
      ) : (
        <View style={styles.stepContainer}>
          <Text allowFontScaling={false} style={styles.completeLabel}>
            Tailored to your goals
          </Text>
          <Text allowFontScaling={false} style={styles.stepSublabel}>
            {form.workoutsPerWeek || 3}x per week • {form.workoutDuration || 45} min sessions
          </Text>
        </View>
      )}

      {/* Step indicators */}
      <View style={styles.stepDots}>
        {ANALYSIS_STEPS.map((_, index) => (
          <View
            key={index}
            style={[
              styles.stepDot,
              index <= currentStep && styles.stepDotActive,
              index === currentStep && !isComplete && styles.stepDotCurrent,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 60,
  },
  orbsContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  ringContainer: {
    position: "relative",
    width: RING_SIZE + 60,
    height: RING_SIZE + 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  pulseRing: {
    position: "absolute",
    width: RING_SIZE + 60,
    height: RING_SIZE + 60,
    borderRadius: (RING_SIZE + 60) / 2,
    overflow: "hidden",
  },
  pulseGradient: {
    flex: 1,
    borderRadius: (RING_SIZE + 60) / 2,
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: darkColors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  checkCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: "hidden",
  },
  checkGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: darkColors.text,
    fontSize: 28,
    fontFamily: theme.fonts.heading,
    textAlign: "center",
    marginBottom: 16,
  },
  stepContainer: {
    alignItems: "center",
    gap: 6,
    minHeight: 60,
  },
  stepLabel: {
    color: darkColors.text,
    fontSize: 17,
    fontFamily: theme.fonts.bodyMedium,
    textAlign: "center",
  },
  stepSublabel: {
    color: darkColors.muted,
    fontSize: 14,
    fontFamily: theme.fonts.body,
    textAlign: "center",
  },
  completeLabel: {
    color: darkColors.primary,
    fontSize: 17,
    fontFamily: theme.fonts.bodySemiBold,
    textAlign: "center",
  },
  stepDots: {
    flexDirection: "row",
    gap: 8,
    marginTop: 32,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: darkColors.border,
  },
  stepDotActive: {
    backgroundColor: darkColors.primary,
  },
  stepDotCurrent: {
    width: 24,
    borderRadius: 4,
  },
});
