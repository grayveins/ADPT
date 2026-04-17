/**
 * CoachInsightCard
 *
 * Displays how much the AI coach has learned from the user's workout history.
 * Subtle horizontal card with sparkles icon, dynamic message, and workout count badge.
 * Designed to increase perceived switching cost by making AI personalization visible.
 */

import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import type { CoachInsight } from "@/src/hooks/useCoachInsight";

type CoachInsightCardProps = {
  insight: CoachInsight;
  onTap?: () => void;
};

export const CoachInsightCard: React.FC<CoachInsightCardProps> = ({
  insight,
  onTap,
}) => {
  const { colors, radius } = useTheme();

  if (insight.loading) return null;

  const Wrapper = onTap ? Pressable : View;
  const wrapperProps = onTap ? { onPress: onTap } : {};

  return (
    <Wrapper
      {...(wrapperProps as any)}
      style={[
        styles.container,
        {
          backgroundColor: colors.primaryFaint,
          borderLeftColor: colors.primary,
          borderRadius: radius.md,
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="sparkles" size={20} color={colors.primary} />
      </View>

      <View style={styles.content}>
        <Text
          allowFontScaling={false}
          style={[styles.message, { color: colors.text }]}
          numberOfLines={2}
        >
          {insight.coachMessage}
        </Text>
        {insight.daysSinceFirst > 0 && (
          <Text
            allowFontScaling={false}
            style={[styles.subtitle, { color: colors.textMuted }]}
          >
            {insight.daysSinceFirst} days of training data
            {insight.limitationsTracked > 0
              ? ` \u00B7 ${insight.limitationsTracked} limitation${insight.limitationsTracked !== 1 ? "s" : ""} tracked`
              : ""}
          </Text>
        )}
      </View>

      {insight.workoutCount > 0 && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: colors.primaryMuted,
              borderRadius: radius.pill,
            },
          ]}
        >
          <Text
            allowFontScaling={false}
            style={[styles.badgeText, { color: colors.primary }]}
          >
            {insight.workoutCount}
          </Text>
        </View>
      )}

      {onTap && (
        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.textMuted}
          style={styles.chevron}
        />
      )}
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderLeftWidth: 3,
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    gap: 2,
  },
  message: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 16,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 36,
    alignItems: "center",
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  chevron: {
    marginLeft: -4,
  },
});

export default CoachInsightCard;
