/**
 * LimitationsScreen
 * Injuries or physical limitations selection
 */

import React from "react";
import { ScrollView, StyleSheet, Text, View, Pressable, TextInput } from "react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { darkColors, theme } from "@/src/theme";
import { useOnboarding } from "@/src/context/OnboardingContext";
import Button from "@/src/components/Button";
import { hapticPress } from "@/src/animations/feedback/haptics";

type LimitationsScreenProps = {
  onNext: () => void;
};

const limitations = [
  { value: "none", label: "None", icon: "checkmark-circle" },
  { value: "knees", label: "Knees", icon: "walk" },
  { value: "back", label: "Back", icon: "body" },
  { value: "shoulder", label: "Shoulders", icon: "fitness" },
  { value: "hips", label: "Hips", icon: "walk" },
  { value: "wrists", label: "Wrists", icon: "hand-left" },
  { value: "other", label: "Other", icon: "ellipsis-horizontal" },
] as const;

export default function LimitationsScreen({ onNext }: LimitationsScreenProps) {
  const { form, updateForm } = useOnboarding();
  const selected = form.limitations ?? [];
  const hasOther = selected.includes("other");

  const toggleLimitation = (value: string) => {
    hapticPress();
    
    if (value === "none") {
      updateForm({ limitations: ["none"], limitationsOtherText: "" });
      return;
    }

    const next = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected.filter((item) => item !== "none"), value];

    updateForm({
      limitations: next,
      limitationsOtherText: next.includes("other") ? form.limitationsOtherText ?? "" : "",
    });
  };

  const isSelected = (value: string) => selected.includes(value);

  return (
    <ScrollView 
      contentContainerStyle={styles.container} 
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text allowFontScaling={false} style={styles.title}>
          Any injuries or{"\n"}limitations?
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          We&apos;ll customize your workouts to keep you safe and progressing.
        </Text>
      </Animated.View>

      <Animated.View 
        entering={FadeInDown.delay(150).duration(400)} 
        style={styles.grid}
      >
        {limitations.map((item, index) => {
          const active = isSelected(item.value);
          const isNone = item.value === "none";
          return (
            <Pressable
              key={item.value}
              onPress={() => toggleLimitation(item.value)}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipSelected,
                isNone && active && styles.chipNone,
                pressed && styles.chipPressed,
              ]}
            >
              <Ionicons 
                name={item.icon as any} 
                size={18} 
                color={active ? (isNone ? "#000" : darkColors.primary) : darkColors.muted} 
              />
              <Text allowFontScaling={false} style={[
                styles.chipText,
                active && styles.chipTextSelected,
                isNone && active && styles.chipTextNone,
              ]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </Animated.View>

      {hasOther && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.otherSection}>
          <Text allowFontScaling={false} style={styles.otherLabel}>
            Tell us more (optional)
          </Text>
          <TextInput
            value={form.limitationsOtherText ?? ""}
            onChangeText={(value) => updateForm({ limitationsOtherText: value })}
            placeholder="Describe any other limitations..."
            placeholderTextColor={darkColors.muted}
            style={styles.otherInput}
            multiline
            numberOfLines={3}
            allowFontScaling={false}
            keyboardAppearance="dark"
          />
        </Animated.View>
      )}

      {/* Reassurance */}
      <Animated.View 
        entering={FadeInDown.delay(300).duration(400)} 
        style={styles.reassurance}
      >
        <View style={styles.reassuranceIcon}>
          <Ionicons name="shield-checkmark" size={20} color={darkColors.primary} />
        </View>
        <View style={styles.reassuranceContent}>
          <Text allowFontScaling={false} style={styles.reassuranceTitle}>
            Your safety is our priority
          </Text>
          <Text allowFontScaling={false} style={styles.reassuranceText}>
            We&apos;ll avoid exercises that stress problem areas and suggest alternatives.
          </Text>
        </View>
      </Animated.View>

      <Animated.View 
        entering={FadeInDown.delay(400).duration(400)} 
        style={styles.footer}
      >
        <Button 
          title="Continue" 
          onPress={onNext}
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: darkColors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "transparent",
  },
  chipSelected: {
    borderColor: darkColors.primary,
    backgroundColor: darkColors.selectedBg,
  },
  chipNone: {
    backgroundColor: darkColors.primary,
    borderColor: darkColors.primary,
  },
  chipPressed: {
    opacity: 0.9,
  },
  chipText: {
    color: darkColors.muted,
    fontSize: 14,
    fontFamily: theme.fonts.bodyMedium,
  },
  chipTextSelected: {
    color: darkColors.primary,
  },
  chipTextNone: {
    color: "#000",
  },
  otherSection: {
    gap: 8,
  },
  otherLabel: {
    color: darkColors.muted,
    fontSize: 13,
    fontFamily: theme.fonts.bodyMedium,
  },
  otherInput: {
    backgroundColor: darkColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: darkColors.border,
    padding: 16,
    color: darkColors.text,
    fontSize: 15,
    fontFamily: theme.fonts.body,
    minHeight: 100,
    textAlignVertical: "top",
  },
  reassurance: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: darkColors.card,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  reassuranceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: darkColors.selectedBg,
    alignItems: "center",
    justifyContent: "center",
  },
  reassuranceContent: {
    flex: 1,
    gap: 4,
  },
  reassuranceTitle: {
    color: darkColors.text,
    fontSize: 15,
    fontFamily: theme.fonts.bodySemiBold,
  },
  reassuranceText: {
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
