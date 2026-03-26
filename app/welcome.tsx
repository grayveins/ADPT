/**
 * Welcome Screen — Premium landing
 * Clean hero with brand, punchy copy, animated tagline rotation, teal glow.
 */

import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";

import { useTheme } from "@/src/context/ThemeContext";

const LOGO = require("@/assets/images/icon.png");

const TAGLINES = [
  "Your PT just got a lot cheaper.",
  "Programs that actually adapt to you.",
  "Built for people who lift, not scroll.",
];

const CYCLE_MS = 3000;

export default function Welcome() {
  const { colors } = useTheme();
  const s = useMemo(() => createStyles(colors), [colors]);

  // --- Staggered fade-ins ---
  const o1 = useSharedValue(0);
  const o2 = useSharedValue(0);
  const o3 = useSharedValue(0);
  const o4 = useSharedValue(0);
  const o5 = useSharedValue(0);

  // Logo scale for entrance (no pulsating glow)

  // --- Tagline rotation ---
  const [taglineIdx, setTaglineIdx] = useState(0);
  const taglineOpacity = useSharedValue(0);

  useEffect(() => {
    const ease = { duration: 500, easing: Easing.out(Easing.cubic) };
    o1.value = withDelay(100, withTiming(1, ease));
    o2.value = withDelay(250, withTiming(1, ease));
    o3.value = withDelay(400, withTiming(1, ease));
    o4.value = withDelay(550, withTiming(1, ease));
    o5.value = withDelay(700, withTiming(1, ease));

    // Initial tagline fade in
    taglineOpacity.value = withDelay(800, withTiming(1, { duration: 400 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tagline rotation timer
  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      taglineOpacity.value = withTiming(0, { duration: 300 }, () => {});
      // After fade out, update text & fade in
      setTimeout(() => {
        setTaglineIdx((prev) => (prev + 1) % TAGLINES.length);
        taglineOpacity.value = withTiming(1, { duration: 300 });
      }, 320);
    }, CYCLE_MS);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const a1 = useAnimatedStyle(() => ({ opacity: o1.value }));
  const a2 = useAnimatedStyle(() => ({ opacity: o2.value }));
  const a3 = useAnimatedStyle(() => ({ opacity: o3.value }));
  const a4 = useAnimatedStyle(() => ({ opacity: o4.value }));
  const a5 = useAnimatedStyle(() => ({ opacity: o5.value }));
  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        {/* Spacer to push content to center-bottom */}
        <View style={s.spacer} />

        {/* Brand with glow */}
        <Animated.View style={[s.brand, a1]}>
          <Image source={LOGO} style={s.logo} resizeMode="contain" />
          <Text allowFontScaling={false} style={s.brandName}>ADPT</Text>
        </Animated.View>

        {/* Copy */}
        <Animated.View style={[s.copy, a2]}>
          <Text allowFontScaling={false} style={s.headline}>
            PT in your pocket.
          </Text>
          <Text allowFontScaling={false} style={s.sub}>
            AI programs that adapt as you level up.
          </Text>
        </Animated.View>

        {/* Rotating tagline */}
        <Animated.View style={[s.taglineWrap, a3]}>
          <Animated.Text
            allowFontScaling={false}
            style={[s.tagline, taglineStyle]}
          >
            {TAGLINES[taglineIdx]}
          </Animated.Text>
        </Animated.View>

        {/* Spacer */}
        <View style={s.spacerSmall} />

        {/* Actions */}
        <Animated.View style={[s.actions, a4]}>
          <Pressable
            onPress={() => router.replace("/sign-up")}
            style={({ pressed }) => [s.primaryBtn, pressed && s.pressed]}
          >
            <Text allowFontScaling={false} style={s.primaryText}>Start Training</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.textOnPrimary} />
          </Pressable>

          <Pressable
            onPress={() => router.replace("/sign-in")}
            style={({ pressed }) => [s.secondaryBtn, pressed && s.pressed]}
          >
            <Text allowFontScaling={false} style={s.secondaryText}>
              Sign in
            </Text>
          </Pressable>
        </Animated.View>

        {/* Legal */}
        <Animated.View style={[s.legal, a5]}>
          <Text allowFontScaling={false} style={s.legalText}>
            By continuing, you agree to our{" "}
            <Text style={s.legalLink}>Terms</Text> and{" "}
            <Text style={s.legalLink}>Privacy Policy</Text>
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    container: { flex: 1, paddingHorizontal: 24, paddingBottom: 16 },
    spacer: { flex: 1 },
    spacerSmall: { flex: 0.4 },

    // Brand
    brand: { alignItems: "center", gap: 12, marginBottom: 24 },
    logo: { width: 72, height: 72, borderRadius: 18 },
    brandName: {
      color: colors.text, fontFamily: "Inter_600SemiBold",
      fontSize: 28, letterSpacing: 6,
    },

    // Copy
    copy: { alignItems: "center", gap: 10 },
    headline: {
      color: colors.text, fontFamily: "Inter_600SemiBold",
      fontSize: 30, lineHeight: 38, textAlign: "center",
    },
    sub: {
      color: colors.textMuted, fontFamily: "Inter_400Regular",
      fontSize: 15, textAlign: "center",
    },

    // Rotating tagline
    taglineWrap: {
      alignItems: "center", marginTop: 16, height: 22,
      justifyContent: "center",
    },
    tagline: {
      color: colors.primary, fontFamily: "Inter_500Medium",
      fontSize: 14, textAlign: "center", letterSpacing: 0.5,
    },

    // Actions
    actions: { width: "100%", gap: 12 },
    primaryBtn: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 8, height: 56, borderRadius: 28, backgroundColor: colors.primary,
    },
    primaryText: {
      color: colors.textOnPrimary, fontFamily: "Inter_600SemiBold", fontSize: 17,
    },
    secondaryBtn: {
      alignItems: "center", justifyContent: "center", height: 48,
    },
    secondaryText: {
      color: colors.text, fontFamily: "Inter_500Medium", fontSize: 15,
    },
    pressed: { opacity: 0.85 },

    // Legal
    legal: { marginTop: 20, alignItems: "center" },
    legalText: {
      color: colors.disabledText, fontFamily: "Inter_400Regular",
      fontSize: 12, lineHeight: 18, textAlign: "center",
    },
    legalLink: { color: colors.textMuted, fontFamily: "Inter_500Medium" },
  });
