/**
 * ExperienceScreen
 * Training experience level selection
 */

import React from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { darkColors, theme } from "@/src/theme";
import { useOnboarding } from "@/src/context/OnboardingContext";
import Button from "@/src/components/Button";
import { hapticPress } from "@/src/animations/feedback/haptics";

type ExperienceScreenProps = {
  onNext: () => void;
};

const levels = [
  {
    value: "beginner",
    label: "Beginner",
    subtitle: "New to weight training",
    description: "Perfect! We'll start with the fundamentals.",
    icon: "leaf",
  },
  {
    value: "novice",
    label: "Novice",
    subtitle: "Less than 1 year",
    description: "Building your foundation.",
    icon: "trending-up",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    subtitle: "1-3 years",
    description: "Ready for progressive overload.",
    icon: "barbell",
  },
  {
    value: "advanced",
    label: "Advanced",
    subtitle: "3+ years",
    description: "Optimizing for gains.",
    icon: "trophy",
  },
] as const;

export default function ExperienceScreen({ onNext }: ExperienceScreenProps) {
  const { form, updateForm } = useOnboarding();
  const selected = form.experienceLevel;

  const handleSelect = (value: typeof levels[number]["value"]) => {
    hapticPress();
    updateForm({ experienceLevel: value });
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container} 
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text allowFontScaling={false} style={styles.title}>
          What&apos;s your training{"\n"}experience?
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          This helps us match the complexity of your workouts.
        </Text>
      </Animated.View>

      <View style={styles.options}>
        {levels.map((level, index) => {
          const isSelected = selected === level.value;
          return (
            <Animated.View
              key={level.value}
              entering={FadeInDown.delay(index * 100).duration(400)}
            >
              <Pressable
                onPress={() => handleSelect(level.value)}
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
                    name={level.icon as any} 
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
                      {level.label}
                    </Text>
                    <Text allowFontScaling={false} style={styles.optionSubtitle}>
                      {level.subtitle}
                    </Text>
                  </View>
                  {isSelected && (
                    <Text allowFontScaling={false} style={styles.optionDescription}>
                      {level.description}
                    </Text>
                  )}
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
    alignItems: "flex-start",
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
    marginTop: 2,
  },
  optionIconSelected: {
    backgroundColor: darkColors.primary,
  },
  optionContent: {
    flex: 1,
    gap: 4,
  },
  optionHeader: {
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
    fontSize: 13,
    fontFamily: theme.fonts.body,
  },
  optionDescription: {
    color: darkColors.muted,
    fontSize: 13,
    fontFamily: theme.fonts.body,
    marginTop: 4,
  },
  footer: {
    marginTop: "auto",
    paddingTop: 16,
  },
});
