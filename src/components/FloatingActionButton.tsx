import React, { useCallback, useState } from "react";
import { Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/context/ThemeContext";
import { spacing, radius } from "@/src/theme";
import { hapticPress } from "@/src/animations/feedback/haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Action = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

const DURATION = 180;

export function FloatingActionButton() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const progress = useSharedValue(0);

  const actions: Action[] = [
    {
      icon: "scale-outline",
      label: "Log Body Stats",
      onPress: () => router.push("/(app)/log-progress" as any),
    },
    {
      icon: "barbell-outline",
      label: "Start Workout",
      onPress: () => router.push({ pathname: "/(workout)/active", params: { name: "Workout", sourceType: "empty" } }),
    },
    {
      icon: "camera-outline",
      label: "Take Photos",
      onPress: () => router.push("/(app)/take-photos" as any),
    },
  ];

  const toggle = useCallback(() => {
    hapticPress();
    const next = !open;
    setOpen(next);
    progress.value = withTiming(next ? 1 : 0, { duration: DURATION });
  }, [open]);

  const handleAction = useCallback((action: Action) => {
    hapticPress();
    setOpen(false);
    progress.value = withTiming(0, { duration: 120 });
    setTimeout(() => action.onPress(), 130);
  }, []);

  const fabRotation = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 45])}deg` }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.25,
    pointerEvents: progress.value > 0.1 ? "auto" as const : "none" as const,
  }));

  const menuStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    pointerEvents: progress.value > 0.1 ? "auto" as const : "none" as const,
  }));

  const bottomOffset = 90 + insets.bottom;

  return (
    <>
      <AnimatedPressable onPress={toggle} style={[styles.overlay, overlayStyle]} />

      <Animated.View style={[styles.menuWrap, { bottom: bottomOffset + 64 }, menuStyle]}>
        {actions.map((action, i) => (
          <Pressable
            key={i}
            onPress={() => handleAction(action)}
            style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name={action.icon} size={18} color={colors.text} />
            <Text allowFontScaling={false} style={[styles.menuLabel, { color: colors.text }]}>
              {action.label}
            </Text>
          </Pressable>
        ))}
      </Animated.View>

      <AnimatedPressable
        onPress={toggle}
        style={[styles.fab, { bottom: bottomOffset, backgroundColor: colors.text }]}
      >
        <Animated.View style={fabRotation}>
          <Ionicons name="add" size={28} color={colors.bg} />
        </Animated.View>
      </AnimatedPressable>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 100,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    zIndex: 99,
  },
  menuWrap: {
    position: "absolute",
    right: spacing.lg,
    gap: 6,
    zIndex: 101,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  menuLabel: { fontSize: 14, fontWeight: "500" },
});
