/**
 * Welcome/Auth Landing Screen
 * Clean light theme with subtle animations
 * First screen users see before signing up/in
 */

import { useEffect, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { router } from "expo-router";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { PlayfairDisplay_600SemiBold } from "@expo-google-fonts/playfair-display";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/src/context/ThemeContext";

export default function Welcome() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    PlayfairDisplay_600SemiBold,
  });

  // Animation values
  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(30);
  const buttonsOpacity = useSharedValue(0);
  const buttonsY = useSharedValue(20);
  const socialOpacity = useSharedValue(0);
  const legalOpacity = useSharedValue(0);

  useEffect(() => {
    // Orchestrated animation sequence
    logoOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    logoScale.value = withDelay(200, withSpring(1, { damping: 12 }));

    titleOpacity.value = withDelay(500, withTiming(1, { duration: 500 }));
    titleY.value = withDelay(500, withSpring(0, { damping: 20 }));

    buttonsOpacity.value = withDelay(800, withTiming(1, { duration: 400 }));
    buttonsY.value = withDelay(800, withSpring(0, { damping: 20 }));

    socialOpacity.value = withDelay(1000, withTiming(1, { duration: 400 }));
    legalOpacity.value = withDelay(1200, withTiming(1, { duration: 400 }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsY.value }],
  }));

  const socialStyle = useAnimatedStyle(() => ({
    opacity: socialOpacity.value,
  }));

  const legalStyle = useAnimatedStyle(() => ({
    opacity: legalOpacity.value,
  }));

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Logo section */}
        <Animated.View style={[styles.logoSection, logoStyle]}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="fitness" size={40} color={colors.textOnPrimary} />
            </View>
          </View>
          <Text allowFontScaling={false} style={styles.brand}>ADPT</Text>
        </Animated.View>

        {/* Title section */}
        <Animated.View style={[styles.titleSection, titleStyle]}>
          <Text allowFontScaling={false} style={styles.title}>
            Train Smarter
          </Text>
          <Text allowFontScaling={false} style={styles.subtitle}>
            AI-powered workouts that adapt{"\n"}to your goals and progress
          </Text>
        </Animated.View>

        {/* Action buttons */}
        <Animated.View style={[styles.actions, buttonsStyle]}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push("/sign-up")}
          >
            <Text allowFontScaling={false} style={styles.primaryText}>
              Get Started
            </Text>
            <Ionicons name="arrow-forward" size={18} color={colors.textOnPrimary} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push("/sign-in")}
          >
            <Text allowFontScaling={false} style={styles.secondaryText}>
              I already have an account
            </Text>
          </Pressable>
        </Animated.View>

        {/* Social login */}
        <Animated.View style={[styles.socialSection, socialStyle]}>
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text allowFontScaling={false} style={styles.orText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtons}>
            <Pressable
              style={({ pressed }) => [
                styles.socialButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="logo-apple" size={20} color={colors.text} />
              <Text allowFontScaling={false} style={styles.socialText}>
                Continue with Apple
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.socialButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="logo-google" size={20} color={colors.text} />
              <Text allowFontScaling={false} style={styles.socialText}>
                Continue with Google
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Legal */}
        <Animated.View style={[styles.legalContainer, legalStyle]}>
          <Text allowFontScaling={false} style={styles.legal}>
            By continuing, you agree to our{" "}
            <Text style={styles.legalAccent}>Terms</Text> and{" "}
            <Text style={styles.legalAccent}>Privacy Policy</Text>
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    logoSection: {
      alignItems: "center",
      marginBottom: 32,
    },
    logoContainer: {
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    logoCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    brand: {
      color: colors.text,
      fontFamily: "Inter_600SemiBold",
      fontSize: 24,
      letterSpacing: 8,
    },
    titleSection: {
      alignItems: "center",
      marginBottom: 40,
      gap: 12,
    },
    title: {
      color: colors.text,
      fontFamily: "PlayfairDisplay_600SemiBold",
      fontSize: 36,
      textAlign: "center",
    },
    subtitle: {
      color: colors.textMuted,
      fontFamily: "Inter_400Regular",
      fontSize: 16,
      lineHeight: 24,
      textAlign: "center",
    },
    actions: {
      width: "100%",
      gap: 14,
      marginBottom: 24,
    },
    primaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 28,
      backgroundColor: colors.primary,
    },
    primaryText: {
      color: colors.textOnPrimary,
      fontFamily: "Inter_600SemiBold",
      fontSize: 17,
    },
    secondaryButton: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
    },
    secondaryText: {
      color: colors.text,
      fontFamily: "Inter_500Medium",
      fontSize: 16,
    },
    pressed: {
      opacity: 0.85,
    },
    socialSection: {
      width: "100%",
      gap: 16,
    },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    orText: {
      color: colors.inputPlaceholder,
      fontFamily: "Inter_500Medium",
      fontSize: 14,
    },
    socialButtons: {
      gap: 12,
    },
    socialButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    socialText: {
      color: colors.text,
      fontFamily: "Inter_500Medium",
      fontSize: 16,
    },
    legalContainer: {
      marginTop: 20,
      paddingBottom: 16,
    },
    legal: {
      color: colors.inputPlaceholder,
      fontFamily: "Inter_400Regular",
      fontSize: 13,
      lineHeight: 18,
      textAlign: "center",
    },
    legalAccent: {
      color: colors.primary,
      fontFamily: "Inter_500Medium",
    },
  });
