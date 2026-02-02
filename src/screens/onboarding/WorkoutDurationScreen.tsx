/**
 * WorkoutDurationScreen
 * Preferred workout duration selection
 */

import React from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { darkColors, theme } from "@/src/theme";
import { useOnboarding } from "@/src/context/OnboardingContext";
import Button from "@/src/components/Button";
import { hapticPress } from "@/src/animations/feedback/haptics";

type WorkoutDurationScreenProps = {
  onNext: () => void;
};

const durations = [
  {
    value: 30,
    label: "30 min",
    subtitle: "Quick & efficient",
    recommended: false,
  },
  {
    value: 45,
    label: "45 min",
    subtitle: "Balanced sessions",
    recommended: true,
  },
  {
    value: 60,
    label: "60 min",
    subtitle: "Thorough training",
    recommended: false,
  },
  {
    value: 75,
    label: "75+ min",
    subtitle: "Extended workouts",
    recommended: false,
  },
] as const;

export default function WorkoutDurationScreen({ onNext }: WorkoutDurationScreenProps) {
  const { form, updateForm } = useOnboarding();
  const selected = form.workoutDuration;

  const handleSelect = (value: typeof durations[number]["value"]) => {
    hapticPress();
    updateForm({ workoutDuration: value });
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container} 
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text allowFontScaling={false} style={styles.title}>
          How long do you want{"\n"}to train?
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          We&apos;ll structure your workouts to fit your schedule.
        </Text>
      </Animated.View>

      <View style={styles.options}>
        {durations.map((duration, index) => {
          const isSelected = selected === duration.value;
          return (
            <Animated.View
              key={duration.value}
              entering={FadeInDown.delay(index * 100).duration(400)}
            >
              <Pressable
                onPress={() => handleSelect(duration.value)}
                style={({ pressed }) => [
                  styles.option,
                  isSelected && styles.optionSelected,
                  pressed && styles.optionPressed,
                ]}
              >
                <View style={[
                  styles.optionIcon,
                  isSelected && styles.optionIconSelected,
                ]}>
                  <Ionicons 
                    name="time" 
                    size={24} 
                    color={isSelected ? "#000" : darkColors.primary} 
                  />
                </View>
                <View style={styles.optionContent}>
                  <View style={styles.optionHeader}>
                    <Text allowFontScaling={false} style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected,
                    ]}>
                      {duration.label}
                    </Text>
                    {duration.recommended && (
                      <View style={styles.recommendedBadge}>
                        <Text allowFontScaling={false} style={styles.recommendedText}>
                          Popular
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text allowFontScaling={false} style={styles.optionSubtitle}>
                    {duration.subtitle}
                  </Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={24} color={darkColors.primary} />
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.tip}>
        <Ionicons name="bulb" size={18} color={darkColors.primary} />
        <Text allowFontScaling={false} style={styles.tipText}>
          Quality beats quantity. 30-45 minutes of focused training is highly effective.
        </Text>
      </Animated.View>

      <View style={styles.footer}>
        <Button 
          title="Continue" 
          onPress={onNext} 
          disabled={!selected}
        />
      </View>
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
  options: {
    gap: 12,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: darkColors.card,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionSelected: {
    borderColor: darkColors.primary,
    backgroundColor: darkColors.selectedBg,
  },
  optionPressed: {
    opacity: 0.9,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: darkColors.selectedBg,
    alignItems: "center",
    justifyContent: "center",
  },
  optionIconSelected: {
    backgroundColor: darkColors.primary,
  },
  optionContent: {
    flex: 1,
    gap: 2,
  },
  optionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  optionLabel: {
    color: darkColors.text,
    fontSize: 17,
    fontFamily: theme.fonts.bodySemiBold,
  },
  optionLabelSelected: {
    color: darkColors.primary,
  },
  optionSubtitle: {
    color: darkColors.muted,
    fontSize: 13,
    fontFamily: theme.fonts.body,
  },
  recommendedBadge: {
    backgroundColor: darkColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recommendedText: {
    color: "#000",
    fontSize: 10,
    fontFamily: theme.fonts.bodySemiBold,
    textTransform: "uppercase",
  },
  tip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: darkColors.card,
    borderRadius: 12,
    padding: 14,
  },
  tipText: {
    flex: 1,
    color: darkColors.muted,
    fontSize: 13,
    fontFamily: theme.fonts.body,
    lineHeight: 18,
  },
  footer: {
    marginTop: "auto",
    paddingTop: 16,
  },
});
