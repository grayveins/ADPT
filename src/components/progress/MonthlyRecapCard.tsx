/**
 * MonthlyRecapCard
 *
 * "Spotify Wrapped for Training" — a shareable 9:16 card showing
 * the user's previous-month training highlights. Tapping opens a
 * full-screen modal; the inner card is captured via react-native-view-shot
 * and shared as a PNG.
 *
 * Always rendered in dark theme (it's a shareable image).
 */

import React, { useRef, useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import ViewShot from "react-native-view-shot";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import type { MonthlyRecap } from "@/src/hooks/useMonthlyRecap";
import { captureAndShare } from "@/src/utils/shareCard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MonthlyRecapCardProps = {
  visible: boolean;
  onClose: () => void;
  recap: MonthlyRecap;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format large numbers: 123456 -> "123,456" */
function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

/** Minutes -> "12h 34m" */
function fmtTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

// ---------------------------------------------------------------------------
// Animated count-up (lightweight, no reanimated dependency)
// ---------------------------------------------------------------------------

function CountUp({
  to,
  duration = 1200,
  style,
  formatter = String,
}: {
  to: number;
  duration?: number;
  style?: any;
  formatter?: (n: number) => string;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (to === 0) {
      setDisplay(0);
      return;
    }

    const startTime = Date.now();
    let raf: number;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(to * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);

  return (
    <Text allowFontScaling={false} style={style}>
      {formatter(display)}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// Stat cell for the 2x3 grid
// ---------------------------------------------------------------------------

function StatCell({
  value,
  label,
  formatter = fmtNum,
}: {
  value: number;
  label: string;
  formatter?: (n: number) => string;
}) {
  return (
    <View style={styles.statCell}>
      <CountUp
        to={value}
        style={styles.statValue}
        formatter={formatter}
      />
      <Text allowFontScaling={false} style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MonthlyRecapCard({ visible, onClose, recap }: MonthlyRecapCardProps) {
  const viewShotRef = useRef<ViewShot>(null);

  const handleShare = async () => {
    await captureAndShare(viewShotRef, `adpt-recap-${recap.month.replace(/\s/g, "-").toLowerCase()}`);
  };

  if (recap.loading) {
    return (
      <Modal visible={visible} animationType="fade" transparent>
        <View style={styles.backdrop}>
          <ActivityIndicator size="large" color="#00C9B7" />
        </View>
      </Modal>
    );
  }

  const srPositive = recap.srChange >= 0;

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={styles.backdrop}>
        {/* ── Shareable card (captured by ViewShot) ─────────────────── */}
        <ViewShot
          ref={viewShotRef}
          options={{ format: "png", quality: 1 }}
          style={styles.cardOuter}
        >
          <LinearGradient
            colors={["#0A0A0A", "#111111", "#141414"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Subtle glow behind title */}
          <View style={styles.glow} />

          <View style={styles.content}>
            {/* ── Brand header ──────────────────────────────────────── */}
            <View style={styles.headerRow}>
              <View style={styles.brandRow}>
                <Text allowFontScaling={false} style={styles.brandMark}>
                  ADPT
                </Text>
                <View style={styles.brandDot} />
              </View>
              <Text allowFontScaling={false} style={styles.monthLabel}>
                {recap.month.toUpperCase()}
              </Text>
            </View>

            {/* ── Title ────────────────────────────────────────────── */}
            <Text allowFontScaling={false} style={styles.title}>
              Monthly Recap
            </Text>

            {/* ── Stats grid (2x3) ─────────────────────────────────── */}
            <View style={styles.statsGrid}>
              <View style={styles.statsRow}>
                <StatCell value={recap.workouts} label="Workouts" />
                <StatCell value={recap.totalVolume} label="Volume (lbs)" />
              </View>
              <View style={styles.statsRow}>
                <StatCell value={recap.prs} label="PRs Hit" />
                <StatCell value={recap.longestStreak} label="Best Streak" />
              </View>
              <View style={styles.statsRow}>
                <StatCell
                  value={recap.totalMinutes}
                  label="Time Training"
                  formatter={fmtTime}
                />
                <StatCell value={recap.totalSets} label="Total Sets" />
              </View>
            </View>

            {/* ── Highlights card ──────────────────────────────────── */}
            <View style={styles.highlightCard}>
              <View style={styles.highlightRow}>
                <Ionicons name="barbell-outline" size={16} color="#00C9B7" />
                <Text allowFontScaling={false} style={styles.highlightLabel}>
                  Top Lift
                </Text>
                <Text allowFontScaling={false} style={styles.highlightValue}>
                  {recap.favoriteExercise}
                </Text>
              </View>
              <View style={styles.highlightDivider} />
              <View style={styles.highlightRow}>
                <Ionicons name="body-outline" size={16} color="#00C9B7" />
                <Text allowFontScaling={false} style={styles.highlightLabel}>
                  Top Muscle
                </Text>
                <Text allowFontScaling={false} style={styles.highlightValue}>
                  {recap.topMuscle}
                </Text>
              </View>
            </View>

            {/* ── SR change pill ───────────────────────────────────── */}
            {recap.srChange !== 0 && (
              <View
                style={[
                  styles.srPill,
                  {
                    backgroundColor: srPositive
                      ? "rgba(0, 201, 183, 0.12)"
                      : "rgba(248, 113, 113, 0.12)",
                    borderColor: srPositive
                      ? "rgba(0, 201, 183, 0.25)"
                      : "rgba(248, 113, 113, 0.25)",
                  },
                ]}
              >
                <Ionicons
                  name={srPositive ? "arrow-up" : "arrow-down"}
                  size={18}
                  color={srPositive ? "#00C9B7" : "#F87171"}
                />
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.srText,
                    { color: srPositive ? "#00C9B7" : "#F87171" },
                  ]}
                >
                  {srPositive ? "+" : ""}
                  {recap.srChange} SR this month
                </Text>
              </View>
            )}

            {/* ── Spacer ──────────────────────────────────────────── */}
            <View style={{ flex: 1 }} />

            {/* ── Watermark ───────────────────────────────────────── */}
            <Text allowFontScaling={false} style={styles.watermark}>
              adptfit.com
            </Text>
          </View>
        </ViewShot>

        {/* ── Action buttons (below the card, not captured) ────────── */}
        <View style={styles.actions}>
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [
              styles.shareBtn,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="share-outline" size={20} color="#0A0A0A" />
            <Text allowFontScaling={false} style={styles.shareBtnText}>
              Share
            </Text>
          </Pressable>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeBtn,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text allowFontScaling={false} style={styles.closeBtnText}>
              Close
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default MonthlyRecapCard;

// ---------------------------------------------------------------------------
// Styles — always dark themed (shareable image)
// ---------------------------------------------------------------------------

const CARD_WIDTH = 340;
const CARD_HEIGHT = (CARD_WIDTH * 16) / 9; // 9:16 aspect ratio

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Card (captured) ────────────────────────────────────────────
  cardOuter: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    top: "8%",
    left: "15%",
    right: "15%",
    height: "12%",
    borderRadius: 200,
    backgroundColor: "rgba(0, 201, 183, 0.06)",
  },
  content: {
    flex: 1,
    padding: 28,
  },

  // ── Header ─────────────────────────────────────────────────────
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  brandMark: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#F5F5F5",
    letterSpacing: 3,
  },
  brandDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#00C9B7",
  },
  monthLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: "#737373",
    letterSpacing: 2,
  },

  // ── Title ──────────────────────────────────────────────────────
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: "#F5F5F5",
    marginBottom: 24,
  },

  // ── Stats grid ─────────────────────────────────────────────────
  statsGrid: {
    gap: 16,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCell: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: "#F5F5F5",
    lineHeight: 26,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#737373",
    letterSpacing: 0.5,
  },

  // ── Highlight card ─────────────────────────────────────────────
  highlightCard: {
    backgroundColor: "rgba(0, 201, 183, 0.06)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0, 201, 183, 0.12)",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  highlightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  highlightLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#737373",
  },
  highlightValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#F5F5F5",
    flex: 1,
    textAlign: "right",
  },
  highlightDivider: {
    height: 1,
    backgroundColor: "rgba(0, 201, 183, 0.08)",
    marginVertical: 10,
  },

  // ── SR pill ────────────────────────────────────────────────────
  srPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  srText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    letterSpacing: 0.3,
  },

  // ── Watermark ──────────────────────────────────────────────────
  watermark: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#3D3D3D",
    textAlign: "center",
    letterSpacing: 1.5,
  },

  // ── Actions (below card) ───────────────────────────────────────
  actions: {
    marginTop: 20,
    alignItems: "center",
    gap: 12,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#00C9B7",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  shareBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#0A0A0A",
  },
  closeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  closeBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: "#A3A3A3",
  },
});
