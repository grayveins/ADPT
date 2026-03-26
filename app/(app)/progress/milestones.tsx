/**
 * Milestones Screen
 *
 * Trophy-case style achievement gallery. Each milestone is a clean card
 * with rarity color accents. Achieved milestones glow; locked ones are
 * mysterious. Grouped by category with a visual header.
 */

import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from "react-native";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useTheme } from "@/src/context/ThemeContext";
import { layout, spacing } from "@/src/theme";
import { useStrengthScore } from "@/src/hooks/useStrengthScore";
import { supabase } from "@/lib/supabase";
import type { Milestone, MilestoneRarity } from "@/lib/strengthScore";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  TOTAL_MILESTONES,
} from "@/lib/strengthScore";

// ─── Rarity helpers ──────────────────────────────────────────────────────────

function useRarityColor(rarity: MilestoneRarity) {
  const { colors } = useTheme();
  const map: Record<MilestoneRarity, string> = {
    common: colors.success,
    uncommon: colors.primary,
    rare: colors.info,
    epic: colors.intensity,
    legendary: colors.gold,
  };
  return map[rarity];
}

const CATEGORY_ICONS: Record<string, string> = {
  first_steps: "flash",
  plate_club: "barbell",
  relative_strength: "fitness",
  total_club: "medal-outline",
  score: "sparkles",
};

// ─── Progress Ring ───────────────────────────────────────────────────────────

function ProgressRing({
  progress,
  size = 100,
  strokeWidth = 6,
  color,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color: string;
}) {
  const { colors } = useTheme();
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={colors.bg}
        strokeWidth={strokeWidth}
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${circumference}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90, ${size / 2}, ${size / 2})`}
      />
    </Svg>
  );
}

// ─── Milestone Card ──────────────────────────────────────────────────────────

function MilestoneCard({ milestone }: { milestone: Milestone }) {
  const { colors } = useTheme();
  const rarityColor = useRarityColor(milestone.rarity);
  const progressPercent = Math.round(milestone.progress * 100);

  const isRareOrHigher = ["rare", "epic", "legendary"].includes(milestone.rarity);
  const isMystery = !milestone.achieved && isRareOrHigher && milestone.progress < 0.1;

  if (isMystery) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardInner}>
          <View style={[styles.iconCircle, { backgroundColor: colors.bg }]}>
            <Ionicons name="lock-closed" size={18} color={colors.textMuted} />
          </View>
          <View style={styles.cardText}>
            <Text allowFontScaling={false} style={[styles.cardTitle, { color: colors.textMuted }]}>
              ???
            </Text>
            <Text allowFontScaling={false} style={[styles.cardDesc, { color: colors.textMuted }]}>
              Keep lifting to discover
            </Text>
          </View>
          <View style={[styles.rarityPill, { backgroundColor: rarityColor + "15" }]}>
            <View style={[styles.rarityPillDot, { backgroundColor: rarityColor }]} />
          </View>
        </View>
      </View>
    );
  }

  if (milestone.achieved) {
    return (
      <View
        style={[
          styles.card,
          styles.achievedCard,
          { backgroundColor: rarityColor + "08", borderColor: rarityColor + "25" },
        ]}
      >
        <View style={styles.cardInner}>
          <View style={[styles.iconCircle, { backgroundColor: rarityColor + "20" }]}>
            <Ionicons
              name={milestone.icon as keyof typeof Ionicons.glyphMap}
              size={20}
              color={rarityColor}
            />
            {/* Checkmark badge */}
            <View style={[styles.checkBadge, { backgroundColor: rarityColor }]}>
              <Ionicons name="checkmark" size={8} color="#0A0A0A" />
            </View>
          </View>
          <View style={styles.cardText}>
            <Text allowFontScaling={false} style={[styles.cardTitle, { color: colors.text }]}>
              {milestone.label}
            </Text>
            <Text allowFontScaling={false} style={[styles.cardDesc, { color: colors.textMuted }]}>
              {milestone.description}
            </Text>
          </View>
          <View style={[styles.rarityPill, { backgroundColor: rarityColor + "15" }]}>
            <View style={[styles.rarityPillDot, { backgroundColor: rarityColor }]} />
          </View>
        </View>
      </View>
    );
  }

  // In progress
  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardInner}>
        <View style={[styles.iconCircle, { backgroundColor: colors.bg }]}>
          <Ionicons
            name={milestone.icon as keyof typeof Ionicons.glyphMap}
            size={18}
            color={colors.textMuted}
          />
        </View>
        <View style={styles.cardText}>
          <Text allowFontScaling={false} style={[styles.cardTitle, { color: colors.textSecondary }]}>
            {milestone.label}
          </Text>
          <Text allowFontScaling={false} style={[styles.cardDesc, { color: colors.textMuted }]}>
            {milestone.description}
          </Text>
          {/* Inline progress */}
          <View style={styles.progressRow}>
            <View style={[styles.progressBg, { backgroundColor: colors.bg }]}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: rarityColor, width: `${progressPercent}%` },
                ]}
              />
            </View>
            <Text allowFontScaling={false} style={[styles.progressText, { color: rarityColor }]}>
              {progressPercent}%
            </Text>
          </View>
        </View>
        <View style={[styles.rarityPill, { backgroundColor: rarityColor + "15" }]}>
          <View style={[styles.rarityPillDot, { backgroundColor: rarityColor }]} />
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function MilestonesScreen() {
  const { colors } = useTheme();
  const [userId, setUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const { score } = useStrengthScore(userId);

  const grouped = useMemo(() => {
    if (!score) return [];

    return CATEGORY_ORDER.map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat],
      icon: CATEGORY_ICONS[cat],
      milestones: score.milestones.filter((m) => m.category === cat),
      achievedCount: score.milestones.filter((m) => m.category === cat && m.achieved).length,
    })).filter((g) => g.milestones.length > 0);
  }, [score]);

  const achievedCount = score?.achievedCount ?? 0;
  const overallProgress = TOTAL_MILESTONES > 0 ? achievedCount / TOTAL_MILESTONES : 0;

  // Rarity stats
  const rarityStats = useMemo(() => {
    if (!score) return [];
    const rarities: MilestoneRarity[] = ["common", "uncommon", "rare", "epic", "legendary"];
    return rarities.map((r) => ({
      rarity: r,
      achieved: score.milestones.filter((m) => m.rarity === r && m.achieved).length,
      total: score.milestones.filter((m) => m.rarity === r).length,
    })).filter((r) => r.total > 0);
  }, [score]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <Text allowFontScaling={false} style={[styles.headerTitle, { color: colors.text }]}>
          Milestones
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Header ─────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(0).duration(300)}
          style={styles.heroContainer}
        >
          {/* Progress ring with count inside */}
          <View style={styles.ringContainer}>
            <ProgressRing progress={overallProgress} size={110} strokeWidth={7} color={colors.gold} />
            <View style={styles.ringContent}>
              <Text allowFontScaling={false} style={[styles.ringCount, { color: colors.gold }]}>
                {achievedCount}
              </Text>
              <Text allowFontScaling={false} style={[styles.ringTotal, { color: colors.textMuted }]}>
                of {TOTAL_MILESTONES}
              </Text>
            </View>
          </View>

          {/* Rarity breakdown pills */}
          <View style={styles.rarityRow}>
            {rarityStats.map((r) => (
              <RarityPill key={r.rarity} rarity={r.rarity} achieved={r.achieved} total={r.total} />
            ))}
          </View>
        </Animated.View>

        {/* ── Categories ──────────────────────────────────────── */}
        {grouped.map((group, groupIndex) => (
          <Animated.View
            key={group.category}
            entering={FadeInDown.delay((groupIndex + 1) * 60).duration(300)}
            style={styles.categorySection}
          >
            {/* Category header */}
            <View style={styles.categoryHeader}>
              <View style={styles.categoryHeaderLeft}>
                <View style={[styles.categoryIcon, { backgroundColor: colors.card }]}>
                  <Ionicons
                    name={group.icon as keyof typeof Ionicons.glyphMap}
                    size={16}
                    color={colors.primary}
                  />
                </View>
                <Text allowFontScaling={false} style={[styles.categoryTitle, { color: colors.text }]}>
                  {group.label}
                </Text>
              </View>
              <Text allowFontScaling={false} style={[styles.categoryCount, { color: colors.textMuted }]}>
                {group.achievedCount}/{group.milestones.length}
              </Text>
            </View>

            {/* Milestone cards */}
            <View style={styles.cardList}>
              {group.milestones.map((milestone) => (
                <MilestoneCard key={milestone.id} milestone={milestone} />
              ))}
            </View>
          </Animated.View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Rarity Pill ─────────────────────────────────────────────────────────────

function RarityPill({
  rarity,
  achieved,
  total,
}: {
  rarity: MilestoneRarity;
  achieved: number;
  total: number;
}) {
  const color = useRarityColor(rarity);
  return (
    <View style={[styles.rarityPillLarge, { backgroundColor: color + "12", borderColor: color + "25" }]}>
      <View style={[styles.rarityPillLargeDot, { backgroundColor: color }]} />
      <Text allowFontScaling={false} style={[styles.rarityPillLargeText, { color }]}>
        {achieved}/{total}
      </Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.lg,
    paddingBottom: 100,
  },

  // Hero
  heroContainer: {
    alignItems: "center",
    marginBottom: spacing.xl,
    gap: spacing.lg,
  },
  ringContainer: {
    position: "relative",
    width: 110,
    height: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  ringContent: {
    position: "absolute",
    alignItems: "center",
  },
  ringCount: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    lineHeight: 36,
  },
  ringTotal: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: -2,
  },

  // Rarity pills row
  rarityRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  rarityPillLarge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  rarityPillLargeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  rarityPillLargeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },

  // Category
  categorySection: {
    marginBottom: spacing.lg,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  categoryHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  categoryIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  categoryCount: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },

  // Cards
  cardList: {
    gap: spacing.sm,
  },
  card: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  achievedCard: {
    borderWidth: 1,
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  checkBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  cardDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },

  // Rarity indicator on card
  rarityPill: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rarityPillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Progress
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: 6,
  },
  progressBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    width: 34,
    textAlign: "right",
  },
});
