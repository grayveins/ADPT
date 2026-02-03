/**
 * SexScreen
 * Biological sex selection for training recommendations
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

type SexScreenProps = {
  onNext: () => void;
};

const options = [
  { value: "male", label: "Male", icon: "male" },
  { value: "female", label: "Female", icon: "female" },
  { value: "other", label: "Prefer not to say", icon: "person" },
] as const;

export default function SexScreen({ onNext }: SexScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { form, updateForm } = useOnboarding();
  const selected = form.sex;

  const handleSelect = (value: typeof options[number]["value"]) => {
    hapticPress();
    updateForm({ sex: value });
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container} 
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text allowFontScaling={false} style={styles.title}>
          What&apos;s your{"\n"}biological sex?
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          This helps us optimize your training recommendations based on physiology.
        </Text>
      </Animated.View>

      <View style={styles.options}>
        {options.map((option, index) => {
          const isSelected = selected === option.value;
          return (
            <Animated.View
              key={option.value}
              entering={FadeInDown.delay(index * 100).duration(400)}
            >
              <Pressable
                onPress={() => handleSelect(option.value)}
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
                    name={option.icon as any} 
                    size={28} 
                    color={isSelected ? colors.textOnPrimary : colors.primary} 
                  />
                </View>
                <Text allowFontScaling={false} style={[
                  styles.optionLabel,
                  isSelected && styles.optionLabelSelected,
                ]}>
                  {option.label}
                </Text>
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark" size={16} color={colors.textOnPrimary} />
                  </View>
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      <View style={styles.privacy}>
        <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
        <Text allowFontScaling={false} style={styles.privacyText}>
          Your data is private and never shared
        </Text>
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
      padding: 20,
      gap: 16,
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
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.selected,
      alignItems: "center",
      justifyContent: "center",
    },
    optionIconSelected: {
      backgroundColor: colors.primary,
    },
    optionLabel: {
      flex: 1,
      color: colors.text,
      fontSize: 18,
      fontFamily: theme.fonts.bodySemiBold,
    },
    optionLabelSelected: {
      color: colors.primary,
    },
    checkmark: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    privacy: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    privacyText: {
      color: colors.textMuted,
      fontSize: 13,
      fontFamily: theme.fonts.body,
    },
    footer: {
      marginTop: "auto",
      paddingTop: 16,
    },
  });
