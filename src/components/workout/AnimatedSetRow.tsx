/**
 * AnimatedSetRow
 * Set row with animated checkbox and glow feedback
 */

import React, { useState } from "react";
import { StyleSheet, View, Text, TextInput } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import { useTheme } from "@/src/context/ThemeContext";
import { AnimatedCheckbox } from "@/src/animations/components";
import { MicroConfetti } from "@/src/animations/components/Confetti";
import { showToast } from "@/src/animations/celebrations";
import { TIMING } from "@/src/animations/constants";

type AnimatedSetRowProps = {
  setNumber: number;
  weight: string;
  reps: string;
  completed: boolean;
  previousWeight?: string;
  previousReps?: string;
  targetWeight?: string;
  isPR?: boolean;
  onComplete: () => void;
  onWeightChange: (weight: string) => void;
  onRepsChange: (reps: string) => void;
};

export const AnimatedSetRow: React.FC<AnimatedSetRowProps> = ({
  setNumber,
  weight,
  reps,
  completed,
  previousWeight,
  previousReps,
  targetWeight,
  isPR = false,
  onComplete,
  onWeightChange,
  onRepsChange,
}) => {
  const { colors, radius } = useTheme();
  const [showConfetti, setShowConfetti] = useState(false);
  const glowOpacity = useSharedValue(0);

  const handleComplete = () => {
    // Trigger glow animation
    glowOpacity.value = withSequence(
      withTiming(0.4, { duration: TIMING.fast }),
      withTiming(0, { duration: TIMING.normal })
    );

    // Show micro confetti for set completion
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 1000);

    // Show toast
    showToast({ type: "setComplete" });

    onComplete();
  };

  const glowStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(0, 201, 183, ${glowOpacity.value})`,
  }));

  return (
    <Animated.View style={[
      styles.container, 
      { backgroundColor: colors.card, borderRadius: radius.md },
      completed && styles.containerCompleted
    ]}>
      {/* Glow overlay */}
      <Animated.View style={[styles.glowOverlay, { borderRadius: radius.md }, glowStyle]} />

      {/* Confetti */}
      <MicroConfetti
        active={showConfetti}
        origin={{ x: 40, y: 20 }}
      />

      {/* Set number */}
      <View style={[styles.setNumber, { backgroundColor: colors.border }]}>
        <Text allowFontScaling={false} style={[styles.setNumberText, { color: colors.muted }]}>
          {setNumber}
        </Text>
      </View>

      {/* Previous / Target hint */}
      {previousWeight && !completed && (
        <Text allowFontScaling={false} style={[styles.hint, { color: colors.muted2 }]}>
          prev: {previousWeight} × {previousReps}
        </Text>
      )}

      {/* Inputs */}
      <View style={styles.inputsContainer}>
        <View style={styles.inputGroup}>
          <TextInput
            value={weight}
            onChangeText={onWeightChange}
            placeholder="0"
            placeholderTextColor={colors.muted2}
            keyboardType="numeric"
            keyboardAppearance="dark"
            style={[
              styles.input, 
              { backgroundColor: colors.cardAlt, color: colors.text },
              completed && { backgroundColor: colors.border, color: colors.muted }
            ]}
            editable={!completed}
            allowFontScaling={false}
          />
          <Text allowFontScaling={false} style={[styles.inputLabel, { color: colors.muted }]}>
            lbs
          </Text>
        </View>

        <Text allowFontScaling={false} style={[styles.times, { color: colors.muted }]}>
          ×
        </Text>

        <View style={styles.inputGroup}>
          <TextInput
            value={reps}
            onChangeText={onRepsChange}
            placeholder="0"
            placeholderTextColor={colors.muted2}
            keyboardType="numeric"
            keyboardAppearance="dark"
            style={[
              styles.input, 
              { backgroundColor: colors.cardAlt, color: colors.text },
              completed && { backgroundColor: colors.border, color: colors.muted }
            ]}
            editable={!completed}
            allowFontScaling={false}
          />
          <Text allowFontScaling={false} style={[styles.inputLabel, { color: colors.muted }]}>
            reps
          </Text>
        </View>
      </View>

      {/* PR Badge */}
      {isPR && (
        <View style={[styles.prBadge, { backgroundColor: colors.gold }]}>
          <Text allowFontScaling={false} style={styles.prBadgeText}>
            PR?
          </Text>
        </View>
      )}

      {/* Checkbox */}
      <AnimatedCheckbox
        checked={completed}
        onToggle={handleComplete}
        size={28}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    overflow: "hidden",
    position: "relative",
  },
  containerCompleted: {
    opacity: 0.7,
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  setNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  setNumberText: {
    fontSize: 14,
    fontWeight: "600",
  },
  hint: {
    position: "absolute",
    top: 4,
    right: 60,
    fontSize: 10,
    fontWeight: "400",
  },
  inputsContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 18,
    fontWeight: "600",
    minWidth: 60,
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "400",
  },
  times: {
    fontSize: 16,
    fontWeight: "400",
  },
  prBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  prBadgeText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "600",
  },
});

export default AnimatedSetRow;
