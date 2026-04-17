/**
 * RankUpCelebration
 * Full-screen celebration when the user's XP level crosses a rank threshold.
 * Uses unified rank system from lib/ranks.ts.
 */

import React, { useEffect, useState, useMemo } from "react";
import { Image, StyleSheet, Text, View, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { SPRING_CONFIG, Z_INDEX, PARTICLE_COLORS } from "../constants";
import { Confetti } from "../components/Confetti";
import { hapticCelebration } from "../feedback/haptics";
import { getRankByName, type RankDef } from "@/lib/ranks";

type RankUpCelebrationProps = {
  visible: boolean;
  newRank: string;
  previousRank: string;
  score: number;
  onDismiss: () => void;
};

export const RankUpCelebration: React.FC<RankUpCelebrationProps> = ({
  visible,
  newRank,
  previousRank,
  score,
  onDismiss,
}) => {
  const { colors } = useTheme();
  const newRankDef = getRankByName(newRank);
  const prevRankDef = getRankByName(previousRank);
  const rankColor = newRankDef.color;
  const styles = useMemo(() => createStyles(colors, rankColor), [colors, rankColor]);
  const [showConfetti, setShowConfetti] = useState(false);

  const overlayOpacity = useSharedValue(0);
  const iconScale = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const rankTransitionOpacity = useSharedValue(0);
  const rankTransitionTranslateY = useSharedValue(20);
  const rankNameScale = useSharedValue(0);
  const scoreOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // 0ms: Overlay fades in
      overlayOpacity.value = withTiming(1, { duration: 200 });

      // 200ms: Rank icon scales up with wobble
      iconScale.value = withDelay(
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

      // 500ms: Title "Rank Up!"
      titleOpacity.value = withDelay(500, withTiming(1, { duration: 200 }));

      // 700ms: Gold confetti
      setTimeout(() => {
        setShowConfetti(true);
      }, 700);

      // 800ms: Old rank -> New rank transition
      rankTransitionOpacity.value = withDelay(800, withTiming(1, { duration: 300 }));
      rankTransitionTranslateY.value = withDelay(
        800,
        withSpring(0, SPRING_CONFIG.gentle)
      );

      // 1100ms: Large new rank name with glow
      rankNameScale.value = withDelay(
        1100,
        withSequence(
          withSpring(1.2, SPRING_CONFIG.bouncy),
          withSpring(1, SPRING_CONFIG.snappy)
        )
      );

      // 1400ms: Score
      scoreOpacity.value = withDelay(1400, withTiming(1, { duration: 300 }));

      // 4000ms: Auto dismiss
      setTimeout(() => {
        onDismiss();
      }, 4000);
    } else {
      overlayOpacity.value = 0;
      iconScale.value = 0;
      titleOpacity.value = 0;
      rankTransitionOpacity.value = 0;
      rankTransitionTranslateY.value = 20;
      rankNameScale.value = 0;
      scoreOpacity.value = 0;
      setShowConfetti(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const rankTransitionStyle = useAnimatedStyle(() => ({
    opacity: rankTransitionOpacity.value,
    transform: [{ translateY: rankTransitionTranslateY.value }],
  }));

  const rankNameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rankNameScale.value }],
  }));

  const scoreStyle = useAnimatedStyle(() => ({
    opacity: scoreOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss}>
      <Animated.View style={[styles.overlay, overlayStyle]}>
        {/* Gold confetti */}
        <Confetti
          active={showConfetti}
          colors={[...PARTICLE_COLORS.gold]}
          count={30}
          spread={80}
        />

        <View style={styles.content}>
          {/* Rank badge image */}
          <Animated.View style={[styles.iconContainer, iconStyle]}>
            <View style={styles.iconCircle}>
              <Image
                source={newRankDef.image}
                style={{ width: 52, height: 52 }}
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.Text
            allowFontScaling={false}
            style={[styles.title, titleStyle]}
          >
            Rank Up!
          </Animated.Text>

          {/* Old rank -> New rank */}
          <Animated.View style={[styles.transitionContainer, rankTransitionStyle]}>
            <Text
              allowFontScaling={false}
              style={[styles.oldRank, { color: prevRankDef.color }]}
            >
              {previousRank}
            </Text>
            <View style={styles.arrowContainer}>
              <Ionicons name="arrow-forward" size={24} color={colors.primary} />
            </View>
            <Text
              allowFontScaling={false}
              style={[styles.newRankSmall, { color: rankColor }]}
            >
              {newRank}
            </Text>
          </Animated.View>

          {/* Large new rank name with glow */}
          <Animated.Text
            allowFontScaling={false}
            style={[
              styles.rankName,
              rankNameStyle,
              {
                color: rankColor,
                textShadowColor: `${rankColor}99`,
              },
            ]}
          >
            {newRank}
          </Animated.Text>

          {/* Score */}
          <Animated.Text
            allowFontScaling={false}
            style={[styles.score, scoreStyle]}
          >
            {score} SS
          </Animated.Text>

          {/* Hint */}
          <Animated.Text
            allowFontScaling={false}
            style={[styles.hint, scoreStyle]}
          >
            Tap anywhere to continue
          </Animated.Text>
        </View>
      </Animated.View>
    </Pressable>
  );
};

const createStyles = (
  colors: ReturnType<typeof useTheme>["colors"],
  rankColor: string
) =>
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
    iconContainer: {
      marginBottom: 16,
    },
    iconCircle: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: rankColor,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: rankColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.7,
      shadowRadius: 25,
    },
    title: {
      color: rankColor,
      fontSize: 36,
      fontWeight: "700",
      marginBottom: 20,
      textShadowColor: `${rankColor}80`,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 10,
    },
    transitionContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 24,
      marginBottom: 24,
    },
    oldRank: {
      fontSize: 18,
      fontWeight: "500",
      textDecorationLine: "line-through",
    },
    arrowContainer: {
      paddingHorizontal: 16,
    },
    newRankSmall: {
      fontSize: 18,
      fontWeight: "600",
    },
    rankName: {
      fontSize: 44,
      fontWeight: "800",
      marginBottom: 12,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 20,
    },
    score: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "500",
      marginBottom: 24,
    },
    hint: {
      color: colors.inputPlaceholder,
      fontSize: 14,
      fontWeight: "400",
    },
  });

export default RankUpCelebration;
