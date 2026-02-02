/**
 * TrainingPreferenceScreen
 * Training split / style preference selection
 */

import React from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { darkColors, theme } from "@/src/theme";
import { useOnboarding } from "@/src/context/OnboardingContext";
import Button from "@/src/components/Button";
import { hapticPress } from "@/src/animations/feedback/haptics";

type TrainingPreferenceScreenProps = {
  onNext: () => void;
};

const splits = [
  {
    value: "full_body",
    label: "Full Body",
    description: "Train all muscle groups each session",
    detail: "Best for 2-3 days/week",
    icon: "body",
  },
  {
    value: "upper_lower",
    label: "Upper / Lower",
    description: "Alternate upper and lower body days",
    detail: "Best for 3-4 days/week",
    icon: "fitness",
  },
  {
    value: "ppl",
    label: "Push / Pull / Legs",
    description: "Split by movement patterns",
    detail: "Best for 4-6 days/week",
    icon: "barbell",
  },
  {
    value: "custom",
    label: "Let AI Decide",
    description: "We'll optimize based on your goals",
    detail: "Recommended",
    icon: "sparkles",
  },
] as const;

export default function TrainingPreferenceScreen({ onNext }: TrainingPreferenceScreenProps) {
  const { form, updateForm } = useOnboarding();
  const selected = form.trainingStyle;

  const handleSelect = (value: typeof splits[number]["value"]) => {
    hapticPress();
    updateForm({ trainingStyle: value });
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container} 
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text allowFontScaling={false} style={styles.title}>
          How do you like{"\n"}to train?
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          Choose a training split or let us optimize for you.
        </Text>
      </Animated.View>

      <View style={styles.options}>
        {splits.map((split, index) => {
          const isSelected = selected === split.value;
          const isRecommended = split.value === "custom";
          return (
            <Animated.View
              key={split.value}
              entering={FadeInDown.delay(index * 100).duration(400)}
            >
              <Pressable
                onPress={() => handleSelect(split.value)}
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
                    name={split.icon as any} 
                    size={24} 
                    color={isSelected ? "#000" : darkColors.primary} 
                  />
                </View>
                <View style={styles.optionContent}>
                  <View style={styles.optionTitleRow}>
                    <Text allowFontScaling={false} style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected,
                    ]}>
                      {split.label}
                    </Text>
                    {isRecommended && (
                      <View style={styles.recommendedBadge}>
                        <Text allowFontScaling={false} style={styles.recommendedText}>
                          AI
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text allowFontScaling={false} style={styles.optionDescription}>
                    {split.description}
                  </Text>
                  <Text allowFontScaling={false} style={[
                    styles.optionDetail,
                    isSelected && styles.optionDetailSelected,
                  ]}>
                    {split.detail}
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

      {/* Helper text */}
      <Animated.View 
        entering={FadeInDown.delay(450).duration(400)} 
        style={styles.helper}
      >
        <Ionicons name="information-circle" size={16} color={darkColors.muted} />
        <Text allowFontScaling={false} style={styles.helperText}>
          Not sure? &ldquo;Let AI Decide&rdquo; adapts to your schedule and goals.
        </Text>
      </Animated.View>

      <Animated.View 
        entering={FadeInDown.delay(500).duration(400)} 
        style={styles.footer}
      >
        <Button 
          title="Continue" 
          onPress={onNext} 
          disabled={!selected}
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
  optionTitleRow: {
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
  recommendedBadge: {
    backgroundColor: darkColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  recommendedText: {
    color: "#000",
    fontSize: 10,
    fontFamily: theme.fonts.bodySemiBold,
  },
  optionDescription: {
    color: darkColors.muted,
    fontSize: 13,
    fontFamily: theme.fonts.body,
  },
  optionDetail: {
    color: darkColors.muted2,
    fontSize: 12,
    fontFamily: theme.fonts.body,
    marginTop: 2,
  },
  optionDetailSelected: {
    color: darkColors.primary,
  },
  helper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  helperText: {
    color: darkColors.muted,
    fontSize: 13,
    fontFamily: theme.fonts.body,
    flex: 1,
  },
  footer: {
    marginTop: "auto",
    paddingTop: 16,
  },
});
