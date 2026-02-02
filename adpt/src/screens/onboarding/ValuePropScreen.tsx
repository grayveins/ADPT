/**
 * ValuePropScreen
 * Social proof + key benefits screen (like Calm's "Join 100M+ people")
 * Builds trust and excitement before asking questions
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
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { darkColors, theme } from "@/src/theme";
import { hapticPress } from "@/src/animations/feedback/haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type ValuePropScreenProps = {
  onNext: () => void;
};

// Animated counter component
function AnimatedCounter({ 
  value, 
  suffix = "", 
  delay = 0 
}: { 
  value: number; 
  suffix?: string; 
  delay?: number;
}) {
  const animatedValue = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    animatedValue.value = withDelay(
      delay,
      withTiming(value, { duration: 1500, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  const textStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.Text allowFontScaling={false} style={[styles.statNumber, textStyle]}>
      {Math.round(animatedValue.value).toLocaleString()}{suffix}
    </Animated.Text>
  );
}

// Star rating component
function StarRating({ rating, delay }: { rating: number; delay: number }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.starsContainer, style]}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? "star" : "star-outline"}
          size={16}
          color="#FFD700"
        />
      ))}
    </Animated.View>
  );
}

// Testimonial avatar component
function TestimonialAvatar({ 
  initials, 
  color, 
  delay,
  x,
  y,
}: { 
  initials: string; 
  color: string;
  delay: number;
  x: number;
  y: number;
}) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    scale.value = withDelay(delay, withSpring(1, { damping: 12 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    position: "absolute" as const,
    left: x,
    top: y,
  }));

  return (
    <Animated.View style={[styles.avatar, { backgroundColor: color }, style]}>
      <Text allowFontScaling={false} style={styles.avatarText}>{initials}</Text>
    </Animated.View>
  );
}

export default function ValuePropScreen({ onNext }: ValuePropScreenProps) {
  // Animation values
  const headlineOpacity = useSharedValue(0);
  const headlineY = useSharedValue(30);
  const statsOpacity = useSharedValue(0);
  const benefitsOpacity = useSharedValue(0);
  const ctaOpacity = useSharedValue(0);
  const ctaScale = useSharedValue(0.9);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    // Orchestrated animation sequence
    headlineOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
    headlineY.value = withDelay(200, withSpring(0, { damping: 20 }));
    
    statsOpacity.value = withDelay(500, withTiming(1, { duration: 500 }));
    benefitsOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));
    
    ctaOpacity.value = withDelay(1200, withTiming(1, { duration: 400 }));
    ctaScale.value = withDelay(1200, withSpring(1, { damping: 15 }));

    // Glow animation
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 2000 }),
        withTiming(0.3, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const headlineStyle = useAnimatedStyle(() => ({
    opacity: headlineOpacity.value,
    transform: [{ translateY: headlineY.value }],
  }));

  const statsStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
  }));

  const benefitsStyle = useAnimatedStyle(() => ({
    opacity: benefitsOpacity.value,
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ scale: ctaScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handleNext = () => {
    hapticPress();
    onNext();
  };

  return (
    <View style={styles.container}>
      {/* Background glow */}
      <Animated.View style={[styles.backgroundGlow, glowStyle]} />

      {/* Floating avatars representing community */}
      <View style={styles.avatarsContainer}>
        <TestimonialAvatar initials="JM" color="#FF6B6B" delay={300} x={20} y={40} />
        <TestimonialAvatar initials="SK" color="#4ECDC4" delay={400} x={SCREEN_WIDTH - 80} y={60} />
        <TestimonialAvatar initials="AR" color="#45B7D1" delay={500} x={40} y={120} />
        <TestimonialAvatar initials="LP" color="#96CEB4" delay={600} x={SCREEN_WIDTH - 100} y={140} />
        <TestimonialAvatar initials="TC" color="#DDA0DD" delay={700} x={SCREEN_WIDTH / 2 - 20} y={20} />
      </View>

      {/* Main headline */}
      <Animated.View style={[styles.headlineContainer, headlineStyle]}>
        <Text allowFontScaling={false} style={styles.headline}>
          Join thousands{"\n"}getting stronger
        </Text>
        <Text allowFontScaling={false} style={styles.subheadline}>
          ADPT has helped people just like you transform their fitness journey
        </Text>
      </Animated.View>

      {/* Stats row */}
      <Animated.View style={[styles.statsContainer, statsStyle]}>
        <View style={styles.stat}>
          <AnimatedCounter value={50} suffix="K+" delay={600} />
          <Text allowFontScaling={false} style={styles.statLabel}>Active Users</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <AnimatedCounter value={2} suffix="M+" delay={700} />
          <Text allowFontScaling={false} style={styles.statLabel}>Workouts Done</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <View style={styles.ratingRow}>
            <Text allowFontScaling={false} style={styles.statNumber}>4.9</Text>
            <StarRating rating={5} delay={800} />
          </View>
          <Text allowFontScaling={false} style={styles.statLabel}>App Store</Text>
        </View>
      </Animated.View>

      {/* Key benefits */}
      <Animated.View style={[styles.benefitsContainer, benefitsStyle]}>
        <BenefitItem 
          icon="checkmark-circle" 
          text="Personalized plans that adapt to your progress"
          delay={900}
        />
        <BenefitItem 
          icon="checkmark-circle" 
          text="Expert-designed workouts for any fitness level"
          delay={1000}
        />
        <BenefitItem 
          icon="checkmark-circle" 
          text="AI coach available 24/7 to answer questions"
          delay={1100}
        />
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
              Start Your Transformation
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#000" />
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// Benefit item component
function BenefitItem({ icon, text, delay }: { icon: string; text: string; delay: number }) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-20);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    translateX.value = withDelay(delay, withSpring(0, { damping: 20 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[styles.benefitItem, style]}>
      <Ionicons name={icon as any} size={22} color={darkColors.primary} />
      <Text allowFontScaling={false} style={styles.benefitText}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  backgroundGlow: {
    position: "absolute",
    top: -100,
    left: SCREEN_WIDTH / 2 - 200,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: darkColors.primary,
    opacity: 0.1,
  },
  avatarsContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: darkColors.bg,
  },
  avatarText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: theme.fonts.bodySemiBold,
  },
  headlineContainer: {
    marginTop: 120,
    gap: 12,
  },
  headline: {
    color: darkColors.text,
    fontSize: 36,
    fontFamily: theme.fonts.heading,
    lineHeight: 44,
  },
  subheadline: {
    color: darkColors.muted,
    fontSize: 16,
    fontFamily: theme.fonts.body,
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: darkColors.card,
    borderRadius: 16,
    padding: 20,
    marginTop: 32,
  },
  stat: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    color: darkColors.text,
    fontSize: 24,
    fontFamily: theme.fonts.bodySemiBold,
  },
  statLabel: {
    color: darkColors.muted,
    fontSize: 12,
    fontFamily: theme.fonts.body,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: darkColors.border,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 2,
  },
  benefitsContainer: {
    marginTop: 32,
    gap: 16,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  benefitText: {
    color: darkColors.text,
    fontSize: 15,
    fontFamily: theme.fonts.body,
    flex: 1,
    lineHeight: 22,
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
