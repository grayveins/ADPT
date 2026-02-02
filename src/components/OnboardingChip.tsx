import { Pressable, StyleSheet, Text, View } from "react-native";

import OnboardingIcon, { OnboardingIconName } from "@/src/components/OnboardingIcon";
import { darkColors, theme } from "@/src/theme";

type OnboardingChipProps = {
  label: string;
  icon?: OnboardingIconName;
  selected?: boolean;
  onPress: () => void;
};

export default function OnboardingChip({ label, icon, selected, onPress }: OnboardingChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.chipPressed,
      ]}
    >
      {icon ? (
        <View style={styles.iconWrap}>
          <OnboardingIcon
            name={icon}
            size={16}
            color={selected ? darkColors.primary : darkColors.muted}
          />
        </View>
      ) : null}
      <Text allowFontScaling={false} style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: darkColors.border,
    backgroundColor: darkColors.card,
  },
  chipSelected: {
    borderColor: darkColors.primary,
    backgroundColor: darkColors.selectedBg,
  },
  chipPressed: {
    opacity: 0.9,
  },
  iconWrap: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: darkColors.text,
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 14,
  },
  labelSelected: {
    color: darkColors.text,
  },
});
