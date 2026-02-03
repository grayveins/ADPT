/**
 * StrengthGains
 * 
 * Shows key lift progress with big numbers and percentage gains.
 * Inspired by Strong and Gravl's progress displays.
 */

import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/src/context/ThemeContext";

export type LiftProgress = {
  name: string;
  currentMax: number;      // Current estimated 1RM or best weight
  startingMax: number;     // First recorded max
  unit: "lbs" | "kg";
  lastUpdated?: string;    // Date of last PR
};

type StrengthGainsProps = {
  lifts: LiftProgress[];
  onLiftPress?: (liftName: string) => void;
};

const calculateGain = (current: number, starting: number) => {
  if (starting === 0) return { absolute: current, percent: 0 };
  const absolute = current - starting;
  const percent = ((current - starting) / starting) * 100;
  return { absolute, percent };
};

export const StrengthGains: React.FC<StrengthGainsProps> = ({ lifts, onLiftPress }) => {
  const { colors } = useTheme();

  if (lifts.length === 0) {
    return (
      <View style={[styles.emptyCard, { backgroundColor: colors.bgSecondary }]}>
        <Ionicons name="barbell-outline" size={32} color={colors.textMuted} />
        <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.textMuted }]}>
          Complete workouts to track your strength gains
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {lifts.map((lift, index) => {
        const { absolute, percent } = calculateGain(lift.currentMax, lift.startingMax);
        const isPositive = absolute >= 0;
        
        return (
          <Pressable
            key={lift.name}
            onPress={() => onLiftPress?.(lift.name)}
            style={({ pressed }) => [
              styles.liftCard,
              { backgroundColor: colors.card },
              pressed && styles.liftCardPressed,
            ]}
          >
            <View style={styles.liftHeader}>
              <Text allowFontScaling={false} style={[styles.liftName, { color: colors.text }]}>
                {lift.name}
              </Text>
              {lift.lastUpdated && (
                <View style={[styles.prBadge, { backgroundColor: colors.gold }]}>
                  <Text allowFontScaling={false} style={[styles.prBadgeText, { color: colors.bg }]}>
                    PR
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.liftStats}>
              <View style={styles.currentWeight}>
                <Text allowFontScaling={false} style={[styles.weightValue, { color: colors.text }]}>
                  {lift.currentMax}
                </Text>
                <Text allowFontScaling={false} style={[styles.weightUnit, { color: colors.textMuted }]}>
                  {lift.unit}
                </Text>
              </View>
              
              <View style={styles.gainInfo}>
                <View style={styles.gainRow}>
                  <Ionicons
                    name={isPositive ? "trending-up" : "trending-down"}
                    size={16}
                    color={isPositive ? colors.success : colors.error}
                  />
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.gainPercent,
                      { color: isPositive ? colors.success : colors.error },
                    ]}
                  >
                    {isPositive ? "+" : ""}{percent.toFixed(1)}%
                  </Text>
                </View>
                <Text allowFontScaling={false} style={[styles.gainAbsolute, { color: colors.textMuted }]}>
                  {isPositive ? "+" : ""}{absolute} {lift.unit} total
                </Text>
              </View>
            </View>
            
            {/* Progress bar showing relative improvement */}
            <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(100, Math.max(0, percent))}%`,
                    backgroundColor: isPositive ? colors.primary : colors.error,
                  },
                ]}
              />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  liftCard: {
    borderRadius: 16,
    padding: 16,
  },
  liftCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  liftHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  liftName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  prBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  prBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  liftStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  currentWeight: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  weightValue: {
    fontSize: 36,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -1,
  },
  weightUnit: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  gainInfo: {
    alignItems: "flex-end",
  },
  gainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  gainPercent: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  gainAbsolute: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
});

export default StrengthGains;
