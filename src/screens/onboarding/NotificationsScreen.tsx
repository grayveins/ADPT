/**
 * NotificationsScreen
 * Enable push notifications (priming for engagement)
 * Shows value of notifications before asking
 */

import React, { useEffect } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import { darkColors, theme } from "@/src/theme";
import { hapticPress, hapticCelebration } from "@/src/animations/feedback/haptics";

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
function NotificationPreview() {
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
    <Animated.View style={[styles.notificationPreview, style]}>
      <View style={styles.notificationIcon}>
        <LinearGradient
          colors={[darkColors.primary, darkColors.primaryDark]}
          style={styles.notificationIconGradient}
        >
          <Ionicons name="fitness" size={20} color="#000" />
        </LinearGradient>
      </View>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text allowFontScaling={false} style={styles.notificationApp}>ADPT</Text>
          <Text allowFontScaling={false} style={styles.notificationTime}>now</Text>
        </View>
        <Text allowFontScaling={false} style={styles.notificationTitle}>
          Time to train!
        </Text>
        <Text allowFontScaling={false} style={styles.notificationBody}>
          Your Push workout is ready. Let&apos;s crush it today!
        </Text>
      </View>
    </Animated.View>
  );
}

export default function NotificationsScreen({ onNext }: NotificationsScreenProps) {
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
      <NotificationPreview />

      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <Animated.View style={[styles.bellContainer, bellStyle]}>
          <Ionicons name="notifications" size={48} color={darkColors.primary} />
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
              <Ionicons name={benefit.icon as any} size={24} color={darkColors.primary} />
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
          <LinearGradient
            colors={[darkColors.primary, darkColors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Ionicons name="notifications" size={20} color="#000" />
            <Text allowFontScaling={false} style={styles.ctaText}>
              Enable Notifications
            </Text>
          </LinearGradient>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 16,
  },
  notificationPreview: {
    flexDirection: "row",
    backgroundColor: darkColors.card,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: darkColors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  notificationIcon: {
    alignSelf: "flex-start",
  },
  notificationIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationContent: {
    flex: 1,
    gap: 2,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notificationApp: {
    color: darkColors.muted,
    fontSize: 12,
    fontFamily: theme.fonts.bodyMedium,
  },
  notificationTime: {
    color: darkColors.muted2,
    fontSize: 12,
    fontFamily: theme.fonts.body,
  },
  notificationTitle: {
    color: darkColors.text,
    fontSize: 15,
    fontFamily: theme.fonts.bodySemiBold,
  },
  notificationBody: {
    color: darkColors.muted,
    fontSize: 14,
    fontFamily: theme.fonts.body,
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
    color: darkColors.text,
    fontSize: 28,
    fontFamily: theme.fonts.heading,
    textAlign: "center",
  },
  subtitle: {
    color: darkColors.muted,
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
    backgroundColor: darkColors.card,
    borderRadius: 14,
    padding: 16,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: darkColors.selectedBg,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: {
    flex: 1,
    gap: 2,
  },
  benefitTitle: {
    color: darkColors.text,
    fontSize: 16,
    fontFamily: theme.fonts.bodySemiBold,
  },
  benefitDescription: {
    color: darkColors.muted,
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
  },
  ctaText: {
    color: "#000",
    fontSize: 17,
    fontFamily: theme.fonts.bodySemiBold,
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  skipText: {
    color: darkColors.muted,
    fontSize: 15,
    fontFamily: theme.fonts.bodyMedium,
  },
});
