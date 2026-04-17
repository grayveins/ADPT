/**
 * TrialBanner
 * Shows a subtle banner for users on the reverse trial,
 * reminding them how many days are left and nudging toward upgrade.
 */

import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "@/src/context/ThemeContext";
import { theme } from "@/src/theme";
import { useReverseTrial } from "@/src/hooks/useReverseTrial";
import { useSubscription } from "@/src/hooks/useSubscription";
import { hapticPress } from "@/src/animations/feedback/haptics";

export default function TrialBanner() {
  const { colors } = useTheme();
  const { isPro } = useSubscription();
  const { isTrialActive, daysRemaining, loading } = useReverseTrial();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Don't show if Pro, trial expired, or still loading
  if (isPro || !isTrialActive || loading) return null;

  const handleUpgrade = () => {
    hapticPress();
    router.push("/onboarding/editorial");
  };

  const urgency = daysRemaining <= 2;

  return (
    <Pressable onPress={handleUpgrade} style={[styles.banner, urgency && styles.bannerUrgent]}>
      <View style={styles.left}>
        <Ionicons
          name={urgency ? "timer-outline" : "sparkles"}
          size={16}
          color={urgency ? colors.intensity : colors.primary}
        />
        <View style={styles.textCol}>
          <Text allowFontScaling={false} style={[styles.text, urgency && styles.textUrgent]}>
            {daysRemaining === 1
              ? "Last day of free Pro trial"
              : `${daysRemaining} days left of free Pro trial`}
          </Text>
          {urgency && (
            <Text allowFontScaling={false} style={styles.loseText}>
              Keep unlimited workouts and full analytics
            </Text>
          )}
        </View>
      </View>
      <Text allowFontScaling={false} style={[styles.cta, urgency && styles.ctaUrgent]}>
        Keep Pro
      </Text>
    </Pressable>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    banner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.selected,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
      marginHorizontal: 16,
      marginTop: 8,
    },
    bannerUrgent: {
      backgroundColor: "rgba(255, 107, 53, 0.12)",
    },
    left: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
    },
    textCol: {
      flex: 1,
      gap: 1,
    },
    loseText: {
      color: colors.intensity,
      fontFamily: theme.fonts.body,
      fontSize: 11,
      opacity: 0.8,
    },
    text: {
      color: colors.text,
      fontFamily: theme.fonts.bodyMedium,
      fontSize: 13,
    },
    textUrgent: {
      color: colors.intensity,
    },
    cta: {
      color: colors.primary,
      fontFamily: theme.fonts.bodySemiBold,
      fontSize: 13,
    },
    ctaUrgent: {
      color: colors.intensity,
    },
  });
