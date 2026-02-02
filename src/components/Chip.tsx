import { StyleSheet, Text, View } from "react-native";

import { darkColors, theme } from "@/src/theme";

type ChipProps = {
  label: string;
};

export default function Chip({ label }: ChipProps) {
  return (
    <View style={styles.chip}>
      <Text allowFontScaling={false} style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: darkColors.primary,
  },
  text: {
    color: "#000000",
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 12,
  },
});
