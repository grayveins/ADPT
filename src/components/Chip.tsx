import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";

type ChipProps = {
  label: string;
};

export default function Chip({ label }: ChipProps) {
  const { colors, radius } = useTheme();
  
  return (
    <View style={[styles.chip, { backgroundColor: colors.primary, borderRadius: radius.pill }]}>
      <Text allowFontScaling={false} style={[styles.text, { color: colors.textOnPrimary }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontWeight: "500",
    fontSize: 12,
  },
});
