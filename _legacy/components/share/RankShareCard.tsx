/**
 * RankShareCard
 *
 * Standalone SS (Strength Score) rank card for bragging rights.
 * Designed to make people ask "What's your SS?"
 *
 * Large rank display, big-4 lifts, percentile — all in a dark premium card.
 */

import React, { forwardRef } from "react";
import { Image, View, Text, StyleSheet } from "react-native";
import ViewShot from "react-native-view-shot";
import { LinearGradient } from "expo-linear-gradient";

import { getRankByLevel } from "@/lib/ranks";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LiftDisplay = {
  name: string; // "Bench", "Squat", etc.
  weightLbs: number;
};

export type RankShareCardProps = {
  strengthScore: number;
  level: number;
  percentile?: number; // 0-100, e.g. 87 = "Stronger than 87% of lifters"
  lifts: LiftDisplay[];
  /** "story" = 9:16 tall, "square" = 1:1 */
  format?: "story" | "square";
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const RankShareCard = forwardRef<ViewShot, RankShareCardProps>(
  ({ strengthScore, level, percentile, lifts, format = "story" }, ref) => {
    const rank = getRankByLevel(level);
    const isStory = format === "story";

    return (
      <ViewShot
        ref={ref}
        options={{ format: "png", quality: 1 }}
        style={[
          styles.shotContainer,
          isStory ? styles.storySize : styles.squareSize,
        ]}
      >
        {/* Background with rank-colored accent */}
        <LinearGradient
          colors={["#0F0F0F", "#0A0A0A", "#0D0D0D"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Radial glow behind score */}
        <View style={[styles.glow, { backgroundColor: `${rank.color}08` }]} />

        <View style={styles.content}>
          {/* ---- Brand header ---- */}
          <View style={styles.brandRow}>
            <Text allowFontScaling={false} style={styles.brandMark}>
              ADPT
            </Text>
            <View style={[styles.brandDot, { backgroundColor: "#00C9B7" }]} />
          </View>

          {/* ---- Spacer ---- */}
          <View style={{ flex: isStory ? 0.2 : 0.1 }} />

          {/* ---- Main score display ---- */}
          <View style={styles.scoreBlock}>
            <Text
              allowFontScaling={false}
              style={[styles.scoreNumber, { color: rank.color }]}
            >
              {strengthScore}
            </Text>
            <Text
              allowFontScaling={false}
              style={[styles.ssLabel, { color: `${rank.color}66` }]}
            >
              SS
            </Text>
          </View>

          {/* ---- Rank name pill ---- */}
          <View
            style={[
              styles.rankNamePill,
              { backgroundColor: `${rank.color}15`, borderColor: `${rank.color}30` },
            ]}
          >
            <Image source={rank.image} style={{ width: 20, height: 20 }} resizeMode="contain" />
            <Text
              allowFontScaling={false}
              style={[styles.rankNameText, { color: rank.color }]}
            >
              {rank.name}
            </Text>
          </View>

          {/* ---- Percentile ---- */}
          {percentile != null && (
            <Text allowFontScaling={false} style={styles.percentileText}>
              Stronger than {percentile}% of lifters
            </Text>
          )}

          {/* ---- Spacer ---- */}
          <View style={{ flex: isStory ? 0.12 : 0.08 }} />

          {/* ---- Big 4 lifts ---- */}
          {lifts.length > 0 && (
            <View style={styles.liftsContainer}>
              <Text allowFontScaling={false} style={styles.liftsHeader}>
                TOP LIFTS
              </Text>
              <View style={styles.liftsGrid}>
                {lifts.map((lift) => (
                  <View key={lift.name} style={styles.liftItem}>
                    <Text allowFontScaling={false} style={styles.liftWeight}>
                      {lift.weightLbs}
                    </Text>
                    <Text allowFontScaling={false} style={styles.liftUnit}>
                      lbs
                    </Text>
                    <Text allowFontScaling={false} style={styles.liftName}>
                      {lift.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ---- Spacer pushes watermark to bottom ---- */}
          <View style={{ flex: 1 }} />

          {/* ---- Watermark ---- */}
          <Text allowFontScaling={false} style={styles.watermark}>
            adpt.fit
          </Text>
        </View>
      </ViewShot>
    );
  }
);

RankShareCard.displayName = "RankShareCard";
export { RankShareCard };

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  shotContainer: {
    overflow: "hidden",
  },
  storySize: {
    width: 360,
    height: 640,
  },
  squareSize: {
    width: 400,
    height: 400,
  },
  content: {
    flex: 1,
    padding: 32,
    alignItems: "center",
  },

  // Background glow
  glow: {
    position: "absolute",
    top: "20%",
    left: "10%",
    right: "10%",
    height: "30%",
    borderRadius: 200,
  },

  // Brand
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
  },
  brandMark: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: "#F5F5F5",
    letterSpacing: 3,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Score
  scoreBlock: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  scoreNumber: {
    fontFamily: "Inter_700Bold",
    fontSize: 80,
    lineHeight: 88,
    includeFontPadding: false,
  },
  ssLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 24,
    letterSpacing: 1,
    includeFontPadding: false,
  },

  // Rank pill
  rankNamePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 12,
  },
  rankNameText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    textTransform: "uppercase",
    letterSpacing: 2,
  },

  // Percentile
  percentileText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#A3A3A3",
    marginTop: 14,
  },

  // Lifts
  liftsContainer: {
    width: "100%",
  },
  liftsHeader: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: "#525252",
    letterSpacing: 2,
    marginBottom: 12,
    textAlign: "center",
  },
  liftsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  liftItem: {
    alignItems: "center",
  },
  liftWeight: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 22,
    color: "#F5F5F5",
    lineHeight: 26,
  },
  liftUnit: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: "#525252",
    letterSpacing: 0.5,
    marginTop: 1,
  },
  liftName: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#737373",
    marginTop: 4,
  },

  // Watermark
  watermark: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#3D3D3D",
    textAlign: "center",
    letterSpacing: 1.5,
  },
});
