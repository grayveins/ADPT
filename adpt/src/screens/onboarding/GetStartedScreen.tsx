/**
 * GetStartedScreen
 * Final motivation screen before starting first workout
 * Creates excitement and primes user for success
 */

import React, { useEffect } from "react";
import { StyleSheet, Text, View, Pressable, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeInDown,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { darkColors, theme } from "@/src/theme";
import { useOnboarding } from "@/src/context/OnboardingContext";
import { hapticPress, hapticCelebration } from "@/src/animations/feedback/haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type GetStartedScreenProps = {
  onNext: () => void;
};

// Floating celebration particle
function CelebrationParticle({ 
  delay, 
  x, 
  size,
  color,
}: { 
  delay: number; 
  x: number;
  size: number;
  color: string;
}) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(0.8, { duration: 500 }));
    scale.value = withDelay(delay, withSpring(1, { damping: 8 }));
    
    translateY.value = withDelay(
      delay + 200,
      withRepeat(
        withSequence(
          withTiming(-15, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
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
    position: "absolute" as const,
    left: x,
    top: Math.random() * 150,
  }));

  return (
    <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]} />
  );
}

export default function GetStartedScreen({ onNext }: GetStartedScreenProps) {
  const { form } = useOnboarding();

  // Animation values
  const trophyScale = useSharedValue(0);
  const trophyRotate = useSharedValue(-10);
  const glowOpacity = useSharedValue(0);
  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(30);

  useEffect(() => {
    // Trophy entrance
    trophyScale.value = withDelay(200, withSpring(1, { damping: 10 }));
    trophyRotate.value = withDelay(200, withSpring(0, { damping: 15 }));
    
    // Glow pulse
    glowOpacity.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1500 }),
          withTiming(0.3, { duration: 1500 })
        ),
        -1,
        true
      )
    );

    // Header animation
    headerOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    headerY.value = withDelay(300, withSpring(0, { damping: 20 }));
  }, []);

  const trophyStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: trophyScale.value },
      { rotate: `${trophyRotate.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));

  const handleStart = async () => {
    hapticCelebration();
    
    // Mark onboarding as complete
    await AsyncStorage.setItem("onboarding_complete", "true");
    
    // Navigate to main app
    router.replace("/(app)/(tabs)");
  };

  // Get personalized message based on goal
  const getMotivationalMessage = () => {
    const goal = form.goal;
    switch (goal) {
      case "build_muscle":
        return "Time to build the physique you&apos;ve always wanted";
      case "lose_weight":
        return "Your transformation journey starts now";
      case "get_toned":
        return "Let&apos;s sculpt a leaner, stronger you";
      case "endurance":
        return "Ready to push your limits further than ever";
      default:
        return "Your fitness journey begins today";
    }
  };

  return (
    <View style={styles.container}>
      {/* Celebration particles */}
      <View style={styles.particlesContainer}>
        <CelebrationParticle delay={0} x={SCREEN_WIDTH * 0.1} size={8} color={darkColors.primary} />
        <CelebrationParticle delay={200} x={SCREEN_WIDTH * 0.8} size={6} color="#FFD700" />
        <CelebrationParticle delay={400} x={SCREEN_WIDTH * 0.3} size={10} color="#FF6B6B" />
        <CelebrationParticle delay={600} x={SCREEN_WIDTH * 0.65} size={7} color="#4ECDC4" />
        <CelebrationParticle delay={300} x={SCREEN_WIDTH * 0.5} size={5} color="#45B7D1" />
      </View>

      {/* Trophy/celebration icon */}
      <View style={styles.trophyContainer}>
        <Animated.View style={[styles.glow, glowStyle]} />
        <Animated.View style={[styles.trophyCircle, trophyStyle]}>
          <LinearGradient
            colors={["#FFD700", "#FFA500"]}
            style={styles.trophyGradient}
          >
            <Ionicons name="trophy" size={56} color="#fff" />
          </LinearGradient>
        </Animated.View>
      </View>

      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <Text allowFontScaling={false} style={styles.title}>
          You&apos;re all set!
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          {getMotivationalMessage().replace(/&apos;/g, "'")}
        </Text>
      </Animated.View>

      {/* Quick tips */}
      <Animated.View 
        entering={FadeInDown.delay(600).duration(400)}
        style={styles.tipsContainer}
      >
        <Text allowFontScaling={false} style={styles.tipsTitle}>
          Quick tips to succeed
        </Text>
        <View style={styles.tipsList}>
          <TipItem 
            number="1" 
            text="Start with your first workout today" 
            delay={700}
          />
          <TipItem 
            number="2" 
            text="Log every workout to track progress" 
            delay={800}
          />
          <TipItem 
            number="3" 
            text="Ask the AI coach any questions" 
            delay={900}
          />
        </View>
      </Animated.View>

      {/* CTA */}
      <Animated.View 
        entering={FadeInDown.delay(1000).duration(400)}
        style={styles.ctaContainer}
      >
        <Pressable
          onPress={handleStart}
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
              Start Training
            </Text>
            <Ionicons name="barbell" size={22} color="#000" />
          </LinearGradient>
        </Pressable>

        <Text allowFontScaling={false} style={styles.ctaHint}>
          Your first workout is waiting
        </Text>
      </Animated.View>
    </View>
  );
}

function TipItem({ number, text, delay }: { number: string; text: string; delay: number }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      style={styles.tipItem}
    >
      <View style={styles.tipNumber}>
        <Text allowFontScaling={false} style={styles.tipNumberText}>{number}</Text>
      </View>
      <Text allowFontScaling={false} style={styles.tipText}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 16,
  },
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  trophyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 32,
  },
  glow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#FFD700",
  },
  trophyCircle: {
    borderRadius: 60,
    overflow: "hidden",
  },
  trophyGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    gap: 12,
    marginBottom: 32,
  },
  title: {
    color: darkColors.text,
    fontSize: 36,
    fontFamily: theme.fonts.heading,
    textAlign: "center",
  },
  subtitle: {
    color: darkColors.muted,
    fontSize: 18,
    fontFamily: theme.fonts.body,
    textAlign: "center",
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  tipsContainer: {
    backgroundColor: darkColors.card,
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  tipsTitle: {
    color: darkColors.text,
    fontSize: 16,
    fontFamily: theme.fonts.bodySemiBold,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tipNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: darkColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  tipNumberText: {
    color: "#000",
    fontSize: 14,
    fontFamily: theme.fonts.bodySemiBold,
  },
  tipText: {
    color: darkColors.text,
    fontSize: 15,
    fontFamily: theme.fonts.body,
    flex: 1,
  },
  ctaContainer: {
    marginTop: "auto",
    alignItems: "center",
    gap: 12,
    paddingTop: 24,
  },
  ctaButton: {
    width: "100%",
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
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  ctaText: {
    color: "#000",
    fontSize: 18,
    fontFamily: theme.fonts.bodySemiBold,
  },
  ctaHint: {
    color: darkColors.muted2,
    fontSize: 14,
    fontFamily: theme.fonts.body,
  },
});
