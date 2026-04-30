/**
 * CheckInHistoryScreen
 * Shows past check-ins as a timeline.
 * Each entry: date, weight, thumbnail photos, coach feedback status.
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { format, parseISO } from "date-fns";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useTheme } from "@/src/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { layout, spacing, shadows } from "@/src/theme";

// ============================================================================
// TYPES
// ============================================================================
type CheckInEntry = {
  id: string;
  created_at: string;
  weight: number | null;
  photo_front: string | null;
  photo_side: string | null;
  photo_back: string | null;
  waist: number | null;
  training_score: number | null;
  nutrition_score: number | null;
  energy_score: number | null;
  sleep_score: number | null;
  hunger_score: number | null;
  status: "pending" | "reviewed" | "flagged";
  coach_feedback: string | null;
};

// ============================================================================
// STATUS BADGE
// ============================================================================
function StatusBadge({ status }: { status: CheckInEntry["status"] }) {
  const { colors } = useTheme();

  const config = {
    pending: {
      label: "Pending",
      bg: colors.warningMuted,
      color: colors.warning,
      icon: "time-outline" as const,
    },
    reviewed: {
      label: "Reviewed",
      bg: colors.successMuted,
      color: colors.success,
      icon: "checkmark-circle-outline" as const,
    },
    flagged: {
      label: "Action Needed",
      bg: colors.errorMuted,
      color: colors.error,
      icon: "alert-circle-outline" as const,
    },
  };

  const c = config[status];

  return (
    <View style={[badgeStyles.container, { backgroundColor: c.bg }]}>
      <Ionicons name={c.icon} size={12} color={c.color} />
      <Text
        allowFontScaling={false}
        style={[badgeStyles.text, { color: c.color }]}
      >
        {c.label}
      </Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  text: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
});

// ============================================================================
// CHECK-IN CARD
// ============================================================================
function CheckInCard({
  item,
  index,
}: {
  item: CheckInEntry;
  index: number;
}) {
  const { colors } = useTheme();
  const photos = [item.photo_front, item.photo_side, item.photo_back].filter(Boolean);
  const avgScore = [
    item.training_score,
    item.nutrition_score,
    item.energy_score,
    item.sleep_score,
    item.hunger_score,
  ].filter((v): v is number => v !== null);

  const avg = avgScore.length > 0
    ? (avgScore.reduce((a, b) => a + b, 0) / avgScore.length).toFixed(1)
    : null;

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <View style={[cardStyles.container, { backgroundColor: colors.card }]}>
        {/* Header: date + status */}
        <View style={cardStyles.header}>
          <View>
            <Text
              allowFontScaling={false}
              style={[cardStyles.date, { color: colors.text }]}
            >
              {format(parseISO(item.created_at), "MMM d, yyyy")}
            </Text>
            <Text
              allowFontScaling={false}
              style={[cardStyles.timeAgo, { color: colors.textMuted }]}
            >
              {format(parseISO(item.created_at), "EEEE")}
            </Text>
          </View>
          <StatusBadge status={item.status} />
        </View>

        {/* Stats row */}
        <View style={cardStyles.statsRow}>
          {item.weight && (
            <View style={cardStyles.statItem}>
              <Ionicons name="scale-outline" size={14} color={colors.primary} />
              <Text
                allowFontScaling={false}
                style={[cardStyles.statValue, { color: colors.text }]}
              >
                {item.weight.toFixed(1)} lbs
              </Text>
            </View>
          )}
          {item.waist && (
            <View style={cardStyles.statItem}>
              <Ionicons name="resize-outline" size={14} color={colors.primary} />
              <Text
                allowFontScaling={false}
                style={[cardStyles.statValue, { color: colors.text }]}
              >
                {item.waist}" waist
              </Text>
            </View>
          )}
          {avg && (
            <View style={cardStyles.statItem}>
              <Ionicons name="heart-outline" size={14} color={colors.primary} />
              <Text
                allowFontScaling={false}
                style={[cardStyles.statValue, { color: colors.text }]}
              >
                {avg}/10 avg
              </Text>
            </View>
          )}
        </View>

        {/* Photo thumbnails */}
        {photos.length > 0 && (
          <View style={cardStyles.photosRow}>
            {photos.map((url, i) => (
              <Image
                key={i}
                source={{ uri: url! }}
                style={[cardStyles.thumbnail, { backgroundColor: colors.bgTertiary }]}
                resizeMode="cover"
              />
            ))}
          </View>
        )}

        {/* Coach feedback */}
        {item.coach_feedback && (
          <View style={[cardStyles.feedbackBox, { backgroundColor: colors.primaryFaint }]}>
            <View style={cardStyles.feedbackHeader}>
              <Ionicons name="chatbubble-ellipses" size={14} color={colors.primary} />
              <Text
                allowFontScaling={false}
                style={[cardStyles.feedbackLabel, { color: colors.primary }]}
              >
                Coach Feedback
              </Text>
            </View>
            <Text
              allowFontScaling={false}
              style={[cardStyles.feedbackText, { color: colors.textSecondary }]}
              numberOfLines={3}
            >
              {item.coach_feedback}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  date: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  timeAgo: {
    fontSize: 13,
    fontWeight: "400",
    marginTop: 1,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.base,
    marginBottom: spacing.md,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  photosRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  thumbnail: {
    width: 72,
    height: 96,
    borderRadius: 8,
  },
  feedbackBox: {
    borderRadius: 12,
    padding: spacing.md,
  },
  feedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  feedbackLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  feedbackText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

// ============================================================================
// MAIN SCREEN
// ============================================================================
export default function CheckInHistoryScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [checkins, setCheckins] = useState<CheckInEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCheckins = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("check_ins")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setCheckins((data ?? []) as CheckInEntry[]);
    } catch (err) {
      console.error("Error fetching check-ins:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCheckins();
  }, [fetchCheckins]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCheckins(true);
  };

  const renderEmpty = () => (
    <View style={emptyStyles.container}>
      <View style={[emptyStyles.iconWrap, { backgroundColor: colors.primaryMuted }]}>
        <Ionicons name="clipboard-outline" size={40} color={colors.primary} />
      </View>
      <Text
        allowFontScaling={false}
        style={[emptyStyles.title, { color: colors.text }]}
      >
        No Check-Ins Yet
      </Text>
      <Text
        allowFontScaling={false}
        style={[emptyStyles.subtitle, { color: colors.textSecondary }]}
      >
        Submit your first weekly check-in to start tracking your progress with your coach.
      </Text>
    </View>
  );

  return (
    <View style={[mainStyles.container, { backgroundColor: colors.bg }]}>
      <FlatList
        data={checkins}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <CheckInCard item={item} index={index} />
        )}
        contentContainerStyle={[
          mainStyles.list,
          checkins.length === 0 && { flex: 1 },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={loading ? null : renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
});

const mainStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.base,
    paddingBottom: 100,
  },
});
