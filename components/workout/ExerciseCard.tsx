import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { AppColors } from "@/constants/Colors";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { SetRow } from "@/components/workout/SetRow";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatRestTime, formatVolume, getSetVolume, getVolumePercent } from "@/lib/workout/volume";
import type { WorkoutExercise, WorkoutSet } from "@/lib/workout/types";

type ExerciseCardProps = {
  exercise: WorkoutExercise;
  unit: "lb" | "kg";
  onRemove: () => void;
  onAddSet: () => void;
  onDuplicateSet: () => void;
  onSetChange: (setId: string, patch: Partial<WorkoutSet>) => void;
  onSetDelete: (setId: string) => void;
  onSetToggleDone: (setId: string) => void;
  onSetLongPress: (setId: string) => void;
  onCycleRest: () => void;
  restSeconds: number;
  restRemaining?: number | null;
};

export function ExerciseCard({
  exercise,
  unit,
  onRemove,
  onAddSet,
  onDuplicateSet,
  onSetChange,
  onSetDelete,
  onSetToggleDone,
  onSetLongPress,
  onCycleRest,
  restSeconds,
  restRemaining,
}: ExerciseCardProps) {
  const { colors, radius, spacing, typography } = useAppTheme();
  const styles = createStyles(colors, radius, spacing, typography);

  const setCount = exercise.sets.length;
  const volumes = exercise.sets.map((set) => getSetVolume(set));
  const maxVolume = Math.max(...volumes, 0);
  const totalVolume = volumes.reduce((sum, value, index) => {
    if (exercise.sets[index]?.isWarmup) return sum;
    return sum + value;
  }, 0);
  const summary = `Sets ${setCount} | Volume ${formatVolume(Math.round(totalVolume))}`;
  const miniBars = volumes.slice(-5);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{exercise.name}</Text>
          <Text style={styles.summary}>{summary}</Text>
        </View>
        <Pressable onPress={onRemove} style={styles.removeButton}>
          <Ionicons name="trash" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.restRow}>
          <Chip label={`Rest ${restSeconds}s`} onPress={onCycleRest} />
          {restRemaining ? (
            <View style={styles.restPill}>
              <Text style={styles.restText}>{`Rest ${formatRestTime(restRemaining)}`}</Text>
            </View>
          ) : null}
        </View>
        {miniBars.length ? (
          <View style={styles.miniBars}>
            {miniBars.map((value, index) => {
              const height = Math.max(4, Math.round((value / Math.max(maxVolume, 1)) * 24));
              return (
                <View
                  key={`${exercise.id}-bar-${index}`}
                  style={[styles.miniBar, { height }]}
                />
              );
            })}
          </View>
        ) : null}
      </View>

      <View style={styles.setHeader}>
        <Text style={styles.setHeaderText}>SET</Text>
        <Text style={styles.setHeaderText}>{`WEIGHT (${unit})`}</Text>
        <Text style={styles.setHeaderText}>REPS</Text>
        <Text style={styles.setHeaderText}>DONE</Text>
        <Text style={styles.setHeaderText}>DEL</Text>
      </View>

      <View style={styles.setList}>
        {exercise.sets.map((set, index) => {
          const volume = volumes[index] ?? 0;
          const showBar = volume > 0;
          const volumePercent = getVolumePercent(volume, maxVolume);
          const showDivider = index !== exercise.sets.length - 1;
          return (
            <SetRow
              key={set.id}
              index={index}
              set={set}
              unit={unit}
              showDivider={showDivider}
              showBar={showBar}
              volumePercent={volumePercent}
              onChange={(patch) => onSetChange(set.id, patch)}
              onToggleDone={() => onSetToggleDone(set.id)}
              onDelete={() => onSetDelete(set.id)}
              onLongPress={() => onSetLongPress(set.id)}
            />
          );
        })}
      </View>

      <View style={styles.actions}>
        <Pressable onPress={onAddSet} style={styles.actionButton}>
          <Text style={styles.actionText}>Add set</Text>
        </Pressable>
        <Pressable onPress={onDuplicateSet} style={styles.actionButton}>
          <Text style={styles.actionText}>Duplicate last</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const createStyles = (
  colors: AppColors,
  radius: typeof import("@/constants/Colors").radius,
  spacing: typeof import("@/constants/Colors").spacing,
  typography: typeof import("@/constants/Colors").typography
) =>
  StyleSheet.create({
    card: {
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: spacing.sm,
    },
    headerLeft: {
      flex: 1,
      gap: 4,
    },
    title: {
      color: colors.textPrimary,
      fontFamily: typography.family,
      fontWeight: typography.weight.semibold,
      fontSize: 16,
    },
    summary: {
      color: colors.textSecondary,
      fontFamily: typography.family,
      fontWeight: typography.weight.regular,
      fontSize: 12,
    },
    removeButton: {
      paddingLeft: spacing.sm,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.md,
    },
    restRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    restPill: {
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.accentMuted,
      borderWidth: 1,
      borderColor: colors.border,
    },
    restText: {
      color: colors.textPrimary,
      fontFamily: typography.family,
      fontWeight: typography.weight.medium,
      fontSize: 12,
    },
    miniBars: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 6,
    },
    miniBar: {
      width: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.accent,
      opacity: 0.3,
    },
    setHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: spacing.sm,
    },
    setHeaderText: {
      color: colors.textSecondary,
      fontFamily: typography.family,
      fontWeight: typography.weight.medium,
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 1,
      flex: 1,
      textAlign: "center",
    },
    setList: {
      gap: spacing.xs,
    },
    actions: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: spacing.sm,
    },
    actionButton: {
      paddingVertical: spacing.xs,
    },
    actionText: {
      color: colors.accent,
      fontFamily: typography.family,
      fontWeight: typography.weight.semibold,
      fontSize: 13,
    },
  });
