/**
 * BodyStatsScreen
 * Height and weight input with visual BMI indicator
 */

import React, { useState, useMemo } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Slider from "@react-native-community/slider";
import { darkColors, theme } from "@/src/theme";
import { useOnboarding } from "@/src/context/OnboardingContext";
import Button from "@/src/components/Button";
import { hapticPress } from "@/src/animations/feedback/haptics";

type BodyStatsScreenProps = {
  onNext: () => void;
};

// Convert cm to feet/inches
const cmToFeetInches = (cm: number) => {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches}"`;
};

// Convert kg to lbs
const kgToLbs = (kg: number) => Math.round(kg * 2.205);

// Calculate BMI
const calculateBMI = (weightKg: number, heightCm: number) => {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
};

// Get BMI category
const getBMICategory = (bmi: number | null) => {
  if (!bmi) return { label: "", color: darkColors.muted };
  if (bmi < 18.5) return { label: "Underweight", color: "#FFB800" };
  if (bmi < 25) return { label: "Healthy", color: darkColors.primary };
  if (bmi < 30) return { label: "Overweight", color: "#FF8C00" };
  return { label: "Obese", color: "#FF4444" };
};

export default function BodyStatsScreen({ onNext }: BodyStatsScreenProps) {
  const { form, updateForm } = useOnboarding();
  
  // Default values
  const [height, setHeight] = useState(form.heightCm ?? 170);
  const [weight, setWeight] = useState(form.weightKg ?? 75);
  const [useMetric, setUseMetric] = useState(false);

  const bmi = useMemo(() => calculateBMI(weight, height), [weight, height]);
  const bmiCategory = useMemo(() => getBMICategory(bmi), [bmi]);

  const handleNext = () => {
    updateForm({ heightCm: height, weightKg: weight });
    onNext();
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container} 
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text allowFontScaling={false} style={styles.title}>
          Let&apos;s get your{"\n"}measurements
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          We&apos;ll use this to calculate your training load.
        </Text>
      </Animated.View>

      {/* Unit toggle */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.unitToggle}>
        <Pressable
          onPress={() => {
            hapticPress();
            setUseMetric(false);
          }}
          style={[styles.unitOption, !useMetric && styles.unitOptionActive]}
        >
          <Text allowFontScaling={false} style={[
            styles.unitText,
            !useMetric && styles.unitTextActive,
          ]}>
            Imperial
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            hapticPress();
            setUseMetric(true);
          }}
          style={[styles.unitOption, useMetric && styles.unitOptionActive]}
        >
          <Text allowFontScaling={false} style={[
            styles.unitText,
            useMetric && styles.unitTextActive,
          ]}>
            Metric
          </Text>
        </Pressable>
      </Animated.View>

      {/* Height */}
      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.statCard}>
        <View style={styles.statHeader}>
          <Text allowFontScaling={false} style={styles.statLabel}>
            Height
          </Text>
          <Text allowFontScaling={false} style={styles.statValue}>
            {useMetric ? `${height} cm` : cmToFeetInches(height)}
          </Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={140}
          maximumValue={220}
          step={1}
          value={height}
          onValueChange={setHeight}
          minimumTrackTintColor={darkColors.primary}
          maximumTrackTintColor={darkColors.border}
          thumbTintColor={darkColors.primary}
        />
        <View style={styles.sliderLabels}>
          <Text allowFontScaling={false} style={styles.sliderLabel}>
            {useMetric ? "140 cm" : "4'7\""}
          </Text>
          <Text allowFontScaling={false} style={styles.sliderLabel}>
            {useMetric ? "220 cm" : "7'3\""}
          </Text>
        </View>
      </Animated.View>

      {/* Weight */}
      <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.statCard}>
        <View style={styles.statHeader}>
          <Text allowFontScaling={false} style={styles.statLabel}>
            Weight
          </Text>
          <Text allowFontScaling={false} style={styles.statValue}>
            {useMetric ? `${weight} kg` : `${kgToLbs(weight)} lbs`}
          </Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={40}
          maximumValue={180}
          step={0.5}
          value={weight}
          onValueChange={setWeight}
          minimumTrackTintColor={darkColors.primary}
          maximumTrackTintColor={darkColors.border}
          thumbTintColor={darkColors.primary}
        />
        <View style={styles.sliderLabels}>
          <Text allowFontScaling={false} style={styles.sliderLabel}>
            {useMetric ? "40 kg" : "88 lbs"}
          </Text>
          <Text allowFontScaling={false} style={styles.sliderLabel}>
            {useMetric ? "180 kg" : "397 lbs"}
          </Text>
        </View>
      </Animated.View>

      {/* BMI Indicator */}
      <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.bmiCard}>
        <View style={styles.bmiRow}>
          <Text allowFontScaling={false} style={styles.bmiLabel}>
            BMI
          </Text>
          <Text allowFontScaling={false} style={[styles.bmiValue, { color: bmiCategory.color }]}>
            {bmi ? bmi.toFixed(1) : "—"} · {bmiCategory.label}
          </Text>
        </View>
        <Text allowFontScaling={false} style={styles.bmiNote}>
          BMI is just one metric. Your training will be personalized.
        </Text>
      </Animated.View>

      <View style={styles.footer}>
        <Button 
          title="Continue" 
          onPress={handleNext}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingVertical: 16,
    gap: 20,
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
  unitToggle: {
    flexDirection: "row",
    backgroundColor: darkColors.card,
    borderRadius: 12,
    padding: 4,
  },
  unitOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  unitOptionActive: {
    backgroundColor: darkColors.primary,
  },
  unitText: {
    color: darkColors.muted,
    fontSize: 14,
    fontFamily: theme.fonts.bodyMedium,
  },
  unitTextActive: {
    color: "#000",
  },
  statCard: {
    backgroundColor: darkColors.card,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    color: darkColors.muted,
    fontSize: 14,
    fontFamily: theme.fonts.bodyMedium,
  },
  statValue: {
    color: darkColors.text,
    fontSize: 24,
    fontFamily: theme.fonts.bodySemiBold,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderLabel: {
    color: darkColors.muted2,
    fontSize: 12,
    fontFamily: theme.fonts.body,
  },
  bmiCard: {
    backgroundColor: darkColors.card,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  bmiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bmiLabel: {
    color: darkColors.muted,
    fontSize: 14,
    fontFamily: theme.fonts.bodyMedium,
  },
  bmiValue: {
    fontSize: 16,
    fontFamily: theme.fonts.bodySemiBold,
  },
  bmiNote: {
    color: darkColors.muted2,
    fontSize: 12,
    fontFamily: theme.fonts.body,
  },
  footer: {
    marginTop: "auto",
    paddingTop: 16,
  },
});
