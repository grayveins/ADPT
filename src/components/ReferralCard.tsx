/**
 * ReferralCard
 * Shows referral stats with copyable code and share button.
 * Teal accent on dark card background.
 */

import React, { useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import type { ReferralData } from "@/src/hooks/useReferral";

type ReferralCardProps = {
  referral: ReferralData;
  onShare: () => void;
};

export function ReferralCard({ referral, onShare }: ReferralCardProps) {
  const { colors, radius, components, shadows } = useTheme();

  const copyCode = useCallback(async () => {
    if (!referral.referralCode) return;
    await Clipboard.setStringAsync(referral.referralCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [referral.referralCode]);

  if (referral.loading) return null;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          padding: components.card.padding,
          ...shadows.card,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: colors.primaryMuted },
          ]}
        >
          <Ionicons name="gift-outline" size={22} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>
            Invite friends, earn XP
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Each friend who joins earns you 500 XP
          </Text>
        </View>
      </View>

      {/* Code row */}
      <Pressable onPress={copyCode} style={styles.codeRow}>
        <View
          style={[
            styles.codePill,
            {
              backgroundColor: colors.primaryFaint,
              borderColor: colors.primary,
              borderRadius: radius.sm,
            },
          ]}
        >
          <Text style={[styles.codeText, { color: colors.primary }]}>
            {referral.referralCode || "---"}
          </Text>
          <Ionicons name="copy-outline" size={16} color={colors.primary} />
        </View>
        <Text style={[styles.tapHint, { color: colors.textMuted }]}>
          Tap to copy
        </Text>
      </Pressable>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {referral.totalReferred}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Referred
          </Text>
        </View>
        <View
          style={[styles.statDivider, { backgroundColor: colors.border }]}
        />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.gold }]}>
            {referral.xpEarned.toLocaleString()}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            XP Earned
          </Text>
        </View>
      </View>

      {/* Share button */}
      <Pressable
        onPress={onShare}
        style={({ pressed }) => [
          styles.shareButton,
          {
            backgroundColor: pressed ? colors.primaryDark : colors.primary,
            borderRadius: radius.md,
            height: components.button.heightSmall,
          },
        ]}
      >
        <Ionicons
          name="share-social-outline"
          size={20}
          color={colors.textOnPrimary}
        />
        <Text style={[styles.shareText, { color: colors.textOnPrimary }]}>
          Share Invite
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 13,
  },
  codeRow: {
    alignItems: "center",
    gap: 4,
  },
  codePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    alignSelf: "center",
  },
  codeText: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  tapHint: {
    fontSize: 11,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 13,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  shareText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ReferralCard;
