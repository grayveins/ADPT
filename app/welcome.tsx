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
  withSpring,
  withDelay,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Path, Circle, Ellipse } from "react-native-svg";

import { useTheme } from "@/src/context/ThemeContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const MESH_SIZE = SCREEN_WIDTH * 0.95;

// Premium organic blob shapes - smoother, more fluid
const BLOB_SHAPES = {
  // Main large blob
  primary: "M45.3,-51.2C58.3,-40.9,68.1,-25.3,71.2,-8.1C74.3,9.2,70.6,28.1,60.3,42.3C50,56.5,33.1,66,14.8,70.7C-3.5,75.4,-23.2,75.3,-39.5,67.5C-55.8,59.7,-68.7,44.2,-74.1,26.5C-79.5,8.8,-77.4,-11.1,-69.2,-27.8C-61,-44.5,-46.7,-58,-31.1,-67.5C-15.5,-77,-0.8,-82.5,11.8,-78.3C24.4,-74.1,32.3,-61.5,45.3,-51.2Z",
  // Secondary floating blob
  secondary: "M38.9,-47.1C49.5,-36.8,56.6,-23.3,59.8,-8.4C63,6.5,62.3,22.8,54.5,35.5C46.7,48.2,31.8,57.3,15.4,62.1C-1,66.9,-18.9,67.4,-33.5,60.5C-48.1,53.6,-59.4,39.3,-65.1,22.8C-70.8,6.3,-70.9,-12.4,-63.7,-27.3C-56.5,-42.2,-42,-53.3,-27.2,-62.3C-12.4,-71.3,2.7,-78.2,16.3,-75.3C29.9,-72.4,28.3,-57.4,38.9,-47.1Z",
  // Accent blob (smaller)
  accent: "M42.7,-52.8C53.9,-43.5,60.5,-28.8,64.2,-13.1C67.9,2.6,68.7,19.3,62.1,33.1C55.5,46.9,41.5,57.8,25.8,63.6C10.1,69.4,-7.3,70.1,-23.3,65C-39.3,59.9,-53.9,49,-62.8,34.4C-71.7,19.8,-74.9,1.5,-71.3,-15.2C-67.7,-31.9,-57.3,-47,-43.8,-55.8C-30.3,-64.6,-13.7,-67.1,1.2,-68.6C16.1,-70.1,31.5,-62.1,42.7,-52.8Z",
};

// Premium color palette
const PREMIUM_COLORS = {
  tealBright: "#00E5CC",
  tealMain: "#00C9B7", 
  tealDeep: "#00A99D",
  tealDark: "#007A70",
  cyan: "#00D4FF",
  purple: "#8B5CF6",
  purpleLight: "#A78BFA",
};

function PremiumGradientMesh({ colors }: { colors: ReturnType<typeof useTheme>["colors"] }) {
  // Animation values for each blob layer
  const blob1Rotation = useSharedValue(0);
  const blob1Scale = useSharedValue(1);
  const blob2Rotation = useSharedValue(0);
  const blob2Scale = useSharedValue(1);
  const blob3Rotation = useSharedValue(0);
  const blob3Scale = useSharedValue(1);
  const ambientPulse = useSharedValue(0.6);

  useEffect(() => {
    // Primary blob - slow rotation and breathing
    blob1Rotation.value = withRepeat(
      withTiming(360, { duration: 60000, easing: Easing.linear }),
      -1,
      false
    );
    blob1Scale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 8000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.98, { duration: 8000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // Secondary blob - counter rotation, different rhythm
    blob2Rotation.value = withRepeat(
      withTiming(-360, { duration: 45000, easing: Easing.linear }),
      -1,
      false
    );
    blob2Scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 6000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.95, { duration: 6000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // Accent blob - fastest, creates visual interest
    blob3Rotation.value = withRepeat(
      withTiming(360, { duration: 35000, easing: Easing.linear }),
      -1,
      false
    );
    blob3Scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.92, { duration: 5000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // Ambient glow pulse
    ambientPulse.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.5, { duration: 4000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const blob1Style = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${blob1Rotation.value}deg` },
      { scale: blob1Scale.value },
    ],
  }));

  const blob2Style = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${blob2Rotation.value}deg` },
      { scale: blob2Scale.value },
    ],
  }));

  const blob3Style = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${blob3Rotation.value}deg` },
      { scale: blob3Scale.value },
    ],
  }));

  const ambientStyle = useAnimatedStyle(() => ({
    opacity: ambientPulse.value,
  }));

  return (
    <View style={meshStyles.container}>
      {/* Deep ambient glow - outermost layer */}
      <Animated.View style={[meshStyles.ambientGlow, ambientStyle]}>
        <Svg width={MESH_SIZE * 1.4} height={MESH_SIZE * 1.4} viewBox="0 0 400 400">
          <Defs>
            <RadialGradient id="ambientGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={PREMIUM_COLORS.tealMain} stopOpacity="0.4" />
              <Stop offset="40%" stopColor={PREMIUM_COLORS.tealDeep} stopOpacity="0.2" />
              <Stop offset="70%" stopColor={PREMIUM_COLORS.cyan} stopOpacity="0.1" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="200" cy="200" r="200" fill="url(#ambientGlow)" />
        </Svg>
      </Animated.View>

      {/* Blob Layer 3 - Accent (back, cyan tint) */}
      <Animated.View style={[meshStyles.blobLayer, meshStyles.blob3, blob3Style]}>
        <Svg width={MESH_SIZE * 0.7} height={MESH_SIZE * 0.7} viewBox="-100 -100 200 200">
          <Defs>
            <RadialGradient id="gradient3" cx="30%" cy="30%" r="70%">
              <Stop offset="0%" stopColor={PREMIUM_COLORS.cyan} stopOpacity="0.6" />
              <Stop offset="50%" stopColor={PREMIUM_COLORS.tealBright} stopOpacity="0.4" />
              <Stop offset="100%" stopColor={PREMIUM_COLORS.tealDeep} stopOpacity="0.1" />
            </RadialGradient>
          </Defs>
          <Path d={BLOB_SHAPES.accent} fill="url(#gradient3)" />
        </Svg>
      </Animated.View>

      {/* Blob Layer 2 - Secondary (middle, purple accent) */}
      <Animated.View style={[meshStyles.blobLayer, meshStyles.blob2, blob2Style]}>
        <Svg width={MESH_SIZE * 0.8} height={MESH_SIZE * 0.8} viewBox="-100 -100 200 200">
          <Defs>
            <LinearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={PREMIUM_COLORS.purpleLight} stopOpacity="0.3" />
              <Stop offset="50%" stopColor={PREMIUM_COLORS.tealMain} stopOpacity="0.5" />
              <Stop offset="100%" stopColor={PREMIUM_COLORS.tealDark} stopOpacity="0.2" />
            </LinearGradient>
          </Defs>
          <Path d={BLOB_SHAPES.secondary} fill="url(#gradient2)" />
        </Svg>
      </Animated.View>

      {/* Blob Layer 1 - Primary (front, main teal) */}
      <Animated.View style={[meshStyles.blobLayer, meshStyles.blob1, blob1Style]}>
        <Svg width={MESH_SIZE * 0.85} height={MESH_SIZE * 0.85} viewBox="-100 -100 200 200">
          <Defs>
            <RadialGradient id="gradient1" cx="35%" cy="35%" r="65%">
              <Stop offset="0%" stopColor={PREMIUM_COLORS.tealBright} stopOpacity="0.9" />
              <Stop offset="30%" stopColor={PREMIUM_COLORS.tealMain} stopOpacity="0.7" />
              <Stop offset="60%" stopColor={PREMIUM_COLORS.tealDeep} stopOpacity="0.5" />
              <Stop offset="100%" stopColor={PREMIUM_COLORS.tealDark} stopOpacity="0.2" />
            </RadialGradient>
          </Defs>
          <Path d={BLOB_SHAPES.primary} fill="url(#gradient1)" />
        </Svg>
      </Animated.View>

      {/* Glass highlight - top layer for premium feel */}
      <View style={meshStyles.glassHighlight}>
        <Svg width={MESH_SIZE * 0.5} height={MESH_SIZE * 0.35} viewBox="0 0 200 140">
          <Defs>
            <LinearGradient id="glassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Ellipse cx="100" cy="70" rx="90" ry="60" fill="url(#glassGradient)" />
        </Svg>
      </View>

      {/* Subtle inner glow for depth */}
      <View style={meshStyles.innerGlow}>
        <Svg width={MESH_SIZE * 0.4} height={MESH_SIZE * 0.4} viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="innerGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={PREMIUM_COLORS.tealBright} stopOpacity="0.5" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="50" cy="50" r="50" fill="url(#innerGlow)" />
        </Svg>
      </View>
    </View>
  );
}

const meshStyles = StyleSheet.create({
  container: {
    width: MESH_SIZE * 1.2,
    height: MESH_SIZE * 1.0,
    alignItems: "center",
    justifyContent: "center",
  },
  ambientGlow: {
    position: "absolute",
  },
  blobLayer: {
    position: "absolute",
  },
  blob1: {
    zIndex: 3,
  },
  blob2: {
    zIndex: 2,
    transform: [{ translateX: 15 }, { translateY: -10 }],
  },
  blob3: {
    zIndex: 1,
    transform: [{ translateX: -20 }, { translateY: 20 }],
  },
  glassHighlight: {
    position: "absolute",
    top: MESH_SIZE * 0.08,
    zIndex: 4,
  },
  innerGlow: {
    position: "absolute",
    zIndex: 5,
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
          <PremiumGradientMesh colors={colors} />
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
