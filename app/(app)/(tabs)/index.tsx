import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  addDays,
  format,
  isSameDay,
  startOfWeek,
} from "date-fns";
import { SafeAreaView } from "react-native-safe-area-context";

import { useNavigation, type DrawerNavigationProp } from "@react-navigation/native";
import { useTheme } from "@/src/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { spacing, radius } from "@/src/theme";
import { useStreak } from "@/src/hooks/useStreak";
import { useBodyStats } from "@/src/hooks/useBodyStats";
import { useClientMacros } from "@/src/hooks/useClientMacros";
import { useLatestPhotos } from "@/src/hooks/useLatestPhotos";
import { MetricCard } from "@/src/components/progress/MetricCard";
import { hapticPress } from "@/src/animations/feedback/haptics";

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export default function HomeScreen() {
  const { colors } = useTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("there");
  const [refreshing, setRefreshing] = useState(false);
  const [todayWorkout, setTodayWorkout] = useState<any>(null);

  const { currentStreak } = useStreak(userId);
  const { data: bodyStats, refresh: refreshStats } = useBodyStats(userId);
  const { data: macros } = useClientMacros(userId);
  const { photos } = useLatestPhotos(userId);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/sign-in"); return; }
    setUserId(user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name")
      .eq("id", user.id)
      .single();
    if (profile?.first_name) setProfileName(profile.first_name);

    // Check for assigned workout today
    const { data: program } = await supabase
      .from("coaching_programs")
      .select("id, name, program_phases(id, status, phase_workouts(id, day_number, name, exercises))")
      .eq("client_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (program) {
      const sortedPhases = ((program as any).program_phases ?? [])
        .sort((a: any, b: any) => (a.phase_number ?? 0) - (b.phase_number ?? 0));
      const activePhase = sortedPhases.find((p: any) => p.status === "active") || sortedPhases[0];
      const dayOfWeek = new Date().getDay() || 7;
      const todayW = activePhase?.phase_workouts?.find((w: any) => w.day_number === dayOfWeek);
      setTodayWorkout(todayW || null);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useFocusEffect(useCallback(() => { refreshStats(); }, [refreshStats]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    await refreshStats();
    setRefreshing(false);
  }, [fetchData, refreshStats]);

  const greeting = `${getGreeting()}, ${profileName}`;

  const startWorkout = () => {
    hapticPress();
    if (todayWorkout) {
      router.push({
        pathname: "/(workout)/active",
        params: {
          name: todayWorkout.name,
          exercises: JSON.stringify(todayWorkout.exercises || []),
          sourceType: "program",
        },
      });
    } else {
      router.push("/(app)/(tabs)/workout");
    }
  };

  const weightLbs = bodyStats?.weight_kg
    ? (bodyStats.weight_kg * 2.205).toFixed(1)
    : "—";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text allowFontScaling={false} style={[styles.greeting, { color: colors.text }]}>
            {greeting}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <AvatarButton name={profileName} colors={colors} />
        </View>
      </View>

      {/* Week strip */}
      <WeekStrip />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
        }
      >
        {/* Today's Workout */}
        <Pressable
          onPress={startWorkout}
          style={[styles.workoutCard, { backgroundColor: colors.bgSecondary }]}
        >
          <Text allowFontScaling={false} style={[styles.workoutLabel, { color: colors.textMuted }]}>
            {todayWorkout ? "TODAY" : "WORKOUT"}
          </Text>
          <Text allowFontScaling={false} style={[styles.workoutName, { color: colors.text }]}>
            {todayWorkout ? todayWorkout.name : "Start a Workout"}
          </Text>
          {todayWorkout?.exercises?.length > 0 && (
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              style={[styles.workoutExercises, { color: colors.textMuted }]}
            >
              {(todayWorkout.exercises as any[]).map((e: any) => e.name || e.exercise_name).join(", ")}
            </Text>
          )}
          <View style={styles.workoutStart}>
            <Text allowFontScaling={false} style={[styles.workoutStartText, { color: colors.text }]}>
              {todayWorkout ? "Start Workout" : "Choose Workout"}
            </Text>
            <Ionicons name="chevron-forward" size={14} color={colors.text} />
          </View>
        </Pressable>

        {/* Body Metrics */}
        <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text }]}>
          Body Metrics
        </Text>
        <View style={styles.cardRow}>
          <MetricCard
            title="Scale Weight"
            subtitle={bodyStats?.date ? format(new Date(bodyStats.date), "d MMM yyyy") : "No data"}
            value={weightLbs}
            unit="lbs"
            onAdd={() => router.push("/(app)/log-progress" as any)}
          />
          <MetricCard
            title="Body Fat"
            subtitle={bodyStats?.date ? format(new Date(bodyStats.date), "d MMM yyyy") : "No data"}
            value={bodyStats?.body_fat_pct != null ? `${bodyStats.body_fat_pct}` : "—"}
            unit="%"
            onAdd={() => router.push("/(app)/log-progress" as any)}
          />
        </View>

        {/* Nutrition */}
        {macros && (
          <>
            <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text }]}>
              Nutrition
            </Text>
            <View style={styles.cardRow}>
              <MetricCard
                title="Calories"
                subtitle="Daily target"
                value={macros.calories != null ? `${macros.calories}` : "—"}
                unit="kcal"
              />
              <MetricCard
                title="Protein"
                subtitle="Daily target"
                value={macros.protein_g != null ? `${macros.protein_g}` : "—"}
                unit="g"
              />
            </View>
            <View style={styles.cardRow}>
              <MetricCard
                title="Fat"
                subtitle="Daily target"
                value={macros.fat_g != null ? `${macros.fat_g}` : "—"}
                unit="g"
              />
              <MetricCard
                title="Carbs"
                subtitle="Daily target"
                value={macros.carbs_g != null ? `${macros.carbs_g}` : "—"}
                unit="g"
              />
            </View>
          </>
        )}

        {/* Photos */}
        <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text }]}>
          Photos
        </Text>
        <View style={[styles.photosCard, { backgroundColor: colors.bgSecondary }]}>
          {photos.length > 0 ? (
            <View style={styles.photoRow}>
              {photos.map((p) => (
                <View key={p.id} style={[styles.photoThumb, { backgroundColor: colors.border }]}>
                  <Text allowFontScaling={false} style={[styles.photoType, { color: colors.textMuted }]}>
                    {p.photo_type}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.textMuted }]}>
              No check-in photos yet
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const WEEKS_TO_SHOW = 12;

function WeekStrip() {
  const { colors } = useTheme();
  const today = new Date();
  const scrollRef = useRef<ScrollView>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const allDays = useMemo(() => {
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    const firstWeekStart = addDays(currentWeekStart, -(WEEKS_TO_SHOW - 1) * 7);
    return Array.from({ length: WEEKS_TO_SHOW * 7 }, (_, i) => addDays(firstWeekStart, i));
  }, []);

  const scrollToToday = useCallback(() => {
    if (containerWidth > 0 && scrollRef.current) {
      scrollRef.current.scrollTo({ x: (WEEKS_TO_SHOW - 1) * containerWidth, animated: false });
    }
  }, [containerWidth]);

  useEffect(() => { scrollToToday(); }, [scrollToToday]);

  return (
    <View onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)} style={styles.weekStripWrap}>
      {containerWidth > 0 && (
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={{ width: containerWidth }}
          contentContainerStyle={{ width: containerWidth * WEEKS_TO_SHOW }}
        >
          {Array.from({ length: WEEKS_TO_SHOW }, (_, weekIdx) => (
            <View key={weekIdx} style={[styles.weekRow, { width: containerWidth }]}>
              {allDays.slice(weekIdx * 7, weekIdx * 7 + 7).map((day, i) => {
                const isToday = isSameDay(day, today);
                return (
                  <View key={i} style={styles.weekDay}>
                    <Text
                      allowFontScaling={false}
                      style={[styles.weekDayLabel, { color: isToday ? colors.text : colors.textMuted }]}
                    >
                      {format(day, "EEEEE")}
                    </Text>
                    <View style={[styles.weekDayCircle, isToday && { backgroundColor: colors.text }]}>
                      <Text
                        allowFontScaling={false}
                        style={[styles.weekDayDate, { color: isToday ? colors.bg : colors.textMuted }]}
                      >
                        {format(day, "d")}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function AvatarButton({ name, colors }: { name: string; colors: any }) {
  const navigation = useNavigation<any>();
  const initial = (name || "?").charAt(0).toUpperCase();

  const openDrawer = () => {
    // Try every known way to open the drawer
    try { navigation.openDrawer?.(); return; } catch {}
    try { navigation.getParent()?.openDrawer?.(); return; } catch {}
    try { navigation.getParent()?.getParent()?.openDrawer?.(); return; } catch {}
    // Last resort: settings screen
    router.push("/settings");
  };

  return (
    <Pressable
      onPress={openDrawer}
      style={[styles.avatar, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
    >
      <Text allowFontScaling={false} style={[styles.avatarText, { color: colors.text }]}>
        {initial}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
    paddingBottom: spacing.md,
  },
  headerLeft: { flex: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  greeting: { fontSize: 22, fontWeight: "600" },
  streakBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
  streakText: { fontSize: 15, fontWeight: "600" },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 15, fontWeight: "600" },

  weekStripWrap: { overflow: "hidden", marginBottom: spacing.sm },
  weekRow: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: spacing.lg },
  weekDay: { alignItems: "center", gap: 4 },
  weekDayLabel: { fontSize: 13, fontWeight: "500" },
  weekDayCircle: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  weekDayDate: { fontSize: 14, fontWeight: "600" },

  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 100 },

  workoutCard: { padding: spacing.base, borderRadius: radius.lg, marginBottom: spacing.xl },
  workoutLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 0.5 },
  workoutName: { fontSize: 18, fontWeight: "600", marginTop: 2 },
  workoutExercises: { fontSize: 13, marginTop: 4 },
  workoutStart: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.md },
  workoutStartText: { fontSize: 14, fontWeight: "600" },

  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: spacing.md, marginTop: spacing.sm },

  cardRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },

  photosCard: { borderRadius: radius.lg, padding: spacing.base, marginBottom: spacing.lg },
  photoRow: { flexDirection: "row", gap: spacing.sm },
  photoThumb: {
    width: 80, height: 100, borderRadius: radius.sm,
    alignItems: "center", justifyContent: "center",
  },
  photoType: { fontSize: 11, textTransform: "capitalize" },
  emptyText: { fontSize: 14, textAlign: "center", paddingVertical: spacing.lg },
});
