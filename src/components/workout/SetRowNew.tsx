/**
 * SetRowNew - Premium set row component
 * 
 * Features:
 * - 56pt touch target (gym-friendly, sweaty hands)
 * - Full row tap-to-complete
 * - PREVIOUS column showing last workout data
 * - Green background fill on completion
 * - Scale bounce + haptic feedback
 * 
 * Design: Hevy/Strong inspired, minimal, professional
 */

import React, { useCallback } from "react";
import { StyleSheet, View, Text, TextInput, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/context/ThemeContext";
import { spacing, radius, layout } from "@/src/theme";

type SetRowNewProps = {
  setNumber: number;
  weight: string;
  reps: string;
  completed: boolean;
  // Previous workout data
  previousWeight?: string;
  previousReps?: string;
  // Callbacks
  onComplete: () => void;
  onWeightChange: (weight: string) => void;
  onRepsChange: (reps: string) => void;
  // Optional
  disabled?: boolean;
  isPR?: boolean;
  closeToPR?: boolean;
};

const ROW_HEIGHT = layout.touchTargetPrimary; // 56pt

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const SetRowNew: React.FC<SetRowNewProps> = ({
  setNumber,
  weight,
  reps,
  completed,
  previousWeight,
  previousReps,
  onComplete,
  onWeightChange,
  onRepsChange,
  disabled = false,
  isPR = false,
  closeToPR = false,
}) => {
  const { colors } = useTheme();
  
  // Animation values
  const scale = useSharedValue(1);
  const completionProgress = useSharedValue(completed ? 1 : 0);

  // Handle row tap to complete
  const handleRowPress = useCallback(() => {
    if (completed || disabled) return;
    
    // Only complete if we have weight and reps
    if (!weight || !reps) return;
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Hevy-style: crisp press-down, no bouncy overshoot
    scale.value = withSequence(
      withTiming(0.97, { duration: 80 }),
      withTiming(1, { duration: 120 })
    );

    // Background fill animation
    completionProgress.value = withTiming(1, { duration: 180 });
    
    // Trigger completion callback
    onComplete();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed, disabled, weight, reps, onComplete]);

  // Update completion progress when prop changes
  React.useEffect(() => {
    completionProgress.value = withTiming(completed ? 1 : 0, { duration: 200 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed]);

  // Animated row style
  const rowAnimatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      completionProgress.value,
      [0, 1],
      [colors.cardAlt, colors.successMuted]
    );
    
    return {
      transform: [{ scale: scale.value }],
      backgroundColor,
    };
  });

  // Animated set number badge style
  const setNumberStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      completionProgress.value,
      [0, 1],
      [colors.border, colors.success]
    );
    
    return { backgroundColor };
  });

  // Animated text style for set number
  const setNumberTextColor = completed ? colors.textOnPrimary : colors.textMuted;
  const inputTextColor = completed ? colors.textMuted : colors.text;

  return (
    <AnimatedPressable
      onPress={handleRowPress}
      disabled={disabled}
      style={[
        styles.row,
        rowAnimatedStyle,
        { borderRadius: radius.md },
      ]}
    >
      {/* Set Number Badge */}
      <Animated.View style={[styles.setNumberBadge, setNumberStyle]}>
        <Text 
          allowFontScaling={false} 
          style={[styles.setNumberText, { color: setNumberTextColor }]}
        >
          {setNumber}
        </Text>
      </Animated.View>

      {/* Previous Data Column */}
      <View style={styles.previousColumn}>
        {previousWeight && previousReps ? (
          <>
            <Text 
              allowFontScaling={false} 
              style={[styles.previousLabel, { color: colors.textMuted }]}
            >
              PREV
            </Text>
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[styles.previousValue, { color: colors.textSecondary }]}
            >
              {previousWeight} x {previousReps}
            </Text>
          </>
        ) : (
          <Text 
            allowFontScaling={false} 
            style={[styles.previousEmpty, { color: colors.textMuted }]}
          >
            --
          </Text>
        )}
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Weight Input */}
      <View style={styles.inputGroup}>
        <TextInput
          value={weight}
          onChangeText={onWeightChange}
          placeholder={previousWeight || "0"}
          placeholderTextColor={colors.inputPlaceholder}
          keyboardType="numeric"
          keyboardAppearance="dark"
          style={[
            styles.input,
            { 
              backgroundColor: completed ? "transparent" : colors.inputBg,
              color: inputTextColor,
              borderColor: completed ? "transparent" : colors.inputBorder,
            },
          ]}
          editable={!completed && !disabled}
          selectTextOnFocus
          allowFontScaling={false}
        />
        <Text 
          allowFontScaling={false} 
          style={[styles.inputUnit, { color: colors.textMuted }]}
        >
          lbs
        </Text>
      </View>

      {/* Multiply Sign */}
      <Text 
        allowFontScaling={false} 
        style={[styles.multiply, { color: colors.textMuted }]}
      >
        x
      </Text>

      {/* Reps Input */}
      <View style={styles.inputGroup}>
        <TextInput
          value={reps}
          onChangeText={onRepsChange}
          placeholder={previousReps || "0"}
          placeholderTextColor={colors.inputPlaceholder}
          keyboardType="numeric"
          keyboardAppearance="dark"
          style={[
            styles.input,
            { 
              backgroundColor: completed ? "transparent" : colors.inputBg,
              color: inputTextColor,
              borderColor: completed ? "transparent" : colors.inputBorder,
            },
          ]}
          editable={!completed && !disabled}
          selectTextOnFocus
          allowFontScaling={false}
        />
        <Text 
          allowFontScaling={false} 
          style={[styles.inputUnit, { color: colors.textMuted }]}
        >
          reps
        </Text>
      </View>

      {/* Completion Indicator */}
      <View style={styles.completionIndicator}>
        {completed ? (
          <View style={[styles.checkCircle, { backgroundColor: colors.success }]}>
            <Text allowFontScaling={false} style={styles.checkMark}>
              ✓
            </Text>
          </View>
        ) : (
          <View style={[styles.emptyCircle, { borderColor: colors.border }]} />
        )}
      </View>

      {/* PR Badge (if applicable) */}
      {isPR && (
        <View style={[styles.prBadge, { backgroundColor: colors.gold }]}>
          <Text allowFontScaling={false} style={styles.prBadgeText}>
            PR
          </Text>
        </View>
      )}

      {/* Close to PR callout */}
      {closeToPR && !completed && !isPR && (
        <View style={[styles.prBadge, { backgroundColor: colors.intensity }]}>
          <Text allowFontScaling={false} style={styles.prBadgeText}>
            PR?
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    height: ROW_HEIGHT,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  setNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  setNumberText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_600SemiBold",
  },
  previousColumn: {
    width: 68,
    alignItems: "center",
  },
  previousLabel: {
    fontSize: 9,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  previousValue: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
    marginTop: 1,
  },
  previousEmpty: {
    fontSize: 14,
    fontWeight: "500",
  },
  divider: {
    width: 1,
    height: 32,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  input: {
    minWidth: 52,
    width: 64,
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  inputUnit: {
    fontSize: 11,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  multiply: {
    fontSize: 14,
    fontWeight: "500",
  },
  completionIndicator: {
    marginLeft: "auto",
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
  prBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  prBadgeText: {
    color: "#000000",
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "Inter_600SemiBold",
  },
});

export default SetRowNew;
