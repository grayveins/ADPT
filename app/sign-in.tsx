import { useState } from "react";
import {
  Alert,
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
import { useTheme } from "@/src/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { spacing, radius } from "@/src/theme";

export default function SignIn() {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { Alert.alert("Error", error.message); return; }
      const userId = data.user?.id;
      if (!userId) { Alert.alert("Error", "User not found."); return; }
      router.replace("/(app)/(tabs)" as any);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: "padding", android: "height" })}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>

          <View style={styles.spacer} />

          {/* Header */}
          <Text allowFontScaling={false} style={[styles.title, { color: colors.text }]}>
            Sign In
          </Text>

          {/* Form */}
          <View style={styles.form}>
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholderTextColor={colors.inputPlaceholder}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
              placeholderTextColor={colors.inputPlaceholder}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
            <Pressable
              onPress={onLogin}
              disabled={loading}
              style={[styles.btn, { backgroundColor: colors.text }, loading && styles.btnDisabled]}
            >
              <Text allowFontScaling={false} style={[styles.btnText, { color: colors.bg }]}>
                {loading ? "Signing in..." : "Sign In"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.spacer} />

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable onPress={() => router.replace("/sign-up")}>
              <Text allowFontScaling={false} style={[styles.footerText, { color: colors.textMuted }]}>
                Don't have an account?{" "}
                <Text style={{ color: colors.text, fontWeight: "600" }}>Sign Up</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.xl },
  spacer: { flex: 1 },
  backBtn: { width: 40, height: 40, justifyContent: "center", marginTop: spacing.sm },
  title: { fontSize: 28, fontWeight: "700", marginBottom: spacing.xl },
  form: { gap: 14 },
  input: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.base,
    fontSize: 16,
  },
  btn: {
    height: 56,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 17, fontWeight: "600" },
  footer: { alignItems: "center", paddingBottom: spacing.lg },
  footerText: { fontSize: 14 },
});
