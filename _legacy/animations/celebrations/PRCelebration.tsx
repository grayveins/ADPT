/**
 * PRCelebration
 * Special celebration for personal records
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
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { SPRING_CONFIG, Z_INDEX, PARTICLE_COLORS } from "../constants";
import { Confetti } from "../components/Confetti";
import { haptic } from "../feedback/haptics";

type PRCelebrationProps = {
  visible: boolean;
  exercise: string;
  previousValue: string;
  newValue: string;
  unit?: string;
  onDismiss: () => void;
};

export const PRCelebration: React.FC<PRCelebrationProps> = ({
  visible,
  exercise,
  previousValue,
  newValue,
  unit = "lbs",
  onDismiss,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [showConfetti, setShowConfetti] = useState(false);

  const overlayOpacity = useSharedValue(0);
  const crownScale = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(20);

  useEffect(() => {
    if (visible) {
      // Sequence animation
      overlayOpacity.value = withTiming(1, { duration: 200 });
      
      // Crown zooms in with bounce
      crownScale.value = withDelay(
        200,
        withSequence(
          withSpring(1.3, SPRING_CONFIG.wobbly),
          withSpring(1, SPRING_CONFIG.snappy)
        )
      );
      
      // Haptic
      setTimeout(() => {
        haptic("heavy");
      }, 300);
      
      // Title
      titleOpacity.value = withDelay(400, withTiming(1, { duration: 200 }));
      
      // Confetti (gold!)
      setTimeout(() => {
        setShowConfetti(true);
      }, 500);
      
      // Content
      contentOpacity.value = withDelay(600, withTiming(1, { duration: 300 }));
      contentTranslateY.value = withDelay(600, withSpring(0, SPRING_CONFIG.gentle));
      
      // Auto dismiss after 3 seconds
      setTimeout(() => {
        onDismiss();
      }, 3500);
    } else {
      overlayOpacity.value = 0;
      crownScale.value = 0;
      titleOpacity.value = 0;
      contentOpacity.value = 0;
      contentTranslateY.value = 20;
      setShowConfetti(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const crownStyle = useAnimatedStyle(() => ({
    transform: [{ scale: crownScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  if (!visible) return null;

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss}>
      <Animated.View style={[styles.overlay, overlayStyle]}>
        {/* Gold confetti */}
        <Confetti
          active={showConfetti}
          colors={[...PARTICLE_COLORS.gold]}
          count={25}
          spread={70}
        />

        <View style={styles.content}>
        {/* Crown icon */}
        <Animated.View style={[styles.crownContainer, crownStyle]}>
          <View style={styles.crownCircle}>
            <Ionicons name="trophy" size={40} color="#000" />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.Text
          allowFontScaling={false}
          style={[styles.title, titleStyle]}
        >
          NEW PR!
        </Animated.Text>

        {/* Exercise name */}
        <Animated.View style={[styles.exerciseContainer, contentStyle]}>
          <Text allowFontScaling={false} style={styles.exerciseName}>
            {exercise}
          </Text>
        </Animated.View>

        {/* PR comparison */}
        <Animated.View style={[styles.comparisonContainer, contentStyle]}>
          <View style={styles.prValue}>
            <Text allowFontScaling={false} style={styles.prLabel}>
              Previous
            </Text>
            <Text allowFontScaling={false} style={styles.prOldValue}>
              {previousValue} {unit}
            </Text>
          </View>
          
          <View style={styles.arrowContainer}>
            <Ionicons name="arrow-forward" size={24} color={colors.primary} />
          </View>
          
          <View style={styles.prValue}>
            <Text allowFontScaling={false} style={styles.prLabel}>
              Now
            </Text>
            <Text allowFontScaling={false} style={styles.prNewValue}>
              {newValue} {unit}
            </Text>
          </View>
        </Animated.View>

        {/* Tap to dismiss hint */}
        <Animated.Text
          allowFontScaling={false}
          style={[styles.hint, contentStyle]}
        >
          Tap anywhere to continue
        </Animated.Text>
      </View>
    </Animated.View>
    </Pressable>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.9)",
      zIndex: Z_INDEX.celebration,
      justifyContent: "center",
      alignItems: "center",
    },
    content: {
      alignItems: "center",
      paddingHorizontal: 32,
    },
    crownContainer: {
      marginBottom: 16,
    },
    crownCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.gold,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.gold,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 20,
    },
    title: {
      color: colors.gold,
      fontSize: 36,
      fontWeight: "700",
      marginBottom: 8,
      textShadowColor: "rgba(255, 215, 0, 0.5)",
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 10,
    },
    exerciseContainer: {
      marginBottom: 24,
    },
    exerciseName: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "500",
    },
    comparisonContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 32,
    },
    prValue: {
      alignItems: "center",
      paddingHorizontal: 16,
    },
    prLabel: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: "400",
      marginBottom: 4,
    },
    prOldValue: {
      color: colors.textMuted,
      fontSize: 20,
      fontWeight: "500",
      textDecorationLine: "line-through",
    },
    prNewValue: {
      color: colors.gold,
      fontSize: 24,
      fontWeight: "600",
    },
    arrowContainer: {
      paddingHorizontal: 12,
    },
    hint: {
      color: colors.inputPlaceholder,
      fontSize: 14,
      fontWeight: "400",
    },
  });

export default PRCelebration;
