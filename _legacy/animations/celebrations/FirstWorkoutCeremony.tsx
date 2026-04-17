/**
 * FirstWorkoutCeremony
 * Special full-screen celebration for when the user completes their very first workout
 */

import React, { useEffect, useState, useMemo } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  FadeIn,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { SPRING_CONFIG, Z_INDEX, PARTICLE_COLORS } from "../constants";
import { Confetti } from "../components/Confetti";
import { hapticCelebration } from "../feedback/haptics";

type FirstWorkoutCeremonyProps = {
  visible: boolean;
  userName: string;
  onContinue: () => void;
};

export const FirstWorkoutCeremony: React.FC<FirstWorkoutCeremonyProps> = ({
  visible,
  userName,
  onContinue,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const overlayOpacity = useSharedValue(0);
  const trophyScale = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(20);

  useEffect(() => {
    if (visible) {
      // 0ms: Overlay fades in
      overlayOpacity.value = withTiming(1, { duration: 200 });

      // 200ms: Trophy zooms in with big bounce
      trophyScale.value = withDelay(
        200,
        withSequence(
          withSpring(1.5, SPRING_CONFIG.wobbly),
          withSpring(1, SPRING_CONFIG.snappy)
        )
      );

      // 400ms: Heavy haptic celebration
      setTimeout(() => {
        hapticCelebration();
      }, 400);

      // 500ms: Confetti burst (rainbow, big burst)
      setTimeout(() => {
        setShowConfetti(true);
      }, 500);

      // 600ms: Title appears
      titleOpacity.value = withDelay(600, withTiming(1, { duration: 300 }));

      // 900ms: Subtitle slides in
      subtitleOpacity.value = withDelay(900, withTiming(1, { duration: 300 }));
      subtitleTranslateY.value = withDelay(
        900,
        withSpring(0, SPRING_CONFIG.gentle)
      );

      // 3000ms: Show continue button
      setTimeout(() => {
        setShowButton(true);
      }, 3000);
    } else {
      overlayOpacity.value = 0;
      trophyScale.value = 0;
      titleOpacity.value = 0;
      subtitleOpacity.value = 0;
      subtitleTranslateY.value = 20;
      setShowConfetti(false);
      setShowButton(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const trophyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: trophyScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, overlayStyle]}>
      {/* Rainbow confetti — big burst */}
      <Confetti
        active={showConfetti}
        colors={[...PARTICLE_COLORS.rainbow]}
        count={40}
        spread={90}
      />

      <View style={styles.content}>
        {/* Trophy icon */}
        <Animated.View style={[styles.trophyContainer, trophyStyle]}>
          <View style={styles.trophyCircle}>
            <Ionicons name="trophy" size={48} color="#000" />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.Text
          allowFontScaling={false}
          style={[styles.title, titleStyle]}
        >
          Welcome to the Club, {userName}!
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text
          allowFontScaling={false}
          style={[styles.subtitle, subtitleStyle]}
        >
          You just completed your first workout. This is where it begins.
        </Animated.Text>

        {/* Continue button */}
        {showButton && (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={styles.buttonContainer}
          >
            <Pressable style={styles.button} onPress={onContinue}>
              <Text allowFontScaling={false} style={styles.buttonText}>
                Continue
              </Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.95)",
      zIndex: Z_INDEX.celebration,
      justifyContent: "center",
      alignItems: "center",
    },
    content: {
      alignItems: "center",
      paddingHorizontal: 32,
    },
    trophyContainer: {
      marginBottom: 24,
    },
    trophyCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.gold,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.gold,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 30,
    },
    title: {
      color: colors.gold,
      fontSize: 28,
      fontWeight: "700",
      marginBottom: 12,
      textAlign: "center",
      textShadowColor: "rgba(255, 215, 0, 0.5)",
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 10,
    },
    subtitle: {
      color: colors.muted,
      fontSize: 16,
      fontWeight: "400",
      textAlign: "center",
      lineHeight: 24,
      marginBottom: 40,
      maxWidth: 280,
    },
    buttonContainer: {
      width: "100%",
    },
    button: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 48,
      borderRadius: 28,
    },
    buttonText: {
      color: colors.textOnPrimary,
      fontSize: 18,
      fontWeight: "600",
      textAlign: "center",
    },
  });

export default FirstWorkoutCeremony;
