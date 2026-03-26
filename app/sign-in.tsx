/**
 * Sign In Screen — Clean, animated, on-brand
 */

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/src/context/ThemeContext";
import { supabase } from "@/lib/supabase";

const LOGO = require("@/assets/images/icon.png");

const QUOTES = [
  "Your PR isn't going to hit itself.",
  "Rest day was yesterday.",
  "Weights won't lift themselves.",
  "Less talking, more racking.",
];

export default function SignIn() {
  const { colors } = useTheme();
  const s = useMemo(() => createStyles(colors), [colors]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Random motivational quote with crossfade
  const [quoteIdx, setQuoteIdx] = useState(
    () => Math.floor(Math.random() * QUOTES.length),
  );
  const quoteOpacity = useSharedValue(0);

  useEffect(() => {
    // Fade in initial quote after entrance animations
    const t = setTimeout(() => {
      quoteOpacity.value = withTiming(1, { duration: 500 });
    }, 600);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rotate quote every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      quoteOpacity.value = withTiming(0, { duration: 250 });
      setTimeout(() => {
        setQuoteIdx((prev) => (prev + 1) % QUOTES.length);
        quoteOpacity.value = withTiming(1, { duration: 250 });
      }, 280);
    }, 5000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const quoteStyle = useAnimatedStyle(() => ({
    opacity: quoteOpacity.value,
  }));

  const onLogin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { Alert.alert("Login error", error.message); return; }

      const userId = data.user?.id;
      if (!userId) { Alert.alert("Error", "User not found."); return; }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", userId)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        Alert.alert("Error", profileError.message);
        return;
      }

      const done = profile?.onboarding_complete ?? false;
      router.replace((done ? "/(app)/(tabs)" : "/onboarding/editorial") as any);
    } catch (e: any) {
      Alert.alert("Login failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.select({ ios: "padding", android: "height" })}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top row: back button + centered logo */}
          <Animated.View entering={FadeInDown.duration(300)} style={s.topRow}>
            <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
            <Image source={LOGO} style={s.logo} resizeMode="contain" />
            {/* Invisible spacer to balance the back button */}
            <View style={s.backBtn} />
          </Animated.View>

          <View style={s.topSpacer} />

          {/* Motivational quote */}
          <Animated.View entering={FadeInDown.delay(80).duration(400)} style={s.quoteWrap}>
            <Animated.Text allowFontScaling={false} style={[s.quote, quoteStyle]}>
              {QUOTES[quoteIdx]}
            </Animated.Text>
          </Animated.View>

          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={s.header}>
            <Text allowFontScaling={false} style={s.title}>Let&apos;s go.</Text>
            <Text allowFontScaling={false} style={s.subtitle}>
              Pick up where you left off.
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={s.form}>
            <View style={s.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
              <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
                placeholderTextColor={colors.inputPlaceholder}
                style={s.input}
                keyboardAppearance="dark"
              />
            </View>

            <View style={s.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="password"
                placeholderTextColor={colors.inputPlaceholder}
                style={s.input}
                keyboardAppearance="dark"
              />
            </View>

            <Pressable
              onPress={onLogin}
              disabled={loading}
              style={[s.btn, loading && s.btnDisabled]}
            >
              <Text allowFontScaling={false} style={s.btnText}>
                {loading ? "Logging in..." : "Continue Training"}
              </Text>
            </Pressable>
          </Animated.View>

          <View style={s.spacer} />

          {/* Footer */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={s.footer}>
            <Pressable onPress={() => router.replace("/sign-up")}>
              <Text allowFontScaling={false} style={s.footerText}>
                Don&apos;t have an account?{" "}
                <Text style={s.footerLink}>Sign up</Text>
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    flex: { flex: 1 },
    scroll: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 16 },
    topSpacer: { flex: 0.4 },
    spacer: { flex: 1 },

    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: colors.card, alignItems: "center", justifyContent: "center",
    },
    logo: {
      width: 44, height: 44, borderRadius: 10,
    },

    quoteWrap: {
      alignItems: "center", marginBottom: 20, height: 20,
      justifyContent: "center",
    },
    quote: {
      color: colors.textMuted, fontFamily: "Inter_400Regular",
      fontSize: 13, fontStyle: "italic", textAlign: "center",
    },

    header: { alignItems: "center", marginBottom: 32, gap: 8 },
    title: { color: colors.text, fontSize: 28, fontFamily: "Inter_600SemiBold" },
    subtitle: { color: colors.textMuted, fontSize: 15, fontFamily: "Inter_400Regular" },

    form: { gap: 14 },
    inputWrap: {
      flexDirection: "row", alignItems: "center", gap: 12,
      backgroundColor: colors.bgTertiary, borderRadius: 14,
      borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16,
    },
    input: {
      flex: 1, color: colors.text, fontSize: 16,
      fontFamily: "Inter_400Regular", paddingVertical: 16,
    },
    btn: {
      height: 56, borderRadius: 28, backgroundColor: colors.primary,
      alignItems: "center", justifyContent: "center", marginTop: 4,
    },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: colors.textOnPrimary, fontSize: 17, fontFamily: "Inter_600SemiBold" },

    footer: { alignItems: "center", paddingBottom: 8 },
    footerText: { color: colors.textMuted, fontSize: 14, fontFamily: "Inter_400Regular" },
    footerLink: { color: colors.primary, fontFamily: "Inter_600SemiBold" },
  });
