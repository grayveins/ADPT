import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/src/theme";

type DashboardHeaderProps = {
  greeting: string;
  subtitle: string;
};

export default function DashboardHeader({ greeting, subtitle }: DashboardHeaderProps) {
  return (
    <View style={styles.header}>
      <Text allowFontScaling={false} style={styles.greeting}>
        {greeting}
      </Text>
      <Text allowFontScaling={false} style={styles.subtitle}>
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: theme.space.s,
  },
  greeting: {
    color: theme.colors.text,
    fontFamily: theme.fonts.heading,
    fontSize: 32,
    lineHeight: 38,
  },
  subtitle: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: theme.type.body,
    lineHeight: 22,
  },
});
