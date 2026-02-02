import { StyleSheet, Text, View } from "react-native";

import Card from "@/src/components/Card";
import { theme } from "@/src/theme";

type CoachInsightProps = {
  title?: string;
  insight: string;
  footnote?: string;
};

export default function CoachInsight({
  title = "Coach insight",
  insight,
  footnote,
}: CoachInsightProps) {
  return (
    <Card style={styles.card}>
      <Text allowFontScaling={false} style={styles.title}>
        {title}
      </Text>
      <Text allowFontScaling={false} style={styles.insight}>
        {insight}
      </Text>
      {footnote ? (
        <View style={styles.footnoteRow}>
          <Text allowFontScaling={false} style={styles.footnote}>
            {footnote}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.space.s,
  },
  title: {
    color: theme.colors.muted2,
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 13,
  },
  insight: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 22,
  },
  footnoteRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.space.s,
  },
  footnote: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 12,
  },
});
