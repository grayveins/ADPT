/**
 * GoalTimelineScreen
 * When do you want to achieve your goal?
 */

import React from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { darkColors, theme } from "@/src/theme";
import { useOnboarding } from "@/src/context/OnboardingContext";
import Button from "@/src/components/Button";
import { hapticPress } from "@/src/animations/feedback/haptics";

type GoalTimelineScreenProps = {
  onNext: () => void;
};

const timelines = [
  { 
    value: "3_months", 
    label: "3 months", 
    subtitle: "Aggressive but achievable",
    icon: "flash" 
  },
  { 
    value: "6_months", 
    label: "6 months", 
    subtitle: "Balanced approach",
    icon: "trending-up" 
  },
  { 
    value: "1_year", 
    label: "1 year", 
    subtitle: "Sustainable long-term",
    icon: "calendar" 
  },
  { 
    value: "no_rush", 
    label: "No rush", 
    subtitle: "Focus on the journey",
    icon: "infinite" 
  },
] as const;

export default function GoalTimelineScreen({ onNext }: GoalTimelineScreenProps) {
  const { form, updateForm } = useOnboarding();
  const selected = form.goalTimeline;

  const handleSelect = (value: typeof timelines[number]["value"]) => {
    hapticPress();
    updateForm({ goalTimeline: value });
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container} 
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text allowFontScaling={false} style={styles.title}>
          When do you want{"\n"}to reach your goal?
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          This helps us plan your training intensity.
        </Text>
      </Animated.View>

      <View style={styles.options}>
        {timelines.map((timeline, index) => {
          const isSelected = selected === timeline.value;
          return (
            <Animated.View
              key={timeline.value}
              entering={FadeInDown.delay(index * 100).duration(400)}
            >
              <Pressable
                onPress={() => handleSelect(timeline.value)}
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
                    name={timeline.icon as any} 
                    size={24} 
                    color={isSelected ? "#000" : darkColors.primary} 
                  />
                </View>
                <View style={styles.optionContent}>
                  <Text allowFontScaling={false} style={[
                    styles.optionLabel,
                    isSelected && styles.optionLabelSelected,
                  ]}>
                    {timeline.label}
                  </Text>
                  <Text allowFontScaling={false} style={styles.optionSubtitle}>
                    {timeline.subtitle}
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
    gap: 16,
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
    fontSize: 14,
    fontFamily: theme.fonts.body,
  },
  footer: {
    marginTop: "auto",
    paddingTop: 16,
  },
});
