import { useMemo, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/src/context/ThemeContext";
import { supabase } from "@/lib/supabase";

export default function SignIn() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    setLoading(true);
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        Alert.alert("Login error", signInError.message);
        return;
      }

      const userId = signInData.user?.id;
      if (!userId) {
        Alert.alert("Error", "User not found after login.");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", userId)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        Alert.alert("Error fetching profile", profileError.message);
        return;
      }

      const onboardingComplete = profile?.onboarding_complete ?? false;
      router.replace((onboardingComplete ? "/(app)/(tabs)" : "/onboarding/editorial") as any);
    } catch (e: any) {
      Alert.alert("Login failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.select({ ios: "padding", android: "height" })}
        keyboardVerticalOffset={Platform.select({ ios: 0, android: 0 })}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="fitness" size={32} color={colors.textOnPrimary} />
            </View>
            <Text allowFontScaling={false} style={styles.logoText}>
              ADPT
            </Text>
          </View>

          <View style={styles.header}>
            <Text allowFontScaling={false} style={styles.title}>
              Welcome back
            </Text>
            <Text allowFontScaling={false} style={styles.subtitle}>
              Log in to continue your training
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                keyboardAppearance="light"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="password"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                keyboardAppearance="light"
              />
            </View>

            <TouchableOpacity
              onPress={onLogin}
              disabled={loading}
              style={[styles.button, loading && styles.buttonDisabled]}
            >
              <Text allowFontScaling={false} style={styles.buttonText}>
                {loading ? "Logging in..." : "Log in"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.replace("/sign-up")} style={styles.footer}>
            <Text allowFontScaling={false} style={styles.footerText}>
              Don&apos;t have an account?{" "}
              <Text style={styles.footerLink}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: 24,
      paddingVertical: 40,
    },
    logoContainer: {
      alignItems: "center",
      marginBottom: 40,
    },
    logoCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    logoText: {
      color: colors.text,
      fontSize: 28,
      fontFamily: "Inter_600SemiBold",
      letterSpacing: 2,
    },
    header: {
      alignItems: "center",
      marginBottom: 32,
    },
    title: {
      color: colors.text,
      fontSize: 28,
      fontFamily: "Inter_600SemiBold",
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      marginTop: 8,
    },
    form: {
      gap: 16,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      color: colors.text,
      fontSize: 16,
      fontFamily: "Inter_400Regular",
      paddingVertical: 16,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center",
      marginTop: 8,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: colors.textOnPrimary,
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
    },
    footer: {
      marginTop: 32,
      alignItems: "center",
    },
    footerText: {
      color: colors.textMuted,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
    },
    footerLink: {
      color: colors.primary,
      fontFamily: "Inter_600SemiBold",
    },
  });
