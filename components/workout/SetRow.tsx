import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { AppColors } from "@/constants/Colors";
import { useAppTheme } from "@/hooks/useAppTheme";
import type { WorkoutSet } from "@/lib/workout/types";

type SetRowProps = {
  index: number;
  set: WorkoutSet;
  unit: "lb" | "kg";
  showDivider: boolean;
  volumePercent: number;
  showBar: boolean;
  onChange: (patch: Partial<WorkoutSet>) => void;
  onToggleDone: () => void;
  onDelete: () => void;
  onLongPress: () => void;
};

const parseNumber = (value: string) => {
  if (!value.trim()) return null;
  const next = Number(value.replace(/,/g, "."));
  return Number.isNaN(next) ? null : next;
};

export function SetRow({
  index,
  set,
  unit,
  showDivider,
  volumePercent,
  showBar,
  onChange,
  onToggleDone,
  onDelete,
  onLongPress,
}: SetRowProps) {
  const { colors, radius, spacing, typography } = useAppTheme();
  const styles = createStyles(colors, radius, spacing, typography);

  const weightValue = set.weight == null ? "" : String(set.weight);
  const repsValue = set.reps == null ? "" : String(set.reps);

  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={250}
      style={({ pressed }) => [
        styles.row,
        showDivider && styles.rowDivider,
        set.isWarmup && styles.warmupRow,
        set.isDone && styles.doneRow,
        pressed && styles.rowPressed,
      ]}
    >
      {showBar ? (
        <View
          style={[
            styles.volumeBar,
            {
              width: `${Math.round(volumePercent * 100)}%`,
            },
          ]}
        />
      ) : null}
      {set.isDone ? <View style={styles.doneIndicator} /> : null}

      <View style={styles.indexGroup}>
        <Text style={styles.setIndex}>{index + 1}</Text>
        {set.isWarmup ? (
          <View style={styles.warmupBadge}>
            <Text style={styles.warmupText}>W</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.inputGroup}>
        <TextInput
          value={weightValue}
          onChangeText={(value) => onChange({ weight: parseNumber(value) })}
          placeholder={unit}
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.accent}
          keyboardType="decimal-pad"
          keyboardAppearance="light"
          underlineColorAndroid="transparent"
          textAlign="center"
          style={styles.input}
        />
      </View>

      <View style={styles.inputGroup}>
        <TextInput
          value={repsValue}
          onChangeText={(value) => onChange({ reps: parseNumber(value) })}
          placeholder="reps"
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.accent}
          keyboardType="number-pad"
          keyboardAppearance="light"
          underlineColorAndroid="transparent"
          textAlign="center"
          style={styles.input}
        />
      </View>

      <Pressable onPress={onToggleDone} style={styles.doneToggle}>
        <View style={[styles.doneCircle, set.isDone && styles.doneCircleActive]}>
          {set.isDone ? <Ionicons name="checkmark" size={12} color={colors.textPrimary} /> : null}
        </View>
      </Pressable>

      <Pressable onPress={onDelete} style={styles.deleteButton}>
        <Ionicons name="trash" size={16} color={colors.textSecondary} />
      </Pressable>
    </Pressable>
  );
}

const createStyles = (
  colors: AppColors,
  radius: typeof import("@/constants/Colors").radius,
  spacing: typeof import("@/constants/Colors").spacing,
  typography: typeof import("@/constants/Colors").typography
) =>
  StyleSheet.create({
    row: {
      position: "relative",
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      minHeight: 48,
      borderRadius: radius.md,
      backgroundColor: colors.card,
      overflow: "hidden",
    },
    rowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowPressed: {
      opacity: 0.85,
    },
    warmupRow: {
      backgroundColor: colors.accentMuted,
    },
    doneRow: {
      opacity: 0.72,
    },
    volumeBar: {
      position: "absolute",
      left: 0,
      top: 6,
      bottom: 6,
      borderRadius: radius.md,
      backgroundColor: colors.accent,
      opacity: 0.18,
    },
    doneIndicator: {
      position: "absolute",
      left: 6,
      top: 10,
      bottom: 10,
      width: 2,
      borderRadius: 2,
      backgroundColor: colors.accent,
      opacity: 0.5,
    },
    indexGroup: {
      width: 42,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    setIndex: {
      color: colors.textSecondary,
      fontFamily: typography.family,
      fontWeight: typography.weight.semibold,
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    warmupBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    warmupText: {
      color: colors.textSecondary,
      fontFamily: typography.family,
      fontWeight: typography.weight.semibold,
      fontSize: 10,
      letterSpacing: 0.6,
    },
    inputGroup: {
      flex: 1,
      alignItems: "center",
    },
    input: {
      width: "100%",
      paddingVertical: 6,
      paddingHorizontal: spacing.xs,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      color: colors.textPrimary,
      fontFamily: typography.family,
      fontWeight: typography.weight.medium,
      fontSize: 14,
    },
    doneToggle: {
      marginLeft: spacing.xs,
      marginRight: spacing.xs,
    },
    doneCircle: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    doneCircleActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentMuted,
    },
    deleteButton: {
      paddingLeft: spacing.xs,
    },
  });
