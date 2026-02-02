import { StyleSheet, Text, type TextProps } from "react-native";

import { typography } from "@/constants/Colors";
import { useThemeColor } from "@/hooks/useThemeColor";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");
  const linkColor = useThemeColor({}, "tint");

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? [styles.link, { color: linkColor }] : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: typography.family,
    fontWeight: typography.weight.regular,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: typography.family,
    fontWeight: typography.weight.semibold,
  },
  title: {
    fontSize: 32,
    lineHeight: 36,
    fontFamily: typography.family,
    fontWeight: typography.weight.bold,
  },
  subtitle: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: typography.family,
    fontWeight: typography.weight.semibold,
  },
  link: {
    lineHeight: 24,
    fontSize: 16,
    fontFamily: typography.family,
    fontWeight: typography.weight.semibold,
  },
});
