/**
 * MainGoalScreen
 * Primary fitness goal selection with animations
 */

import React from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { darkColors, theme } from "@/src/theme";
import { useOnboarding } from "@/src/context/OnboardingContext";
import Button from "@/src/components/Button";
import { hapticPress } from "@/src/animations/feedback/haptics";

type MainGoalScreenProps = {
  onNext: () => void;
};

const goals = [
  {
    value: "build_muscle",
    label: "Build Muscle",
    description: "Gain strength and size",
    icon: "barbell",
  },
  {
    value: "lose_weight",
    label: "Lose Weight",
    description: "Burn fat and slim down",
    icon: "flame",
  },
  {
    value: "get_toned",
    label: "Get Toned",
    description: "Lean and defined physique",
    icon: "body",
  },
  {
    value: "endurance",
    label: "Build Endurance",
    description: "Stamina and cardiovascular",
    icon: "heart",
  },
] as const;

export default function MainGoalScreen({ onNext }: MainGoalScreenProps) {
  const { form, updateForm } = useOnboarding();
  const selected = form.goal;

  const handleSelect = (value: typeof goals[number]["value"]) => {
    hapticPress();
    updateForm({ goal: value });
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container} 
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text allowFontScaling={false} style={styles.title}>
          What&apos;s your main{"\n"}fitness goal?
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          Pick the focus that matters most right now.
        </Text>
      </Animated.View>

      <View style={styles.grid}>
        {goals.map((goal, index) => {
          const isSelected = selected === goal.value;
          return (
            <Animated.View
              key={goal.value}
              entering={FadeInDown.delay(100 + index * 80).duration(400)}
              style={styles.cardWrap}
            >
              <Pressable
                onPress={() => handleSelect(goal.value)}
                style={({ pressed }) => [
                  styles.card,
                  isSelected && styles.cardSelected,
                  pressed && styles.cardPressed,
                ]}
              >
                <View style={[
                  styles.iconContainer,
                  isSelected && styles.iconSelected,
                ]}>
                  <Ionicons 
                    name={goal.icon as any} 
                    size={28} 
                    color={isSelected ? "#000" : darkColors.primary} 
                  />
                </View>
                <Text allowFontScaling={false} style={[
                  styles.cardLabel,
                  isSelected && styles.cardLabelSelected,
                ]}>
                  {goal.label}
                </Text>
                <Text allowFontScaling={false} style={styles.cardDescription}>
                  {goal.description}
                </Text>
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={20} color={darkColors.primary} />
                  </View>
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  cardWrap: {
    width: "48%",
  },
  card: {
    backgroundColor: darkColors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 10,
    borderWidth: 2,
    borderColor: "transparent",
    minHeight: 140,
    position: "relative",
  },
  cardSelected: {
    borderColor: darkColors.primary,
    backgroundColor: darkColors.selectedBg,
  },
  cardPressed: {
    opacity: 0.9,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: darkColors.selectedBg,
    alignItems: "center",
    justifyContent: "center",
  },
  iconSelected: {
    backgroundColor: darkColors.primary,
  },
  cardLabel: {
    color: darkColors.text,
    fontSize: 16,
    fontFamily: theme.fonts.bodySemiBold,
    textAlign: "center",
  },
  cardLabelSelected: {
    color: darkColors.primary,
  },
  cardDescription: {
    color: darkColors.muted,
    fontSize: 12,
    fontFamily: theme.fonts.body,
    textAlign: "center",
  },
  checkmark: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  footer: {
    marginTop: "auto",
    paddingTop: 16,
  },
});
