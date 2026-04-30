/**
 * SecondChanceOffer
 *
 * A "second chance" discount modal that appears after repeated paywall dismissals.
 * Shows a compelling 25% off offer with countdown timer to create urgency.
 * Follows the Gravl/Fastic pattern: after 4-5 dismissals, present a discount
 * as a special limited-time offer rather than a desperate plea.
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { theme, radius, spacing } from "@/src/theme";
import { hapticPress, hapticSuccess } from "@/src/animations/feedback/haptics";

type SecondChanceOfferProps = {
  visible: boolean;
  onClose: () => void;
  onClaim: () => void;
  originalPrice: string;
  discountedPrice: string;
  monthlySavings?: string;
};

const COUNTDOWN_SECONDS = 10 * 60; // 10 minutes

export default function SecondChanceOffer({
  visible,
  onClose,
  onClaim,
  originalPrice,
  discountedPrice,
  monthlySavings,
}: SecondChanceOfferProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset and start countdown when modal becomes visible
  useEffect(() => {
    if (visible) {
      setSecondsLeft(COUNTDOWN_SECONDS);
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [visible]);

  // Auto-dismiss when timer expires
  useEffect(() => {
    if (secondsLeft === 0 && visible) {
      onClose();
    }
  }, [secondsLeft, visible, onClose]);

  const formattedTime = useMemo(() => {
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, [secondsLeft]);

  const handleClaim = useCallback(() => {
    hapticSuccess();
    onClaim();
  }, [onClaim]);

  const handleDismiss = useCallback(() => {
    hapticPress();
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={handleDismiss}>
        <Animated.View
          entering={FadeInDown.duration(350).springify().damping(18).stiffness(200)}
          style={styles.sheet}
        >
          <Pressable onPress={() => {}} style={styles.sheetContent}>
            {/* Countdown badge */}
            <Animated.View entering={FadeIn.delay(200).duration(300)} style={styles.timerBadge}>
              <Ionicons name="time-outline" size={14} color={colors.gold} />
              <Text allowFontScaling={false} style={styles.timerText}>
                Offer expires in {formattedTime}
              </Text>
            </Animated.View>

            {/* Offer icon */}
            <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.iconCircle}>
              <Ionicons name="pricetag" size={28} color={colors.gold} />
            </Animated.View>

            {/* Headline */}
            <Animated.View entering={FadeInDown.delay(150).duration(300)}>
              <Text allowFontScaling={false} style={styles.headline}>
                Wait — here&apos;s 25% off{"\n"}your first year
              </Text>
            </Animated.View>

            {/* Price comparison */}
            <Animated.View entering={FadeInDown.delay(200).duration(300)} style={styles.priceCard}>
              <View style={styles.priceRow}>
                <Text allowFontScaling={false} style={styles.originalPrice}>
                  {originalPrice}
                </Text>
                <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
                <Text allowFontScaling={false} style={styles.discountedPrice}>
                  {discountedPrice}
                </Text>
              </View>
              {monthlySavings && (
                <Text allowFontScaling={false} style={styles.monthlySavings}>
                  That&apos;s just {monthlySavings} — less than a coffee
                </Text>
              )}
            </Animated.View>

            {/* Social proof */}
            <Animated.View entering={FadeIn.delay(300).duration(300)} style={styles.socialRow}>
              <Ionicons name="people" size={14} color={colors.primary} />
              <Text allowFontScaling={false} style={styles.socialText}>
                Join 50K+ users getting stronger
              </Text>
            </Animated.View>

            {/* Claim CTA */}
            <Animated.View entering={FadeInDown.delay(350).duration(300)} style={styles.ctaWrapper}>
              <Pressable
                onPress={handleClaim}
                style={({ pressed }) => [
                  styles.claimButton,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Ionicons name="flash" size={18} color={colors.textOnPrimary} />
                <Text allowFontScaling={false} style={styles.claimText}>
                  Claim Offer
                </Text>
              </Pressable>
            </Animated.View>

            {/* Trial note */}
            <View style={styles.trialNote}>
              <Ionicons name="shield-checkmark" size={13} color={colors.textMuted} />
              <Text allowFontScaling={false} style={styles.trialNoteText}>
                7-day free trial included
              </Text>
            </View>

            {/* Dismiss */}
            <Pressable onPress={handleDismiss} style={styles.dismissButton}>
              <Text allowFontScaling={false} style={styles.dismissText}>
                No thanks
              </Text>
            </Pressable>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.bg,
      borderTopLeftRadius: radius.xxl,
      borderTopRightRadius: radius.xxl,
      paddingBottom: 40,
    },
    sheetContent: {
      alignItems: "center",
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xxl,
      gap: spacing.md,
    },

    // Timer badge
    timerBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(255, 215, 0, 0.12)",
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: "rgba(255, 215, 0, 0.25)",
    },
    timerText: {
      color: colors.gold,
      fontFamily: theme.fonts.bodySemiBold,
      fontSize: 13,
      fontWeight: "600",
    },

    // Icon
    iconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: "rgba(255, 215, 0, 0.12)",
      alignItems: "center",
      justifyContent: "center",
    },

    // Headline
    headline: {
      color: colors.text,
      fontFamily: theme.fonts.heading,
      fontSize: 24,
      fontWeight: "700",
      textAlign: "center",
      lineHeight: 32,
    },

    // Price comparison card
    priceCard: {
      width: "100%",
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.base,
      paddingVertical: 14,
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    priceRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    originalPrice: {
      color: colors.textMuted,
      fontFamily: theme.fonts.body,
      fontSize: 18,
      textDecorationLine: "line-through",
      textDecorationStyle: "solid",
    },
    discountedPrice: {
      color: colors.primary,
      fontFamily: theme.fonts.heading,
      fontSize: 28,
      fontWeight: "700",
    },
    monthlySavings: {
      color: colors.textSecondary,
      fontFamily: theme.fonts.body,
      fontSize: 13,
    },

    // Social proof
    socialRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    socialText: {
      color: colors.textSecondary,
      fontFamily: theme.fonts.bodyMedium,
      fontSize: 13,
    },

    // CTA
    ctaWrapper: {
      width: "100%",
      marginTop: spacing.xs,
    },
    claimButton: {
      width: "100%",
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    claimText: {
      color: colors.textOnPrimary,
      fontFamily: theme.fonts.bodySemiBold,
      fontSize: 17,
      fontWeight: "600",
    },

    // Trial note
    trialNote: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    trialNoteText: {
      color: colors.textMuted,
      fontFamily: theme.fonts.body,
      fontSize: 12,
    },

    // Dismiss
    dismissButton: {
      paddingVertical: 8,
    },
    dismissText: {
      color: colors.textMuted,
      fontFamily: theme.fonts.body,
      fontSize: 14,
    },
  });
