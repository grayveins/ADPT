import { StyleSheet, Text, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { darkColors } from "@/src/theme";

export default function SocialScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text allowFontScaling={false} style={styles.title}>
          Community
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          Connect with others on the same journey
        </Text>

        {/* Community Feed Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="people-outline" size={20} color={darkColors.primary} />
            <Text allowFontScaling={false} style={styles.cardTitle}>
              Community Feed
            </Text>
          </View>
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubbles-outline" size={32} color={darkColors.muted} />
            </View>
            <Text allowFontScaling={false} style={styles.emptyTitle}>
              Coming Soon
            </Text>
            <Text allowFontScaling={false} style={styles.emptyText}>
              Your network will appear here. Share wins, routines, and motivation with others.
            </Text>
          </View>
        </View>

        {/* Public Routines Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="barbell-outline" size={20} color={darkColors.primary} />
            <Text allowFontScaling={false} style={styles.cardTitle}>
              Public Routines
            </Text>
          </View>
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="list-outline" size={32} color={darkColors.muted} />
            </View>
            <Text allowFontScaling={false} style={styles.emptyTitle}>
              Browse & Save
            </Text>
            <Text allowFontScaling={false} style={styles.emptyText}>
              Discover training blocks from others and add them to your library.
            </Text>
          </View>
        </View>

        {/* Leaderboard Preview */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="podium-outline" size={20} color={darkColors.primary} />
            <Text allowFontScaling={false} style={styles.cardTitle}>
              Leaderboard
            </Text>
          </View>
          <View style={styles.leaderRow}>
            <View style={styles.leaderRank}>
              <Text allowFontScaling={false} style={styles.rankText}>1</Text>
            </View>
            <View style={styles.leaderInfo}>
              <Text allowFontScaling={false} style={styles.leaderName}>You</Text>
              <Text allowFontScaling={false} style={styles.leaderStat}>12 day streak</Text>
            </View>
            <Ionicons name="trophy" size={20} color={darkColors.primary} />
          </View>
          <Text allowFontScaling={false} style={styles.cardHint}>
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
  emptyState: {
    alignItems: "center",
    paddingVertical: 16,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: darkColors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    color: darkColors.text,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 6,
  },
  emptyText: {
    color: darkColors.muted,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  leaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: darkColors.selectedBg,
    padding: 12,
    borderRadius: 12,
  },
  leaderRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: darkColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    color: "#000",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  leaderInfo: {
    flex: 1,
  },
  leaderName: {
    color: darkColors.text,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  leaderStat: {
    color: darkColors.muted,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
