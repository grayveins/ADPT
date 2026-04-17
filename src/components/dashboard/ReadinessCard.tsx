/**
 * ReadinessCard
 * Compact dashboard card showing today's readiness score with
 * animated count-up, color-coded level, and expandable factors.
 */

import React, { useState } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { CountUpText } from "@/src/animations/components";
import type { ReadinessData, ReadinessFactor } from "@/src/hooks/useReadinessScore";

// =============================================================================
// TYPES
// =============================================================================

type ReadinessCardProps = {
  readiness: ReadinessData;
  onTap?: () => void;
  onConnectWearable?: () => void;
};

// =============================================================================
// FACTOR ROW
// =============================================================================

const FactorRow: React.FC<{
  factor: ReadinessFactor;
  colors: ReturnType<typeof useTheme>["colors"];
}> = ({ factor, colors }) => {
  const impactColor =
    factor.impact > 0
      ? colors.success
      : factor.impact < 0
        ? colors.error
        : colors.textMuted;

  const impactLabel =
    factor.impact > 0 ? `+${factor.impact}` : `${factor.impact}`;

  return (
    <View style={styles.factorRow}>
      <View style={styles.factorLeft}>
        <Text
          allowFontScaling={false}
          style={[styles.factorName, { color: colors.textSecondary }]}
        >
          {factor.name}
        </Text>
        <Text
          allowFontScaling={false}
          style={[styles.factorDetail, { color: colors.textMuted }]}
        >
          {factor.detail}
        </Text>
      </View>
      <Text
        allowFontScaling={false}
        style={[styles.factorImpact, { color: impactColor }]}
      >
        {impactLabel}
      </Text>
    </View>
  );
};

// =============================================================================
// EMPTY STATE
// =============================================================================

const EmptyState: React.FC<{
  colors: ReturnType<typeof useTheme>["colors"];
  onConnect?: () => void;
}> = ({ colors, onConnect }) => (
  <View style={styles.emptyContainer}>
    <Ionicons name="watch-outline" size={24} color={colors.textMuted} />
    <Text
      allowFontScaling={false}
      style={[styles.emptyText, { color: colors.textSecondary }]}
    >
      Connect a wearable for recovery insights
    </Text>
    {onConnect && (
      <Pressable
        onPress={onConnect}
        style={[styles.connectButton, { backgroundColor: colors.primaryMuted }]}
      >
        <Text
          allowFontScaling={false}
          style={[styles.connectButtonText, { color: colors.primary }]}
        >
          Set Up
        </Text>
      </Pressable>
    )}
  </View>
);

// =============================================================================
// COMPONENT
// =============================================================================

export const ReadinessCard: React.FC<ReadinessCardProps> = ({
  readiness,
  onTap,
  onConnectWearable,
}) => {
  const { colors, radius, shadows } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const handlePress = () => {
    if (onTap) {
      onTap();
    } else {
      setExpanded((prev) => !prev);
    }
  };

  // Show empty state only when loading is done and no factors were computed
  if (!readiness.loading && readiness.factors.length === 0) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.card,
            borderRadius: radius.lg,
            ...shadows.card,
          },
        ]}
      >
        <EmptyState colors={colors} onConnect={onConnectWearable} />
      </View>
    );
  }

  // Score dot color
  const dotColor = readiness.color;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          opacity: pressed ? 0.95 : 1,
          ...shadows.card,
        },
      ]}
    >
      {/* Main row */}
      <View style={styles.mainRow}>
        {/* Color dot */}
        <View style={[styles.dot, { backgroundColor: dotColor }]} />

        {/* Score */}
        <View style={styles.scoreContainer}>
          {readiness.loading ? (
            <Text
              allowFontScaling={false}
              style={[styles.scoreText, { color: colors.textMuted }]}
            >
              --
            </Text>
          ) : (
            <CountUpText
              value={readiness.score}
              duration={800}
              style={[styles.scoreText, { color: dotColor }] as any}
            />
          )}
        </View>

        {/* Label + suggestion */}
        <View style={styles.labelContainer}>
          <Text
            allowFontScaling={false}
            style={[styles.levelLabel, { color: colors.text }]}
            numberOfLines={1}
          >
            {readiness.label}
          </Text>
          <Text
            allowFontScaling={false}
            style={[styles.suggestion, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {readiness.suggestion}
          </Text>
        </View>

        {/* Expand chevron */}
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textMuted}
        />
      </View>

      {/* Expanded factors */}
      {expanded && readiness.factors.length > 0 && (
        <Animated.View
          entering={FadeInDown.duration(200)}
          layout={Layout.springify()}
          style={[styles.factorsContainer, { borderTopColor: colors.border }]}
        >
          {readiness.factors.map((factor, i) => (
            <Animated.View
              key={factor.name}
              entering={FadeInUp.delay(i * 60).duration(200)}
            >
              <FactorRow factor={factor} colors={colors} />
            </Animated.View>
          ))}
        </Animated.View>
      )}
    </Pressable>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    padding: 16,
    overflow: "hidden",
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  scoreContainer: {
    minWidth: 44,
    alignItems: "center",
  },
  scoreText: {
    fontSize: 36,
    fontWeight: "700",
    lineHeight: 40,
  },
  labelContainer: {
    flex: 1,
    gap: 2,
  },
  levelLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  suggestion: {
    fontSize: 13,
    lineHeight: 17,
  },
  // Factors
  factorsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  factorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  factorLeft: {
    flex: 1,
    gap: 1,
  },
  factorName: {
    fontSize: 13,
    fontWeight: "600",
  },
  factorDetail: {
    fontSize: 12,
  },
  factorImpact: {
    fontSize: 14,
    fontWeight: "700",
    minWidth: 32,
    textAlign: "right",
  },
  // Empty state
  emptyContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  emptyText: {
    flex: 1,
    fontSize: 14,
  },
  connectButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default ReadinessCard;
