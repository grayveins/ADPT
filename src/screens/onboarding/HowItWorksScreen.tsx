/**
 * HowItWorksScreen
 * Quick 3-step explanation of how the app works
 * Educates users before asking questions (like Duolingo)
 */

import React, { useEffect } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { darkColors, theme } from "@/src/theme";
import { hapticPress } from "@/src/animations/feedback/haptics";

type HowItWorksScreenProps = {
  onNext: () => void;
};

const steps = [
  {
    number: "1",
    icon: "person-circle",
    title: "Tell us about you",
    description: "Share your goals, experience, and preferences so we can personalize everything.",
    color: "#FF6B6B",
  },
  {
    number: "2",
    icon: "sparkles",
    title: "We build your plan",
    description: "Our AI creates a workout program tailored specifically to your needs and schedule.",
    color: "#4ECDC4",
  },
  {
    number: "3",
    icon: "trending-up",
    title: "Train & adapt",
    description: "Complete workouts and watch your plan evolve as you get stronger.",
    color: "#45B7D1",
  },
];

// Animated step component
function StepCard({ 
  step, 
  index, 
  isLast 
}: { 
  step: typeof steps[0]; 
  index: number;
  isLast: boolean;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const iconScale = useSharedValue(0);
  const lineHeight = useSharedValue(0);

  useEffect(() => {
    const delay = 400 + index * 200;
    
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 20 }));
    iconScale.value = withDelay(delay + 100, withSpring(1, { damping: 12 }));
    
    if (!isLast) {
      lineHeight.value = withDelay(delay + 200, withTiming(1, { duration: 400 }));
    }
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: lineHeight.value }],
  }));

  return (
    <Animated.View style={[styles.stepCard, cardStyle]}>
      {/* Left side - number and line */}
      <View style={styles.stepLeft}>
        <Animated.View style={[styles.stepNumber, { backgroundColor: step.color }, iconStyle]}>
          <Text allowFontScaling={false} style={styles.stepNumberText}>{step.number}</Text>
        </Animated.View>
        {!isLast && (
          <Animated.View style={[styles.stepLine, lineStyle]} />
        )}
      </View>

      {/* Right side - content */}
      <View style={styles.stepContent}>
        <View style={[styles.stepIconContainer, { backgroundColor: `${step.color}20` }]}>
          <Ionicons name={step.icon as any} size={28} color={step.color} />
        </View>
        <Text allowFontScaling={false} style={styles.stepTitle}>{step.title}</Text>
        <Text allowFontScaling={false} style={styles.stepDescription}>{step.description}</Text>
      </View>
    </Animated.View>
  );
}

export default function HowItWorksScreen({ onNext }: HowItWorksScreenProps) {
  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(20);
  const ctaOpacity = useSharedValue(0);
  const ctaScale = useSharedValue(0.9);
  const timeOpacity = useSharedValue(0);

  useEffect(() => {
    // Orchestrated animation sequence
    headerOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));
    headerY.value = withDelay(100, withSpring(0, { damping: 20 }));
    
    ctaOpacity.value = withDelay(1400, withTiming(1, { duration: 400 }));
    ctaScale.value = withDelay(1400, withSpring(1, { damping: 15 }));
    
    timeOpacity.value = withDelay(1500, withTiming(1, { duration: 400 }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ scale: ctaScale.value }],
  }));

  const timeStyle = useAnimatedStyle(() => ({
    opacity: timeOpacity.value,
  }));

  const handleNext = () => {
    hapticPress();
    onNext();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <Text allowFontScaling={false} style={styles.title}>
          How ADPT works
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          Three simple steps to your personalized fitness journey
        </Text>
      </Animated.View>

      {/* Steps */}
      <View style={styles.stepsContainer}>
        {steps.map((step, index) => (
          <StepCard 
            key={step.number} 
            step={step} 
            index={index}
            isLast={index === steps.length - 1}
          />
        ))}
      </View>

      {/* Time estimate */}
      <Animated.View style={[styles.timeEstimate, timeStyle]}>
        <Ionicons name="time-outline" size={18} color={darkColors.muted} />
        <Text allowFontScaling={false} style={styles.timeText}>
          Takes about 2 minutes
        </Text>
      </Animated.View>

      {/* CTA */}
      <Animated.View style={[styles.ctaContainer, ctaStyle]}>
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.ctaButton,
            pressed && styles.ctaButtonPressed,
          ]}
        >
          <LinearGradient
            colors={[darkColors.primary, darkColors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text allowFontScaling={false} style={styles.ctaText}>
              Let&apos;s Begin
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#000" />
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    gap: 8,
    marginBottom: 40,
  },
  title: {
    color: darkColors.text,
    fontSize: 32,
    fontFamily: theme.fonts.heading,
    lineHeight: 40,
  },
  subtitle: {
    color: darkColors.muted,
    fontSize: 16,
    fontFamily: theme.fonts.body,
    lineHeight: 24,
  },
  stepsContainer: {
    gap: 0,
  },
  stepCard: {
    flexDirection: "row",
    gap: 16,
  },
  stepLeft: {
    alignItems: "center",
    width: 40,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: theme.fonts.bodySemiBold,
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: darkColors.border,
    marginVertical: 8,
    transformOrigin: "top",
  },
  stepContent: {
    flex: 1,
    paddingBottom: 24,
    gap: 8,
  },
  stepIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  stepTitle: {
    color: darkColors.text,
    fontSize: 18,
    fontFamily: theme.fonts.bodySemiBold,
  },
  stepDescription: {
    color: darkColors.muted,
    fontSize: 14,
    fontFamily: theme.fonts.body,
    lineHeight: 21,
  },
  timeEstimate: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
  },
  timeText: {
    color: darkColors.muted,
    fontSize: 14,
    fontFamily: theme.fonts.body,
  },
  ctaContainer: {
    marginTop: "auto",
    paddingBottom: 40,
  },
  ctaButton: {
    borderRadius: 28,
    overflow: "hidden",
  },
  ctaButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  ctaText: {
    color: "#000",
    fontSize: 17,
    fontFamily: theme.fonts.bodySemiBold,
  },
});
