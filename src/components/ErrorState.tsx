/**
 * ErrorState Component
 * 
 * Reusable error display with retry functionality
 * Used when data fetching fails across the app
 */

import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";

import { useTheme } from "@/src/context/ThemeContext";
import { hapticPress } from "@/src/animations/feedback/haptics";

type ErrorStateProps = {
  message?: string;
  detail?: string;
  onRetry?: () => void;
  compact?: boolean;
};

export function ErrorState({
  message = "Something went wrong",
  detail,
  onRetry,
  compact = false,
}: ErrorStateProps) {
  const { colors } = useTheme();

  const handleRetry = () => {
    hapticPress();
    onRetry?.();
  };

  if (compact) {
    return (
      <Animated.View 
        entering={FadeIn.duration(200)}
        style={[styles.compactContainer, { backgroundColor: colors.card }]}
      >
        <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
        <Text 
          allowFontScaling={false} 
          style={[styles.compactMessage, { color: colors.textMuted }]}
          numberOfLines={1}
        >
          {message}
        </Text>
        {onRetry && (
          <Pressable onPress={handleRetry} hitSlop={8}>
            <Ionicons name="refresh" size={20} color={colors.primary} />
          </Pressable>
        )}
      </Animated.View>
    );
  }

  return (
    <Animated.View 
      entering={FadeIn.duration(300)}
      style={styles.container}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${colors.error}15` }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
      </View>
      
      <Text 
        allowFontScaling={false} 
        style={[styles.message, { color: colors.text }]}
      >
        {message}
      </Text>
      
      {detail && (
        <Text 
          allowFontScaling={false} 
          style={[styles.detail, { color: colors.textMuted }]}
        >
          {detail}
        </Text>
      )}
      
      {onRetry && (
        <Pressable 
          onPress={handleRetry}
          style={({ pressed }) => [
            styles.retryButton,
            { backgroundColor: colors.primary },
            pressed && styles.retryButtonPressed,
          ]}
        >
          <Ionicons name="refresh" size={18} color={colors.textOnPrimary} />
          <Text 
            allowFontScaling={false} 
            style={[styles.retryText, { color: colors.textOnPrimary }]}
          >
            Try Again
          </Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  message: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    marginBottom: 8,
  },
  detail: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonPressed: {
    opacity: 0.85,
  },
  retryText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  // Compact variant
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 20,
    marginVertical: 8,
  },
  compactMessage: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});

export default ErrorState;
