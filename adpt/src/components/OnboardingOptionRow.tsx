import { Pressable, StyleSheet, Text, View } from "react-native";

import OnboardingIcon, { OnboardingIconName } from "@/src/components/OnboardingIcon";
import { darkColors, theme } from "@/src/theme";

type OnboardingOptionRowProps = {
  title: string;
  subtitle?: string;
  icon: OnboardingIconName;
  selected?: boolean;
  onPress: () => void;
};

export default function OnboardingOptionRow({
  title,
  subtitle,
  icon,
  selected,
  onPress,
}: OnboardingOptionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowSelected,
        pressed && styles.rowPressed,
      ]}
    >
      <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
        <OnboardingIcon
          name={icon}
          size={20}
          color={selected ? darkColors.primary : darkColors.muted}
        />
      </View>
      <View style={styles.textCol}>
        <Text allowFontScaling={false} style={styles.title}>
          {title}
        </Text>
        {subtitle ? (
          <Text allowFontScaling={false} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {selected ? (
        <OnboardingIcon name="check" size={18} color={darkColors.primary} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space.m,
    paddingVertical: theme.space.m,
    paddingHorizontal: theme.space.m,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: darkColors.border,
    backgroundColor: darkColors.card,
    shadowColor: darkColors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  rowSelected: {
    borderColor: darkColors.primary,
    backgroundColor: darkColors.selectedBg,
  },
  rowPressed: {
    opacity: 0.9,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: darkColors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: darkColors.cardAlt,
  },
  iconWrapSelected: {
    borderColor: darkColors.primary,
    backgroundColor: darkColors.selectedBg,
  },
  textCol: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: darkColors.text,
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 15,
  },
  subtitle: {
    color: darkColors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
});
