/**
 * WelcomeScreen
 * Clean, minimal welcome with logo and name input
 * No bouncy animations - simple fade-ins only
 */

import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { theme } from "@/src/theme";
import { useOnboarding } from "@/src/context/OnboardingContext";
import { hapticPress } from "@/src/animations/feedback/haptics";

// Logo asset
const LOGO = require("@/assets/images/icon.png");

type WelcomeScreenProps = {
  onNext: () => void;
};

export default function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { form, updateForm } = useOnboarding();
  const [name, setName] = useState(form.firstName || "");
  const inputRef = useRef<TextInput>(null);

  // Animation values
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(20);
  const inputOpacity = useSharedValue(0);
  const footerOpacity = useSharedValue(0);

  useEffect(() => {
    // Logo: fade + scale with spring
    logoOpacity.value = withDelay(100, withTiming(1, { duration: 500 }));
    logoScale.value = withDelay(100, withSpring(1, { damping: 12, stiffness: 200 }));

    // No glow animation — clean and static

    // Content: fade + slide up with spring
    contentOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    contentTranslateY.value = withDelay(300, withSpring(0, { damping: 15, stiffness: 150 }));

    // Input and footer: simple fades
    inputOpacity.value = withDelay(500, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }));
    footerOpacity.value = withDelay(650, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const inputStyle = useAnimatedStyle(() => ({
    opacity: inputOpacity.value,
  }));

  const footerStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
  }));

  const handleNext = () => {
    hapticPress();
    updateForm({ firstName: name.trim() || undefined });
    onNext();
  };

  const canContinue = name.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Logo Section — clean, no glow */}
      <View style={styles.logoSection}>
        <Animated.View style={logoStyle}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        </Animated.View>
      </View>

      {/* Brand and Value Prop */}
      <Animated.View style={[styles.contentSection, contentStyle]}>
        <View style={styles.brandRow}>
          <Text allowFontScaling={false} style={styles.brandName}>
            ADPT
          </Text>
          <View style={styles.tagline}>
            <Text allowFontScaling={false} style={styles.taglineText}>
              Smart Training
            </Text>
          </View>
        </View>

        <Text allowFontScaling={false} style={styles.headline}>
          Workouts that adapt{"\n"}as you grow stronger
        </Text>

        {/* Value bullets */}
        <View style={styles.bullets}>
          <View style={styles.bullet}>
            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
            <Text allowFontScaling={false} style={styles.bulletText}>
              Personalized to your goals
            </Text>
          </View>
          <View style={styles.bullet}>
            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
            <Text allowFontScaling={false} style={styles.bulletText}>
              Adjusts based on your progress
            </Text>
          </View>
          <View style={styles.bullet}>
            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
            <Text allowFontScaling={false} style={styles.bulletText}>
              Built around your schedule
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Name Input */}
      <Animated.View style={[styles.inputSection, inputStyle]}>
        <Text allowFontScaling={false} style={styles.inputLabel}>
          What should we call you?
        </Text>
        <TextInput
          ref={inputRef}
          value={name}
          onChangeText={setName}
          placeholder="Your first name"
          placeholderTextColor={colors.inputPlaceholder}
          style={styles.input}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={canContinue ? handleNext : undefined}
        />
      </Animated.View>

      {/* Footer */}
      <Animated.View style={[styles.footer, footerStyle]}>
        <Pressable
          onPress={handleNext}
          disabled={!canContinue}
          style={({ pressed }) => [
            styles.ctaButton,
            !canContinue && styles.ctaButtonDisabled,
            pressed && canContinue && styles.ctaButtonPressed,
          ]}
        >
          <Text allowFontScaling={false} style={[
            styles.ctaText,
            !canContinue && styles.ctaTextDisabled,
          ]}>
            Get Started
          </Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color={canContinue ? colors.textOnPrimary : colors.textMuted}
          />
        </Pressable>

        <Text allowFontScaling={false} style={styles.footerNote}>
          Takes about 2 minutes to set up your plan
        </Text>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingBottom: 24,
    },
    logoSection: {
      alignItems: "center",
      justifyContent: "center",
      marginTop: 24,
      marginBottom: 16,
      height: 140,
    },
    logoGlow: {
      position: "absolute",
      width: 140,
      height: 140,
      borderRadius: 70,
      opacity: 0.15,
    },
    logo: {
      width: 100,
      height: 100,
      borderRadius: 24,
    },
    contentSection: {
      gap: 20,
      marginTop: 8,
    },
    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    brandName: {
      color: colors.text,
      fontSize: 32,
      fontFamily: theme.fonts.bodySemiBold,
      letterSpacing: 4,
    },
    tagline: {
      backgroundColor: colors.selected,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    taglineText: {
      color: colors.primary,
      fontSize: 11,
      fontFamily: theme.fonts.bodyMedium,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    headline: {
      color: colors.text,
      fontSize: 26,
      fontFamily: theme.fonts.heading,
      lineHeight: 34,
    },
    bullets: {
      gap: 10,
    },
    bullet: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    bulletText: {
      color: colors.textMuted,
      fontSize: 14,
      fontFamily: theme.fonts.body,
    },
    inputSection: {
      marginTop: 28,
      gap: 10,
    },
    inputLabel: {
      color: colors.text,
      fontSize: 16,
      fontFamily: theme.fonts.bodySemiBold,
    },
    input: {
      backgroundColor: colors.card,
      borderRadius: 14,
      paddingVertical: 16,
      paddingHorizontal: 18,
      fontSize: 17,
      fontFamily: theme.fonts.body,
      color: colors.text,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    footer: {
      marginTop: "auto",
      gap: 14,
    },
    ctaButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 18,
      paddingHorizontal: 32,
      borderRadius: 16,
      backgroundColor: colors.primary,
    },
    ctaButtonDisabled: {
      backgroundColor: colors.border,
    },
    ctaButtonPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.99 }],
    },
    ctaText: {
      color: colors.textOnPrimary,
      fontSize: 17,
      fontFamily: theme.fonts.bodySemiBold,
    },
    ctaTextDisabled: {
      color: colors.textMuted,
    },
    footerNote: {
      color: colors.inputPlaceholder,
      fontSize: 13,
      fontFamily: theme.fonts.body,
      textAlign: "center",
    },
  });
