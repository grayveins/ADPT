import { StyleSheet, Text, View } from "react-native";

import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import { theme } from "@/src/theme";
import type { PlannedWorkout } from "@/lib/workoutPlan";

type TodayWorkoutCardProps = {
  workout: PlannedWorkout | null;
  onStart: () => void;
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export default function TodayWorkoutCard({ workout, onStart }: TodayWorkoutCardProps) {
  const title = workout?.isRest ? "Recovery day" : workout?.type ?? "Today";
  const meta = workout
    ? `${workout.durationMinutes} min - ${workout.focus}`
    : "Building your plan";
  const phase = workout ? `${capitalize(workout.phase)} week` : null;
  const intensity = workout ? `${capitalize(workout.intensity)} intensity` : null;

  return (
    <Card style={styles.card}>
      <Text allowFontScaling={false} style={styles.title}>
        Today&apos;s workout
      </Text>
      <Text allowFontScaling={false} style={styles.workoutTitle}>
        {title}
      </Text>
      <Text allowFontScaling={false} style={styles.meta}>
        {meta}
      </Text>
      <View style={styles.tagRow}>
        {phase ? (
          <View style={styles.tag}>
            <Text allowFontScaling={false} style={styles.tagText}>
              {phase}
            </Text>
          </View>
        ) : null}
        {intensity ? (
          <View style={styles.tag}>
            <Text allowFontScaling={false} style={styles.tagText}>
              {intensity}
            </Text>
          </View>
        ) : null}
      </View>
      <Button title="Start workout" onPress={onStart} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.space.s,
  },
  title: {
    color: theme.colors.muted2,
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 13,
  },
  workoutTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.heading,
    fontSize: 26,
    lineHeight: 30,
  },
  meta: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.space.s,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  tagText: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 12,
  },
});
