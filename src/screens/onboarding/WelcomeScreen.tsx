/**
 * WelcomeScreen
 * Minimalist, fitness-centric welcome with name input
 * Inspired by premium fitness apps (Fitbod, Hevy, Strong)
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
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
  withRepeat,
  withSequence,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { theme } from "@/src/theme";
import { useOnboarding } from "@/src/context/OnboardingContext";
import { hapticPress } from "@/src/animations/feedback/haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type WelcomeScreenProps = {
  onNext: () => void;
};

// Abstract fitness-themed decorative element
function FitnessGraphic({ colors }: { colors: ReturnType<typeof useTheme>["colors"] }) {
  const barHeights = [0.4, 0.6, 0.8, 1.0, 0.7, 0.5, 0.3];
  const animatedValues = barHeights.map(() => useSharedValue(0));

  useEffect(() => {
    animatedValues.forEach((av, i) => {
      av.value = withDelay(
        100 + i * 80,
        withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.2)) })
      );
    });
  }, []);

  return (
    <View style={graphicStyles.container}>
      {/* Abstract progress bars representing growth */}
      <View style={graphicStyles.barsContainer}>
        {barHeights.map((height, i) => {
          const animatedStyle = useAnimatedStyle(() => ({
            transform: [{ scaleY: animatedValues[i].value }],
          }));

          return (
            <Animated.View
              key={i}
              style={[
                graphicStyles.bar,
                { 
                  height: height * 80,
                  backgroundColor: i === 3 ? colors.primary : `${colors.primary}${Math.round((0.2 + i * 0.1) * 255).toString(16).padStart(2, '0')}`,
                },
                animatedStyle,
              ]}
            />
          );
        })}
      </View>
      
      {/* Subtle pulse ring */}
      <View style={[graphicStyles.pulseRing, { borderColor: `${colors.primary}20` }]} />
      <View style={[graphicStyles.pulseRingInner, { borderColor: `${colors.primary}10` }]} />
    </View>
  );
}

const graphicStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    height: 140,
    marginBottom: 8,
  },
  barsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    height: 80,
  },
  bar: {
    width: 12,
    borderRadius: 6,
    transformOrigin: "bottom",
  },
  pulseRing: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
  },
  pulseRingInner: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
  },
});

export default function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { form, updateForm } = useOnboarding();
  const [name, setName] = useState(form.firstName || "");
  const inputRef = useRef<TextInput>(null);

  // Animation values
  const graphicOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const inputOpacity = useSharedValue(0);
  const footerOpacity = useSharedValue(0);

  useEffect(() => {
    graphicOpacity.value = withDelay(100, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    contentOpacity.value = withDelay(300, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    inputOpacity.value = withDelay(500, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    footerOpacity.value = withDelay(700, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }));
  }, []);

  const graphicStyle = useAnimatedStyle(() => ({
    opacity: graphicOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
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
      {/* Decorative graphic */}
      <Animated.View style={[styles.graphicSection, graphicStyle]}>
        <FitnessGraphic colors={colors} />
      </Animated.View>

      {/* Brand and Value Prop */}
      <Animated.View style={[styles.contentSection, contentStyle]}>
        <View style={styles.brandRow}>
          <Text allowFontScaling={false} style={styles.brandName}>
            ADPT
          </Text>
          <View style={styles.tagline}>
            <Text allowFontScaling={false} style={styles.taglineText}>
              AI-Powered Training
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
              AI coach available 24/7
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
    graphicSection: {
      marginTop: 16,
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
