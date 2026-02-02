import { StyleSheet, View } from "react-native";

import { theme } from "@/src/theme";

type DotsProps = {
  count: number;
  index: number;
};

export default function Dots({ count, index }: DotsProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[styles.dot, i === index ? styles.dotActive : styles.dotInactive]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 99,
  },
  dotActive: {
    backgroundColor: theme.colors.primary,
  },
  dotInactive: {
    backgroundColor: theme.colors.border,
  },
});
