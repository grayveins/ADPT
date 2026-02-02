/**
 * EquipmentScreen
 * Equipment availability selection
 */

import React from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { darkColors, theme } from "@/src/theme";
import { useOnboarding } from "@/src/context/OnboardingContext";
import Button from "@/src/components/Button";
import { hapticPress } from "@/src/animations/feedback/haptics";

type EquipmentScreenProps = {
  onNext: () => void;
};

const options = [
  {
    value: "full_gym",
    label: "Full Gym",
    subtitle: "Barbells, machines, cables",
    icon: "barbell",
  },
  {
    value: "home_gym",
    label: "Home Gym",
    subtitle: "Rack, bench, weights",
    icon: "home",
  },
  {
    value: "dumbbells",
    label: "Dumbbells Only",
    subtitle: "Adjustable or fixed dumbbells",
    icon: "fitness",
  },
  {
    value: "bodyweight",
    label: "Bodyweight",
    subtitle: "No equipment needed",
    icon: "body",
  },
] as const;

export default function EquipmentScreen({ onNext }: EquipmentScreenProps) {
  const { form, updateForm } = useOnboarding();
  const selected = form.equipment;

  const handleSelect = (value: typeof options[number]["value"]) => {
    hapticPress();
    updateForm({ equipment: value });
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container} 
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text allowFontScaling={false} style={styles.title}>
          What equipment do{"\n"}you have access to?
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          We&apos;ll design workouts around your setup.
        </Text>
      </Animated.View>

      <View style={styles.grid}>
        {options.map((option, index) => {
          const isSelected = selected === option.value;
          return (
            <Animated.View
              key={option.value}
              entering={FadeInDown.delay(index * 80).duration(400)}
              style={styles.gridItem}
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
                    size={32} 
                    color={isSelected ? "#000" : darkColors.primary} 
                  />
                </View>
                <Text allowFontScaling={false} style={[
                  styles.optionLabel,
                  isSelected && styles.optionLabelSelected,
                ]}>
                  {option.label}
                </Text>
                <Text allowFontScaling={false} style={styles.optionSubtitle}>
                  {option.subtitle}
                </Text>
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark" size={14} color="#000" />
                  </View>
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridItem: {
    width: "48%",
  },
  option: {
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
  optionSelected: {
    borderColor: darkColors.primary,
    backgroundColor: darkColors.selectedBg,
  },
  optionPressed: {
    opacity: 0.9,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: darkColors.selectedBg,
    alignItems: "center",
    justifyContent: "center",
  },
  optionIconSelected: {
    backgroundColor: darkColors.primary,
  },
  optionLabel: {
    color: darkColors.text,
    fontSize: 15,
    fontFamily: theme.fonts.bodySemiBold,
    textAlign: "center",
  },
  optionLabelSelected: {
    color: darkColors.primary,
  },
  optionSubtitle: {
    color: darkColors.muted,
    fontSize: 12,
    fontFamily: theme.fonts.body,
    textAlign: "center",
  },
  checkmark: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: darkColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    marginTop: "auto",
    paddingTop: 16,
  },
});
