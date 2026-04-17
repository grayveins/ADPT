/**
 * SetRowNew — Minimal set row (Hevy/Trainerize table style)
 * Simple row: set# | previous | weight | reps | checkbox
 */

import React, { useCallback } from "react";
import { StyleSheet, View, Text, TextInput, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/src/context/ThemeContext";
import { spacing } from "@/src/theme";

type SetRowNewProps = {
  setNumber: number;
  weight: string;
  reps: string;
  completed: boolean;
  previousWeight?: string;
  previousReps?: string;
  onComplete: () => void;
  onWeightChange: (weight: string) => void;
  onRepsChange: (reps: string) => void;
  disabled?: boolean;
  isPR?: boolean;
  closeToPR?: boolean;
};

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
}) => {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const handleComplete = useCallback(() => {
    if (disabled) return;
    scale.value = withSequence(
      withTiming(0.97, { duration: 60 }),
      withTiming(1, { duration: 100 })
    );
    onComplete();
  }, [disabled, onComplete]);

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const prevText = previousWeight && previousReps
    ? `${previousWeight} lbs x ${previousReps}`
    : "—";

  return (
    <AnimatedPressable
      onPress={handleComplete}
      disabled={disabled}
      style={[
        styles.row,
        rowStyle,
        completed && { backgroundColor: colors.successMuted },
      ]}
    >
      {/* Set number */}
      <Text
        allowFontScaling={false}
        style={[styles.setNum, { color: colors.textMuted }]}
      >
        {setNumber}
      </Text>

      {/* Previous */}
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={[styles.prev, { color: colors.textMuted }]}
      >
        {prevText}
      </Text>

      {/* Weight input */}
      <TextInput
        value={weight}
        onChangeText={onWeightChange}
        placeholder={previousWeight || "—"}
        placeholderTextColor={colors.inputPlaceholder}
        keyboardType="numeric"
        style={[
          styles.input,
          {
            color: colors.text,
            borderColor: completed ? "transparent" : colors.border,
            backgroundColor: completed ? "transparent" : colors.bg,
          },
        ]}
        editable={!completed && !disabled}
        selectTextOnFocus
        allowFontScaling={false}
      />

      {/* Reps input */}
      <TextInput
        value={reps}
        onChangeText={onRepsChange}
        placeholder={previousReps || "—"}
        placeholderTextColor={colors.inputPlaceholder}
        keyboardType="numeric"
        style={[
          styles.input,
          {
            color: colors.text,
            borderColor: completed ? "transparent" : colors.border,
            backgroundColor: completed ? "transparent" : colors.bg,
          },
        ]}
        editable={!completed && !disabled}
        selectTextOnFocus
        allowFontScaling={false}
      />

      {/* Checkbox */}
      <View style={styles.checkWrap}>
        {completed ? (
          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
        ) : (
          <View style={[styles.emptyCheck, { borderColor: colors.border }]} />
        )}
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  setNum: {
    width: 30,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  prev: {
    width: 80,
    fontSize: 12,
    textAlign: "center",
  },
  input: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
  },
  checkWrap: {
    width: 32,
    alignItems: "center",
  },
  emptyCheck: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
  },
});

export default SetRowNew;
