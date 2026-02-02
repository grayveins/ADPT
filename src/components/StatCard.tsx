import { StyleSheet, Text, View } from "react-native";

import { darkColors, theme } from "@/src/theme";

type StatCardProps = {
  title: string;
  value: string;
  hint?: string;
};

export default function StatCard({ title, value, hint }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Text allowFontScaling={false} style={styles.title}>{title}</Text>
      <Text allowFontScaling={false} style={styles.value}>{value}</Text>
      {hint ? <Text allowFontScaling={false} style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: darkColors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: darkColors.border,
    padding: theme.space.m,
    gap: 4,
  },
  title: {
    color: darkColors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 12,
  },
  value: {
    color: darkColors.text,
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 16,
  },
  hint: {
    color: darkColors.muted2,
    fontFamily: theme.fonts.body,
    fontSize: 12,
  },
});
