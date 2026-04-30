/**
 * HealthConnectScreen
 * Apple Health / Google Fit integration option
 */

import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable, Platform } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { theme } from "@/src/theme";
import { useOnboarding } from "@/src/context/OnboardingContext";
import Button from "@/src/components/Button";
import { hapticPress } from "@/src/animations/feedback/haptics";

type HealthConnectScreenProps = {
  onNext: () => void;
};

const benefits = [
  {
    icon: "heart",
    title: "Track activity",
    description: "Sync steps, calories, and workouts",
  },
  {
    icon: "pulse",
    title: "Recovery insights",
    description: "Use sleep and HRV data for better rest recommendations",
  },
  {
    icon: "trending-up",
    title: "Complete picture",
    description: "See all your health data in one place",
  },
];

export default function HealthConnectScreen({ onNext }: HealthConnectScreenProps) {
  const { colors } = useTheme();
  const { updateForm } = useOnboarding();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleConnect = async () => {
    hapticPress();
    // In a real app, this would trigger HealthKit/Google Fit permission request
    // For now, we'll just mark it as connected
    updateForm({ appleHealthConnected: true });
    onNext();
  };

  const handleSkip = () => {
    hapticPress();
    updateForm({ appleHealthConnected: false });
    onNext();
  };

  const healthAppName = Platform.OS === "ios" ? "Apple Health" : "Google Fit";

  return (
    <ScrollView 
      contentContainerStyle={styles.container} 
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons 
              name={Platform.OS === "ios" ? "heart" : "fitness"} 
              size={40} 
              color={colors.primary} 
            />
          </View>
        </View>

        <Text allowFontScaling={false} style={styles.title}>
          Connect {healthAppName}?
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          Get smarter recommendations by syncing your health data.
        </Text>
      </Animated.View>

      {/* Benefits */}
      <View style={styles.benefits}>
        {benefits.map((benefit, index) => (
          <Animated.View
            key={benefit.title}
            entering={FadeInDown.delay(index * 100 + 200).duration(400)}
            style={styles.benefit}
          >
            <View style={styles.benefitIcon}>
              <Ionicons name={benefit.icon as any} size={22} color={colors.primary} />
            </View>
            <View style={styles.benefitContent}>
              <Text allowFontScaling={false} style={styles.benefitTitle}>
                {benefit.title}
              </Text>
              <Text allowFontScaling={false} style={styles.benefitDescription}>
                {benefit.description}
              </Text>
            </View>
          </Animated.View>
        ))}
      </View>

      {/* Privacy note */}
      <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.privacy}>
        <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
        <Text allowFontScaling={false} style={styles.privacyText}>
          Your data stays private and secure. We never share it with third parties.
        </Text>
      </Animated.View>

      {/* Actions */}
      <View style={styles.footer}>
        <Button 
          title={`Connect ${healthAppName}`}
          onPress={handleConnect}
        />
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Text allowFontScaling={false} style={styles.skipText}>
            Maybe later
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      paddingVertical: 16,
      gap: 28,
    },
    header: {
      alignItems: "center",
      gap: 12,
    },
    iconContainer: {
      marginBottom: 8,
    },
    iconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.selected,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: colors.primary,
    },
    title: {
      color: colors.text,
      fontSize: 26,
      fontFamily: theme.fonts.heading,
      textAlign: "center",
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 15,
      fontFamily: theme.fonts.body,
      textAlign: "center",
      lineHeight: 22,
      maxWidth: 280,
    },
    benefits: {
      gap: 16,
    },
    benefit: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 14,
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
    },
    benefitIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.selected,
      alignItems: "center",
      justifyContent: "center",
    },
    benefitContent: {
      flex: 1,
      gap: 2,
    },
    benefitTitle: {
      color: colors.text,
      fontSize: 16,
      fontFamily: theme.fonts.bodySemiBold,
    },
    benefitDescription: {
      color: colors.textMuted,
      fontSize: 13,
      fontFamily: theme.fonts.body,
      lineHeight: 18,
    },
    privacy: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      paddingHorizontal: 4,
    },
    privacyText: {
      flex: 1,
      color: colors.textMuted,
      fontSize: 13,
      fontFamily: theme.fonts.body,
      lineHeight: 18,
    },
    footer: {
      marginTop: "auto",
      gap: 12,
      paddingTop: 16,
    },
    skipButton: {
      paddingVertical: 12,
      alignItems: "center",
    },
    skipText: {
      color: colors.textMuted,
      fontSize: 15,
      fontFamily: theme.fonts.bodyMedium,
    },
  });
