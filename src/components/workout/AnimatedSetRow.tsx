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
import { darkColors, theme } from "@/src/theme";
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
  const [showConfetti, setShowConfetti] = useState(false);
  const glowOpacity = useSharedValue(0);
  const backgroundColor = useSharedValue(darkColors.card);

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
    backgroundColor: `rgba(0, 199, 190, ${glowOpacity.value})`,
  }));

  return (
    <Animated.View style={[styles.container, completed && styles.containerCompleted]}>
      {/* Glow overlay */}
      <Animated.View style={[styles.glowOverlay, glowStyle]} />

      {/* Confetti */}
      <MicroConfetti
        active={showConfetti}
        origin={{ x: 40, y: 20 }}
      />

      {/* Set number */}
      <View style={styles.setNumber}>
        <Text allowFontScaling={false} style={styles.setNumberText}>
          {setNumber}
        </Text>
      </View>

      {/* Previous / Target hint */}
      {previousWeight && !completed && (
        <Text allowFontScaling={false} style={styles.hint}>
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
            placeholderTextColor={darkColors.muted2}
            keyboardType="numeric"
            keyboardAppearance="dark"
            style={[styles.input, completed && styles.inputCompleted]}
            editable={!completed}
            allowFontScaling={false}
          />
          <Text allowFontScaling={false} style={styles.inputLabel}>
            lbs
          </Text>
        </View>

        <Text allowFontScaling={false} style={styles.times}>
          ×
        </Text>

        <View style={styles.inputGroup}>
          <TextInput
            value={reps}
            onChangeText={onRepsChange}
            placeholder="0"
            placeholderTextColor={darkColors.muted2}
            keyboardType="numeric"
            keyboardAppearance="dark"
            style={[styles.input, completed && styles.inputCompleted]}
            editable={!completed}
            allowFontScaling={false}
          />
          <Text allowFontScaling={false} style={styles.inputLabel}>
            reps
          </Text>
        </View>
      </View>

      {/* PR Badge */}
      {isPR && (
        <View style={styles.prBadge}>
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
    backgroundColor: darkColors.card,
    borderRadius: 12,
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
    borderRadius: 12,
  },
  setNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: darkColors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  setNumberText: {
    color: darkColors.muted,
    fontSize: 14,
    fontFamily: theme.fonts.bodySemiBold,
  },
  hint: {
    position: "absolute",
    top: 4,
    right: 60,
    color: darkColors.muted2,
    fontSize: 10,
    fontFamily: theme.fonts.body,
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
    backgroundColor: darkColors.cardAlt,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: darkColors.text,
    fontSize: 18,
    fontFamily: theme.fonts.bodySemiBold,
    minWidth: 60,
    textAlign: "center",
  },
  inputCompleted: {
    backgroundColor: darkColors.border,
    color: darkColors.muted,
  },
  inputLabel: {
    color: darkColors.muted,
    fontSize: 12,
    fontFamily: theme.fonts.body,
  },
  times: {
    color: darkColors.muted,
    fontSize: 16,
    fontFamily: theme.fonts.body,
  },
  prBadge: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  prBadgeText: {
    color: "#000",
    fontSize: 10,
    fontFamily: theme.fonts.bodySemiBold,
  },
});

export default AnimatedSetRow;
