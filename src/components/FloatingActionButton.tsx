import React, { useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  Extrapolation,
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

const SPRING = { damping: 14, stiffness: 160 };

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
    progress.value = withSpring(next ? 1 : 0, SPRING);
  }, [open]);

  const handleAction = useCallback((action: Action) => {
    hapticPress();
    setOpen(false);
    progress.value = withSpring(0, SPRING);
    setTimeout(() => action.onPress(), 200);
  }, []);

  const fabRotation = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 45])}deg` }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    pointerEvents: progress.value > 0.1 ? "auto" as const : "none" as const,
  }));

  const bottomOffset = 90 + insets.bottom;

  return (
    <>
      {/* Backdrop */}
      <AnimatedPressable
        onPress={toggle}
        style={[styles.overlay, overlayStyle]}
      />

      {/* Menu items (staggered) */}
      {actions.map((action, i) => {
        const reverseIdx = actions.length - 1 - i;
        const itemStyle = useAnimatedStyle(() => {
          const translateY = interpolate(
            progress.value,
            [0, 1],
            [20, 0],
            Extrapolation.CLAMP,
          );
          const opacity = withDelay(
            reverseIdx * 30,
            withTiming(progress.value > 0.5 ? 1 : 0, { duration: 150 })
          );
          return { opacity, transform: [{ translateY }] };
        });

        return (
          <AnimatedPressable
            key={i}
            onPress={() => handleAction(action)}
            style={[
              styles.menuItem,
              { backgroundColor: colors.card, borderColor: colors.border, bottom: bottomOffset + 68 + i * 52 },
              itemStyle,
            ]}
          >
            <Ionicons name={action.icon} size={18} color={colors.text} />
            <Text allowFontScaling={false} style={[styles.menuLabel, { color: colors.text }]}>
              {action.label}
            </Text>
          </AnimatedPressable>
        );
      })}

      {/* FAB */}
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 100,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
    zIndex: 99,
  },
  menuItem: {
    position: "absolute",
    right: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    zIndex: 101,
  },
  menuLabel: { fontSize: 14, fontWeight: "500" },
});
