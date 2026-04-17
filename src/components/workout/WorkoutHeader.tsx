/**
 * WorkoutHeader
 * Title (tappable to edit), elapsed timer, progress bar, close/done buttons.
 */

import React, { useState } from "react";
import { View, Text, Pressable, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { useActiveWorkout } from "@/src/context/ActiveWorkoutContext";

export function WorkoutHeader() {
  const { colors } = useTheme();
  const { state, actions, progress, formatTime } = useActiveWorkout();
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const isComplete = progress.completedSets === progress.totalSets && progress.totalSets > 0;

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      {/* Top row: close / title / done */}
      <View style={styles.topRow}>
        <Pressable onPress={actions.discardWorkout} style={styles.button}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>

        <View style={styles.center}>
          {isEditingTitle ? (
            <TextInput
              value={state.title}
              onChangeText={actions.updateTitle}
              onBlur={() => setIsEditingTitle(false)}
              onSubmitEditing={() => setIsEditingTitle(false)}
              autoFocus
              style={[styles.titleInput, { color: colors.text, borderBottomColor: colors.primary }]}
              allowFontScaling={false}
              keyboardAppearance="dark"
            />
          ) : (
            <Pressable onPress={() => setIsEditingTitle(true)}>
              <Text allowFontScaling={false} style={[styles.title, { color: colors.text }]}>
                {state.title}
              </Text>
            </Pressable>
          )}
          <View style={styles.timerRow}>
            <Ionicons name="time-outline" size={14} color={colors.primary} />
            <Text allowFontScaling={false} style={[styles.timer, { color: colors.primary }]}>
              {formatTime(state.elapsedSeconds)}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={isComplete ? () => actions.finishWorkout() : actions.discardWorkout}
          style={styles.button}
        >
          <Text allowFontScaling={false} style={[styles.doneText, { color: colors.primary }]}>
            {isComplete ? "Done" : "End"}
          </Text>
        </Pressable>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress.percentage * 100}%`, backgroundColor: colors.primary },
            ]}
          />
        </View>
        <Text allowFontScaling={false} style={[styles.progressText, { color: colors.textMuted }]}>
          {progress.completedSets} / {progress.totalSets} sets
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  button: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    alignItems: "center",
  },
  title: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  titleInput: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    borderBottomWidth: 1,
    paddingBottom: 2,
    textAlign: "center",
    minWidth: 120,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  timer: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  doneText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 6,
  },
});
