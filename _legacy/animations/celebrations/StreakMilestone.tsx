/**
 * StreakMilestone
 * Full-screen celebration for streak milestones (7, 14, 30, 60, 100 days)
 */

import React, { useEffect, useState, useMemo } from "react";
import { StyleSheet, View, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  withRepeat,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { SPRING_CONFIG, Z_INDEX } from "../constants";
import { Confetti } from "../components/Confetti";
import { hapticCelebration } from "../feedback/haptics";

const STREAK_MESSAGES: Record<number, string> = {
  7: "One week strong. Consistency is everything.",
  14: "Two weeks in. You're building a habit.",
  30: "A full month. Most people quit by now \u2014 not you.",
  60: "Two months of dedication. You're unstoppable.",
  100: "100 days. You're in the top 1% of fitness app users.",
};

const getStreakMessage = (days: number): string => {
  // Exact match first
  if (STREAK_MESSAGES[days]) return STREAK_MESSAGES[days];
  // Fallback for other milestones
  if (days >= 100) return `${days} days. Legendary dedication.`;
  if (days >= 60) return `${days} days of dedication. You're unstoppable.`;
  if (days >= 30) return `${days} days strong. You've built a real habit.`;
  if (days >= 14) return `${days} days in. The consistency is paying off.`;
  return `${days} days strong. Keep it going.`;
};

// Orange/gold confetti colors for streak celebrations
const STREAK_CONFETTI_COLORS = ["#FF6B35", "#FFD700", "#FFA500", "#FF8C00", "#FFFFFF"];

type StreakMilestoneProps = {
  visible: boolean;
  days: number;
  onDismiss: () => void;
};

export const StreakMilestone: React.FC<StreakMilestoneProps> = ({
  visible,
  days,
  onDismiss,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [showConfetti, setShowConfetti] = useState(false);

  const overlayOpacity = useSharedValue(0);
  const flameScale = useSharedValue(0);
  const flamePulse = useSharedValue(1);
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(20);

  useEffect(() => {
    if (visible) {
      // 0ms: Overlay fades in
      overlayOpacity.value = withTiming(1, { duration: 200 });

      // 200ms: Flame icon scales up with wobbly spring
      flameScale.value = withDelay(
        200,
        withSequence(
          withSpring(1.4, SPRING_CONFIG.wobbly),
          withSpring(1, SPRING_CONFIG.snappy)
        )
      );

      // 400ms: Haptic
      setTimeout(() => {
        hapticCelebration();
      }, 400);

      // 500ms: Start pulse animation on flame
      setTimeout(() => {
        flamePulse.value = withRepeat(
          withSequence(
            withSpring(1.08, SPRING_CONFIG.wobbly),
            withSpring(1, SPRING_CONFIG.wobbly)
          ),
          -1,
          true
        );
      }, 800);

      // 600ms: Confetti
      setTimeout(() => {
        setShowConfetti(true);
      }, 600);

      // 700ms: Title appears
      titleOpacity.value = withDelay(700, withTiming(1, { duration: 300 }));

      // 1000ms: Subtitle slides in
      subtitleOpacity.value = withDelay(1000, withTiming(1, { duration: 300 }));
      subtitleTranslateY.value = withDelay(
        1000,
        withSpring(0, SPRING_CONFIG.gentle)
      );

      // 3500ms: Auto dismiss
      setTimeout(() => {
        onDismiss();
      }, 3500);
    } else {
      overlayOpacity.value = 0;
      flameScale.value = 0;
      flamePulse.value = 1;
      titleOpacity.value = 0;
      subtitleOpacity.value = 0;
      subtitleTranslateY.value = 20;
      setShowConfetti(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const flameStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: flameScale.value * flamePulse.value },
    ],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  if (!visible) return null;

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss}>
      <Animated.View style={[styles.overlay, overlayStyle]}>
        {/* Orange/gold confetti */}
        <Confetti
          active={showConfetti}
          colors={STREAK_CONFETTI_COLORS}
          count={25}
          spread={70}
        />

        <View style={styles.content}>
          {/* Flame icon */}
          <Animated.View style={[styles.flameContainer, flameStyle]}>
            <View style={styles.flameCircle}>
              <Ionicons name="flame" size={44} color="#FFF" />
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.Text
            allowFontScaling={false}
            style={[styles.title, titleStyle]}
          >
            {days}-Day Streak!
          </Animated.Text>

          {/* Subtitle */}
          <Animated.Text
            allowFontScaling={false}
            style={[styles.subtitle, subtitleStyle]}
          >
            {getStreakMessage(days)}
          </Animated.Text>

          {/* Hint */}
          <Animated.Text
            allowFontScaling={false}
            style={[styles.hint, subtitleStyle]}
          >
            Tap anywhere to continue
          </Animated.Text>
        </View>
      </Animated.View>
    </Pressable>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.93)",
      zIndex: Z_INDEX.celebration,
      justifyContent: "center",
      alignItems: "center",
    },
    content: {
      alignItems: "center",
      paddingHorizontal: 32,
    },
    flameContainer: {
      marginBottom: 20,
    },
    flameCircle: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: "#FF6B35",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#FF6B35",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.7,
      shadowRadius: 25,
    },
    title: {
      color: "#FF6B35",
      fontSize: 36,
      fontWeight: "700",
      marginBottom: 12,
      textAlign: "center",
      textShadowColor: "rgba(255, 107, 53, 0.5)",
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 10,
    },
    subtitle: {
      color: colors.muted,
      fontSize: 16,
      fontWeight: "400",
      textAlign: "center",
      lineHeight: 24,
      marginBottom: 32,
      maxWidth: 300,
    },
    hint: {
      color: colors.inputPlaceholder,
      fontSize: 14,
      fontWeight: "400",
    },
  });

export default StreakMilestone;
