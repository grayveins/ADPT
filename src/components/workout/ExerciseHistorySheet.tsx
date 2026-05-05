/**
 * ExerciseHistorySheet
 *
 * Bottom sheet that surfaces a single exercise's full history while the
 * user is mid-workout. Tap an exercise name in `(workout)/active.tsx`
 * to open it.
 *
 * Layout (top → bottom):
 *   1. Hero numeral — best estimated 1RM, display-size (Cal-AI restraint).
 *   2. Metric toggle — 1RM Est. / Best Set Vol. / Heaviest Weight.
 *   3. Line chart — values over time for the selected metric.
 *   4. Chronological session list — each row = date + sets summary +
 *      coach/self notes preview.
 *   5. Sticky bottom CTA — "Use Last Workout" copies last session's
 *      sets into the current exercise.
 */

import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";

import { useTheme } from "@/src/context/ThemeContext";
import { spacing, radius } from "@/src/theme";
import { hapticPress } from "@/src/animations/feedback/haptics";
import {
  brzycki1RM,
  useExerciseHistory,
  type HistorySession,
} from "@/src/hooks/useExerciseHistory";

type MetricKey = "oneRM" | "volume" | "heaviest";

type Props = {
  visible: boolean;
  userId: string | null;
  exerciseName: string | null;
  onClose: () => void;
  /** Called when the user taps "Use Last Workout". Caller copies the
   *  sets into the active workout state. */
  onUseLastWorkout?: (sets: { weight: number; reps: number }[]) => void;
};

const SCREEN_W = Dimensions.get("window").width;

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "long" });
  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: d.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

function summarizeSets(session: HistorySession): string {
  const working = session.sets.filter((s) => !s.isWarmup);
  if (working.length === 0) return "Warmup only";
  const reps = working.map((s) => s.reps).join("/");
  const maxWeight = Math.max(...working.map((s) => s.weight));
  return `${working.length} set${working.length === 1 ? "" : "s"} · ${reps} @ ${maxWeight} lbs`;
}

function metricForSession(session: HistorySession, metric: MetricKey): number {
  let best = 0;
  for (const set of session.sets) {
    if (set.isWarmup) continue;
    if (metric === "heaviest") {
      if (set.weight > best) best = set.weight;
    } else if (metric === "volume") {
      const v = set.weight * set.reps;
      if (v > best) best = v;
    } else {
      const e = brzycki1RM(set.weight, set.reps) ?? 0;
      if (e > best) best = e;
    }
  }
  return best;
}

export function ExerciseHistorySheet({
  visible,
  userId,
  exerciseName,
  onClose,
  onUseLastWorkout,
}: Props) {
  const { colors } = useTheme();
  const [metric, setMetric] = useState<MetricKey>("oneRM");

  const { loading, error, sessions, stats, refresh } = useExerciseHistory(
    userId,
    visible ? exerciseName : null
  );

  const chartData = useMemo(() => {
    // Oldest → newest for the chart, last 12 sessions max so the X axis
    // stays legible on a phone.
    const ordered = [...sessions].reverse().slice(-12);
    const values = ordered.map((s) => metricForSession(s, metric));
    return {
      labels: ordered.map(() => ""), // hide X labels — date is in the list below
      datasets: [{ data: values.length ? values : [0] }],
    };
  }, [sessions, metric]);

  const lastSession = sessions[0];
  const canUseLast = !!lastSession && lastSession.sets.some((s) => !s.isWarmup);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.bg, borderColor: colors.border },
          ]}
        >
          {/* Drag handle */}
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          {/* Header — exercise name + close */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text
                allowFontScaling={false}
                numberOfLines={1}
                style={[styles.title, { color: colors.text }]}
              >
                {exerciseName ?? "Exercise"}
              </Text>
              <Text
                allowFontScaling={false}
                style={[styles.subtitle, { color: colors.textMuted }]}
              >
                {sessions.length === 0
                  ? "No history yet"
                  : `${sessions.length} session${sessions.length === 1 ? "" : "s"} logged`}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              hitSlop={8}
              style={[styles.closeBtn, { backgroundColor: colors.bgSecondary }]}
            >
              <Ionicons name="close" size={18} color={colors.text} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.text} />
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={[styles.errorTitle, { color: colors.text }]}>
                Couldn&apos;t load history
              </Text>
              <Text
                allowFontScaling={false}
                style={[styles.errorBody, { color: colors.textMuted }]}
              >
                {error}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  hapticPress();
                  refresh();
                }}
                style={[
                  styles.retryBtn,
                  { borderColor: colors.border, backgroundColor: colors.bgSecondary },
                ]}
              >
                <Text style={[styles.retryText, { color: colors.text }]}>
                  Tap to retry
                </Text>
              </Pressable>
            </View>
          ) : sessions.length === 0 ? (
            <View style={styles.center}>
              <Ionicons
                name="barbell-outline"
                size={28}
                color={colors.textMuted}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No sessions yet
              </Text>
              <Text
                allowFontScaling={false}
                style={[styles.emptyBody, { color: colors.textMuted }]}
              >
                Log this exercise once and your history shows up here.
              </Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: spacing.xl + 56 }}
            >
              {/* Hero — display-size 1RM */}
              <View style={styles.heroBlock}>
                <Text
                  allowFontScaling={false}
                  style={[styles.heroNumber, { color: colors.text }]}
                >
                  {stats.best1RM ? `${stats.best1RM}` : "—"}
                </Text>
                <Text
                  allowFontScaling={false}
                  style={[styles.heroCaption, { color: colors.textMuted }]}
                >
                  Estimated 1-rep max · lbs
                </Text>
              </View>

              {/* Metric toggle */}
              <View style={styles.toggleRow}>
                <ToggleChip
                  label="1RM Est."
                  active={metric === "oneRM"}
                  onPress={() => setMetric("oneRM")}
                  colors={colors}
                />
                <ToggleChip
                  label="Best Set Vol."
                  active={metric === "volume"}
                  onPress={() => setMetric("volume")}
                  colors={colors}
                />
                <ToggleChip
                  label="Heaviest"
                  active={metric === "heaviest"}
                  onPress={() => setMetric("heaviest")}
                  colors={colors}
                />
              </View>

              {/* Chart */}
              {chartData.datasets[0].data.length > 1 ? (
                <View style={styles.chartWrap}>
                  <LineChart
                    data={chartData}
                    width={SCREEN_W - spacing.base * 2}
                    height={180}
                    withInnerLines={false}
                    withOuterLines={false}
                    withVerticalLabels={false}
                    withDots
                    withShadow={false}
                    bezier
                    chartConfig={{
                      backgroundColor: colors.bg,
                      backgroundGradientFrom: colors.bg,
                      backgroundGradientTo: colors.bg,
                      decimalPlaces: 0,
                      color: () => colors.text,
                      labelColor: () => colors.textMuted,
                      propsForDots: {
                        r: "3",
                        strokeWidth: "0",
                      },
                    }}
                    style={styles.chart}
                  />
                </View>
              ) : (
                <Text
                  allowFontScaling={false}
                  style={[styles.chartHint, { color: colors.textMuted }]}
                >
                  Log this exercise once more to see a trend chart.
                </Text>
              )}

              {/* Section label */}
              <Text
                allowFontScaling={false}
                style={[styles.sectionLabel, { color: colors.textMuted }]}
              >
                History
              </Text>

              {/* Chronological session list */}
              {sessions.map((session) => (
                <View
                  key={session.sessionId}
                  style={[styles.sessionRow, { borderBottomColor: colors.border }]}
                >
                  <View style={styles.sessionHead}>
                    <Text
                      allowFontScaling={false}
                      style={[styles.sessionDate, { color: colors.text }]}
                    >
                      {formatDate(session.date)}
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={[styles.sessionSummary, { color: colors.textMuted }]}
                    >
                      {summarizeSets(session)}
                    </Text>
                  </View>
                  {session.notes ? (
                    <Text
                      allowFontScaling={false}
                      numberOfLines={2}
                      style={[styles.sessionNotes, { color: colors.textMuted }]}
                    >
                      {session.notes}
                    </Text>
                  ) : null}
                </View>
              ))}
            </ScrollView>
          )}

          {/* Sticky bottom CTA */}
          {!loading && !error && canUseLast && onUseLastWorkout && (
            <View
              style={[styles.ctaBar, { backgroundColor: colors.bg, borderTopColor: colors.border }]}
            >
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  hapticPress();
                  const sets = lastSession.sets
                    .filter((s) => !s.isWarmup)
                    .map((s) => ({ weight: s.weight, reps: s.reps }));
                  onUseLastWorkout(sets);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.ctaBtn,
                  {
                    backgroundColor: colors.text,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text
                  allowFontScaling={false}
                  style={[styles.ctaText, { color: colors.bg }]}
                >
                  Use Last Workout
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function ToggleChip({
  label,
  active,
  onPress,
  colors,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: { text: string; bg: string; border: string; bgSecondary: string; textMuted: string };
}) {
  return (
    <Pressable
      onPress={() => {
        hapticPress();
        onPress();
      }}
      style={[
        styles.toggleChip,
        {
          backgroundColor: active ? colors.text : colors.bgSecondary,
          borderColor: active ? colors.text : colors.border,
        },
      ]}
    >
      <Text
        allowFontScaling={false}
        style={[
          styles.toggleLabel,
          { color: active ? colors.bg : colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
    maxHeight: "88%",
    minHeight: "60%",
  },
  handleWrap: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 4,
  },
  handle: { width: 40, height: 4, borderRadius: 2 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingTop: 4,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  title: { fontSize: 20, fontWeight: "700" },
  subtitle: { fontSize: 12, marginTop: 2 },

  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  center: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  emptyTitle: { fontSize: 16, fontWeight: "600" },
  emptyBody: {
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  errorTitle: { fontSize: 16, fontWeight: "600" },
  errorBody: { fontSize: 13, textAlign: "center", paddingHorizontal: spacing.xl },
  retryBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  retryText: { fontSize: 13, fontWeight: "600" },

  heroBlock: {
    alignItems: "center",
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  heroNumber: {
    fontSize: 64,
    fontWeight: "700",
    letterSpacing: -1.5,
    fontVariant: ["tabular-nums"],
  },
  heroCaption: { fontSize: 12, marginTop: 4 },

  toggleRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
  },
  toggleChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  toggleLabel: { fontSize: 12, fontWeight: "600" },

  chartWrap: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
  },
  chart: { borderRadius: radius.md, marginLeft: -spacing.sm },
  chartHint: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
    fontSize: 12,
    textAlign: "center",
  },

  sectionLabel: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: 8,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },

  sessionRow: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  sessionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: spacing.sm,
  },
  sessionDate: { fontSize: 14, fontWeight: "600" },
  sessionSummary: {
    fontSize: 13,
    fontVariant: ["tabular-nums"],
  },
  sessionNotes: { fontSize: 12, fontStyle: "italic" },

  ctaBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ctaBtn: {
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { fontSize: 15, fontWeight: "700" },
});

export default ExerciseHistorySheet;
