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
      if (!data.user?.id) { Alert.alert("Error", "User not found."); return; }
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

          {/* Title */}
          <Text allowFontScaling={false} style={[styles.title, { color: colors.text }]}>
            Welcome
          </Text>

          {/* Form */}
          <View style={styles.form}>
            <View style={[styles.inputRow, { borderBottomColor: colors.border }]}>
              <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
              <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.text }]}
              />
            </View>

            <View style={[styles.inputRow, { borderBottomColor: colors.border }]}>
              <Ionicons name="key-outline" size={20} color={colors.textMuted} />
              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="password"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.text }]}
              />
            </View>

            <Pressable
              onPress={onLogin}
              disabled={loading}
              style={[styles.btn, { backgroundColor: colors.text }, loading && styles.btnDisabled]}
            >
              <Text allowFontScaling={false} style={[styles.btnText, { color: colors.bg }]}>
                {loading ? "Signing in..." : "SIGN IN"}
              </Text>
            </Pressable>

            <Pressable style={styles.forgotWrap}>
              <Text allowFontScaling={false} style={[styles.forgotText, { color: colors.textMuted }]}>
                Forgot Password?
              </Text>
            </Pressable>
          </View>

          <View style={styles.spacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 32 },
  spacer: { flex: 1 },
  backBtn: { width: 40, height: 40, justifyContent: "center", marginTop: spacing.sm },
  title: { fontSize: 34, fontWeight: "300", marginBottom: 32, letterSpacing: 1 },
  form: { gap: 0 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    paddingVertical: 14,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 2,
  },
  btn: {
    height: 48,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 14, fontWeight: "600", letterSpacing: 1 },
  forgotWrap: { alignItems: "center", marginTop: 16 },
  forgotText: { fontSize: 14 },
});
