/**
 * AddExerciseButton
 * "Add Exercise" button at the bottom of the exercise list.
 * Opens exercise library in "add" mode.
 */

import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { hapticPress } from "@/src/animations/feedback/haptics";

export function AddExerciseButton() {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={() => {
        hapticPress();
        router.push({ pathname: "/(workout)/exercises", params: { mode: "add" } });
      }}
      style={[styles.button, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}
    >
      <Ionicons name="add" size={20} color={colors.primary} />
      <Text allowFontScaling={false} style={[styles.text, { color: colors.primary }]}>
        Add Exercise
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 100, // space for scroll bottom
  },
  text: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
