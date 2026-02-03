/**
 * OfflineIndicator - Shows when user is offline
 * 
 * A subtle banner that appears at the top of the screen
 * when the device is offline. Only shown when relevant
 * (e.g., when trying to do something that requires network).
 */

import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/src/context/ThemeContext";
import { spacing, radius } from "@/src/theme";

type OfflineIndicatorProps = {
  visible: boolean;
  onRetry?: () => void;
  message?: string;
};

export function OfflineIndicator({
  visible,
  onRetry,
  message = "You're offline",
}: OfflineIndicatorProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      exiting={FadeOutUp.duration(200)}
      style={[
        styles.container,
        {
          backgroundColor: colors.warningMuted,
          top: insets.top + spacing.sm,
        },
      ]}
    >
      <Ionicons name="cloud-offline-outline" size={16} color={colors.warning} />
      <Text
        allowFontScaling={false}
        style={[styles.text, { color: colors.warning }]}
      >
        {message}
      </Text>
      {onRetry && (
        <Pressable onPress={onRetry} style={styles.retryButton} hitSlop={8}>
          <Text
            allowFontScaling={false}
            style={[styles.retryText, { color: colors.warning }]}
          >
            Retry
          </Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    zIndex: 100,
  },
  text: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  retryButton: {
    marginLeft: spacing.sm,
  },
  retryText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textDecorationLine: "underline",
  },
});

export default OfflineIndicator;
