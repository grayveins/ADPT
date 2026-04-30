/**
 * ExerciseNotes
 * Per-exercise free-form text notes that persist across sessions.
 * Shows previous session's notes as placeholder.
 */

import React, { useState } from "react";
import { View, TextInput, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { useActiveWorkout } from "@/src/context/ActiveWorkoutContext";

type Props = {
  exerciseId: string;
  notes: string;
  previousNotes?: string;
};

export function ExerciseNotes({ exerciseId, notes, previousNotes }: Props) {
  const { colors } = useTheme();
  const { actions } = useActiveWorkout();
  const [expanded, setExpanded] = useState(!!notes || !!previousNotes);

  if (!expanded) {
    return (
      <Pressable
        onPress={() => setExpanded(true)}
        style={[styles.addButton, { backgroundColor: colors.cardAlt }]}
        hitSlop={4}
      >
        <Ionicons name="create-outline" size={14} color={colors.textMuted} />
        <Text allowFontScaling={false} style={[styles.addText, { color: colors.textMuted }]}>
          Add note
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      {previousNotes && !notes && (
        <Text allowFontScaling={false} style={[styles.previousLabel, { color: colors.textMuted }]}>
          Last session: {previousNotes}
        </Text>
      )}
      <TextInput
        value={notes}
        onChangeText={(text) => actions.updateNotes(exerciseId, text)}
        placeholder={previousNotes || "Add a note (e.g. 'use wide grip')"}
        placeholderTextColor={colors.inputPlaceholder}
        style={[styles.input, { color: colors.text, backgroundColor: colors.cardAlt, borderColor: colors.border }]}
        multiline
        maxLength={200}
        keyboardAppearance="dark"
        allowFontScaling={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  addText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  previousLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    marginBottom: 4,
  },
  input: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 36,
    maxHeight: 80,
  },
});
