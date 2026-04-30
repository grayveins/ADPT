/**
 * SubjectiveScales Component
 * 5 horizontal scale inputs (1-10) with emoji faces, teal fill bar,
 * and haptic feedback on each notch.
 *
 * Scales: Training adherence, Nutrition adherence, Energy, Sleep, Hunger
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/context/ThemeContext";
import { spacing, radius } from "@/src/theme";

export type SubjectiveData = {
  training: number;
  nutrition: number;
  energy: number;
  sleep: number;
  hunger: number;
};

type SubjectiveScalesProps = {
  values: SubjectiveData;
  onChange: (values: SubjectiveData) => void;
};

const SCALE_CONFIG: { key: keyof SubjectiveData; label: string; description: string }[] = [
  { key: "training", label: "Training", description: "Adherence to program" },
  { key: "nutrition", label: "Nutrition", description: "Adherence to plan" },
  { key: "energy", label: "Energy", description: "General energy levels" },
  { key: "sleep", label: "Sleep", description: "Sleep quality" },
  { key: "hunger", label: "Hunger", description: "Appetite this week" },
];

/** Returns emoji for a scale value 1-10 */
function getEmoji(value: number): string {
  if (value <= 2) return "\u{1F629}"; // weary
  if (value <= 4) return "\u{1F615}"; // confused/meh
  if (value <= 6) return "\u{1F610}"; // neutral
  if (value <= 8) return "\u{1F60A}"; // smiling
  return "\u{1F929}"; // star-struck
}

function ScaleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const { colors } = useTheme();

  const handlePress = (v: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(v);
  };

  const fillPercent = ((value - 1) / 9) * 100;

  return (
    <View style={styles.scaleRow}>
      {/* Label + emoji */}
      <View style={styles.labelRow}>
        <View style={{ flex: 1 }}>
          <Text
            allowFontScaling={false}
            style={[styles.scaleLabel, { color: colors.text }]}
          >
            {label}
          </Text>
          <Text
            allowFontScaling={false}
            style={[styles.scaleDescription, { color: colors.textMuted }]}
          >
            {description}
          </Text>
        </View>
        <View style={styles.emojiValue}>
          <Text style={styles.emoji}>{getEmoji(value)}</Text>
          <Text
            allowFontScaling={false}
            style={[styles.valueLabel, { color: colors.primary }]}
          >
            {value}
          </Text>
        </View>
      </View>

      {/* Scale bar */}
      <View style={[styles.track, { backgroundColor: colors.bgTertiary }]}>
        {/* Fill */}
        <View
          style={[
            styles.fill,
            {
              backgroundColor: colors.primary,
              width: `${fillPercent}%`,
            },
          ]}
        />
        {/* Notch buttons */}
        <View style={styles.notchContainer}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
            <Pressable
              key={v}
              onPress={() => handlePress(v)}
              style={styles.notchButton}
              hitSlop={{ top: 8, bottom: 8, left: 2, right: 2 }}
              accessibilityLabel={`${label} ${v} out of 10`}
            >
              <View
                style={[
                  styles.notchDot,
                  {
                    backgroundColor:
                      v <= value ? colors.primary : colors.border,
                    width: v === value ? 14 : 6,
                    height: v === value ? 14 : 6,
                    borderRadius: v === value ? 7 : 3,
                  },
                ]}
              />
            </Pressable>
          ))}
        </View>
      </View>

      {/* Min/Max labels */}
      <View style={styles.minMaxRow}>
        <Text
          allowFontScaling={false}
          style={[styles.minMaxText, { color: colors.textMuted }]}
        >
          Low
        </Text>
        <Text
          allowFontScaling={false}
          style={[styles.minMaxText, { color: colors.textMuted }]}
        >
          High
        </Text>
      </View>
    </View>
  );
}

export function SubjectiveScales({ values, onChange }: SubjectiveScalesProps) {
  const handleChange = (key: keyof SubjectiveData, v: number) => {
    onChange({ ...values, ...{ [key]: v } });
  };

  return (
    <View style={styles.container}>
      {SCALE_CONFIG.map((config) => (
        <ScaleRow
          key={config.key}
          label={config.label}
          description={config.description}
          value={values[config.key]}
          onChange={(v) => handleChange(config.key, v)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xl,
  },
  scaleRow: {
    gap: spacing.sm,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scaleLabel: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  scaleDescription: {
    fontSize: 12,
    fontWeight: "400",
    marginTop: 1,
  },
  emojiValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  emoji: {
    fontSize: 20,
  },
  valueLabel: {
    fontSize: 16,
    fontWeight: "700",
    minWidth: 20,
    textAlign: "center",
  },
  track: {
    height: 28,
    borderRadius: 14,
    overflow: "hidden",
    justifyContent: "center",
  },
  fill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 14,
    opacity: 0.25,
  },
  notchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  notchButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 28,
  },
  notchDot: {
    // Dynamic sizing applied inline
  },
  minMaxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  minMaxText: {
    fontSize: 10,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
