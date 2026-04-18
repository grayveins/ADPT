import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { spacing, radius } from "@/src/theme";

type MetricCardProps = {
  title: string;
  subtitle?: string;
  value: string;
  unit?: string;
  onPress?: () => void;
  onAdd?: () => void;
  children?: React.ReactNode;
};

export function MetricCard({ title, subtitle, value, unit, onPress, onAdd, children }: MetricCardProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.bgSecondary }]}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <View>
          <Text allowFontScaling={false} style={[styles.title, { color: colors.text }]}>
            {title}
          </Text>
          {subtitle && (
            <Text allowFontScaling={false} style={[styles.subtitle, { color: colors.textMuted }]}>
              {subtitle}
            </Text>
          )}
        </View>
        {onAdd && (
          <Pressable onPress={onAdd} hitSlop={8}>
            <Ionicons name="add-circle-outline" size={22} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {children}

      <View style={styles.footer}>
        <Text allowFontScaling={false} style={[styles.value, { color: colors.text }]}>
          {value}
        </Text>
        {unit && (
          <Text allowFontScaling={false} style={[styles.unit, { color: colors.textMuted }]}>
            {unit}
          </Text>
        )}
        {onPress && (
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} style={styles.chevron} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.sm,
    minHeight: 100,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: { fontSize: 14, fontWeight: "600" },
  subtitle: { fontSize: 11, marginTop: 1 },
  footer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
  },
  value: { fontSize: 22, fontWeight: "700" },
  unit: { fontSize: 13 },
  chevron: { marginLeft: "auto" },
});
