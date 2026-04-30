/**
 * WorkoutComplete
 * Full-screen celebration for workout completion
 */

import React, { useEffect, useState, useMemo } from "react";
import { StyleSheet, Text, View, Pressable, Share } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  Easing,
  FadeIn,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { theme as appTheme } from "@/src/theme";
import { SPRING_CONFIG, Z_INDEX } from "../constants";
import { hapticCelebration } from "../feedback/haptics";
import { CelebrationConfetti } from "../components/Confetti";

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Motivational messages based on context
const getMotivationalMessage = (stats: WorkoutStats): string => {
  const { workoutsThisWeek = 0, isStreak, totalVolume = 0 } = stats;
  
  if (isStreak && workoutsThisWeek >= 3) {
    return `That's ${workoutsThisWeek} this week. You're building something real.`;
  }
  if (workoutsThisWeek === 1) {
    return "First one down. The hardest part is showing up.";
  }
  if (totalVolume > 10000) {
    return "Serious volume today. Recovery matters.";
  }
  return "Every rep counts. You showed up.";
};

type WorkoutStats = {
  duration: string;
  exercises: number;
  sets: number;
  totalVolume?: number;
  workoutsThisWeek?: number;
  isStreak?: boolean;
  prs?: { exercise: string; value: string; previous?: string }[];
};

type WorkoutCompleteProps = {
  visible: boolean;
  stats: WorkoutStats;
  onContinue: () => void;
  onShare?: () => void;
};

export const WorkoutComplete: React.FC<WorkoutCompleteProps> = ({
  visible,
  stats,
  onContinue,
  onShare,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [showButton, setShowButton] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const formattedVolume = useMemo(() => {
    if (!stats.totalVolume) return null;
    if (stats.totalVolume >= 1000) {
      return `${(stats.totalVolume / 1000).toFixed(1).replace(/\.0$/, "")}K`;
    }
    return stats.totalVolume.toLocaleString();
  }, [stats.totalVolume]);

  const handleShare = async () => {
    if (onShare) {
      // Use visual share card (Instagram Stories-ready)
      onShare();
      return;
    }
    // Fallback: text-based share
    const lines = [
      `Workout Complete`,
      `${stats.duration} | ${stats.exercises} exercises | ${stats.sets} sets`,
    ];
    if (stats.totalVolume) lines.push(`${stats.totalVolume.toLocaleString()} lbs moved`);
    if (stats.prs && stats.prs.length > 0) {
      lines.push(`${stats.prs.length} PR${stats.prs.length > 1 ? "s" : ""} hit!`);
      stats.prs.forEach(pr => lines.push(`  ${pr.exercise}: ${pr.value}`));
    }
    lines.push("", "Trained with ADPT Fit");
    try {
      await Share.share({ message: lines.join("\n") });
    } catch { /* user cancelled */ }
  };

  // Animation values
  const overlayOpacity = useSharedValue(0);
  const checkmarkProgress = useSharedValue(0);
  const checkmarkScale = useSharedValue(0);
  const titleScale = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const statsOpacity = useSharedValue(0);
  const statsTranslateY = useSharedValue(30);
  const messageOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Sequence the celebration

      // 0ms: Overlay fades in
      overlayOpacity.value = withTiming(1, { duration: 200 });
      
      // 200ms: Checkmark draws and bounces
      checkmarkScale.value = withDelay(
        200,
        withSequence(
          withSpring(1.2, SPRING_CONFIG.bouncy),
          withSpring(1, SPRING_CONFIG.snappy)
        )
      );
      checkmarkProgress.value = withDelay(
        200,
        withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) })
      );
      
      // 400ms: Haptic
      setTimeout(() => {
        hapticCelebration();
      }, 400);
      
      // 500ms: Title appears
      titleScale.value = withDelay(
        500,
        withSpring(1, SPRING_CONFIG.bouncy)
      );
      titleOpacity.value = withDelay(
        500,
        withTiming(1, { duration: 200 })
      );
      
      // 900ms: Stats slide in
      statsOpacity.value = withDelay(900, withTiming(1, { duration: 300 }));
      statsTranslateY.value = withDelay(
        900,
        withSpring(0, SPRING_CONFIG.gentle)
      );
      
      // 1200ms: Message fades in
      messageOpacity.value = withDelay(1200, withTiming(1, { duration: 300 }));
      
      // 600ms: Confetti
      setTimeout(() => {
        setShowConfetti(true);
      }, 600);

      // 2500ms: Show button
      setTimeout(() => {
        setShowButton(true);
      }, 2500);
    } else {
      // Reset
      overlayOpacity.value = 0;
      checkmarkProgress.value = 0;
      checkmarkScale.value = 0;
      titleScale.value = 0;
      titleOpacity.value = 0;
      statsOpacity.value = 0;
      statsTranslateY.value = 30;
      messageOpacity.value = 0;
      setShowButton(false);
      setShowConfetti(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const checkmarkContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
  }));

  const checkmarkProps = useAnimatedProps(() => ({
    strokeDashoffset: 50 * (1 - checkmarkProgress.value),
  }));

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value }],
    opacity: titleOpacity.value,
  }));

  const statsStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
    transform: [{ translateY: statsTranslateY.value }],
  }));

  const messageStyle = useAnimatedStyle(() => ({
    opacity: messageOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, overlayStyle]}>
      {/* Confetti */}
      <CelebrationConfetti
        active={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />

      {/* Content */}
      <Pressable style={styles.content} onPress={onContinue}>
        {/* Checkmark */}
        <Animated.View style={[styles.checkmarkContainer, checkmarkContainerStyle]}>
          <View style={styles.checkmarkCircle}>
            <Svg width={60} height={60} viewBox="0 0 60 60">
              <AnimatedPath
                d="M15 30 L25 40 L45 20"
                stroke={colors.textOnPrimary}
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                strokeDasharray={50}
                animatedProps={checkmarkProps}
              />
            </Svg>
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.Text
          allowFontScaling={false}
          style={[styles.title, titleStyle]}
        >
          Workout Complete
        </Animated.Text>

        {/* Stats */}
        <Animated.View style={[styles.statsContainer, statsStyle]}>
          <View style={styles.statItem}>
            <Text allowFontScaling={false} style={styles.statValue}>
              {stats.duration}
            </Text>
            <Text allowFontScaling={false} style={styles.statLabel}>
              Duration
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text allowFontScaling={false} style={styles.statValue}>
              {stats.exercises}
            </Text>
            <Text allowFontScaling={false} style={styles.statLabel}>
              Exercises
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text allowFontScaling={false} style={styles.statValue}>
              {stats.sets}
            </Text>
            <Text allowFontScaling={false} style={styles.statLabel}>
              Sets
            </Text>
          </View>
          {formattedVolume && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text allowFontScaling={false} style={styles.statValue}>
                  {formattedVolume}
                </Text>
                <Text allowFontScaling={false} style={styles.statLabel}>
                  lbs
                </Text>
              </View>
            </>
          )}
        </Animated.View>

        {/* PR Summary */}
        {stats.prs && stats.prs.length > 0 && (
          <Animated.View style={[styles.prContainer, statsStyle]}>
            {stats.prs.map((pr, i) => (
              <View key={i} style={styles.prCard}>
                <Ionicons name="trophy" size={16} color={colors.gold} />
                <View style={styles.prInfo}>
                  <Text allowFontScaling={false} style={styles.prExercise}>{pr.exercise}</Text>
                  <View style={styles.prValues}>
                    {pr.previous && (
                      <>
                        <Text allowFontScaling={false} style={styles.prPrevious}>{pr.previous}</Text>
                        <Ionicons name="arrow-forward" size={12} color={colors.textMuted} />
                      </>
                    )}
                    <Text allowFontScaling={false} style={[styles.prNew, { color: colors.gold }]}>{pr.value}</Text>
                  </View>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Motivational message */}
        <Animated.Text
          allowFontScaling={false}
          style={[styles.message, messageStyle]}
        >
          {getMotivationalMessage(stats)}
        </Animated.Text>

        {/* Action buttons */}
        {showButton && (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={styles.buttonContainer}
          >
            <View style={styles.buttonRow}>
              <Pressable style={styles.shareButton} onPress={handleShare}>
                <Ionicons name="share-outline" size={20} color={colors.text} />
                <Text allowFontScaling={false} style={styles.shareButtonText}>Share</Text>
              </Pressable>
              <Pressable style={styles.button} onPress={onContinue}>
                <Text allowFontScaling={false} style={styles.buttonText}>
                  Continue
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.95)",
      zIndex: Z_INDEX.celebration,
      justifyContent: "center",
      alignItems: "center",
    },
    content: {
      alignItems: "center",
      paddingHorizontal: 32,
    },
    checkmarkContainer: {
      marginBottom: 24,
    },
    checkmarkCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      color: colors.text,
      fontFamily: appTheme.fonts.heading,
      fontSize: 32,
      fontWeight: "700",
      marginBottom: 32,
      textAlign: "center",
    },
    statsContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 16,
      paddingVertical: 20,
      paddingHorizontal: 24,
      marginBottom: 24,
    },
    statItem: {
      alignItems: "center",
      flex: 1,
      paddingHorizontal: 4,
    },
    statValue: {
      color: colors.text,
      fontFamily: appTheme.fonts.bodySemiBold,
      fontSize: 24,
      fontVariant: ["tabular-nums" as const],
    },
    statLabel: {
      color: colors.textMuted,
      fontFamily: appTheme.fonts.body,
      fontSize: 12,
      marginTop: 4,
    },
    statDivider: {
      width: 1,
      height: 40,
      backgroundColor: colors.border,
    },
    message: {
      color: colors.textMuted,
      fontFamily: appTheme.fonts.body,
      fontSize: 16,
      textAlign: "center",
      lineHeight: 24,
      marginBottom: 32,
      maxWidth: 280,
    },
    prContainer: {
      width: "100%",
      gap: 8,
      marginBottom: 16,
    },
    prCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: "rgba(255, 215, 0, 0.08)",
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: "rgba(255, 215, 0, 0.2)",
    },
    prInfo: {
      flex: 1,
      gap: 2,
    },
    prExercise: {
      color: colors.text,
      fontFamily: appTheme.fonts.bodySemiBold,
      fontSize: 14,
    },
    prValues: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    prPrevious: {
      color: colors.textMuted,
      fontFamily: appTheme.fonts.body,
      fontSize: 13,
      textDecorationLine: "line-through" as const,
    },
    prNew: {
      fontFamily: appTheme.fonts.bodySemiBold,
      fontSize: 14,
      fontWeight: "700",
    },
    buttonContainer: {
      width: "100%",
    },
    buttonRow: {
      flexDirection: "row",
      gap: 12,
      width: "100%",
    },
    shareButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: colors.border,
    },
    shareButtonText: {
      color: colors.text,
      fontFamily: appTheme.fonts.bodyMedium,
      fontSize: 16,
    },
    button: {
      flex: 1,
      backgroundColor: colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 48,
      borderRadius: 28,
    },
    buttonText: {
      color: colors.textOnPrimary,
      fontFamily: appTheme.fonts.bodySemiBold,
      fontSize: 18,
      textAlign: "center",
    },
  });

export default WorkoutComplete;
