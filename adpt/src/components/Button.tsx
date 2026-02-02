import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";

import { darkColors, theme } from "@/src/theme";

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "outline" | "link";
  style?: ViewStyle;
  disabled?: boolean;
};

export default function Button({
  title,
  onPress,
  variant = "primary",
  style,
  disabled,
}: ButtonProps) {
  if (variant === "link") {
    return (
      <Pressable onPress={disabled ? undefined : onPress} style={[style, disabled && styles.disabled]}>
        <Text allowFontScaling={false} style={styles.link}>{title}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" ? styles.primary : styles.outline,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text
        allowFontScaling={false}
        style={variant === "primary" ? styles.primaryText : styles.outlineText}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: theme.radius.pill,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  primary: {
    backgroundColor: darkColors.primary,
  },
  primaryText: {
    color: "#000000",
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 18,
  },
  outline: {
    borderWidth: 1,
    borderColor: darkColors.border,
    backgroundColor: "transparent",
  },
  outlineText: {
    color: darkColors.text,
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 18,
  },
  link: {
    color: darkColors.muted,
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 14,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});
