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
      onPress: () => router.push("/(app)/(tabs)/workout" as any),
    },
    {
      icon: "camera-outline",
      label: "Take Photos",
      onPress: () => router.push("/(app)/progress-photos" as any),
    },
  ];

  const handleAction = (action: Action) => {
    setOpen(false);
    hapticPress();
    action.onPress();
  };

  return (
    <>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={[styles.menu, { bottom: 155 + insets.bottom }]}>
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
          </View>
        </Pressable>
      </Modal>

      <Pressable
        onPress={() => { hapticPress(); setOpen(true); }}
        style={[styles.fab, { bottom: 90 + insets.bottom, backgroundColor: colors.text }]}
      >
        <Ionicons name="add" size={28} color={colors.bg} />
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 100,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "flex-end",
  },
  menu: {
    position: "absolute",
    right: spacing.lg,
    gap: 6,
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
