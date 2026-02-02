/**
 * Dashboard
 * Cal AI style home screen - clean, focused, minimal
 * MTWTFS week row at top, hero rings, today's workout CTA
 */

import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { useFonts } from "expo-font";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import {
  addDays,
  differenceInCalendarDays,
  differenceInCalendarWeeks,
  format,
  parseISO,
  startOfWeek,
} from "date-fns";

import { darkColors, theme } from "@/src/theme";
import { supabase } from "@/lib/supabase";
import {
  generateWeeklyPlan,
  type PlannedWorkout,
  type WorkoutPlanPreferences,
} from "@/lib/workoutPlan";

// Components
import { CalWeekRow } from "@/src/components/dashboard/CalWeekRow";
import { StreakBadge, HeroRings } from "@/src/components/dashboard";
import { AnimatedButton } from "@/src/animations/components";
import { ToastContainer, showToast } from "@/src/animations/celebrations";
import { hapticPress } from "@/src/animations/feedback/haptics";

type SessionRow = {
  id: string;
  title: string | null;
  started_at: string;
  ended_at: string | null;
};

const logTypeOptions = [
  "Full Body",
  "Upper Body",
  "Lower Body",
  "Push",
  "Pull",
  "Legs",
];

export default function DashboardScreen() {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState("there");
  const [preferences, setPreferences] = useState<WorkoutPlanPreferences | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);

  const [logOpen, setLogOpen] = useState(false);
  const [logType, setLogType] = useState("");
  const [logDuration, setLogDuration] = useState("");
  const [logSaving, setLogSaving] = useState(false);

  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);

  useEffect(() => {
    if (!loaded) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/sign-in");
          return;
        }

        setUserId(user.id);

        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, onboarding_data, training_style, goal, updated_at")
          .eq("id", user.id)
          .single();

        const onboarding = (profile?.onboarding_data ?? {}) as Record<string, any>;
        const name = profile?.first_name ?? "there";
        const anchor = profile?.updated_at ? new Date(profile.updated_at) : new Date();
        const weekIndex = Math.max(
          0,
          differenceInCalendarWeeks(new Date(), anchor, { weekStartsOn: 1 })
        );

        setProfileName(name);

        setPreferences({
          goal: onboarding.goal ?? profile?.goal ?? null,
          workoutsPerWeek: onboarding.workoutsPerWeek ?? 3,
          trainingStyle: onboarding.trainingStyle ?? profile?.training_style ?? null,
          splitPreference: onboarding.splitPreference ?? null,
          limitations: onboarding.limitations ?? [],
          activityLevel: onboarding.activityLevel ?? null,
          weekIndex,
        });

        const weekStartIso = weekStart.toISOString();
        const weekEndIso = addDays(weekStart, 7).toISOString();
        const { data: sessionRows, error: sessionError } = await supabase
          .from("workout_sessions")
          .select("id, title, started_at, ended_at")
          .eq("user_id", user.id)
          .gte("started_at", weekStartIso)
          .lt("started_at", weekEndIso)
          .order("started_at", { ascending: false });

        if (sessionError) {
          console.error(sessionError);
        }

        setSessions((sessionRows ?? []) as SessionRow[]);
        
        // Calculate streak
        setStreak(Math.min(sessionRows?.length ?? 0, 12));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [loaded, weekStart]);

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, SessionRow>();
    sessions.forEach((session) => {
      const dateKey = format(parseISO(session.started_at), "yyyy-MM-dd");
      if (!map.has(dateKey)) map.set(dateKey, session);
    });
    return map;
  }, [sessions]);

  const lastSessionDaysAgo = useMemo(() => {
    if (!sessions.length) return null;
    const sorted = [...sessions].sort((a, b) => b.started_at.localeCompare(a.started_at));
    const last = sorted[0];
    if (!last) return null;
    return Math.max(0, differenceInCalendarDays(new Date(), parseISO(last.started_at)));
  }, [sessions]);

  const adherenceScore = useMemo(() => {
    const target = preferences?.workoutsPerWeek ?? 3;
    if (!target) return null;
    const completed = sessionsByDate.size;
    return Math.min(1, completed / target);
  }, [preferences, sessionsByDate]);

  const plan = useMemo<PlannedWorkout[]>(() => {
    if (!preferences) return [];
    return generateWeeklyPlan(
      { ...preferences, adherenceScore, lastSessionDaysAgo },
      weekStart
    );
  }, [preferences, adherenceScore, lastSessionDaysAgo, weekStart]);

  const planByDate = useMemo(() => new Map(plan.map((item) => [item.date, item])), [plan]);
  const todayKey = format(new Date(), "yyyy-MM-dd");
  const todayWorkout = planByDate.get(todayKey) ?? null;

  const target = preferences?.workoutsPerWeek ?? 3;
  const completed = sessionsByDate.size;

  // Calculate week view data for Cal AI style row
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => {
      const date = addDays(weekStart, index);
      const dateKey = format(date, "yyyy-MM-dd");
      const isCompleted = sessionsByDate.has(dateKey);
      const isToday = dateKey === todayKey;
      const plannedWorkout = planByDate.get(dateKey);
      const isPlanned = plannedWorkout && !plannedWorkout.isRest;
      return {
        completed: isCompleted,
        isToday,
        isPlanned: isPlanned ?? false,
      };
    });
  }, [weekStart, sessionsByDate, todayKey, planByDate]);

  const openLogModal = () => {
    hapticPress();
    const defaultType = todayWorkout?.type ?? "Full Body";
    const defaultDuration = todayWorkout?.durationMinutes ?? 45;
    setLogType(defaultType);
    setLogDuration(String(defaultDuration));
    setLogOpen(true);
  };

  const saveQuickLog = async () => {
    if (!userId) return;
    const duration = Number(logDuration);
    if (!logType) {
      Alert.alert("Select a workout type", "Pick a workout style to log.");
      return;
    }
    if (Number.isNaN(duration) || duration < 10 || duration > 120) {
      Alert.alert("Add a duration", "Enter a time between 10 and 120 minutes.");
      return;
    }

    setLogSaving(true);
    const now = new Date().toISOString();
    const title = `${logType} - ${Math.min(120, duration)} min`;

    const { data, error } = await supabase
      .from("workout_sessions")
      .insert({
        user_id: userId,
        started_at: now,
        ended_at: now,
        title,
      })
      .select("id, title, started_at, ended_at")
      .single();

    if (error) {
      Alert.alert("Couldn't save", "Try again in a moment.");
      setLogSaving(false);
      return;
    }

    if (data) {
      setSessions((prev) => [data as SessionRow, ...prev]);
      showToast({ type: "setComplete" });
    }

    setLogSaving(false);
    setLogOpen(false);
  };

  const startTodaysWorkout = () => {
    hapticPress();
    if (todayWorkout && !todayWorkout.isRest) {
      router.push({
        pathname: "/(app)/workout/active",
        params: { type: todayWorkout.type, name: todayWorkout.type }
      });
    } else {
      // Navigate to workout tab if no planned workout
      router.push("/(app)/(tabs)/workout");
    }
  };

  if (!loaded) return null;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={darkColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with logo and streak */}
        <Animated.View 
          entering={FadeInDown.delay(0).duration(400)}
          style={styles.header}
        >
          <Text allowFontScaling={false} style={styles.logo}>
            ADPT
          </Text>
          <StreakBadge count={streak} />
        </Animated.View>

        {/* Cal AI style week row - MTWTFS at top */}
        <Animated.View 
          entering={FadeInDown.delay(50).duration(400)}
          style={styles.weekRowSection}
        >
          <CalWeekRow days={weekDays} />
        </Animated.View>

        {/* Hero Rings */}
        <Animated.View 
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.section}
        >
          <HeroRings 
            compliance={adherenceScore ?? 0} 
            intensity={0.85}
          />
        </Animated.View>

        {/* Today's Workout Card */}
        <Animated.View 
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.section}
        >
          <Pressable 
            onPress={startTodaysWorkout}
            style={({ pressed }) => [
              styles.todayCard,
              pressed && styles.todayCardPressed,
            ]}
          >
            <View style={styles.todayCardContent}>
              <View style={styles.todayIcon}>
                <Ionicons name="barbell" size={24} color={darkColors.primary} />
              </View>
              <View style={styles.todayInfo}>
                <Text allowFontScaling={false} style={styles.todayLabel}>
                  {todayWorkout?.isRest ? "Rest Day" : "Today's Workout"}
                </Text>
                <Text allowFontScaling={false} style={styles.todayTitle}>
                  {todayWorkout?.isRest 
                    ? "Recovery & Mobility" 
                    : todayWorkout?.type || "Start Training"
                  }
                </Text>
                {!todayWorkout?.isRest && todayWorkout && (
                  <Text allowFontScaling={false} style={styles.todayMeta}>
                    {todayWorkout.focus.split(" - ")[0]} · ~{todayWorkout.durationMinutes} min
                  </Text>
                )}
              </View>
              <View style={styles.todayAction}>
                <Text allowFontScaling={false} style={styles.todayActionText}>
                  {todayWorkout?.isRest ? "VIEW" : "START"}
                </Text>
                <Ionicons name="arrow-forward" size={16} color="#000" />
              </View>
            </View>
          </Pressable>
        </Animated.View>

        {/* Weekly Progress Summary */}
        <Animated.View 
          entering={FadeInDown.delay(300).duration(400)}
          style={styles.section}
        >
          <View style={styles.progressCard}>
            <Text allowFontScaling={false} style={styles.progressTitle}>
              This Week
            </Text>
            <View style={styles.progressStats}>
              <View style={styles.progressStat}>
                <Text allowFontScaling={false} style={styles.progressValue}>
                  {completed}
                </Text>
                <Text allowFontScaling={false} style={styles.progressLabel}>
                  / {target} workouts
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${Math.min(100, (completed / target) * 100)}%` }
                  ]} 
                />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Quick Stats Grid */}
        <Animated.View 
          entering={FadeInDown.delay(400).duration(400)}
          style={styles.section}
        >
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text allowFontScaling={false} style={styles.statValue}>
                {completed * 15}
              </Text>
              <Text allowFontScaling={false} style={styles.statLabel}>
                Sets
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text allowFontScaling={false} style={styles.statValue}>
                {completed * 5}
              </Text>
              <Text allowFontScaling={false} style={styles.statLabel}>
                Exercises
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text allowFontScaling={false} style={styles.statValue}>
                {completed * 45}
              </Text>
              <Text allowFontScaling={false} style={styles.statLabel}>
                Minutes
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Coach Tip */}
        {lastSessionDaysAgo !== null && lastSessionDaysAgo >= 2 && (
          <Animated.View 
            entering={FadeInDown.delay(500).duration(400)}
            style={styles.section}
          >
            <View style={styles.coachCard}>
              <View style={styles.coachIcon}>
                <Ionicons name="fitness" size={20} color={darkColors.primary} />
              </View>
              <Text allowFontScaling={false} style={styles.coachText}>
                {lastSessionDaysAgo === 2 
                  ? "Great recovery! Ready to hit it today?"
                  : `It's been ${lastSessionDaysAgo} days. Let's get moving!`
                }
              </Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Floating action button */}
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={openLogModal}
      >
        <Ionicons name="add" size={28} color="#000" />
      </Pressable>

      {/* Log workout modal */}
      <Modal visible={logOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setLogOpen(false)} />
          <Animated.View 
            entering={FadeInDown.springify()}
            style={styles.modalCard}
          >
            <View style={styles.modalHeader}>
              <Text allowFontScaling={false} style={styles.modalTitle}>
                Quick Log
              </Text>
              <Pressable onPress={() => setLogOpen(false)}>
                <Text allowFontScaling={false} style={styles.modalClose}>
                  Done
                </Text>
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              <Text allowFontScaling={false} style={styles.fieldLabel}>
                Workout Type
              </Text>
              <View style={styles.chipRow}>
                {logTypeOptions.map((option) => {
                  const selected = logType === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => {
                        hapticPress();
                        setLogType(option);
                      }}
                      style={[styles.chip, selected && styles.chipSelected]}
                    >
                      <Text
                        allowFontScaling={false}
                        style={[styles.chipText, selected && styles.chipTextSelected]}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text allowFontScaling={false} style={styles.fieldLabel}>
                Duration (min)
              </Text>
              <TextInput
                value={logDuration}
                onChangeText={setLogDuration}
                placeholder="45"
                placeholderTextColor={darkColors.muted2}
                keyboardType="number-pad"
                keyboardAppearance="dark"
                selectionColor={darkColors.primary}
                style={styles.input}
                allowFontScaling={false}
              />

              <AnimatedButton
                title={logSaving ? "Saving..." : "Log Workout"}
                onPress={saveQuickLog}
                disabled={logSaving}
                glow={!logSaving}
              />
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Toast Container */}
      <ToastContainer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.bg,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    color: darkColors.text,
    fontSize: 24,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
  },
  weekRowSection: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 16,
  },
  // Today's Workout Card
  todayCard: {
    backgroundColor: darkColors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: darkColors.primary,
  },
  todayCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  todayCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  todayIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: darkColors.selectedBg,
    alignItems: "center",
    justifyContent: "center",
  },
  todayInfo: {
    flex: 1,
  },
  todayLabel: {
    color: darkColors.muted,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  todayTitle: {
    color: darkColors.text,
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  todayMeta: {
    color: darkColors.muted,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  todayAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: darkColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  todayActionText: {
    color: "#000",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  // Progress Card
  progressCard: {
    backgroundColor: darkColors.card,
    borderRadius: 16,
    padding: 16,
  },
  progressTitle: {
    color: darkColors.text,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  progressStats: {
    gap: 8,
  },
  progressStat: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  progressValue: {
    color: darkColors.primary,
    fontSize: 32,
    fontFamily: "Inter_600SemiBold",
  },
  progressLabel: {
    color: darkColors.muted,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  progressBar: {
    height: 6,
    backgroundColor: darkColors.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: darkColors.primary,
    borderRadius: 3,
  },
  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: darkColors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    color: darkColors.text,
    fontSize: 24,
    fontFamily: "Inter_600SemiBold",
  },
  statLabel: {
    color: darkColors.muted,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 4,
  },
  // Coach Card
  coachCard: {
    backgroundColor: darkColors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  coachIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: darkColors.selectedBg,
    alignItems: "center",
    justifyContent: "center",
  },
  coachText: {
    color: darkColors.muted,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  // FAB
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: darkColors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: darkColors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fabPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    backgroundColor: darkColors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    color: darkColors.text,
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
  },
  modalClose: {
    color: darkColors.primary,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  modalBody: {
    gap: 16,
  },
  fieldLabel: {
    color: darkColors.muted,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: darkColors.cardAlt,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  chipSelected: {
    borderColor: darkColors.primary,
    backgroundColor: darkColors.selectedBg,
  },
  chipText: {
    color: darkColors.text,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  chipTextSelected: {
    color: darkColors.primary,
  },
  input: {
    backgroundColor: darkColors.cardAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: darkColors.border,
    padding: 16,
    color: darkColors.text,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
});
