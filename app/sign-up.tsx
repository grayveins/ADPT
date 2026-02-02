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
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { darkColors } from "@/src/theme";
import { supabase } from "@/lib/supabase";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const canSubmit = useMemo(() => hasMinLength && hasSpecialChar, [hasMinLength, hasSpecialChar]);

  const onSignUp = async () => {
    if (!canSubmit) {
      Alert.alert("Password needs work", "Use at least 8 characters and 1 symbol.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert("Sign up error", error.message);
      return;
    }

    Alert.alert(
      "Check your email",
      "We sent a confirmation link. Verify to finish creating your account."
    );
    router.replace("/sign-in");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.select({ ios: "padding", android: "height" })}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={darkColors.text} />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="fitness" size={32} color={darkColors.primary} />
            </View>
            <Text allowFontScaling={false} style={styles.logoText}>
              ADPT
            </Text>
          </View>

          <View style={styles.header}>
            <Text allowFontScaling={false} style={styles.title}>
              Create account
            </Text>
            <Text allowFontScaling={false} style={styles.subtitle}>
              Start your personalized training journey
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={darkColors.muted} style={styles.inputIcon} />
              <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
                placeholderTextColor={darkColors.muted}
                style={styles.input}
                keyboardAppearance="dark"
              />
            </View>

            <View>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={darkColors.muted} style={styles.inputIcon} />
                <TextInput
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  textContentType="newPassword"
                  placeholderTextColor={darkColors.muted}
                  style={styles.input}
                  keyboardAppearance="dark"
                />
              </View>
              <View style={styles.requirements}>
                <View style={styles.requirementRow}>
                  <Ionicons
                    name={hasMinLength ? "checkmark-circle" : "ellipse-outline"}
                    size={16}
                    color={hasMinLength ? darkColors.primary : darkColors.muted}
                  />
                  <Text
                    allowFontScaling={false}
                    style={[styles.requirementText, hasMinLength && styles.requirementMet]}
                  >
                    At least 8 characters
                  </Text>
                </View>
                <View style={styles.requirementRow}>
                  <Ionicons
                    name={hasSpecialChar ? "checkmark-circle" : "ellipse-outline"}
                    size={16}
                    color={hasSpecialChar ? darkColors.primary : darkColors.muted}
                  />
                  <Text
                    allowFontScaling={false}
                    style={[styles.requirementText, hasSpecialChar && styles.requirementMet]}
                  >
                    At least 1 symbol
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={onSignUp}
              disabled={loading || !canSubmit}
              style={[styles.button, (!canSubmit || loading) && styles.buttonDisabled]}
            >
              <Text allowFontScaling={false} style={styles.buttonText}>
                {loading ? "Creating account..." : "Create account"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.replace("/sign-in")} style={styles.footer}>
            <Text allowFontScaling={false} style={styles.footerText}>
              Already have an account?{" "}
              <Text style={styles.footerLink}>Log in</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: darkColors.bg,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: darkColors.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: darkColors.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  logoText: {
    color: darkColors.text,
    fontSize: 28,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    color: darkColors.text,
    fontSize: 28,
    fontFamily: "Inter_600SemiBold",
  },
  subtitle: {
    color: darkColors.muted,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    marginTop: 8,
    textAlign: "center",
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: darkColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: darkColors.border,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: darkColors.text,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    paddingVertical: 16,
  },
  requirements: {
    marginTop: 12,
    gap: 8,
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  requirementText: {
    color: darkColors.muted,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  requirementMet: {
    color: darkColors.primary,
  },
  button: {
    backgroundColor: darkColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  footer: {
    marginTop: 32,
    alignItems: "center",
  },
  footerText: {
    color: darkColors.muted,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  footerLink: {
    color: darkColors.primary,
    fontFamily: "Inter_600SemiBold",
  },
});
