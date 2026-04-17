/**
 * AnalyticsScreen
 *
 * Comprehensive progress analytics — the screen Trainerize wishes it had.
 * Card-based, collapsible sections with View-based charts (no heavy deps).
 *
 * Sections:
 *   A. Body Composition  — Weight trend (12 weeks), weekly avg, delta
 *   B. Strength Progression — Top exercises e1RM trends, exercise selector
 *   C. Training Volume — Weekly volume bars, volume by muscle group
 *   D. Consistency — GitHub heatmap, streak, adherence
 *   E. Check-in Trends — Subjective scores over time
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  subWeeks,
  startOfWeek,
  endOfWeek,
  isSameDay,
  parseISO,
  format,
  differenceInWeeks,
  addDays,
} from "date-fns";

import { useTheme } from "@/src/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { layout, spacing } from "@/src/theme";

import { WeightChart } from "@/src/components/progress/WeightChart";
import { StrengthChartNew } from "@/src/components/progress/StrengthChartNew";
import { VolumeChartNew } from "@/src/components/progress/VolumeChartNew";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SW } = Dimensions.get("window");

// ─── Types ─────────────────────────────────────────────────────────────────────

type BodyStatRow = {
  date: string;
  weight_kg: number | null;
  weight_lbs: number | null;
  waist_cm: number | null;
};

type ExerciseOption = {
  name: string;
  count: number;
};

type CheckInResponse = {
  date: string;
  adherence: number | null;
  energy: number | null;
  sleep: number | null;
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const e1rm = (w: number, r: number) => {
  if (r === 0 || w === 0) return 0;
  if (r === 1) return w;
  return Math.round(w * (1 + r / 30));
};

const fmtVol = (v: number) => {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
  return String(v);
};

const MUSCLE_COLORS: Record<string, string> = {
  Chest: "#3B82F6",
  Back: "#60A5FA",
  Shoulders: "#2563EB",
  Arms: "#7FA07F",
  Legs: "#6B8E6B",
  Core: "#60A5FA",
};

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

// ─── Collapsible Section Card ──────────────────────────────────────────────────

const SectionCard: React.FC<{
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  defaultOpen?: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
  delay?: number;
}> = ({ title, icon, children, defaultOpen = true, colors, delay = 0 }) => {
  const [open, setOpen] = useState(defaultOpen);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(300)}
      style={[styles.sectionCard, { backgroundColor: colors.card }]}
    >
      <Pressable
        onPress={toggle}
        style={styles.sectionHeader}
        hitSlop={4}
      >
        <View style={styles.sectionLeft}>
          <Ionicons name={icon} size={18} color={colors.primary} />
          <Text
            allowFontScaling={false}
            style={[styles.sectionTitle, { color: colors.text }]}
          >
            {title}
          </Text>
        </View>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textMuted}
        />
      </Pressable>
      {open && <View style={styles.sectionBody}>{children}</View>}
    </Animated.View>
  );
};

// ─── Mini Stat ─────────────────────────────────────────────────────────────────

const MiniStat: React.FC<{
  label: string;
  value: string;
  sub?: string;
  colors: ReturnType<typeof useTheme>["colors"];
  accentColor?: string;
}> = ({ label, value, sub, colors, accentColor }) => (
  <View style={styles.miniStat}>
    <Text
      allowFontScaling={false}
      style={[styles.miniStatValue, { color: accentColor || colors.text }]}
    >
      {value}
    </Text>
    <Text
      allowFontScaling={false}
      style={[styles.miniStatLabel, { color: colors.textMuted }]}
    >
      {label}
    </Text>
    {sub && (
      <Text
        allowFontScaling={false}
        style={[styles.miniStatSub, { color: colors.textSecondary }]}
      >
        {sub}
      </Text>
    )}
  </View>
);

// ─── Exercise Pill Selector ────────────────────────────────────────────────────

const ExercisePill: React.FC<{
  name: string;
  selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
}> = ({ name, selected, onPress, colors }) => (
  <Pressable
    onPress={onPress}
    style={[
      styles.exercisePill,
      {
        backgroundColor: selected ? colors.primary : colors.bgTertiary,
        borderColor: selected ? colors.primary : colors.border,
      },
    ]}
  >
    <Text
      allowFontScaling={false}
      style={[
        styles.exercisePillText,
        { color: selected ? colors.textOnPrimary : colors.textSecondary },
      ]}
      numberOfLines={1}
    >
      {name}
    </Text>
  </Pressable>
);

// ─── Heatmap Calendar ──────────────────────────────────────────────────────────

const HeatmapCalendar: React.FC<{
  workoutDates: Date[];
  weeks: number;
  colors: ReturnType<typeof useTheme>["colors"];
}> = ({ workoutDates, weeks, colors }) => {
  const gridData = useMemo(() => {
    const today = new Date();
    const data: { date: Date; count: number; isToday: boolean }[][] = [];

    for (let w = weeks - 1; w >= 0; w--) {
      const weekStart = startOfWeek(subWeeks(today, w), { weekStartsOn: 1 });
      const week: { date: Date; count: number; isToday: boolean }[] = [];

      for (let d = 0; d < 7; d++) {
        const date = addDays(weekStart, d);
        const count = workoutDates.filter((wd) => isSameDay(wd, date)).length;
        const isToday = isSameDay(date, today);
        week.push({ date, count, isToday });
      }
      data.push(week);
    }
    return data;
  }, [workoutDates, weeks]);

  const getColor = (count: number) => {
    if (count === 0) return colors.border;
    if (count === 1) return `${colors.primary}88`;
    return colors.primary;
  };

  return (
    <View style={styles.heatmapContainer}>
      {/* Day labels */}
      <View style={styles.heatmapDayLabels}>
        {DAYS.map((day, i) => (
          <Text
            key={i}
            allowFontScaling={false}
            style={[styles.heatmapDayLabel, { color: colors.textMuted }]}
          >
            {i % 2 === 0 ? day : ""}
          </Text>
        ))}
      </View>

      {/* Grid */}
      <View style={styles.heatmapGrid}>
        {gridData.map((week, wi) => (
          <View key={wi} style={styles.heatmapWeekCol}>
            {week.map((day, di) => (
              <View
                key={di}
                style={[
                  styles.heatmapCell,
                  { backgroundColor: getColor(day.count) },
                  day.isToday && {
                    borderWidth: 1,
                    borderColor: colors.text,
                  },
                ]}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── Subjective Score Line ─────────────────────────────────────────────────────

const SubjectiveScoreLine: React.FC<{
  label: string;
  data: { date: string; value: number }[];
  maxValue: number;
  color: string;
  colors: ReturnType<typeof useTheme>["colors"];
}> = ({ label, data, maxValue, color, colors: themeColors }) => {
  const latest = data.length > 0 ? data[data.length - 1].value : null;
  const avg =
    data.length > 0
      ? (data.reduce((s, d) => s + d.value, 0) / data.length).toFixed(1)
      : null;

  return (
    <View style={styles.scoreLine}>
      <View style={styles.scoreLineHeader}>
        <View style={styles.scoreLineLabelRow}>
          <View style={[styles.scoreLineDot, { backgroundColor: color }]} />
          <Text
            allowFontScaling={false}
            style={[styles.scoreLineLabel, { color: themeColors.text }]}
          >
            {label}
          </Text>
        </View>
        <Text
          allowFontScaling={false}
          style={[styles.scoreLineValue, { color }]}
        >
          {latest !== null ? `${latest}/${maxValue}` : "—"}
        </Text>
      </View>

      {/* Mini sparkline */}
      {data.length > 1 && (
        <View style={styles.sparklineContainer}>
          {data.slice(-10).map((d, i, arr) => {
            const fraction = d.value / maxValue;
            return (
              <View
                key={i}
                style={[
                  styles.sparklineBar,
                  {
                    height: Math.max(2, fraction * 24),
                    backgroundColor: color,
                    opacity: i === arr.length - 1 ? 1 : 0.5,
                  },
                ]}
              />
            );
          })}
        </View>
      )}

      {avg !== null && (
        <Text
          allowFontScaling={false}
          style={[styles.scoreLineAvg, { color: themeColors.textMuted }]}
        >
          Avg: {avg}
        </Text>
      )}
    </View>
  );
};

// =============================================================================
// MAIN SCREEN
// =============================================================================

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // ─── A. Body Composition ─────────────────────────────────────────────────
  const [bodyStats, setBodyStats] = useState<BodyStatRow[]>([]);
  const [bodyLoading, setBodyLoading] = useState(true);

  // ─── B. Strength Progression ─────────────────────────────────────────────
  const [topExercises, setTopExercises] = useState<ExerciseOption[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [strengthData, setStrengthData] = useState<
    { date: string; e1rm: number }[]
  >([]);
  const [strengthLoading, setStrengthLoading] = useState(true);

  // ─── C. Training Volume ──────────────────────────────────────────────────
  const [weeklyVolume, setWeeklyVolume] = useState<
    { week: string; volume: number }[]
  >([]);
  const [muscleVolume, setMuscleVolume] = useState<
    { muscle: string; volume: number; color: string }[]
  >([]);
  const [volumeLoading, setVolumeLoading] = useState(true);
  const [workoutFrequency, setWorkoutFrequency] = useState<
    { week: string; count: number }[]
  >([]);

  // ─── D. Consistency ──────────────────────────────────────────────────────
  const [workoutDates, setWorkoutDates] = useState<Date[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [consistencyLoading, setConsistencyLoading] = useState(true);

  // ─── E. Check-in Trends ──────────────────────────────────────────────────
  const [checkinData, setCheckinData] = useState<CheckInResponse[]>([]);
  const [checkinLoading, setCheckinLoading] = useState(true);

  // ─── Auth ────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (user) setUserId(user.id);
      });
  }, []);

  // =========================================================================
  // A. FETCH BODY COMPOSITION
  // =========================================================================
  useEffect(() => {
    if (!userId) return;
    setBodyLoading(true);

    (async () => {
      try {
        const cutoff = subWeeks(new Date(), 12).toISOString().split("T")[0];
        const { data, error } = await supabase
          .from("body_stats")
          .select("date, weight_kg, weight_lbs, waist_cm")
          .eq("client_id", userId)
          .gte("date", cutoff)
          .order("date", { ascending: true });

        if (!error && data) {
          setBodyStats(data as BodyStatRow[]);
        }
      } catch (err) {
        console.error("Error fetching body stats:", err);
      } finally {
        setBodyLoading(false);
      }
    })();
  }, [userId, refreshKey]);

  // Body composition derived data
  const weightData = useMemo(() => {
    return bodyStats
      .filter((s) => s.weight_lbs != null || s.weight_kg != null)
      .map((s) => ({
        date: s.date,
        weight: s.weight_lbs ?? (s.weight_kg ? Math.round(s.weight_kg * 2.20462 * 10) / 10 : 0),
      }));
  }, [bodyStats]);

  const weeklyAvgWeight = useMemo(() => {
    if (weightData.length === 0) return null;
    // Group by week and average
    const weekMap = new Map<string, number[]>();
    weightData.forEach((d) => {
      const ws = format(
        startOfWeek(parseISO(d.date), { weekStartsOn: 1 }),
        "yyyy-MM-dd"
      );
      const existing = weekMap.get(ws) || [];
      existing.push(d.weight);
      weekMap.set(ws, existing);
    });
    const latest = Array.from(weekMap.entries()).sort((a, b) =>
      b[0].localeCompare(a[0])
    )[0];
    if (!latest) return null;
    const avg = latest[1].reduce((s, v) => s + v, 0) / latest[1].length;
    return Math.round(avg * 10) / 10;
  }, [weightData]);

  const waistData = useMemo(() => {
    return bodyStats
      .filter((s) => s.waist_cm != null)
      .map((s) => ({
        date: s.date,
        value: s.waist_cm!,
      }));
  }, [bodyStats]);

  // =========================================================================
  // B. FETCH STRENGTH PROGRESSION
  // =========================================================================
  useEffect(() => {
    if (!userId) return;
    setStrengthLoading(true);

    (async () => {
      try {
        // Find top 5 most frequently logged exercises
        const { data: exercises, error: exErr } = await supabase
          .from("workout_exercises")
          .select("exercise_name, workout_sessions!inner(user_id)")
          .eq("workout_sessions.user_id", userId);

        if (exErr || !exercises) {
          setStrengthLoading(false);
          return;
        }

        const countMap = new Map<string, number>();
        (exercises as any[]).forEach((ex) => {
          const name = ex.exercise_name;
          countMap.set(name, (countMap.get(name) || 0) + 1);
        });

        const top5 = Array.from(countMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }));

        setTopExercises(top5);
        if (top5.length > 0 && !selectedExercise) {
          setSelectedExercise(top5[0].name);
        }
      } catch (err) {
        console.error("Error fetching top exercises:", err);
      } finally {
        setStrengthLoading(false);
      }
    })();
  }, [userId, refreshKey]);

  // Fetch strength data for selected exercise
  useEffect(() => {
    if (!userId || !selectedExercise) return;

    (async () => {
      try {
        const { data: setsData, error } = await supabase
          .from("workout_sets")
          .select(
            `
            weight_lbs,
            reps,
            workout_exercises!inner(
              exercise_name,
              workout_sessions!inner(user_id, started_at)
            )
          `
          )
          .eq("workout_exercises.workout_sessions.user_id", userId)
          .eq("workout_exercises.exercise_name", selectedExercise)
          .eq("is_warmup", false)
          .order("completed_at", { ascending: true });

        if (error || !setsData) return;

        // Group by session date, find best e1RM per session
        const sessionMap = new Map<string, number>();
        (setsData as any[]).forEach((set) => {
          const sessionDate =
            set.workout_exercises?.workout_sessions?.started_at;
          if (!sessionDate) return;
          const dateKey = format(parseISO(sessionDate), "yyyy-MM-dd");
          const w = set.weight_lbs || 0;
          const r = set.reps || 0;
          const val = e1rm(w, r);
          const existing = sessionMap.get(dateKey) || 0;
          if (val > existing) sessionMap.set(dateKey, val);
        });

        const points = Array.from(sessionMap.entries())
          .map(([date, val]) => ({ date, e1rm: val }))
          .sort((a, b) => a.date.localeCompare(b.date));

        setStrengthData(points);
      } catch (err) {
        console.error("Error fetching strength data:", err);
      }
    })();
  }, [userId, selectedExercise, refreshKey]);

  // =========================================================================
  // C. FETCH TRAINING VOLUME
  // =========================================================================
  useEffect(() => {
    if (!userId) return;
    setVolumeLoading(true);

    (async () => {
      try {
        const cutoff = subWeeks(new Date(), 8).toISOString();

        const { data: setsData, error } = await supabase
          .from("workout_sets")
          .select(
            `
            weight_lbs,
            reps,
            workout_exercises!inner(
              muscle_group,
              workout_sessions!inner(user_id, started_at)
            )
          `
          )
          .eq("workout_exercises.workout_sessions.user_id", userId)
          .gte("workout_exercises.workout_sessions.started_at", cutoff)
          .eq("is_warmup", false);

        if (error || !setsData) {
          setVolumeLoading(false);
          return;
        }

        // Weekly volume
        const weekVolMap = new Map<
          string,
          { volume: number; sessions: Set<string> }
        >();
        const muscleVolMap = new Map<string, number>();

        (setsData as any[]).forEach((set) => {
          const sessionDate =
            set.workout_exercises?.workout_sessions?.started_at;
          if (!sessionDate) return;

          const w = set.weight_lbs || 0;
          const r = set.reps || 0;
          const vol = w * r;
          if (vol === 0) return;

          const ws = startOfWeek(parseISO(sessionDate), { weekStartsOn: 1 });
          const weekKey = format(ws, "yyyy-MM-dd");

          const existing = weekVolMap.get(weekKey);
          if (existing) {
            existing.volume += vol;
            existing.sessions.add(sessionDate);
          } else {
            weekVolMap.set(weekKey, {
              volume: vol,
              sessions: new Set([sessionDate]),
            });
          }

          // Muscle volume
          const muscle = set.workout_exercises?.muscle_group;
          if (muscle) {
            muscleVolMap.set(muscle, (muscleVolMap.get(muscle) || 0) + vol);
          }
        });

        // Convert weekly volume
        const weeklyArr = Array.from(weekVolMap.entries())
          .map(([ws, d]) => ({
            week: format(parseISO(ws), "MMM d"),
            volume: Math.round(d.volume),
          }))
          .sort((a, b) => a.week.localeCompare(b.week));

        // Re-label as W1, W2...
        const reLabeled = weeklyArr.map((d, i) => ({
          ...d,
          week: i === weeklyArr.length - 1 ? "This wk" : `W${i + 1}`,
        }));

        setWeeklyVolume(reLabeled);

        // Workout frequency
        const freqArr = Array.from(weekVolMap.entries())
          .map(([ws, d]) => ({
            week: format(parseISO(ws), "MMM d"),
            count: d.sessions.size,
          }))
          .sort((a, b) => a.week.localeCompare(b.week));
        setWorkoutFrequency(freqArr);

        // Muscle volume breakdown
        const total = Array.from(muscleVolMap.values()).reduce(
          (s, v) => s + v,
          0
        );
        const muscleArr = Array.from(muscleVolMap.entries())
          .map(([muscle, vol]) => ({
            muscle,
            volume: vol,
            color: MUSCLE_COLORS[muscle] || "#3B82F6",
          }))
          .sort((a, b) => b.volume - a.volume);
        setMuscleVolume(muscleArr);
      } catch (err) {
        console.error("Error fetching volume data:", err);
      } finally {
        setVolumeLoading(false);
      }
    })();
  }, [userId, refreshKey]);

  // =========================================================================
  // D. FETCH CONSISTENCY
  // =========================================================================
  useEffect(() => {
    if (!userId) return;
    setConsistencyLoading(true);

    (async () => {
      try {
        const cutoff = subWeeks(new Date(), 13).toISOString();
        const { data: sessions, error } = await supabase
          .from("workout_sessions")
          .select("started_at")
          .eq("user_id", userId)
          .gte("started_at", cutoff)
          .order("started_at", { ascending: true });

        if (error || !sessions) {
          setConsistencyLoading(false);
          return;
        }

        const dates = sessions.map((s) => parseISO(s.started_at));
        setWorkoutDates(dates);

        // Calculate streaks (consecutive days with workouts)
        if (dates.length === 0) {
          setCurrentStreak(0);
          setLongestStreak(0);
          setConsistencyLoading(false);
          return;
        }

        // Unique workout dates
        const uniqueDates = Array.from(
          new Set(dates.map((d) => format(d, "yyyy-MM-dd")))
        ).sort();

        // Calculate weekly streak (how many consecutive weeks had at least one workout)
        const weekSet = new Set<string>();
        dates.forEach((d) => {
          const ws = format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd");
          weekSet.add(ws);
        });

        const allWeeks = Array.from(weekSet).sort();
        let current = 0;
        let longest = 0;
        let streak = 0;

        // Walk backwards from current week
        const today = new Date();
        for (let w = 0; w < 52; w++) {
          const ws = format(
            startOfWeek(subWeeks(today, w), { weekStartsOn: 1 }),
            "yyyy-MM-dd"
          );
          if (weekSet.has(ws)) {
            streak++;
            if (w === 0 || (w === 1 && streak === 2)) {
              current = streak;
            }
          } else {
            if (streak > longest) longest = streak;
            if (w <= 1) current = streak;
            streak = 0;
          }
        }
        if (streak > longest) longest = streak;
        // current streak is count from most recent week backwards
        let cs = 0;
        for (let w = 0; w < 52; w++) {
          const ws = format(
            startOfWeek(subWeeks(today, w), { weekStartsOn: 1 }),
            "yyyy-MM-dd"
          );
          if (weekSet.has(ws)) {
            cs++;
          } else {
            break;
          }
        }

        setCurrentStreak(cs);
        setLongestStreak(longest);
      } catch (err) {
        console.error("Error fetching consistency data:", err);
      } finally {
        setConsistencyLoading(false);
      }
    })();
  }, [userId, refreshKey]);

  // =========================================================================
  // E. FETCH CHECK-IN TRENDS
  // =========================================================================
  useEffect(() => {
    if (!userId) return;
    setCheckinLoading(true);

    (async () => {
      try {
        const { data: checkins, error } = await supabase
          .from("check_ins")
          .select("submitted_at, responses")
          .eq("client_id", userId)
          .eq("status", "submitted")
          .order("submitted_at", { ascending: true })
          .limit(20);

        if (error || !checkins) {
          setCheckinLoading(false);
          return;
        }

        const parsed: CheckInResponse[] = (checkins as any[])
          .filter((c) => c.responses)
          .map((c) => {
            const r =
              typeof c.responses === "string"
                ? JSON.parse(c.responses)
                : c.responses;
            return {
              date: c.submitted_at
                ? format(parseISO(c.submitted_at), "yyyy-MM-dd")
                : "",
              adherence: r.training_adherence ?? r.adherence ?? null,
              energy: r.energy ?? r.energy_level ?? null,
              sleep: r.sleep ?? r.sleep_quality ?? null,
            };
          })
          .filter((d) => d.date);

        setCheckinData(parsed);
      } catch (err) {
        console.error("Error fetching check-in data:", err);
      } finally {
        setCheckinLoading(false);
      }
    })();
  }, [userId, refreshKey]);

  // Check-in derived data
  const adherencePoints = useMemo(
    () =>
      checkinData
        .filter((c) => c.adherence !== null)
        .map((c) => ({ date: c.date, value: c.adherence! })),
    [checkinData]
  );
  const energyPoints = useMemo(
    () =>
      checkinData
        .filter((c) => c.energy !== null)
        .map((c) => ({ date: c.date, value: c.energy! })),
    [checkinData]
  );
  const sleepPoints = useMemo(
    () =>
      checkinData
        .filter((c) => c.sleep !== null)
        .map((c) => ({ date: c.date, value: c.sleep! })),
    [checkinData]
  );

  // =========================================================================
  // REFRESH
  // =========================================================================
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    // Give time for useEffects to fire
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  // =========================================================================
  // Computed: total muscle volume for percentage bars
  // =========================================================================
  const totalMuscleVol = useMemo(
    () => muscleVolume.reduce((s, m) => s + m.volume, 0),
    [muscleVolume]
  );

  // Average workouts per week
  const avgWorkoutsPerWeek = useMemo(() => {
    if (workoutFrequency.length === 0) return 0;
    const total = workoutFrequency.reduce((s, w) => s + w.count, 0);
    return (total / workoutFrequency.length).toFixed(1);
  }, [workoutFrequency]);

  // =========================================================================
  // RENDER
  // =========================================================================

  const isAllLoading =
    bodyLoading && strengthLoading && volumeLoading && consistencyLoading;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.bg }]}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Screen Title */}
        <View style={styles.titleRow}>
          <Text
            allowFontScaling={false}
            style={[styles.screenTitle, { color: colors.text }]}
          >
            Analytics
          </Text>
          <Text
            allowFontScaling={false}
            style={[styles.screenSub, { color: colors.textMuted }]}
          >
            Last 12 weeks
          </Text>
        </View>

        {isAllLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {/* ================================================================ */}
        {/* A. BODY COMPOSITION                                              */}
        {/* ================================================================ */}
        <SectionCard
          title="Body Composition"
          icon="body-outline"
          colors={colors}
          delay={0}
        >
          {bodyLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : weightData.length > 0 ? (
            <>
              {/* Summary stats */}
              <View style={styles.miniStatsRow}>
                <MiniStat
                  label="Current"
                  value={`${weightData[weightData.length - 1].weight}`}
                  sub="lbs"
                  colors={colors}
                />
                {weeklyAvgWeight !== null && (
                  <MiniStat
                    label="Week Avg"
                    value={`${weeklyAvgWeight}`}
                    sub="lbs"
                    colors={colors}
                  />
                )}
                {weightData.length >= 2 && (
                  <MiniStat
                    label="Change"
                    value={`${(weightData[weightData.length - 1].weight - weightData[0].weight) > 0 ? "+" : ""}${(weightData[weightData.length - 1].weight - weightData[0].weight).toFixed(1)}`}
                    sub="lbs"
                    colors={colors}
                    accentColor={
                      weightData[weightData.length - 1].weight -
                        weightData[0].weight <=
                      0
                        ? colors.success
                        : colors.textSecondary
                    }
                  />
                )}
              </View>

              {/* Weight chart */}
              <WeightChart data={weightData} unit="lb" height={200} />

              {/* Waist trend (if available) */}
              {waistData.length > 1 && (
                <View style={styles.waistSection}>
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.subSectionTitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Waist Measurement
                  </Text>
                  <View style={styles.miniStatsRow}>
                    <MiniStat
                      label="Current"
                      value={`${waistData[waistData.length - 1].value}`}
                      sub="cm"
                      colors={colors}
                    />
                    <MiniStat
                      label="Change"
                      value={`${(waistData[waistData.length - 1].value - waistData[0].value) > 0 ? "+" : ""}${(waistData[waistData.length - 1].value - waistData[0].value).toFixed(1)}`}
                      sub="cm"
                      colors={colors}
                      accentColor={
                        waistData[waistData.length - 1].value -
                          waistData[0].value <=
                        0
                          ? colors.success
                          : colors.textSecondary
                      }
                    />
                  </View>
                </View>
              )}
            </>
          ) : (
            <Text
              allowFontScaling={false}
              style={[styles.emptyText, { color: colors.textMuted }]}
            >
              Log your weight in check-ins to see trends
            </Text>
          )}
        </SectionCard>

        {/* ================================================================ */}
        {/* B. STRENGTH PROGRESSION                                          */}
        {/* ================================================================ */}
        <SectionCard
          title="Strength Progression"
          icon="barbell-outline"
          colors={colors}
          delay={60}
        >
          {strengthLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : topExercises.length > 0 ? (
            <>
              {/* Exercise selector pills */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.pillScroll}
                contentContainerStyle={styles.pillScrollContent}
              >
                {topExercises.map((ex) => (
                  <ExercisePill
                    key={ex.name}
                    name={ex.name}
                    selected={selectedExercise === ex.name}
                    onPress={() => setSelectedExercise(ex.name)}
                    colors={colors}
                  />
                ))}
              </ScrollView>

              {/* Strength chart */}
              {strengthData.length > 0 ? (
                <StrengthChartNew
                  exerciseName={selectedExercise || ""}
                  data={strengthData}
                  unit="lb"
                  height={220}
                />
              ) : (
                <Text
                  allowFontScaling={false}
                  style={[styles.emptyText, { color: colors.textMuted }]}
                >
                  No data for {selectedExercise}
                </Text>
              )}
            </>
          ) : (
            <Text
              allowFontScaling={false}
              style={[styles.emptyText, { color: colors.textMuted }]}
            >
              Complete workouts to see strength trends
            </Text>
          )}
        </SectionCard>

        {/* ================================================================ */}
        {/* C. TRAINING VOLUME                                               */}
        {/* ================================================================ */}
        <SectionCard
          title="Training Volume"
          icon="analytics-outline"
          colors={colors}
          delay={120}
        >
          {volumeLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : weeklyVolume.length > 0 ? (
            <>
              {/* Summary row */}
              <View style={styles.miniStatsRow}>
                <MiniStat
                  label="This Week"
                  value={fmtVol(
                    weeklyVolume[weeklyVolume.length - 1]?.volume || 0
                  )}
                  sub="lbs"
                  colors={colors}
                  accentColor={colors.primary}
                />
                <MiniStat
                  label="Avg/Week"
                  value={fmtVol(
                    Math.round(
                      weeklyVolume.reduce((s, w) => s + w.volume, 0) /
                        weeklyVolume.length
                    )
                  )}
                  sub="lbs"
                  colors={colors}
                />
                <MiniStat
                  label="Sessions/wk"
                  value={String(avgWorkoutsPerWeek)}
                  colors={colors}
                />
              </View>

              {/* Weekly volume bar chart */}
              <VolumeChartNew data={weeklyVolume} height={180} />

              {/* Volume by muscle group */}
              {muscleVolume.length > 0 && (
                <View style={styles.muscleSection}>
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.subSectionTitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Volume by Muscle Group
                  </Text>
                  {muscleVolume.slice(0, 6).map((m) => {
                    const pct =
                      totalMuscleVol > 0
                        ? (m.volume / totalMuscleVol) * 100
                        : 0;
                    return (
                      <View key={m.muscle} style={styles.muscleRow}>
                        <View style={styles.muscleLabel}>
                          <View
                            style={[
                              styles.muscleDot,
                              { backgroundColor: m.color },
                            ]}
                          />
                          <Text
                            allowFontScaling={false}
                            style={[
                              styles.muscleName,
                              { color: colors.text },
                            ]}
                            numberOfLines={1}
                          >
                            {m.muscle}
                          </Text>
                        </View>
                        <View style={styles.muscleBarWrap}>
                          <View
                            style={[
                              styles.muscleBarBg,
                              { backgroundColor: colors.bg },
                            ]}
                          >
                            <View
                              style={[
                                styles.muscleBarFill,
                                {
                                  width: `${pct}%`,
                                  backgroundColor: m.color,
                                },
                              ]}
                            />
                          </View>
                          <Text
                            allowFontScaling={false}
                            style={[
                              styles.musclePct,
                              { color: colors.textMuted },
                            ]}
                          >
                            {pct.toFixed(0)}%
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          ) : (
            <Text
              allowFontScaling={false}
              style={[styles.emptyText, { color: colors.textMuted }]}
            >
              Complete workouts to see volume trends
            </Text>
          )}
        </SectionCard>

        {/* ================================================================ */}
        {/* D. CONSISTENCY                                                   */}
        {/* ================================================================ */}
        <SectionCard
          title="Consistency"
          icon="flame-outline"
          colors={colors}
          delay={180}
        >
          {consistencyLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              {/* Streak + stats */}
              <View style={styles.miniStatsRow}>
                <MiniStat
                  label="Current Streak"
                  value={`${currentStreak}`}
                  sub="weeks"
                  colors={colors}
                  accentColor={
                    currentStreak >= 4 ? colors.gold : colors.primary
                  }
                />
                <MiniStat
                  label="Longest Streak"
                  value={`${longestStreak}`}
                  sub="weeks"
                  colors={colors}
                />
                <MiniStat
                  label="Total"
                  value={`${workoutDates.length}`}
                  sub="workouts"
                  colors={colors}
                />
              </View>

              {/* Heatmap */}
              {workoutDates.length > 0 ? (
                <HeatmapCalendar
                  workoutDates={workoutDates}
                  weeks={13}
                  colors={colors}
                />
              ) : (
                <Text
                  allowFontScaling={false}
                  style={[styles.emptyText, { color: colors.textMuted }]}
                >
                  Start working out to build your streak
                </Text>
              )}

              {/* Legend */}
              <View style={styles.heatmapLegend}>
                <Text
                  allowFontScaling={false}
                  style={[styles.legendText, { color: colors.textMuted }]}
                >
                  Less
                </Text>
                <View
                  style={[
                    styles.legendCell,
                    { backgroundColor: colors.border },
                  ]}
                />
                <View
                  style={[
                    styles.legendCell,
                    { backgroundColor: `${colors.primary}88` },
                  ]}
                />
                <View
                  style={[
                    styles.legendCell,
                    { backgroundColor: colors.primary },
                  ]}
                />
                <Text
                  allowFontScaling={false}
                  style={[styles.legendText, { color: colors.textMuted }]}
                >
                  More
                </Text>
              </View>
            </>
          )}
        </SectionCard>

        {/* ================================================================ */}
        {/* E. CHECK-IN TRENDS                                               */}
        {/* ================================================================ */}
        <SectionCard
          title="Check-in Trends"
          icon="clipboard-outline"
          colors={colors}
          delay={240}
          defaultOpen={checkinData.length > 0}
        >
          {checkinLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : checkinData.length > 0 ? (
            <View style={styles.scoreLines}>
              {adherencePoints.length > 0 && (
                <SubjectiveScoreLine
                  label="Training Adherence"
                  data={adherencePoints}
                  maxValue={10}
                  color={colors.primary}
                  colors={colors}
                />
              )}
              {energyPoints.length > 0 && (
                <SubjectiveScoreLine
                  label="Energy"
                  data={energyPoints}
                  maxValue={10}
                  color={colors.gold}
                  colors={colors}
                />
              )}
              {sleepPoints.length > 0 && (
                <SubjectiveScoreLine
                  label="Sleep Quality"
                  data={sleepPoints}
                  maxValue={10}
                  color={colors.info}
                  colors={colors}
                />
              )}
              {adherencePoints.length === 0 &&
                energyPoints.length === 0 &&
                sleepPoints.length === 0 && (
                  <Text
                    allowFontScaling={false}
                    style={[styles.emptyText, { color: colors.textMuted }]}
                  >
                    No subjective data found in check-ins
                  </Text>
                )}
            </View>
          ) : (
            <Text
              allowFontScaling={false}
              style={[styles.emptyText, { color: colors.textMuted }]}
            >
              Complete check-ins to see subjective trends
            </Text>
          )}
        </SectionCard>

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.base,
  },
  loadingContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },

  // Title
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontFamily: "Inter_600SemiBold",
  },
  screenSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },

  // Section card
  sectionCard: {
    borderRadius: 16,
    marginBottom: 14,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  sectionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  sectionBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  // Mini stats
  miniStatsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  miniStat: {
    flex: 1,
    alignItems: "center",
  },
  miniStatValue: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    fontVariant: ["tabular-nums"],
  },
  miniStatLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  miniStatSub: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },

  // Sub-section
  subSectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 16,
    marginBottom: 10,
  },

  // Waist section
  waistSection: {
    marginTop: 8,
  },

  // Exercise pills
  pillScroll: {
    marginBottom: 14,
    marginHorizontal: -4,
  },
  pillScrollContent: {
    gap: 8,
    paddingHorizontal: 4,
  },
  exercisePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  exercisePillText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },

  // Muscle volume
  muscleSection: {
    marginTop: 4,
  },
  muscleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  muscleLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: 96,
  },
  muscleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  muscleName: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  muscleBarWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  muscleBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  muscleBarFill: {
    height: 6,
    borderRadius: 3,
  },
  musclePct: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    fontVariant: ["tabular-nums"],
    width: 30,
    textAlign: "right",
  },

  // Heatmap
  heatmapContainer: {
    flexDirection: "row",
    gap: 4,
  },
  heatmapDayLabels: {
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  heatmapDayLabel: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    width: 12,
    height: 12,
    textAlign: "center",
  },
  heatmapGrid: {
    flexDirection: "row",
    gap: 3,
    flex: 1,
  },
  heatmapWeekCol: {
    gap: 3,
    flex: 1,
  },
  heatmapCell: {
    aspectRatio: 1,
    borderRadius: 3,
    maxHeight: 14,
  },
  heatmapLegend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 10,
  },
  legendText: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },

  // Check-in scores
  scoreLines: {
    gap: 14,
  },
  scoreLine: {
    gap: 6,
  },
  scoreLineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scoreLineLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scoreLineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scoreLineLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  scoreLineValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    fontVariant: ["tabular-nums"],
  },
  sparklineContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
    height: 28,
  },
  sparklineBar: {
    flex: 1,
    borderRadius: 2,
    minWidth: 4,
    maxWidth: 24,
  },
  scoreLineAvg: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },

  // Empty state
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingVertical: 20,
  },
});
