/**
 * Welcome/Auth Landing Screen
 * Premium dark theme with animations
 * First screen users see before signing up/in
 */

import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { router } from "expo-router";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { PlayfairDisplay_600SemiBold } from "@expo-google-fonts/playfair-display";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";

import { darkColors, theme } from "@/src/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Floating particle component
function FloatingParticle({ delay, size, x, y }: { delay: number; size: number; x: number; y: number }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(0.5, { duration: 1000 }));
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-20, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: darkColors.primary,
        },
        style,
      ]}
    />
  );
}

// Pulsing ring component
function PulsingRing({ delay }: { delay: number }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(1.6, { duration: 2500, easing: Easing.out(Easing.ease) }),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0, { duration: 2500, easing: Easing.out(Easing.ease) }),
        -1,
        false
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.pulsingRing, style]} />;
}

export default function Welcome() {
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
    <LinearGradient
      colors={[darkColors.bgTop, darkColors.bg]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        {/* Floating particles */}
        <View style={styles.particlesContainer}>
          <FloatingParticle delay={0} size={4} x={SCREEN_WIDTH * 0.1} y={120} />
          <FloatingParticle delay={500} size={6} x={SCREEN_WIDTH * 0.85} y={180} />
          <FloatingParticle delay={1000} size={3} x={SCREEN_WIDTH * 0.2} y={280} />
          <FloatingParticle delay={1500} size={5} x={SCREEN_WIDTH * 0.75} y={320} />
        </View>

        <View style={styles.container}>
          {/* Logo section */}
          <Animated.View style={[styles.logoSection, logoStyle]}>
            <View style={styles.logoContainer}>
              <PulsingRing delay={0} />
              <PulsingRing delay={800} />
              <LinearGradient
                colors={[darkColors.primary, darkColors.primaryDark]}
                style={styles.logoGradient}
              >
                <Ionicons name="fitness" size={40} color="#000" />
              </LinearGradient>
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
              <LinearGradient
                colors={[darkColors.primary, darkColors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButtonGradient}
              >
                <Text allowFontScaling={false} style={styles.primaryText}>
                  Get Started
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#000" />
              </LinearGradient>
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
                <Ionicons name="logo-apple" size={20} color={darkColors.text} />
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
                <Ionicons name="logo-google" size={20} color={darkColors.text} />
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
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
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  pulsingRing: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: darkColors.primary,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    color: darkColors.text,
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
    color: darkColors.text,
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 36,
    textAlign: "center",
  },
  subtitle: {
    color: darkColors.muted,
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
    borderRadius: 28,
    overflow: "hidden",
  },
  primaryButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  primaryText: {
    color: "#000",
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  secondaryText: {
    color: darkColors.text,
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
    backgroundColor: darkColors.border,
  },
  orText: {
    color: darkColors.muted2,
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
    borderColor: darkColors.border,
    backgroundColor: darkColors.card,
  },
  socialText: {
    color: darkColors.text,
    fontFamily: "Inter_500Medium",
    fontSize: 16,
  },
  legalContainer: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
  },
  legal: {
    color: darkColors.muted2,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  legalAccent: {
    color: darkColors.primary,
    fontFamily: "Inter_500Medium",
  },
});
