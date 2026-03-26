/**
 * StreakFreezeCard
 * Shown when the user's streak is at risk and a freeze is available.
 * Offers to preserve the streak without working out today.
 */

import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/src/context/ThemeContext";
import { hapticPress } from "@/src/animations/feedback/haptics";
import { spacing, shadows } from "@/src/theme";

type StreakFreezeCardProps = {
  /** Current streak count */
  streakCount: number;
  /** Called when the user taps "Use Freeze" */
  onUseFreeze: () => void;
  /** Called when the user taps "I'll work out" (dismisses the card) */
  onDismiss: () => void;
};

export const StreakFreezeCard: React.FC<StreakFreezeCardProps> = ({
  streakCount,
  onUseFreeze,
  onDismiss,
}) => {
  const { colors } = useTheme();

  const handleUseFreeze = () => {
    hapticPress();
    onUseFreeze();
  };

  const handleDismiss = () => {
    hapticPress();
    onDismiss();
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(50).duration(400)}
      exiting={FadeOutUp.duration(300)}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.gold,
        },
      ]}
    >
      {/* Header row: icon + message */}
      <View style={styles.header}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: "rgba(255, 215, 0, 0.15)" },
          ]}
        >
          <Ionicons name="snow" size={22} color={colors.gold} />
        </View>

        <View style={styles.textWrap}>
          <Text
            allowFontScaling={false}
            style={[styles.title, { color: colors.text }]}
          >
            Use your streak freeze?
          </Text>
          <Text
            allowFontScaling={false}
            style={[styles.subtitle, { color: colors.textSecondary }]}
          >
            Protect your{" "}
            <Text style={{ color: colors.intensity, fontWeight: "600" }}>
              {streakCount}-day streak
            </Text>{" "}
            without working out today.
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          onPress={handleUseFreeze}
          style={({ pressed }) => [
            styles.freezeButton,
            { backgroundColor: colors.gold },
            pressed && styles.buttonPressed,
          ]}
        >
          <Ionicons name="shield-checkmark" size={18} color="#0A0A0A" />
          <Text allowFontScaling={false} style={styles.freezeButtonText}>
            Use Freeze
          </Text>
        </Pressable>

        <Pressable
          onPress={handleDismiss}
          style={({ pressed }) => [
            styles.dismissButton,
            pressed && { opacity: 0.6 },
          ]}
        >
          <Text
            allowFontScaling={false}
            style={[styles.dismissText, { color: colors.textSecondary }]}
          >
            I&apos;ll work out
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: spacing.base,
    borderWidth: 1.5,
    gap: spacing.base,
    ...shadows.card,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  freezeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  freezeButtonText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#0A0A0A",
  },
  dismissButton: {
    height: 48,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  dismissText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});

export default StreakFreezeCard;
