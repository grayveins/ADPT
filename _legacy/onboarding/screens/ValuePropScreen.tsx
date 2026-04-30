/**
 * ValuePropScreen
 * Social proof + key benefits screen (like Calm's "Join 100M+ people")
 * Builds trust and excitement before asking questions
 */

import React, { useEffect, useMemo } from "react";
import { StyleSheet, Text, View, Pressable, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { theme } from "@/src/theme";
import { hapticPress } from "@/src/animations/feedback/haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type ValuePropScreenProps = {
  onNext: () => void;
};

// Animated counter component
function AnimatedCounter({ 
  value, 
  suffix = "", 
  delay = 0,
  colors,
}: { 
  value: number; 
  suffix?: string; 
  delay?: number;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const animatedValue = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    animatedValue.value = withDelay(
      delay,
      withTiming(value, { duration: 1500, easing: Easing.out(Easing.cubic) })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const textStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.Text allowFontScaling={false} style={[{
      color: colors.text,
      fontSize: 24,
      fontFamily: theme.fonts.bodySemiBold,
    }, textStyle]}>
      {Math.round(animatedValue.value).toLocaleString()}{suffix}
    </Animated.Text>
  );
}

// Star rating component
function StarRating({ rating, delay, colors }: { 
  rating: number; 
  delay: number;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{ flexDirection: "row", gap: 2 }, style]}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? "star" : "star-outline"}
          size={16}
          color={colors.gold}
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
  colors,
}: { 
  initials: string; 
  color: string;
  delay: number;
  x: number;
  y: number;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    scale.value = withDelay(delay, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    position: "absolute" as const,
    left: x,
    top: y,
  }));

  return (
    <Animated.View style={[{
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: color,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: colors.bg,
    }, style]}>
      <Text allowFontScaling={false} style={{
        color: "#fff",
        fontSize: 14,
        fontFamily: theme.fonts.bodySemiBold,
      }}>{initials}</Text>
    </Animated.View>
  );
}

export default function ValuePropScreen({ onNext }: ValuePropScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Animation values
  const headlineOpacity = useSharedValue(0);
  const headlineY = useSharedValue(30);
  const statsOpacity = useSharedValue(0);
  const benefitsOpacity = useSharedValue(0);
  const ctaOpacity = useSharedValue(0);
  const ctaScale = useSharedValue(0.9);

  useEffect(() => {
    headlineOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
    headlineY.value = withDelay(200, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));

    statsOpacity.value = withDelay(500, withTiming(1, { duration: 500 }));
    benefitsOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));

    ctaOpacity.value = withDelay(1200, withTiming(1, { duration: 400 }));
    ctaScale.value = withDelay(1200, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleNext = () => {
    hapticPress();
    onNext();
  };

  return (
    <View style={styles.container}>
      {/* Floating avatars representing community */}
      <View style={styles.avatarsContainer}>
        <TestimonialAvatar initials="JM" color="#FF6B6B" delay={300} x={20} y={40} colors={colors} />
        <TestimonialAvatar initials="SK" color="#4ECDC4" delay={400} x={SCREEN_WIDTH - 80} y={60} colors={colors} />
        <TestimonialAvatar initials="AR" color="#45B7D1" delay={500} x={40} y={120} colors={colors} />
        <TestimonialAvatar initials="LP" color="#96CEB4" delay={600} x={SCREEN_WIDTH - 100} y={140} colors={colors} />
        <TestimonialAvatar initials="TC" color="#DDA0DD" delay={700} x={SCREEN_WIDTH / 2 - 20} y={20} colors={colors} />
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
          <AnimatedCounter value={50} suffix="K+" delay={600} colors={colors} />
          <Text allowFontScaling={false} style={styles.statLabel}>Active Users</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <AnimatedCounter value={2} suffix="M+" delay={700} colors={colors} />
          <Text allowFontScaling={false} style={styles.statLabel}>Workouts Done</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <View style={styles.ratingRow}>
            <Text allowFontScaling={false} style={styles.statNumber}>4.9</Text>
            <StarRating rating={5} delay={800} colors={colors} />
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
          colors={colors}
        />
        <BenefitItem 
          icon="checkmark-circle" 
          text="Expert-designed workouts for any fitness level"
          delay={1000}
          colors={colors}
        />
        <BenefitItem 
          icon="checkmark-circle" 
          text="AI coach available 24/7 to answer questions"
          delay={1100}
          colors={colors}
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
          <Text allowFontScaling={false} style={styles.ctaText}>
            Start Your Transformation
          </Text>
          <Ionicons name="arrow-forward" size={20} color={colors.textOnPrimary} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

// Benefit item component
function BenefitItem({ icon, text, delay, colors }: { icon: string; text: string; delay: number; colors: ReturnType<typeof useTheme>["colors"] }) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-20);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    translateX.value = withDelay(delay, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[{ flexDirection: "row", alignItems: "center", gap: 12 }, style]}>
      <Ionicons name={icon as any} size={22} color={colors.primary} />
      <Text allowFontScaling={false} style={{
        color: colors.text,
        fontSize: 15,
        fontFamily: theme.fonts.body,
        flex: 1,
        lineHeight: 22,
      }}>{text}</Text>
    </Animated.View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 60,
    },
    avatarsContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 180,
    },
    headlineContainer: {
      marginTop: 120,
      gap: 12,
    },
    headline: {
      color: colors.text,
      fontSize: 36,
      fontFamily: theme.fonts.heading,
      lineHeight: 44,
    },
    subheadline: {
      color: colors.textMuted,
      fontSize: 16,
      fontFamily: theme.fonts.body,
      lineHeight: 24,
    },
    statsContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginTop: 32,
    },
    stat: {
      alignItems: "center",
      flex: 1,
    },
    statNumber: {
      color: colors.text,
      fontSize: 24,
      fontFamily: theme.fonts.bodySemiBold,
    },
    statLabel: {
      color: colors.textMuted,
      fontSize: 12,
      fontFamily: theme.fonts.body,
      marginTop: 4,
    },
    statDivider: {
      width: 1,
      height: 40,
      backgroundColor: colors.border,
    },
    ratingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    benefitsContainer: {
      marginTop: 32,
      gap: 16,
    },
    ctaContainer: {
      marginTop: "auto",
      paddingBottom: 40,
    },
    ctaButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 18,
      paddingHorizontal: 32,
      borderRadius: 28,
      backgroundColor: colors.primary,
    },
    ctaButtonPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
    },
    ctaText: {
      color: colors.textOnPrimary,
      fontSize: 17,
      fontFamily: theme.fonts.bodySemiBold,
    },
  });
