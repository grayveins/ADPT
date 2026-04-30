/**
 * WorkoutHeader
 * Title (tappable to edit), elapsed timer, progress bar, close/done buttons.
 */

import React, { useState } from "react";
import { View, Text, Pressable, TextInput, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { useActiveWorkout } from "@/src/context/ActiveWorkoutContext";

type WorkoutHeaderProps = {
  onFinish?: () => void;
  saving?: boolean;
};

export function WorkoutHeader({ onFinish, saving }: WorkoutHeaderProps) {
  const { colors } = useTheme();
  const { state, actions, progress, formatTime } = useActiveWorkout();
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const isComplete = progress.completedSets === progress.totalSets && progress.totalSets > 0;

  const handleDone = () => {
    if (saving) return;
    if (onFinish) {
      onFinish();
    } else {
      actions.discardWorkout();
    }
  };

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      {/* Top row: close / title / done */}
      <View style={styles.topRow}>
        <Pressable onPress={saving ? undefined : actions.discardWorkout} style={styles.button} disabled={saving}>
          <Ionicons name="close" size={24} color={saving ? colors.textMuted : colors.text} />
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

        <Pressable onPress={handleDone} style={styles.button} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text allowFontScaling={false} style={[styles.doneText, { color: colors.primary }]}>
              {isComplete ? "Done" : "End"}
            </Text>
          )}
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  button: {
    width: 48,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  titleInput: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    borderBottomWidth: 1,
    paddingVertical: 2,
    minWidth: 120,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  timer: {
    fontSize: 13,
    fontWeight: "500",
  },
  doneText: {
    fontSize: 16,
    fontWeight: "600",
  },
  progressContainer: {
    paddingHorizontal: 16,
    gap: 4,
  },
  progressBar: {
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    textAlign: "center",
  },
});
