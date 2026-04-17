/**
 * RankBadge
 * Displays the user's rank with colored badge and optional XP progress bar.
 * Compact variant for headers, full variant for progress screens.
 * Uses the unified rank system from lib/ranks.ts.
 */

import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useTheme } from "@/src/context/ThemeContext";
import type { RankDef } from "@/lib/ranks";

type CompactProps = {
  rank: RankDef;
  level: number;
  variant?: "compact";
};

type FullProps = {
  rank: RankDef;
  level: number;
  totalXP: number;
  levelProgress: number;
  xpToNextLevel: number;
  variant: "full";
};

type Props = CompactProps | FullProps;

export function RankBadge(props: Props) {
  const { colors } = useTheme();
  const { rank, level } = props;

  if (props.variant === "full") {
    return (
      <Animated.View entering={FadeIn.duration(300)} style={[styles.fullContainer, { backgroundColor: colors.card }]}>
        <View style={styles.fullTop}>
          <Image source={rank.image} style={styles.rankImage} resizeMode="contain" />
          <View style={styles.fullInfo}>
            <View style={styles.nameRow}>
              <Text allowFontScaling={false} style={[styles.rankName, { color: rank.color }]}>
                {rank.name}
              </Text>
              <Text allowFontScaling={false} style={[styles.levelText, { color: colors.text }]}>
                Level {level}
              </Text>
            </View>
            {/* XP Progress bar */}
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View
                style={[styles.progressFill, { width: `${props.levelProgress * 100}%`, backgroundColor: rank.color }]}
              />
            </View>
            <Text allowFontScaling={false} style={[styles.xpText, { color: colors.textMuted }]}>
              {props.xpToNextLevel.toLocaleString()} XP to next level
            </Text>
          </View>
        </View>

        <Text allowFontScaling={false} style={[styles.totalXP, { color: colors.textMuted }]}>
          {props.totalXP.toLocaleString()} total XP
        </Text>
      </Animated.View>
    );
  }

  // Compact variant — pill with rank name + level
  return (
    <View style={[styles.compactPill, { backgroundColor: rank.glow }]}>
      <Text allowFontScaling={false} style={[styles.compactText, { color: rank.color }]}>
        {rank.name} {level}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Full variant
  fullContainer: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  fullTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  rankImage: {
    width: 44,
    height: 44,
  },
  fullInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  rankName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  levelText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  xpText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  totalXP: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },

  // Compact variant
  compactPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  compactText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
});
