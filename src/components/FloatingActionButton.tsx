import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/context/ThemeContext";
import { spacing, radius } from "@/src/theme";
import { hapticPress } from "@/src/animations/feedback/haptics";

type Action = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

export function FloatingActionButton() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

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

  const handleAction = (action: Action) => {
    setOpen(false);
    hapticPress();
    setTimeout(() => action.onPress(), 150);
  };

  return (
    <>
      {/* Menu overlay */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={[styles.menu, { bottom: 90 + insets.bottom }]}>
            {actions.map((action, i) => (
              <Pressable
                key={i}
                onPress={() => handleAction(action)}
                style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Ionicons name={action.icon} size={20} color={colors.text} />
                <Text allowFontScaling={false} style={[styles.menuLabel, { color: colors.text }]}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* FAB */}
      <Pressable
        onPress={() => { hapticPress(); setOpen(!open); }}
        style={[styles.fab, { bottom: 90 + insets.bottom, backgroundColor: colors.text }]}
      >
        <Ionicons name={open ? "close" : "add"} size={28} color={colors.bg} />
      </Pressable>
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
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  menu: {
    position: "absolute",
    right: spacing.lg,
    gap: spacing.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  menuLabel: { fontSize: 15, fontWeight: "500" },
});
