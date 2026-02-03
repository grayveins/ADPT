/**
 * Avatar - User avatar component
 * 
 * Displays user's first initial in a circular badge.
 * Used for profile access in headers and drawer.
 * 
 * Usage:
 * ```tsx
 * <Avatar name="Troy" onPress={openDrawer} />
 * <Avatar name="Troy" size={64} /> // Larger variant
 * ```
 */

import React from "react";
import { Pressable, Text, StyleSheet, View, ViewStyle } from "react-native";

import { useTheme } from "@/src/context/ThemeContext";

type AvatarProps = {
  name: string;
  size?: number;
  onPress?: () => void;
  style?: ViewStyle;
};

export function Avatar({ name, size = 40, onPress, style }: AvatarProps) {
  const { colors } = useTheme();

  // Get first letter of name, uppercase
  const initial = name?.charAt(0)?.toUpperCase() || "?";

  // Calculate font size based on avatar size (roughly 45% of container)
  const fontSize = Math.round(size * 0.45);

  const avatarStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  };

  const content = (
    <View style={[avatarStyle, style]}>
      <Text
        allowFontScaling={false}
        style={[
          styles.initial,
          { color: colors.primary, fontSize },
        ]}
      >
        {initial}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          pressed && styles.pressed,
        ]}
        hitSlop={8}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  initial: {
    fontFamily: "Inter_600SemiBold",
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
});

export default Avatar;
