/**
 * Workout Tab — Trainerize / Hevy style
 * Start Empty, pick a curated program, use your templates, or re-run a recent workout.
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Modal,
  StyleSheet,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useTheme } from "@/src/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { hapticPress } from "@/src/animations/feedback/haptics";
import { WorkoutSkeleton } from "@/src/animations/components";
import { useTemplates, type WorkoutTemplate } from "@/src/hooks/useTemplates";
import { useRecentWorkouts, type RecentWorkout } from "@/src/hooks/useRecentWorkouts";
import { TemplateCard, RecentWorkoutCard } from "@/src/components/workout";
import { ProgramCard } from "@/src/components/workout/ProgramCard";
import { getProgramsByCategory, type CuratedProgram, type ProgramDay } from "@/lib/workout/programs";
import { useWorkoutLimit } from "@/src/hooks/useWorkoutLimit";
import UpgradePrompt from "@/src/components/UpgradePrompt";

export default function WorkoutScreen() {
  const { colors } = useTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const { canStartWorkout, refresh: refreshWorkoutLimit } = useWorkoutLimit();
  useFocusEffect(useCallback(() => { refreshWorkoutLimit(); }, [refreshWorkoutLimit]));
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<CuratedProgram | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const { templates, loading: templatesLoading, refresh: refreshTemplates } = useTemplates(userId);
  const { workouts: recentWorkouts, loading: recentLoading, refresh: refreshRecent } = useRecentWorkouts(userId, 5);

  const loading = templatesLoading || recentLoading;
  const programCategories = getProgramsByCategory();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshTemplates(), refreshRecent()]);
    setRefreshing(false);
  }, [refreshTemplates, refreshRecent]);

  // ==========================================================================
  // NAVIGATION
  // ==========================================================================

  const guardAndGo = (go: () => void) => {
    if (!canStartWorkout) { setShowUpgrade(true); return; }
    go();
  };

  const startEmptyWorkout = () => {
    hapticPress();
    guardAndGo(() =>
      router.push({ pathname: "/(workout)/active", params: { name: "Workout", sourceType: "empty" } })
    );
  };

  const startFromTemplate = (template: WorkoutTemplate) => {
    hapticPress();
    guardAndGo(() =>
      router.push({
        pathname: "/(workout)/active",
        params: {
          name: template.name,
          exercises: JSON.stringify(template.exercises),
          sourceType: "template",
          sourceId: template.id,
        },
      })
    );
  };

  const startProgramDay = (program: CuratedProgram, day: ProgramDay) => {
    hapticPress();
    guardAndGo(() =>
      router.push({
        pathname: "/(workout)/active",
        params: {
          name: day.name,
          exercises: JSON.stringify(day.exercises),
          sourceType: "program",
          sourceId: program.id,
        },
      })
    );
  };

  const rerunWorkout = (workout: RecentWorkout) => {
    hapticPress();
    guardAndGo(() => {
      const exercises = workout.exercises.map((ex) => ({
        name: ex.name,
        sets: Math.max(ex.set_count, 3),
        reps: "8-10",
        rir: 2,
        muscleGroup: ex.muscle_group || undefined,
      }));
      router.push({
        pathname: "/(workout)/active",
        params: {
          name: workout.title || "Workout",
          exercises: JSON.stringify(exercises),
          sourceType: "rerun",
          sourceId: workout.id,
        },
      });
    });
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <WorkoutSkeleton />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Two hero CTAs — Generate + Empty */}
        <Animated.View entering={FadeInDown.duration(300)} style={styles.heroCtas}>
          <Pressable
            onPress={() => {
              hapticPress();
              guardAndGo(() => router.push("/(workout)/generate"));
            }}
            style={[styles.generateButton, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="sparkles" size={20} color={colors.textOnPrimary} />
            <View>
              <Text allowFontScaling={false} style={[styles.generateText, { color: colors.textOnPrimary }]}>
                Generate Workout
              </Text>
              <Text allowFontScaling={false} style={[styles.generateSub, { color: `${colors.textOnPrimary}99` }]}>
                Personalized to your level
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={startEmptyWorkout}
            style={[styles.emptyButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="add" size={20} color={colors.text} />
            <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.text }]}>
              Empty Workout
            </Text>
          </Pressable>
        </Animated.View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable
            onPress={() => { hapticPress(); router.push("/(workout)/exercises"); }}
            style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="barbell-outline" size={18} color={colors.primary} />
            <Text allowFontScaling={false} style={[styles.qaText, { color: colors.text }]}>Exercises</Text>
          </Pressable>
          <Pressable
            onPress={() => { hapticPress(); router.push("/(workout)/history"); }}
            style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text allowFontScaling={false} style={[styles.qaText, { color: colors.text }]}>History</Text>
          </Pressable>
        </View>

        {/* My Templates */}
        {templates.length > 0 && (
          <Animated.View entering={FadeInDown.delay(80).duration(300)}>
            <View style={styles.sectionHeader}>
              <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text }]}>My Templates</Text>
              <Pressable onPress={() => { hapticPress(); router.push("/(workout)/templates"); }}>
                <Text allowFontScaling={false} style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
              </Pressable>
            </View>
            <FlatList
              data={templates.slice(0, 8)}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => <TemplateCard template={item} onPress={startFromTemplate} />}
              contentContainerStyle={styles.horizontalList}
            />
          </Animated.View>
        )}

        {/* Curated Programs */}
        {programCategories.map((group, gi) => (
          <Animated.View key={group.category} entering={FadeInDown.delay(150 + gi * 60).duration(300)}>
            <View style={styles.sectionHeader}>
              <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text }]}>
                {group.category}
              </Text>
            </View>
            {group.programs.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                onPress={(p) => setSelectedProgram(p)}
              />
            ))}
          </Animated.View>
        ))}

        {/* Recent Workouts */}
        {recentWorkouts.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(300)}>
            <View style={styles.sectionHeader}>
              <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text }]}>Recent Workouts</Text>
              <Pressable onPress={() => { hapticPress(); router.push("/(workout)/history"); }}>
                <Text allowFontScaling={false} style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
              </Pressable>
            </View>
            {recentWorkouts.map((w, i) => (
              <Animated.View key={w.id} entering={FadeInDown.delay(340 + i * 40).duration(250)}>
                <RecentWorkoutCard workout={w} onPress={rerunWorkout} />
              </Animated.View>
            ))}
          </Animated.View>
        )}
      </ScrollView>

      {/* Program Day Picker Modal */}
      <Modal
        visible={!!selectedProgram}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedProgram(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setSelectedProgram(null)} />
          <View style={[styles.daySheet, { backgroundColor: colors.bg }]}>
            {selectedProgram && (
              <>
                <View style={styles.daySheetHeader}>
                  <View>
                    <Text allowFontScaling={false} style={[styles.daySheetTitle, { color: colors.text }]}>
                      {selectedProgram.name}
                    </Text>
                    <Text allowFontScaling={false} style={[styles.daySheetAuthor, { color: colors.textMuted }]}>
                      {selectedProgram.author} &middot; {selectedProgram.split}
                    </Text>
                  </View>
                  <Pressable onPress={() => setSelectedProgram(null)} hitSlop={8}>
                    <Ionicons name="close" size={24} color={colors.textMuted} />
                  </Pressable>
                </View>

                <Text allowFontScaling={false} style={[styles.daySheetDesc, { color: colors.textSecondary }]}>
                  {selectedProgram.description}
                </Text>

                <Text allowFontScaling={false} style={[styles.pickDayLabel, { color: colors.textMuted }]}>
                  PICK A DAY
                </Text>

                <ScrollView showsVerticalScrollIndicator={false} style={styles.dayList}>
                  {selectedProgram.days.map((day, di) => (
                    <Pressable
                      key={di}
                      onPress={() => {
                        setSelectedProgram(null);
                        startProgramDay(selectedProgram!, day);
                      }}
                      style={[styles.dayCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      <View style={styles.dayCardTop}>
                        <Text allowFontScaling={false} style={[styles.dayName, { color: colors.text }]}>
                          {day.name}
                        </Text>
                        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                      </View>
                      <Text allowFontScaling={false} style={[styles.dayFocus, { color: colors.textMuted }]}>
                        {day.focus}
                      </Text>
                      <Text allowFontScaling={false} style={[styles.dayExercises, { color: colors.textSecondary }]} numberOfLines={1}>
                        {day.exercises.map((e) => e.name).join(", ")}
                      </Text>
                      <Text allowFontScaling={false} style={[styles.dayMeta, { color: colors.textMuted }]}>
                        {day.exercises.length} exercises &middot; {day.exercises.reduce((s, e) => s + e.sets, 0)} sets
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      <UpgradePrompt visible={showUpgrade} onClose={() => setShowUpgrade(false)} feature="workouts" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 100 },
  // Hero CTAs
  heroCtas: { gap: 10, marginBottom: 16 },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  generateText: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  generateSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  emptyText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  // Quick actions
  quickActions: { flexDirection: "row", gap: 10, marginBottom: 28 },
  quickAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  qaText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  // Sections
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  seeAll: { fontSize: 14, fontFamily: "Inter_500Medium" },
  horizontalList: { paddingBottom: 4, marginBottom: 20 },
  // Program day picker modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  daySheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  daySheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  daySheetTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold" },
  daySheetAuthor: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  daySheetDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 16 },
  pickDayLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  dayList: { flexGrow: 0 },
  dayCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  dayCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  dayFocus: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  dayExercises: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 6 },
  dayMeta: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4 },
});
