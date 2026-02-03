/**
 * GoalWhyScreen
 * Why is your goal important - motivation selection
 */

import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { theme } from "@/src/theme";
import { useOnboarding } from "@/src/context/OnboardingContext";
import Button from "@/src/components/Button";
import { hapticPress } from "@/src/animations/feedback/haptics";

type GoalWhyScreenProps = {
  onNext: () => void;
};

const motivations = [
  {
    value: "health",
    label: "General Health",
    subtitle: "Feel better overall",
    icon: "heart",
  },
  {
    value: "confidence",
    label: "Feel More Confident",
    subtitle: "Look good, feel great",
    icon: "star",
  },
  {
    value: "energy",
    label: "Have More Energy",
    subtitle: "Power through the day",
    icon: "flash",
  },
  {
    value: "stress",
    label: "Reduce Stress",
    subtitle: "Clear your mind",
    icon: "leaf",
  },
] as const;

export default function GoalWhyScreen({ onNext }: GoalWhyScreenProps) {
  const { colors } = useTheme();
  const { form, updateForm } = useOnboarding();
  const selected = form.goalWhy;
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleSelect = (value: typeof motivations[number]["value"]) => {
    hapticPress();
    updateForm({ goalWhy: value });
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container} 
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text allowFontScaling={false} style={styles.title}>
          Why is your goal{"\n"}important?
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          This helps us keep your plan meaningful and motivating.
        </Text>
      </Animated.View>

      <View style={styles.options}>
        {motivations.map((item, index) => {
          const isSelected = selected === item.value;
          return (
            <Animated.View
              key={item.value}
              entering={FadeInDown.delay(index * 100).duration(400)}
            >
              <Pressable
                onPress={() => handleSelect(item.value)}
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
                    name={item.icon as any} 
                    size={24} 
                    color={isSelected ? colors.textOnPrimary : colors.primary} 
                  />
                </View>
                <View style={styles.optionContent}>
                  <Text allowFontScaling={false} style={[
                    styles.optionLabel,
                    isSelected && styles.optionLabelSelected,
                  ]}>
                    {item.label}
                  </Text>
                  <Text allowFontScaling={false} style={styles.optionSubtitle}>
                    {item.subtitle}
                  </Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {/* Encouragement note */}
      <Animated.View 
        entering={FadeInDown.delay(450).duration(400)} 
        style={styles.encouragement}
      >
        <Ionicons name="sparkles" size={16} color={colors.primary} />
        <Text allowFontScaling={false} style={styles.encouragementText}>
          Your "why" is the secret to staying consistent
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

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      paddingVertical: 16,
      gap: 24,
    },
    header: {
      gap: 8,
    },
    title: {
      color: colors.text,
      fontSize: 28,
      fontFamily: theme.fonts.heading,
      lineHeight: 36,
    },
    subtitle: {
      color: colors.textMuted,
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
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      gap: 14,
      borderWidth: 2,
      borderColor: "transparent",
    },
    optionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.selected,
    },
    optionPressed: {
      opacity: 0.9,
    },
    optionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.selected,
      alignItems: "center",
      justifyContent: "center",
    },
    optionIconSelected: {
      backgroundColor: colors.primary,
    },
    optionContent: {
      flex: 1,
      gap: 2,
    },
    optionLabel: {
      color: colors.text,
      fontSize: 17,
      fontFamily: theme.fonts.bodySemiBold,
    },
    optionLabelSelected: {
      color: colors.primary,
    },
    optionSubtitle: {
      color: colors.textMuted,
      fontSize: 13,
      fontFamily: theme.fonts.body,
    },
    encouragement: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 8,
    },
    encouragementText: {
      color: colors.textMuted,
      fontSize: 13,
      fontFamily: theme.fonts.body,
      fontStyle: "italic",
    },
    footer: {
      marginTop: "auto",
      paddingTop: 16,
    },
  });
