import { StyleSheet, Text, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/src/context/ThemeContext";

export default function SocialScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text allowFontScaling={false} style={[styles.title, { color: colors.text }]}>
          Community
        </Text>
        <Text allowFontScaling={false} style={[styles.subtitle, { color: colors.textMuted }]}>
          Connect with others on the same journey
        </Text>

        {/* Community Feed Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="people-outline" size={20} color={colors.primary} />
            <Text allowFontScaling={false} style={[styles.cardTitle, { color: colors.text }]}>
              Community Feed
            </Text>
          </View>
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.border }]}>
              <Ionicons name="chatbubbles-outline" size={32} color={colors.textMuted} />
            </View>
            <Text allowFontScaling={false} style={[styles.emptyTitle, { color: colors.text }]}>
              Coming Soon
            </Text>
            <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.textMuted }]}>
              Your network will appear here. Share wins, routines, and motivation with others.
            </Text>
          </View>
        </View>

        {/* Public Routines Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="barbell-outline" size={20} color={colors.primary} />
            <Text allowFontScaling={false} style={[styles.cardTitle, { color: colors.text }]}>
              Public Routines
            </Text>
          </View>
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.border }]}>
              <Ionicons name="list-outline" size={32} color={colors.textMuted} />
            </View>
            <Text allowFontScaling={false} style={[styles.emptyTitle, { color: colors.text }]}>
              Browse & Save
            </Text>
            <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.textMuted }]}>
              Discover training blocks from others and add them to your library.
            </Text>
          </View>
        </View>

        {/* Leaderboard Preview */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="podium-outline" size={20} color={colors.primary} />
            <Text allowFontScaling={false} style={[styles.cardTitle, { color: colors.text }]}>
              Leaderboard
            </Text>
          </View>
          <View style={[styles.leaderRow, { backgroundColor: colors.selected }]}>
            <View style={[styles.leaderRank, { backgroundColor: colors.primary }]}>
              <Text allowFontScaling={false} style={[styles.rankText, { color: colors.textOnPrimary }]}>1</Text>
            </View>
            <View style={styles.leaderInfo}>
              <Text allowFontScaling={false} style={[styles.leaderName, { color: colors.text }]}>You</Text>
              <Text allowFontScaling={false} style={[styles.leaderStat, { color: colors.textMuted }]}>12 day streak</Text>
            </View>
            <Ionicons name="trophy" size={20} color={colors.primary} />
          </View>
          <Text allowFontScaling={false} style={[styles.cardHint, { color: colors.textMuted }]}>
            Invite friends to compete
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_600SemiBold",
    marginTop: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    marginBottom: 24,
  },
  card: {
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
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  cardHint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 16,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  leaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
  },
  leaderRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  leaderInfo: {
    flex: 1,
  },
  leaderName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  leaderStat: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
