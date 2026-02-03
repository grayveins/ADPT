import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";

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
  const { colors, radius, typography } = useTheme();

  if (variant === "link") {
    return (
      <Pressable onPress={disabled ? undefined : onPress} style={[style, disabled && styles.disabled]}>
        <Text allowFontScaling={false} style={[styles.link, { color: colors.muted }]}>{title}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        { borderRadius: radius.pill },
        variant === "primary" 
          ? { backgroundColor: colors.primary } 
          : { borderWidth: 1, borderColor: colors.border, backgroundColor: "transparent" },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text
        allowFontScaling={false}
        style={[
          styles.text,
          variant === "primary" 
            ? { color: colors.textOnPrimary } 
            : { color: colors.text }
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  text: {
    fontWeight: "600",
    fontSize: 18,
  },
  link: {
    fontWeight: "500",
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
