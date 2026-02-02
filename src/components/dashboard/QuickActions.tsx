import { Pressable, StyleSheet, Text, View } from "react-native";

import Card from "@/src/components/Card";
import OnboardingIcon, { OnboardingIconName } from "@/src/components/OnboardingIcon";
import { theme } from "@/src/theme";

type QuickActionsProps = {
  onLogWorkout: () => void;
  onViewPlan: () => void;
  onProgress: () => void;
  onCoachChat: () => void;
};

type Action = {
  label: string;
  icon: OnboardingIconName;
  onPress: () => void;
};

export default function QuickActions({
  onLogWorkout,
  onViewPlan,
  onProgress,
  onCoachChat,
}: QuickActionsProps) {
  const actions: Action[] = [
    { label: "Log workout", icon: "dumbbell", onPress: onLogWorkout },
    { label: "View plan", icon: "calendar", onPress: onViewPlan },
    { label: "Progress", icon: "sparkles", onPress: onProgress },
    { label: "Coach chat", icon: "leaf", onPress: onCoachChat },
  ];

  return (
    <View style={styles.wrap}>
      {actions.map((action) => (
        <Pressable
          key={action.label}
          onPress={action.onPress}
          style={({ pressed }) => [styles.actionWrap, pressed && styles.pressed]}
        >
          <Card style={styles.card}>
            <View style={styles.iconWrap}>
              <OnboardingIcon name={action.icon} size={20} color={theme.colors.primary} />
            </View>
            <Text allowFontScaling={false} style={styles.label}>
              {action.label}
            </Text>
          </Card>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: theme.space.m,
  },
  actionWrap: {
    width: "48%",
  },
  card: {
    gap: theme.space.s,
    minHeight: 110,
    justifyContent: "space-between",
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
  label: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.9,
  },
});
