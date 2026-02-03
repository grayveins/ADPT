/**
 * NotificationsScreen
 * Enable push notifications (priming for engagement)
 * Shows value of notifications before asking
 */

import React, { useEffect, useMemo } from "react";
import { StyleSheet, Text, View, Pressable, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  withRepeat,
  withSequence,
  FadeInDown,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useTheme } from "@/src/context/ThemeContext";
import { theme } from "@/src/theme";
import { hapticPress, hapticCelebration } from "@/src/animations/feedback/haptics";
import { registerForPushNotifications } from "@/lib/pushNotifications";

type NotificationsScreenProps = {
  onNext: () => void;
};

const benefits = [
  {
    icon: "calendar-outline",
    title: "Workout reminders",
    description: "Never miss a training day",
  },
  {
    icon: "trophy-outline",
    title: "Celebrate wins",
    description: "Get notified when you hit PRs",
  },
  {
    icon: "chatbubble-outline",
    title: "Coach messages",
    description: "Tips and motivation from your AI coach",
  },
];

// Animated notification preview
function NotificationPreview({ colors }: { colors: ReturnType<typeof useTheme>["colors"] }) {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Slide in from top
    translateY.value = withDelay(
      800,
      withSpring(0, { damping: 15 })
    );
    opacity.value = withDelay(800, withTiming(1, { duration: 300 }));

    // Pulse effect after appearing
    setTimeout(() => {
      translateY.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }, 1500);
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{
      flexDirection: "row",
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 14,
      gap: 12,
      marginBottom: 32,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8,
    }, style]}>
      <View style={{ alignSelf: "flex-start" }}>
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.primary,
        }}>
          <Ionicons name="fitness" size={20} color={colors.textOnPrimary} />
        </View>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text allowFontScaling={false} style={{ color: colors.textMuted, fontSize: 12, fontFamily: theme.fonts.bodyMedium }}>ADPT</Text>
          <Text allowFontScaling={false} style={{ color: colors.inputPlaceholder, fontSize: 12, fontFamily: theme.fonts.body }}>now</Text>
        </View>
        <Text allowFontScaling={false} style={{ color: colors.text, fontSize: 15, fontFamily: theme.fonts.bodySemiBold }}>
          Time to train!
        </Text>
        <Text allowFontScaling={false} style={{ color: colors.textMuted, fontSize: 14, fontFamily: theme.fonts.body }}>
          Your Push workout is ready. Let&apos;s crush it today!
        </Text>
      </View>
    </Animated.View>
  );
}

export default function NotificationsScreen({ onNext }: NotificationsScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(20);
  const bellScale = useSharedValue(0);
  const bellRotate = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));
    headerY.value = withDelay(100, withSpring(0, { damping: 20 }));
    
    bellScale.value = withDelay(300, withSpring(1, { damping: 10 }));
    
    // Bell ring animation
    setTimeout(() => {
      bellRotate.value = withRepeat(
        withSequence(
          withTiming(15, { duration: 100 }),
          withTiming(-15, { duration: 100 }),
          withTiming(10, { duration: 100 }),
          withTiming(-10, { duration: 100 }),
          withTiming(0, { duration: 100 })
        ),
        2,
        false
      );
    }, 600);
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));

  const bellStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: bellScale.value },
      { rotate: `${bellRotate.value}deg` },
    ],
  }));

  const handleEnable = async () => {
    hapticPress();
    
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === "granted") {
      hapticCelebration();
      // Register and save push token to profile
      await registerForPushNotifications();
    }
    
    onNext();
  };

  const handleSkip = () => {
    hapticPress();
    onNext();
  };

  return (
    <View style={styles.container}>
      {/* Notification preview */}
      <NotificationPreview colors={colors} />

      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <Animated.View style={[styles.bellContainer, bellStyle]}>
          <Ionicons name="notifications" size={48} color={colors.primary} />
        </Animated.View>
        
        <Text allowFontScaling={false} style={styles.title}>
          Stay on track
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          Enable notifications to never miss a workout and celebrate your progress
        </Text>
      </Animated.View>

      {/* Benefits */}
      <View style={styles.benefits}>
        {benefits.map((benefit, index) => (
          <Animated.View
            key={benefit.title}
            entering={FadeInDown.delay(400 + index * 100).duration(400)}
            style={styles.benefitItem}
          >
            <View style={styles.benefitIcon}>
              <Ionicons name={benefit.icon as any} size={24} color={colors.primary} />
            </View>
            <View style={styles.benefitText}>
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

      {/* CTA buttons */}
      <Animated.View 
        entering={FadeInDown.delay(700).duration(400)}
        style={styles.ctaContainer}
      >
        <Pressable
          onPress={handleEnable}
          style={({ pressed }) => [
            styles.ctaButton,
            pressed && styles.ctaButtonPressed,
          ]}
        >
          <View style={styles.ctaGradient}>
            <Ionicons name="notifications" size={20} color={colors.textOnPrimary} />
            <Text allowFontScaling={false} style={styles.ctaText}>
              Enable Notifications
            </Text>
          </View>
        </Pressable>

        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Text allowFontScaling={false} style={styles.skipText}>
            Maybe Later
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingVertical: 16,
    },
    header: {
      alignItems: "center",
      gap: 12,
      marginBottom: 32,
    },
    bellContainer: {
      marginBottom: 8,
    },
    title: {
      color: colors.text,
      fontSize: 28,
      fontFamily: theme.fonts.heading,
      textAlign: "center",
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 16,
      fontFamily: theme.fonts.body,
      textAlign: "center",
      lineHeight: 24,
      paddingHorizontal: 20,
    },
    benefits: {
      gap: 16,
      marginBottom: 32,
    },
    benefitItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
    },
    benefitIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.selected,
      alignItems: "center",
      justifyContent: "center",
    },
    benefitText: {
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
      fontSize: 14,
      fontFamily: theme.fonts.body,
    },
    ctaContainer: {
      marginTop: "auto",
      gap: 12,
    },
    ctaButton: {
      borderRadius: 28,
      overflow: "hidden",
    },
    ctaButtonPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
    },
    ctaGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 18,
      paddingHorizontal: 32,
      backgroundColor: colors.primary,
    },
    ctaText: {
      color: colors.textOnPrimary,
      fontSize: 17,
      fontFamily: theme.fonts.bodySemiBold,
    },
    skipButton: {
      alignItems: "center",
      paddingVertical: 12,
    },
    skipText: {
      color: colors.textMuted,
      fontSize: 15,
      fontFamily: theme.fonts.bodyMedium,
    },
  });
