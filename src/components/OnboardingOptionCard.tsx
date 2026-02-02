import { Pressable, StyleSheet, Text, View } from "react-native";

import OnboardingIcon, { OnboardingIconName } from "@/src/components/OnboardingIcon";
import { darkColors, theme } from "@/src/theme";

type OnboardingOptionCardProps = {
  title: string;
  icon: OnboardingIconName;
  selected?: boolean;
  onPress: () => void;
};

export default function OnboardingOptionCard({
  title,
  icon,
  selected,
  onPress,
}: OnboardingOptionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
        <OnboardingIcon
          name={icon}
          size={22}
          color={selected ? darkColors.primary : darkColors.muted}
        />
      </View>
      <Text allowFontScaling={false} style={styles.title}>
        {title}
      </Text>
      {selected ? (
        <View style={styles.check}>
          <OnboardingIcon name="check" size={18} color={darkColors.primary} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: darkColors.border,
    backgroundColor: darkColors.card,
    padding: theme.space.m,
    minHeight: 120,
    justifyContent: "space-between",
    position: "relative",
    shadowColor: darkColors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardSelected: {
    borderColor: darkColors.primary,
    backgroundColor: darkColors.selectedBg,
  },
  cardPressed: {
    opacity: 0.9,
  },
  iconWrap: {
    width: 34,
    height: 34,
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
  title: {
    color: darkColors.text,
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  check: {
    position: "absolute",
    top: 10,
    right: 10,
  },
});
