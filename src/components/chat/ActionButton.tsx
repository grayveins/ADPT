/**
 * ActionButton - Primary style action button for coach messages
 * 
 * Used within coach message bubbles to provide quick actions.
 * Filled teal style per design spec.
 */

import React from "react";
import { Pressable, Text, StyleSheet, ViewStyle } from "react-native";
import { router } from "expo-router";

import { useTheme } from "@/src/context/ThemeContext";
import { spacing, radius, components } from "@/src/theme";
import type { Action } from "@/lib/coachContext";

type ActionButtonProps = {
  action: Action;
  onPress?: (action: Action) => void;
  style?: ViewStyle;
};

export function ActionButton({ action, onPress, style }: ActionButtonProps) {
  const { colors } = useTheme();

  const handlePress = () => {
    if (onPress) {
      onPress(action);
      return;
    }

    // Default navigation behavior
    if (action.route) {
      if (action.params) {
        router.push({ pathname: action.route as any, params: action.params });
      } else {
        router.push(action.route as any);
      }
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: pressed ? colors.primaryDark : colors.primary,
        },
        style,
      ]}
    >
      <Text
        allowFontScaling={false}
        style={[styles.label, { color: colors.textOnPrimary }]}
      >
        {action.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: components.touchTarget.comfortable,
    paddingHorizontal: spacing.base,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  label: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
});

export default ActionButton;
