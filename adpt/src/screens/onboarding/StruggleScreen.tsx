/**
 * StruggleScreen
 * What&apos;s held you back? (Shows empathy, builds trust)
 * Helps us address their specific challenges
 */

import React from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { darkColors, theme } from "@/src/theme";
import { useOnboarding } from "@/src/context/OnboardingContext";
import Button from "@/src/components/Button";
import { hapticPress } from "@/src/animations/feedback/haptics";

type StruggleScreenProps = {
  onNext: () => void;
};

const struggles = [
  {
    value: "time",
    label: "Not enough time",
    description: "Life gets busy, workouts get skipped",
    icon: "time-outline",
  },
  {
    value: "motivation",
    label: "Staying motivated",
    description: "Hard to keep going without seeing results",
    icon: "trending-down-outline",
  },
  {
    value: "knowledge",
    label: "Not sure what to do",
    description: "Overwhelmed by conflicting advice",
    icon: "help-circle-outline",
  },
  {
    value: "consistency",
    label: "Being consistent",
    description: "Start strong but lose momentum",
    icon: "repeat-outline",
  },
  {
    value: "injury",
    label: "Past injuries",
    description: "Worried about getting hurt again",
    icon: "bandage-outline",
  },
  {
    value: "none",
    label: "Nothing specific",
    description: "Ready to start fresh!",
    icon: "checkmark-circle-outline",
  },
] as const;

export default function StruggleScreen({ onNext }: StruggleScreenProps) {
  const { form, updateForm } = useOnboarding();
  // Store in limitations for now, could add a separate field
  const selected = form.attribution;

  const handleSelect = (value: string) => {
    hapticPress();
    updateForm({ attribution: value });
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text allowFontScaling={false} style={styles.eyebrow}>
          We understand
        </Text>
        <Text allowFontScaling={false} style={styles.title}>
          What&apos;s held you{"\n"}back before?
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          Everyone has obstacles. Knowing yours helps us design a plan you&apos;ll actually stick to.
        </Text>
      </Animated.View>

      <View style={styles.options}>
        {struggles.map((struggle, index) => {
          const isSelected = selected === struggle.value;
          return (
            <Animated.View
              key={struggle.value}
              entering={FadeInDown.delay(100 + index * 60).duration(400)}
            >
              <Pressable
                onPress={() => handleSelect(struggle.value)}
                style={({ pressed }) => [
                  styles.option,
                  isSelected && styles.optionSelected,
                  pressed && styles.optionPressed,
                ]}
              >
                <View style={styles.optionLeft}>
                  <View style={[
                    styles.iconContainer,
                    isSelected && styles.iconContainerSelected,
                  ]}>
                    <Ionicons 
                      name={struggle.icon as any} 
                      size={24} 
                      color={isSelected ? "#000" : darkColors.muted} 
                    />
                  </View>
                  <View style={styles.optionText}>
                    <Text allowFontScaling={false} style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected,
                    ]}>
                      {struggle.label}
                    </Text>
                    <Text allowFontScaling={false} style={styles.optionDescription}>
                      {struggle.description}
                    </Text>
                  </View>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={24} color={darkColors.primary} />
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {/* Empathy message */}
      <Animated.View 
        entering={FadeInDown.delay(500).duration(400)} 
        style={styles.empathyCard}
      >
        <Ionicons name="heart" size={20} color={darkColors.primary} />
        <Text allowFontScaling={false} style={styles.empathyText}>
          ADPT adapts to your life, not the other way around. We&apos;ll help you overcome this.
        </Text>
      </Animated.View>

      <Animated.View 
        entering={FadeInDown.delay(600).duration(400)} 
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
  eyebrow: {
    color: darkColors.primary,
    fontSize: 14,
    fontFamily: theme.fonts.bodySemiBold,
    textTransform: "uppercase",
    letterSpacing: 1,
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
    justifyContent: "space-between",
    backgroundColor: darkColors.card,
    borderRadius: 16,
    padding: 14,
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
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: darkColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainerSelected: {
    backgroundColor: darkColors.primary,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    color: darkColors.text,
    fontSize: 16,
    fontFamily: theme.fonts.bodySemiBold,
  },
  optionLabelSelected: {
    color: darkColors.primary,
  },
  optionDescription: {
    color: darkColors.muted,
    fontSize: 13,
    fontFamily: theme.fonts.body,
  },
  empathyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: darkColors.selectedBg,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: darkColors.primary,
  },
  empathyText: {
    color: darkColors.text,
    fontSize: 14,
    fontFamily: theme.fonts.body,
    lineHeight: 20,
    flex: 1,
  },
  footer: {
    marginTop: "auto",
    paddingTop: 16,
  },
});
