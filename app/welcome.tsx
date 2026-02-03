/**
 * Welcome/Auth Landing Screen
 * Modern design with animated gradient mesh
 * Expert coach vibe - "Programming That Adapts"
 */

import { useEffect, useMemo } from "react";
import { Pressable, StyleSheet, Text, View, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { router } from "expo-router";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withSpring,
  withDelay,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from "react-native-reanimated";
import Svg, { Defs, RadialGradient, Stop, Path, Circle } from "react-native-svg";

import { useTheme } from "@/src/context/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BLOB_SIZE = SCREEN_WIDTH * 0.85;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Blob path shapes for morphing animation
const BLOB_PATHS = [
  "M44.5,-76.3C56.9,-69.1,65.5,-55.3,72.8,-40.8C80.1,-26.3,86.1,-11.1,85.6,3.8C85.1,18.7,78.1,33.3,68.3,45.2C58.5,57.1,45.9,66.3,32,72.1C18.1,77.9,2.9,80.3,-12.8,79.5C-28.5,78.7,-44.7,74.7,-57.3,65.6C-69.9,56.5,-79,42.3,-83.2,26.7C-87.4,11.1,-86.7,-5.9,-81.8,-21.1C-76.9,-36.3,-67.8,-49.7,-55.5,-57C-43.2,-64.3,-27.7,-65.5,-13.1,-69.2C1.5,-72.9,32.1,-83.5,44.5,-76.3Z",
  "M39.5,-68.2C51.1,-60.6,60.6,-49.5,67.8,-36.8C75,-24.1,79.9,-9.8,79.3,4.4C78.7,18.6,72.6,32.7,63.4,44.1C54.2,55.5,41.9,64.2,28.3,69.8C14.7,75.4,-0.2,77.9,-15.3,76.1C-30.4,74.3,-45.7,68.2,-57.1,57.8C-68.5,47.4,-76,32.7,-79.5,16.8C-83,-0.9,-82.5,-19.8,-76.1,-36C-69.7,-52.2,-57.4,-65.7,-43.1,-72.1C-28.8,-78.5,-12.5,-77.8,1.1,-79.6C14.7,-81.4,27.9,-75.8,39.5,-68.2Z",
  "M47.7,-80.6C60.8,-72.9,69.8,-58.2,76.2,-42.8C82.6,-27.4,86.4,-11.3,84.9,4.1C83.4,19.5,76.6,34.2,66.8,46.1C57,58,44.2,67.1,30.1,73.1C16,79.1,0.6,82,-15.5,80.5C-31.6,79,-48.4,73.1,-60.6,62.1C-72.8,51.1,-80.4,35,-82.8,18.3C-85.2,1.6,-82.4,-15.7,-75.4,-30.5C-68.4,-45.3,-57.2,-57.6,-44,-66.1C-30.8,-74.6,-15.4,-79.3,1,-80.9C17.4,-82.5,34.6,-88.3,47.7,-80.6Z",
];

function GradientMesh({ colors }: { colors: ReturnType<typeof useTheme>["colors"] }) {
  const morphProgress = useSharedValue(0);
  const glowOpacity = useSharedValue(0.4);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Morphing animation - cycles through blob shapes
    morphProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(2, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Subtle glow pulsing
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Slow rotation
    rotation.value = withRepeat(
      withTiming(360, { duration: 30000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedProps = useAnimatedProps(() => {
    // Interpolate between blob paths based on morphProgress
    // For simplicity, we'll use the first path and animate transform
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(morphProgress.value, [0, 1, 2], [1, 1.05, 0.98]) },
    ],
  }));

  return (
    <View style={meshStyles.container}>
      {/* Outer glow layer */}
      <Animated.View style={[meshStyles.glowOuter, glowStyle]}>
        <Svg width={BLOB_SIZE + 60} height={BLOB_SIZE + 60} viewBox="-150 -150 300 300">
          <Defs>
            <RadialGradient id="outerGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.3" />
              <Stop offset="70%" stopColor={colors.primary} stopOpacity="0.1" />
              <Stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="0" cy="0" r="140" fill="url(#outerGlow)" />
        </Svg>
      </Animated.View>

      {/* Main blob */}
      <Animated.View style={[meshStyles.blobContainer, containerStyle]}>
        <Svg width={BLOB_SIZE} height={BLOB_SIZE} viewBox="-100 -100 200 200">
          <Defs>
            <RadialGradient id="meshGradient" cx="30%" cy="30%" r="70%">
              <Stop offset="0%" stopColor={colors.primary} stopOpacity="1" />
              <Stop offset="40%" stopColor="#008F85" stopOpacity="0.9" />
              <Stop offset="80%" stopColor="#005C54" stopOpacity="0.7" />
              <Stop offset="100%" stopColor={colors.bg} stopOpacity="0.5" />
            </RadialGradient>
          </Defs>
          <AnimatedPath
            d={BLOB_PATHS[0]}
            fill="url(#meshGradient)"
            animatedProps={animatedProps}
          />
        </Svg>
      </Animated.View>

      {/* Inner highlight */}
      <View style={meshStyles.innerHighlight}>
        <Svg width={BLOB_SIZE * 0.5} height={BLOB_SIZE * 0.5} viewBox="-100 -100 200 200">
          <Defs>
            <RadialGradient id="innerGlow" cx="40%" cy="40%" r="50%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.15" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="-20" cy="-20" r="60" fill="url(#innerGlow)" />
        </Svg>
      </View>
    </View>
  );
}

const meshStyles = StyleSheet.create({
  container: {
    width: BLOB_SIZE + 60,
    height: BLOB_SIZE + 60,
    alignItems: "center",
    justifyContent: "center",
  },
  glowOuter: {
    position: "absolute",
  },
  blobContainer: {
    position: "absolute",
  },
  innerHighlight: {
    position: "absolute",
    top: BLOB_SIZE * 0.15,
    left: BLOB_SIZE * 0.2,
  },
});

export default function Welcome() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  // Animation values
  const meshOpacity = useSharedValue(0);
  const meshScale = useSharedValue(0.8);
  const brandOpacity = useSharedValue(0);
  const brandScale = useSharedValue(0.9);
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(20);
  const subtitleOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);
  const buttonsY = useSharedValue(20);
  const socialOpacity = useSharedValue(0);
  const legalOpacity = useSharedValue(0);

  useEffect(() => {
    // Orchestrated animation sequence
    meshOpacity.value = withDelay(100, withTiming(1, { duration: 800 }));
    meshScale.value = withDelay(100, withSpring(1, { damping: 15 }));

    brandOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    brandScale.value = withDelay(400, withSpring(1, { damping: 12 }));

    titleOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
    titleY.value = withDelay(600, withSpring(0, { damping: 20 }));

    subtitleOpacity.value = withDelay(800, withTiming(1, { duration: 400 }));

    buttonsOpacity.value = withDelay(1000, withTiming(1, { duration: 400 }));
    buttonsY.value = withDelay(1000, withSpring(0, { damping: 20 }));

    socialOpacity.value = withDelay(1200, withTiming(1, { duration: 400 }));
    legalOpacity.value = withDelay(1400, withTiming(1, { duration: 400 }));
  }, []);

  const meshStyle = useAnimatedStyle(() => ({
    opacity: meshOpacity.value,
    transform: [{ scale: meshScale.value }],
  }));

  const brandStyle = useAnimatedStyle(() => ({
    opacity: brandOpacity.value,
    transform: [{ scale: brandScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
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
        {/* Gradient Mesh Hero */}
        <Animated.View style={[styles.meshSection, meshStyle]}>
          <GradientMesh colors={colors} />
        </Animated.View>

        {/* Brand */}
        <Animated.View style={[styles.brandSection, brandStyle]}>
          <Text allowFontScaling={false} style={styles.brand}>ADPT</Text>
        </Animated.View>

        {/* Title section */}
        <Animated.View style={[styles.titleSection, titleStyle]}>
          <Text allowFontScaling={false} style={styles.title}>
            Programming That Adapts
          </Text>
        </Animated.View>

        <Animated.View style={subtitleStyle}>
          <Text allowFontScaling={false} style={styles.subtitle}>
            Expert coaching. Real-time adaptation.{"\n"}Zero guesswork.
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
                Apple
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
                Google
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
      paddingHorizontal: 24,
    },
    meshSection: {
      marginTop: -20,
      marginBottom: -40,
    },
    brandSection: {
      marginBottom: 8,
    },
    brand: {
      color: colors.text,
      fontFamily: "Inter_600SemiBold",
      fontSize: 28,
      letterSpacing: 10,
    },
    titleSection: {
      marginBottom: 12,
    },
    title: {
      color: colors.text,
      fontFamily: "Inter_600SemiBold",
      fontSize: 28,
      textAlign: "center",
    },
    subtitle: {
      color: colors.textMuted,
      fontFamily: "Inter_400Regular",
      fontSize: 16,
      lineHeight: 24,
      textAlign: "center",
      marginBottom: 32,
    },
    actions: {
      width: "100%",
      gap: 12,
      marginBottom: 20,
    },
    primaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 14,
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
      paddingVertical: 12,
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
      gap: 14,
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
      flexDirection: "row",
      gap: 12,
    },
    socialButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    socialText: {
      color: colors.text,
      fontFamily: "Inter_500Medium",
      fontSize: 15,
    },
    legalContainer: {
      position: "absolute",
      bottom: 16,
      left: 24,
      right: 24,
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
