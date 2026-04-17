/**
 * Home Screen - "PT in Your Pocket"
 * 
 * Design Philosophy:
 * - 80% focus on today's workout
 * - Coach greeting (time-based, personalized)
 * - Minimal metrics, maximum action
 * - Pre-workout feeling check-in
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useFonts } from "expo-font";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";

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

import { useTheme } from "@/src/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import {
  generateWeeklyPlan,
  type PlannedWorkout,
  type WorkoutPlanPreferences,
} from "@/lib/workoutPlan";

// Components
import { TabHeader } from "@/src/components/layout";
import { ToastContainer } from "@/src/animations/celebrations";
import { hapticPress } from "@/src/animations/feedback/haptics";
import { useStreak } from "@/src/hooks/useStreak";
import { layout, spacing, shadows } from "@/src/theme";
import { ErrorState } from "@/src/components/ErrorState";
import { HomeSkeleton } from "@/src/animations/components";
import { useWorkoutLimit } from "@/src/hooks/useWorkoutLimit";
import { useStrengthScore } from "@/src/hooks/useStrengthScore";
import { useUserXP } from "@/src/hooks/useUserXP";
import UpgradePrompt from "@/src/components/UpgradePrompt";
import TrialBanner from "@/src/components/TrialBanner";
import { generateSmartWorkout } from "@/lib/workout/generateSmart";

type SessionRow = {
  id: string;
  title: string | null;
  started_at: string;
  ended_at: string | null;
};

// Time-based greeting
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

// Coach message based on context
const getCoachMessage = (
  workedOutToday: boolean,
  lastSessionDaysAgo: number | null,
  currentStreak: number,
  isRestDay: boolean
): string => {
  if (workedOutToday) {
    return "Great work today! Rest up and recover.";
  }
  if (isRestDay) {
    return "Rest day. Light movement or stretching is perfect.";
  }
  if (lastSessionDaysAgo === null || lastSessionDaysAgo >= 3) {
    return "Ready to get back at it? Your body is ready.";
  }
  if (currentStreak >= 3) {
    return `${currentStreak} day streak! Let's keep the momentum.`;
  }
  return "Your workout is ready. Let's make it count.";
};

export default function HomeScreen() {
  const { colors } = useTheme();
  
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("there");
  const [preferences, setPreferences] = useState<WorkoutPlanPreferences | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Streak data
  const { currentStreak, workedOutToday, isStreakAtRisk, refreshStreak, streakFreezeAvailable, freezeStreak } = useStreak(userId);


  // Workout limit (free tier: 3/week) — refresh on tab focus after completing a workout
  const { canStartWorkout, refresh: refreshWorkoutLimit } = useWorkoutLimit();
  useFocusEffect(useCallback(() => { refreshWorkoutLimit(); }, [refreshWorkoutLimit]));
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Strength Score
  const { score: strengthScore, loading: scoreLoading } = useStrengthScore(userId);

  // XP + Rank
  const { data: xpData } = useUserXP(userId);

  // Auto-generated workout preview (Fitbod-style)
  type ExercisePreview = { name: string; sets: number; reps: string };
  const [generatedPreview, setGeneratedPreview] = useState<ExercisePreview[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);

  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);

  // Fetch all data for home screen
  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();

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
      const { data: sessionRows } = await supabase
        .from("workout_sessions")
        .select("id, title, started_at, ended_at")
        .eq("user_id", user.id)
        .gte("started_at", weekStartIso)
        .lt("started_at", weekEndIso)
        .order("started_at", { ascending: false });

      setSessions((sessionRows ?? []) as SessionRow[]);
      refreshStreak();
    } catch (err) {
      console.error("Error fetching home data:", err);
      setError("Failed to load your data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [weekStart, refreshStreak]);

  // Pull-to-refresh handler
  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  useEffect(() => {
    if (!loaded) return;
    fetchData();
  }, [loaded, weekStart, fetchData]);

  // Auto-generate today's exercise preview (Fitbod-style: workout ready on open)
  useEffect(() => {
    if (!userId || workedOutToday) return;
    setPreviewLoading(true);
    generateSmartWorkout({ userId, insights: null })
      .then((workout) => {
        if (workout?.exercises) {
          setGeneratedPreview(
            workout.exercises.slice(0, 4).map((ex) => ({
              name: ex.name,
              sets: ex.sets.length,
              reps: ex.targetReps,
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setPreviewLoading(false));
  }, [userId, workedOutToday]);

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

  // Week view data
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

  const openCheckin = () => {
    hapticPress();
    if (!canStartWorkout) {
      setShowUpgrade(true);
      return;
    }
    if (todayWorkout && !todayWorkout.isRest) {
      router.push({
        pathname: "/(workout)/active",
        params: {
          type: todayWorkout.type,
          name: todayWorkout.type,
        },
      });
    } else {
      router.push("/(app)/(tabs)/workout");
    }
  };







  if (!loaded) return null;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <HomeSkeleton />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <ErrorState 
          message={error}
          detail="Please check your connection and try again."
          onRetry={() => fetchData()}
        />
      </View>
    );
  }

  const isRestDay = todayWorkout?.isRest ?? false;
  const greeting = getGreeting();
  const coachMessage = getCoachMessage(workedOutToday, lastSessionDaysAgo, currentStreak, isRestDay);

  // Compose greeting title
  const greetingTitle = `${greeting}, ${profileName}`;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header with greeting, streak, and avatar */}
      <TabHeader
        title={greetingTitle}
        streakCount={currentStreak}
        userName={profileName}
      />

      <TrialBanner />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Coach Message */}
        <Animated.View 
          entering={FadeInDown.delay(0).duration(400)}
          style={styles.coachMessageSection}
        >
          <Text allowFontScaling={false} style={[styles.coachMessage, { color: colors.textSecondary }]}>
            {coachMessage}
          </Text>
        </Animated.View>

        {/* Streak at risk — compact banner */}
        {isStreakAtRisk && currentStreak > 0 && !workedOutToday && (
          <Animated.View entering={FadeInDown.delay(15).duration(300)}>
            <Pressable
              onPress={streakFreezeAvailable ? async () => {
                hapticPress();
                const ok = await freezeStreak();
                if (ok) refreshStreak();
              } : openCheckin}
              style={[styles.streakBanner, { backgroundColor: "rgba(255, 107, 53, 0.1)" }]}
            >
              <Ionicons name="flame" size={16} color={colors.intensity} />
              <Text allowFontScaling={false} style={[styles.streakBannerText, { color: colors.intensity }]}>
                {currentStreak}-day streak at risk
              </Text>
              <Text allowFontScaling={false} style={[styles.streakBannerCta, { color: colors.intensity }]}>
                {streakFreezeAvailable ? "Freeze" : "Train now"}
              </Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Week Progress Bar */}
        <Animated.View 
          entering={FadeInDown.delay(50).duration(400)}
          style={styles.weekSection}
        >
          {/* Week days */}
          <View style={styles.weekStats}>
            <Text allowFontScaling={false} style={[styles.weekStatsText, { color: colors.textMuted }]}>
              {completed} of {target} workouts this week
            </Text>
            <View style={[styles.weekProgressBar, { backgroundColor: colors.border }]}>
              <View 
                style={[
                  styles.weekProgressFill, 
                  { 
                    width: `${Math.min(100, (completed / target) * 100)}%`, 
                    backgroundColor: colors.primary 
                  }
                ]} 
              />
            </View>
          </View>
        </Animated.View>

        {/* Strength score and mesocycle removed for minimal prototype */}

        {/* TODAY'S WORKOUT - Hero Card (80% focus) */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.heroSection}
        >
          {workedOutToday ? (
            // Completed state
            <View style={[styles.heroCard, styles.heroCardCompleted, { backgroundColor: colors.card }]}>
              <View style={[styles.heroIconLarge, { backgroundColor: colors.success }]}>
                <Ionicons name="checkmark" size={40} color={colors.textOnPrimary} />
              </View>
              <Text allowFontScaling={false} style={[styles.heroCompletedTitle, { color: colors.text }]}>
                Workout Complete!
              </Text>
              <Text allowFontScaling={false} style={[styles.heroCompletedSubtitle, { color: colors.textMuted }]}>
                Great work today. Rest and recover.
              </Text>
              <Pressable 
                onPress={() => router.push("/(workout)/history")}
                style={[styles.heroSecondaryButton, { borderColor: colors.border }]}
              >
                <Text allowFontScaling={false} style={[styles.heroSecondaryButtonText, { color: colors.text }]}>
                  View Session
                </Text>
              </Pressable>
            </View>
          ) : isRestDay ? (
            // Rest day state
            <View style={[styles.heroCard, { backgroundColor: colors.card }]}>
              <View style={[styles.heroIconLarge, { backgroundColor: colors.primaryMuted }]}>
                <Ionicons name="leaf" size={40} color={colors.primary} />
              </View>
              <Text allowFontScaling={false} style={[styles.heroTitle, { color: colors.text }]}>
                Rest Day
              </Text>
              <Text allowFontScaling={false} style={[styles.heroSubtitle, { color: colors.textMuted }]}>
                Recovery is where progress happens. Light stretching or a walk is perfect.
              </Text>
              <Pressable 
                onPress={() => router.push("/(app)/(tabs)/workout")}
                style={[styles.heroSecondaryButton, { borderColor: colors.border }]}
              >
                <Text allowFontScaling={false} style={[styles.heroSecondaryButtonText, { color: colors.text }]}>
                  Browse Workouts
                </Text>
              </Pressable>
            </View>
          ) : (
            // Active workout state — Fitbod-style with exercise preview
            <View style={[styles.heroCard, { backgroundColor: colors.card }]}>
              {/* Header row: type badge + meta */}
              <View style={styles.heroHeaderRow}>
                <View style={[styles.heroTypeBadge, { backgroundColor: colors.primaryMuted }]}>
                  <Ionicons name="sparkles" size={12} color={colors.primary} />
                  <Text allowFontScaling={false} style={[styles.heroTypeBadgeText, { color: colors.primary }]}>
                    {todayWorkout?.type ?? "Full Body"}
                  </Text>
                </View>
                {todayWorkout && (
                  <Text allowFontScaling={false} style={[styles.heroMetaText, { color: colors.textMuted }]}>
                    ~{todayWorkout.durationMinutes} min
                  </Text>
                )}
              </View>

              <Text allowFontScaling={false} style={[styles.heroTitle, { color: colors.text }]}>
                Today&apos;s Workout
              </Text>

              {/* Exercise preview list */}
              {previewLoading && !generatedPreview && (
                <View style={styles.exercisePreview}>
                  {[1, 2, 3, 4].map((i) => (
                    <View key={i} style={[styles.exercisePreviewRow, i < 4 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                      <View style={{ width: 120 + (i * 20), height: 14, backgroundColor: colors.card, borderRadius: 4 }} />
                      <View style={{ width: 40, height: 14, backgroundColor: colors.card, borderRadius: 4 }} />
                    </View>
                  ))}
                </View>
              )}
              {generatedPreview && generatedPreview.length > 0 && (
                <View style={styles.exercisePreview}>
                  {generatedPreview.map((ex, i) => (
                    <View key={i} style={[styles.exercisePreviewRow, i < generatedPreview.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                      <Text allowFontScaling={false} style={[styles.exercisePreviewName, { color: colors.text }]} numberOfLines={1}>
                        {ex.name}
                      </Text>
                      <Text allowFontScaling={false} style={[styles.exercisePreviewSets, { color: colors.textMuted }]}>
                        {ex.sets} x {ex.reps}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Start Button */}
              <Pressable
                onPress={openCheckin}
                style={({ pressed }) => [
                  styles.heroButton,
                  { backgroundColor: colors.primary },
                  pressed && styles.heroButtonPressed
                ]}
              >
                <Text allowFontScaling={false} style={[styles.heroButtonText, { color: colors.textOnPrimary }]}>
                  Start Workout
                </Text>
                <Ionicons name="arrow-forward" size={20} color={colors.textOnPrimary} />
              </Pressable>
            </View>
          )}
        </Animated.View>

      </ScrollView>

      <ToastContainer />
      <UpgradePrompt
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="workouts"
        strengthScore={strengthScore?.totalScore}
        rankName={xpData?.rank?.name}
        rankColor={xpData?.rank?.color}
        workoutsCompleted={sessions.length}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.sm,
    paddingBottom: 100,
  },

  // Coach Message
  coachMessageSection: {
    marginBottom: spacing.lg,
  },
  coachMessage: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },

  // Streak at risk banner
  streakBanner: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: spacing.md,
  },
  streakBannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  streakBannerCta: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },

  // Limitation Card
  limitationCard: {
    borderRadius: 16,
    padding: spacing.base,
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  limitationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  limitationIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  limitationTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  limitationBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  limitationFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  limitationFooterText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },

  // Week Section
  weekSection: {
    marginBottom: layout.sectionGap,
  },
  weekStats: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  weekStatsText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  weekProgressBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  weekProgressFill: {
    height: "100%",
    borderRadius: 2,
  },

  // Strength Score Card
  scoreSection: {
    marginBottom: layout.sectionGap,
  },
  scoreCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    padding: spacing.base,
    borderRadius: 16,
    gap: spacing.base,
    ...shadows.card,
  },
  scoreInfo: {
    flex: 1,
    gap: 4,
  },
  scoreTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
  },
  scoreViewMore: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 2,
    marginTop: 4,
  },
  scoreViewText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  scoreNext: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },

  // Hero Card (Today's Workout)
  heroSection: {
    marginBottom: layout.sectionGap,
  },
  heroCard: {
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: "center",
    ...shadows.card,
  },
  heroCardCompleted: {
    paddingVertical: spacing.xxl,
  },
  heroIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.base,
  },
  heroHeaderRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: spacing.sm,
  },
  heroTypeBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  heroTypeBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: "Inter_600SemiBold",
    marginBottom: spacing.sm,
  },
  // Exercise preview (Fitbod-style)
  exercisePreview: {
    marginBottom: spacing.md,
  },
  exercisePreviewRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingVertical: 9,
  },
  exercisePreviewName: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  exercisePreviewSets: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginLeft: 12,
  },
  heroSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
    marginBottom: spacing.lg,
  },
  heroCompletedTitle: {
    fontSize: 22,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  heroCompletedSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  heroMeta: {
    flexDirection: "row",
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  heroMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroMetaText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },

  // Hero Button
  heroButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    height: 56,
    borderRadius: 28,
  },
  heroButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  heroButtonText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  heroSecondaryButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 20,
    borderWidth: 1,
  },
  heroSecondaryButtonText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },

  // Quick Actions
  quickActionsSection: {
    gap: layout.cardGap,
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.base,
    borderRadius: 14,
    gap: spacing.md,
    ...shadows.sm,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
});
