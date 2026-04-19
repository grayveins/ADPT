import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
// animations removed for clean minimal feel
import { format } from "date-fns";

import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/src/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { hapticPress } from "@/src/animations/feedback/haptics";
import { useTemplates, type WorkoutTemplate } from "@/src/hooks/useTemplates";
import { spacing, radius } from "@/src/theme";

export default function WorkoutScreen() {
  const { colors } = useTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [libraryExpanded, setLibraryExpanded] = useState(true);
  const [todayWorkout, setTodayWorkout] = useState<any>(null);
  const [programName, setProgramName] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const { templates, loading: templatesLoading, refresh: refreshTemplates } = useTemplates(userId);

  // Fetch assigned program + today's workout
  const fetchProgram = useCallback(async () => {
    if (!userId) return;
    const { data: program } = await supabase
      .from("coaching_programs")
      .select("id, name, program_phases(id, name, phase_number, status, phase_workouts(id, day_number, name, exercises))")
      .eq("client_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!program) return;
    setProgramName(program.name);

    const activePhase = (program as any).program_phases
      ?.find((p: any) => p.status === "active");
    if (!activePhase?.phase_workouts?.length) return;

    const dayOfWeek = new Date().getDay() || 7;
    const todayW = activePhase.phase_workouts.find(
      (w: any) => w.day_number === dayOfWeek
    ) || activePhase.phase_workouts[0];

    setTodayWorkout(todayW);
  }, [userId]);

  useEffect(() => { fetchProgram(); }, [fetchProgram]);
  useFocusEffect(useCallback(() => { fetchProgram(); }, [fetchProgram]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshTemplates(), fetchProgram()]);
    setRefreshing(false);
  }, [refreshTemplates, fetchProgram]);

  const startEmptyWorkout = () => {
    hapticPress();
    router.push({ pathname: "/(workout)/active", params: { name: "Workout", sourceType: "empty" } });
  };

  const startFromTemplate = (template: WorkoutTemplate) => {
    hapticPress();
    router.push({
      pathname: "/(workout)/active",
      params: {
        name: template.name,
        exercises: JSON.stringify(template.exercises),
        sourceType: "template",
        sourceId: template.id,
      },
    });
  };

  const startTodayWorkout = () => {
    if (!todayWorkout) return;
    hapticPress();
    router.push({
      pathname: "/(workout)/active",
      params: {
        name: todayWorkout.name,
        exercises: JSON.stringify(todayWorkout.exercises || []),
        sourceType: "program",
      },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text allowFontScaling={false} style={[styles.headerTitle, { color: colors.text }]}>
          Workout
        </Text>
        <Pressable onPress={startEmptyWorkout} hitSlop={8}>
          <Ionicons name="add" size={26} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
        }
      >
        {/* Today's Assigned Workout */}
        {todayWorkout ? (
          <View>
            <Pressable
              onPress={startTodayWorkout}
              style={[styles.todayCard, { backgroundColor: colors.bgSecondary }]}
            >
              <View style={styles.todayHeader}>
                <Text allowFontScaling={false} style={[styles.todayLabel, { color: colors.textMuted }]}>
                  {programName ? programName.toUpperCase() : "TODAY'S WORKOUT"}
                </Text>
              </View>
              <Text allowFontScaling={false} style={[styles.todayName, { color: colors.text }]}>
                {todayWorkout.name}
              </Text>
              {todayWorkout.exercises?.length > 0 && (
                <Text
                  allowFontScaling={false}
                  numberOfLines={2}
                  style={[styles.todayExercises, { color: colors.textSecondary }]}
                >
                  {(todayWorkout.exercises as any[]).map((e: any) => e.name || e.exercise_name).join(", ")}
                </Text>
              )}
              <View style={styles.todayStart}>
                <Text allowFontScaling={false} style={[styles.todayStartText, { color: colors.text }]}>
                  Start Workout
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.text} />
              </View>
            </Pressable>
          </View>
        ) : (
          <View>
            <View style={[styles.todayCard, { backgroundColor: colors.bgSecondary }]}>
              <Text allowFontScaling={false} style={[styles.todayLabel, { color: colors.textMuted }]}>
                TODAY
              </Text>
              <Text allowFontScaling={false} style={[styles.todayName, { color: colors.text }]}>
                No workout assigned
              </Text>
              <Text allowFontScaling={false} style={[styles.todayExercises, { color: colors.textMuted }]}>
                Start an empty workout or pick from your library
              </Text>
            </View>
          </View>
        )}

        {/* Workout Library */}
        <View>
          <Pressable
            onPress={() => setLibraryExpanded(!libraryExpanded)}
            style={styles.sectionHeader}
          >
            <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text }]}>
              Workout Library
            </Text>
            <Text allowFontScaling={false} style={[styles.collapseText, { color: colors.textMuted }]}>
              {libraryExpanded ? "Collapse" : "Expand"}
            </Text>
          </Pressable>

          {libraryExpanded && (
            templates.length > 0 ? (
              templates.slice(0, 5).map((template) => (
                <Pressable
                  key={template.id}
                  onPress={() => startFromTemplate(template)}
                  style={[styles.templateCard, { backgroundColor: colors.bgSecondary }]}
                >
                  <View style={styles.templateInfo}>
                    <Text allowFontScaling={false} style={[styles.templateName, { color: colors.text }]}>
                      {template.name}
                    </Text>
                    <Text
                      allowFontScaling={false}
                      numberOfLines={1}
                      style={[styles.templateExercises, { color: colors.textMuted }]}
                    >
                      {(template.exercises as any[])?.map((e: any) => e.name).join(", ")}
                    </Text>
                    {/* Muscle group chips */}
                    <View style={styles.chipRow}>
                      {[...new Set((template.exercises as any[])?.map((e: any) => e.muscleGroup).filter(Boolean))]
                        .slice(0, 4)
                        .map((mg, i) => (
                          <View key={i} style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text allowFontScaling={false} style={[styles.chipText, { color: colors.textSecondary }]}>
                              {mg as string}
                            </Text>
                          </View>
                        ))}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Pressable>
              ))
            ) : !templatesLoading ? (
              <View style={[styles.emptyLibrary, { backgroundColor: colors.bgSecondary }]}>
                <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.textMuted }]}>
                  No templates yet. Finish a workout to save one.
                </Text>
              </View>
            ) : null
          )}
        </View>

        {/* More */}
        <View>
          <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.md }]}>
            More
          </Text>

          <MoreRow
            icon="arrow-forward-outline"
            label="Empty Workout"
            onPress={startEmptyWorkout}
            colors={colors}
          />
          <MoreRow
            icon="time-outline"
            label="Workout History"
            onPress={() => router.push("/(workout)/history")}
            colors={colors}
          />
          <MoreRow
            icon="barbell-outline"
            label="Exercise Library"
            onPress={() => router.push("/(workout)/exercises")}
            colors={colors}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MoreRow({ icon, label, onPress, colors }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  colors: any;
}) {
  return (
    <Pressable onPress={onPress} style={styles.moreRow}>
      <Ionicons name={icon} size={18} color={colors.text} />
      <Text allowFontScaling={false} style={[styles.moreLabel, { color: colors.text }]}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  headerTitle: { fontSize: 28, fontWeight: "700" },

  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 100 },

  // Today's workout
  todayCard: {
    padding: spacing.base,
    borderRadius: radius.lg,
    marginBottom: spacing.xl,
  },
  todayHeader: { marginBottom: spacing.xs },
  todayLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 0.5 },
  todayName: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
  todayExercises: { fontSize: 13, lineHeight: 18, marginBottom: spacing.md },
  todayStart: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  todayStartText: { fontSize: 14, fontWeight: "600" },

  // Section
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  sectionTitle: { fontSize: 18, fontWeight: "600" },
  collapseText: { fontSize: 14 },

  // Template cards
  templateCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.base,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  templateInfo: { flex: 1, gap: 4 },
  templateName: { fontSize: 15, fontWeight: "600" },
  templateExercises: { fontSize: 13 },
  chipRow: { flexDirection: "row", gap: 6, marginTop: 4, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: { fontSize: 11 },

  emptyLibrary: {
    padding: spacing.xl,
    borderRadius: radius.md,
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  emptyText: { fontSize: 14 },

  // More rows
  moreRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: spacing.md,
  },
  moreLabel: { flex: 1, fontSize: 15 },
});
