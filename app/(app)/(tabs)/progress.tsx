import { StyleSheet, Text, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { darkColors } from "@/src/theme";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const completedDays = [true, true, true, false, false, false, false];

export default function ProgressScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text allowFontScaling={false} style={styles.title}>
          Progress
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          Track streaks and milestones
        </Text>

        {/* Weekly Consistency Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="flame-outline" size={20} color={darkColors.primary} />
            <Text allowFontScaling={false} style={styles.cardTitle}>
              Weekly Consistency
            </Text>
          </View>
          <View style={styles.weekRow}>
            {DAYS.map((day, i) => (
              <View key={i} style={styles.dayCol}>
                <View
                  style={[
                    styles.dayDot,
                    completedDays[i] && styles.dayDotActive,
                  ]}
                >
                  {completedDays[i] && (
                    <Ionicons name="checkmark" size={14} color="#000" />
                  )}
                </View>
                <Text allowFontScaling={false} style={styles.dayLabel}>
                  {day}
                </Text>
              </View>
            ))}
          </View>
          <Text allowFontScaling={false} style={styles.cardHint}>
            3 of 7 sessions logged this week
          </Text>
        </View>

        {/* Current Streak Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="trophy-outline" size={20} color={darkColors.primary} />
            <Text allowFontScaling={false} style={styles.cardTitle}>
              Current Streak
            </Text>
          </View>
          <View style={styles.streakRow}>
            <Text allowFontScaling={false} style={styles.streakValue}>
              12
            </Text>
            <Text allowFontScaling={false} style={styles.streakUnit}>
              days
            </Text>
          </View>
          <Text allowFontScaling={false} style={styles.cardHint}>
            Personal best: 21 days
          </Text>
        </View>

        {/* Milestones Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="ribbon-outline" size={20} color={darkColors.primary} />
            <Text allowFontScaling={false} style={styles.cardTitle}>
              Milestones
            </Text>
          </View>
          <View style={styles.milestoneRow}>
            <View style={[styles.badge, styles.badgeEarned]}>
              <Ionicons name="flash" size={18} color="#000" />
            </View>
            <View style={[styles.badge, styles.badgeEarned]}>
              <Ionicons name="fitness" size={18} color="#000" />
            </View>
            <View style={styles.badge}>
              <Ionicons name="barbell-outline" size={18} color={darkColors.muted} />
            </View>
            <View style={styles.badge}>
              <Ionicons name="medal-outline" size={18} color={darkColors.muted} />
            </View>
          </View>
          <Text allowFontScaling={false} style={styles.cardHint}>
            Hit a new PR to unlock your next badge
          </Text>
        </View>

        {/* Stats Summary */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text allowFontScaling={false} style={styles.statValue}>
              47
            </Text>
            <Text allowFontScaling={false} style={styles.statLabel}>
              Total Workouts
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text allowFontScaling={false} style={styles.statValue}>
              12.5k
            </Text>
            <Text allowFontScaling={false} style={styles.statLabel}>
              Total Volume (lbs)
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: darkColors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  title: {
    color: darkColors.text,
    fontSize: 28,
    fontFamily: "Inter_600SemiBold",
    marginTop: 8,
  },
  subtitle: {
    color: darkColors.muted,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    marginBottom: 24,
  },
  card: {
    backgroundColor: darkColors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  cardTitle: {
    color: darkColors.text,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  cardHint: {
    color: darkColors.muted,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 12,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayCol: {
    alignItems: "center",
    gap: 8,
  },
  dayDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: darkColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  dayDotActive: {
    backgroundColor: darkColors.primary,
  },
  dayLabel: {
    color: darkColors.muted,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  streakValue: {
    color: darkColors.primary,
    fontSize: 48,
    fontFamily: "Inter_600SemiBold",
  },
  streakUnit: {
    color: darkColors.muted,
    fontSize: 18,
    fontFamily: "Inter_400Regular",
  },
  milestoneRow: {
    flexDirection: "row",
    gap: 12,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: darkColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeEarned: {
    backgroundColor: darkColors.primary,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: darkColors.card,
    borderRadius: 16,
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
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
});
