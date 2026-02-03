/**
 * OfflineContent - Helpful tips when coach is unavailable
 * 
 * Shows useful fitness tips instead of an error message
 * when the user is offline or the service is unavailable.
 */

import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useTheme } from "@/src/context/ThemeContext";
import { spacing, radius } from "@/src/theme";

// Helpful tips for offline state
const OFFLINE_TIPS = [
  {
    icon: "barbell-outline" as const,
    title: "Form Check",
    desc: "Film your lift from the side for best feedback",
  },
  {
    icon: "nutrition-outline" as const,
    title: "Protein Goal",
    desc: "Aim for 0.8-1g per lb of bodyweight",
  },
  {
    icon: "bed-outline" as const,
    title: "Recovery",
    desc: "7-9 hours sleep for optimal gains",
  },
  {
    icon: "water-outline" as const,
    title: "Hydration",
    desc: "Drink half your bodyweight in oz daily",
  },
];

type OfflineContentProps = {
  onRetry: () => void;
  message?: string;
};

export function OfflineContent({
  onRetry,
  message = "Coach is taking a quick break. Check out these tips in the meantime.",
}: OfflineContentProps) {
  const { colors } = useTheme();

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      style={styles.container}
    >
      {/* Message */}
      <View
        style={[
          styles.messageBubble,
          { backgroundColor: colors.card },
        ]}
      >
        <Text
          allowFontScaling={false}
          style={[styles.messageText, { color: colors.textMuted }]}
        >
          {message}
        </Text>
      </View>

      {/* Tips Grid */}
      <Text
        allowFontScaling={false}
        style={[styles.tipsHeader, { color: colors.text }]}
      >
        Quick Training Tips
      </Text>

      <View style={styles.tipsGrid}>
        {OFFLINE_TIPS.map((tip, index) => (
          <View
            key={index}
            style={[styles.tipCard, { backgroundColor: colors.card }]}
          >
            <View
              style={[
                styles.tipIcon,
                { backgroundColor: colors.primaryMuted },
              ]}
            >
              <Ionicons name={tip.icon} size={20} color={colors.primary} />
            </View>
            <Text
              allowFontScaling={false}
              style={[styles.tipTitle, { color: colors.text }]}
            >
              {tip.title}
            </Text>
            <Text
              allowFontScaling={false}
              style={[styles.tipDesc, { color: colors.textMuted }]}
            >
              {tip.desc}
            </Text>
          </View>
        ))}
      </View>

      {/* Retry Button */}
      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [
          styles.retryButton,
          {
            borderColor: colors.primary,
            backgroundColor: pressed ? colors.primaryMuted : "transparent",
          },
        ]}
      >
        <Ionicons name="refresh" size={16} color={colors.primary} />
        <Text
          allowFontScaling={false}
          style={[styles.retryText, { color: colors.primary }]}
        >
          Try again
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
  },
  messageBubble: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    marginBottom: spacing.base,
    alignSelf: "flex-start",
    maxWidth: "85%",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: "Inter_400Regular",
  },
  tipsHeader: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: spacing.md,
  },
  tipsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm + 2,
  },
  tipCard: {
    width: "48%",
    borderRadius: radius.md,
    padding: spacing.md + 2,
  },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm + 2,
  },
  tipTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: spacing.xs,
  },
  tipDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
  },
  retryText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});

export default OfflineContent;
