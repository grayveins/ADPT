/**
 * AgeRangeScreen
 * Age bracket selection
 */

import React from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { darkColors, theme } from "@/src/theme";
import { useOnboarding } from "@/src/context/OnboardingContext";
import Button from "@/src/components/Button";
import { hapticPress } from "@/src/animations/feedback/haptics";

type AgeRangeScreenProps = {
  onNext: () => void;
};

const ageRanges = [
  { value: "18-25", label: "18 - 25" },
  { value: "26-35", label: "26 - 35" },
  { value: "36-45", label: "36 - 45" },
  { value: "46-55", label: "46 - 55" },
  { value: "55+", label: "55+" },
] as const;

export default function AgeRangeScreen({ onNext }: AgeRangeScreenProps) {
  const { form, updateForm } = useOnboarding();
  const selected = form.ageRange;

  const handleSelect = (value: typeof ageRanges[number]["value"]) => {
    hapticPress();
    updateForm({ ageRange: value });
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container} 
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text allowFontScaling={false} style={styles.title}>
          What&apos;s your{"\n"}age range?
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          Training recommendations adjust based on your life stage.
        </Text>
      </Animated.View>

      <View style={styles.options}>
        {ageRanges.map((range, index) => {
          const isSelected = selected === range.value;
          return (
            <Animated.View
              key={range.value}
              entering={FadeInDown.delay(index * 80).duration(400)}
            >
              <Pressable
                onPress={() => handleSelect(range.value)}
                style={({ pressed }) => [
                  styles.option,
                  isSelected && styles.optionSelected,
                  pressed && styles.optionPressed,
                ]}
              >
                <Text allowFontScaling={false} style={[
                  styles.optionLabel,
                  isSelected && styles.optionLabelSelected,
                ]}>
                  {range.label}
                </Text>
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
    gap: 10,
  },
  option: {
    backgroundColor: darkColors.card,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 20,
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
  optionLabel: {
    color: darkColors.text,
    fontSize: 18,
    fontFamily: theme.fonts.bodySemiBold,
    textAlign: "center",
  },
  optionLabelSelected: {
    color: darkColors.primary,
  },
  footer: {
    marginTop: "auto",
    paddingTop: 16,
  },
});
