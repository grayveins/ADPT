/**
 * StrengthScoreRing (SS — Strength Score)
 *
 * Premium ranked display inspired by League of Legends, Valorant, Solo Leveling.
 *
 * Visual layers (outside in):
 * 1. Outer glow — soft rank-colored halo (pulsing at milestones)
 * 2. Progress arc — thick, rank-colored gradient with rounded caps
 * 3. Inner fill — subtle radial tint of rank color
 * 4. Score number — large, rank-colored
 * 5. Rank emblem badge — image + name below score
 *
 * Rank comes from the unified rank system (lib/ranks.ts), determined by XP level.
 * The SS score (0-999) is purely a strength metric — rank is earned through XP.
 *
 * Adapts gracefully from 80px (compact card) to 160px+ (hero display).
 */

import React, { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
} from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import { useTheme } from "@/src/context/ThemeContext";
import { theme } from "@/src/theme";
import { type RankDef, RANKS, getRankByLevel, getRankByName, getNextRank } from "@/lib/ranks";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Re-export for backward compat — consumers that import getRank from here
/** @deprecated Import from '@/lib/ranks' instead */
export function getRank(nameOrLevel: string | number): RankDef {
  if (typeof nameOrLevel === "string") return getRankByName(nameOrLevel);
  return getRankByLevel(nameOrLevel);
}

export { RANKS, getNextRank, getRankByLevel, getRankByName, type RankDef };

type StrengthScoreRingProps = {
  score: number;
  /** XP level — determines the rank displayed. Defaults to 1 (Bronze). */
  level?: number;
  /** Override rank by name (e.g. for onboarding where level isn't known yet) */
  rankOverride?: string;
  size?: number;
  strokeWidth?: number;
  animateDelay?: number;
  hideNextRank?: boolean;
};

export default function StrengthScoreRing({
  score,
  level = 1,
  rankOverride,
  size = 160,
  strokeWidth = 8,
  animateDelay = 0,
  hideNextRank = false,
}: StrengthScoreRingProps) {
  const { colors } = useTheme();

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(score / 999, 1);

  const rank = rankOverride ? getRankByName(rankOverride) : getRankByLevel(level);
  const nextR = rankOverride ? null : getNextRank(level);

  // Adaptive sizing
  const isCompact = size <= 110;
  const isTiny = size < 80;
  const glowSize = size + (isTiny ? 12 : isCompact ? 18 : 28);
  const inset = strokeWidth + 4;

  // Score font scales
  const scoreFontSize = isTiny ? size * 0.3 : isCompact ? size * 0.24 : size * 0.26;
  const ssLabelSize = isTiny ? size * 0.11 : isCompact ? size * 0.09 : size * 0.085;

  // Progress animation
  const animatedProgress = useSharedValue(0);
  useEffect(() => {
    animatedProgress.value = withDelay(
      animateDelay,
      withTiming(progress, { duration: 1400, easing: Easing.out(Easing.cubic) })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, animateDelay]);

  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  // Glow pulse animation
  const glowOpacity = useSharedValue(0.6);
  useEffect(() => {
    glowOpacity.value = withDelay(
      animateDelay + 400,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animateDelay]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Animated.View entering={FadeIn.delay(animateDelay).duration(500)} style={styles.container}>

      {/* Layer 1: Outer glow — rank-colored halo */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize / 2,
            backgroundColor: rank.glow,
          },
          glowStyle,
        ]}
      />

      {/* Layer 2: SVG ring */}
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id="ssArc" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={rank.color} />
            <Stop offset="50%" stopColor={rank.color} stopOpacity={0.85} />
            <Stop offset="100%" stopColor={rank.color} stopOpacity={0.5} />
          </SvgGradient>
          <SvgGradient id="ssBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={colors.border} stopOpacity={0.6} />
            <Stop offset="100%" stopColor={colors.border} stopOpacity={0.2} />
          </SvgGradient>
        </Defs>

        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ssBg)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Progress arc */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ssArc)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={arcProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {/* Layer 3: Inner tint (subtle rank-colored fill) */}
      {!isTiny && (
        <View
          style={[
            styles.innerTint,
            {
              top: inset + 2,
              left: inset + 2,
              right: inset + 2,
              bottom: inset + 2,
              borderRadius: size / 2,
              backgroundColor: rank.glow,
            },
          ]}
        />
      )}

      {/* Layer 4: Center content */}
      <View style={[styles.center, { top: inset, left: inset, right: inset, bottom: inset }]}>
        {/* Score */}
        <View style={styles.scoreRow}>
          <Text
            allowFontScaling={false}
            style={{
              color: rank.color,
              fontFamily: theme.fonts.heading,
              fontSize: scoreFontSize,
              fontWeight: "700",
              includeFontPadding: false,
            }}
          >
            {score}
          </Text>
          <Text
            allowFontScaling={false}
            style={{
              color: `${rank.color}80`,
              fontFamily: theme.fonts.bodySemiBold,
              fontSize: ssLabelSize,
              letterSpacing: 0.5,
              includeFontPadding: false,
            }}
          >
            SS
          </Text>
        </View>

        {/* Rank emblem badge */}
        {!isTiny && (
          <View style={[styles.rankBadge, { backgroundColor: `${rank.color}18` }]}>
            <Image
              source={rank.image}
              style={{
                width: isCompact ? 14 : 18,
                height: isCompact ? 14 : 18,
              }}
              resizeMode="contain"
            />
            <Text
              allowFontScaling={false}
              style={{
                color: rank.color,
                fontFamily: theme.fonts.bodySemiBold,
                fontSize: isCompact ? 8 : 10,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                includeFontPadding: false,
              }}
            >
              {rank.name}
            </Text>
          </View>
        )}
      </View>

      {/* Next rank hint */}
      {!hideNextRank && nextR && (
        <View style={styles.nextRank}>
          <Text allowFontScaling={false} style={[styles.nextRankText, { color: colors.textMuted }]}>
            Level {nextR.minLevel - level > 0 ? nextR.minLevel - level : 1} to{" "}
            <Text style={{ color: nextR.color, fontFamily: theme.fonts.bodySemiBold }}>
              {nextR.name}
            </Text>
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  glow: {
    position: "absolute",
  },
  innerTint: {
    position: "absolute",
  },
  center: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  rankBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  nextRank: {
    marginTop: 12,
  },
  nextRankText: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    textAlign: "center",
  },
});
