/**
 * WorkoutsPerWeekScreen
 * Select how many days per week to work out
 */

import React from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { darkColors, theme } from "@/src/theme";
import { useOnboarding } from "@/src/context/OnboardingContext";
import Button from "@/src/components/Button";
import { hapticPress, hapticSelect } from "@/src/animations/feedback/haptics";

type WorkoutsPerWeekScreenProps = {
  onNext: () => void;
};

const frequencies = [2, 3, 4, 5, 6] as const;

const getRecommendation = (count: number): string => {
  switch (count) {
    case 2:
      return "Great for beginners or busy schedules";
    case 3:
      return "Perfect balance for most goals";
    case 4:
      return "Ideal for building strength";
    case 5:
      return "Optimal for muscle building";
    case 6:
      return "For dedicated athletes";
    default:
      return "";
  }
};

export default function WorkoutsPerWeekScreen({ onNext }: WorkoutsPerWeekScreenProps) {
  const { form, updateForm } = useOnboarding();
  const selected = form.workoutsPerWeek ?? 3;

  const handleSelect = (value: number) => {
    hapticSelect();
    updateForm({ workoutsPerWeek: value });
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container} 
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text allowFontScaling={false} style={styles.title}>
          How many days{"\n"}can you train?
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          We&apos;ll shape your plan around this pace.
        </Text>
      </Animated.View>

      {/* Visual display */}
      <Animated.View 
        entering={FadeInDown.delay(150).duration(400)} 
        style={styles.valueDisplay}
      >
        <Text allowFontScaling={false} style={styles.valueNumber}>
          {selected}
        </Text>
        <Text allowFontScaling={false} style={styles.valueLabel}>
          {selected === 1 ? "day / week" : "days / week"}
        </Text>
      </Animated.View>

      {/* Days selection */}
      <Animated.View 
        entering={FadeInDown.delay(250).duration(400)} 
        style={styles.daysRow}
      >
        {frequencies.map((day) => {
          const isSelected = selected === day;
          return (
            <Pressable
              key={day}
              onPress={() => handleSelect(day)}
              style={({ pressed }) => [
                styles.dayButton,
                isSelected && styles.dayButtonSelected,
                pressed && styles.dayButtonPressed,
              ]}
            >
              <Text allowFontScaling={false} style={[
                styles.dayText,
                isSelected && styles.dayTextSelected,
              ]}>
                {day}
              </Text>
            </Pressable>
          );
        })}
      </Animated.View>

      {/* Recommendation */}
      <Animated.View 
        entering={FadeInDown.delay(350).duration(400)} 
        style={styles.recommendation}
      >
        <Ionicons name="sparkles" size={16} color={darkColors.primary} />
        <Text allowFontScaling={false} style={styles.recommendationText}>
          {getRecommendation(selected)}
        </Text>
      </Animated.View>

      {/* Week visualization */}
      <Animated.View 
        entering={FadeInDown.delay(400).duration(400)} 
        style={styles.weekPreview}
      >
        <Text allowFontScaling={false} style={styles.weekLabel}>
          Your week at a glance
        </Text>
        <View style={styles.weekDays}>
          {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => {
            const isActive = index < selected;
            return (
              <View 
                key={index} 
                style={[styles.weekDay, isActive && styles.weekDayActive]}
              >
                <Text allowFontScaling={false} style={[
                  styles.weekDayText,
                  isActive && styles.weekDayTextActive,
                ]}>
                  {day}
                </Text>
              </View>
            );
          })}
        </View>
      </Animated.View>

      <Animated.View 
        entering={FadeInDown.delay(450).duration(400)} 
        style={styles.footer}
      >
        <Button 
          title="Continue" 
          onPress={() => {
            hapticPress();
            onNext();
          }}
        />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingVertical: 16,
    gap: 24,
  },
  header: {
    gap: 8,
  },
  title: {
    color: darkColors.text,
    fontSize: 28,
    fontFamily: theme.fonts.heading,
    lineHeight: 36,
  },
  subtitle: {
    color: darkColors.muted,
    fontSize: 15,
    fontFamily: theme.fonts.body,
    lineHeight: 22,
  },
  valueDisplay: {
    alignItems: "center",
    gap: 4,
    paddingVertical: 16,
  },
  valueNumber: {
    color: darkColors.primary,
    fontSize: 72,
    fontFamily: theme.fonts.bodySemiBold,
    lineHeight: 80,
  },
  valueLabel: {
    color: darkColors.muted,
    fontSize: 16,
    fontFamily: theme.fonts.body,
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  dayButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: darkColors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  dayButtonSelected: {
    backgroundColor: darkColors.primary,
    borderColor: darkColors.primary,
  },
  dayButtonPressed: {
    opacity: 0.9,
  },
  dayText: {
    color: darkColors.text,
    fontSize: 20,
    fontFamily: theme.fonts.bodySemiBold,
  },
  dayTextSelected: {
    color: "#000",
  },
  recommendation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
  },
  recommendationText: {
    color: darkColors.muted,
    fontSize: 14,
    fontFamily: theme.fonts.body,
  },
  weekPreview: {
    backgroundColor: darkColors.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  weekLabel: {
    color: darkColors.muted,
    fontSize: 13,
    fontFamily: theme.fonts.bodyMedium,
    textAlign: "center",
  },
  weekDays: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  weekDay: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: darkColors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  weekDayActive: {
    backgroundColor: darkColors.selectedBg,
  },
  weekDayText: {
    color: darkColors.muted2,
    fontSize: 13,
    fontFamily: theme.fonts.bodyMedium,
  },
  weekDayTextActive: {
    color: darkColors.primary,
  },
  footer: {
    marginTop: "auto",
    paddingTop: 16,
  },
});
