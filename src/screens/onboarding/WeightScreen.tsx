import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Slider from "@react-native-community/slider";

import Button from "@/src/components/Button";
import { useOnboarding } from "@/src/context/OnboardingContext";
import { kgToLbs, lbsToKg, roundTo } from "@/lib/units";
import { darkColors, theme } from "@/src/theme";

type WeightScreenProps = {
  onNext: () => void;
};

export default function WeightScreen({ onNext }: WeightScreenProps) {
  const { form, updateForm } = useOnboarding();
  const weightKg = form.weightKg ?? lbsToKg(165);
  const [manualWeight, setManualWeight] = useState("");

  const sliderValue = useMemo(() => roundTo(kgToLbs(weightKg), 1), [weightKg]);
  const display = useMemo(() => sliderValue.toFixed(1), [sliderValue]);

  useEffect(() => {
    setManualWeight(display);
  }, [display]);

  const handleChange = (value: number) => {
    updateForm({ weightKg: roundTo(lbsToKg(value), 0.5) });
  };

  const applyManualWeight = (value: string) => {
    setManualWeight(value);
    if (!value.trim()) return;
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      if (parsed >= 90 && parsed <= 350) {
        updateForm({ weightKg: roundTo(lbsToKg(parsed), 0.5) });
      }
    }
  };

  const handleNext = () => {
    if (!form.weightKg) updateForm({ weightKg });
    onNext();
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text allowFontScaling={false} style={styles.title}>What&apos;s your current weight?</Text>
        <Text allowFontScaling={false} style={styles.subtitle}>Estimate if you&apos;re unsure.</Text>
      </View>

      <View style={styles.valueRow}>
        <Text allowFontScaling={false} style={styles.value}>{display}</Text>
        <Text allowFontScaling={false} style={styles.unit}>lb</Text>
      </View>

      <Slider
        minimumValue={90}
        maximumValue={350}
        step={0.5}
        value={sliderValue}
        onValueChange={handleChange}
        minimumTrackTintColor={darkColors.primary}
        maximumTrackTintColor={darkColors.border}
        thumbTintColor={darkColors.primary}
      />

      <TextInput
        value={manualWeight}
        onChangeText={applyManualWeight}
        keyboardType="numeric"
        style={styles.input}
        allowFontScaling={false}
        keyboardAppearance="dark"
        placeholderTextColor={darkColors.muted}
      />

      <Button title="Continue" onPress={handleNext} style={styles.cta} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    transform: [{ translateY: -8 }],
    gap: theme.space.l,
  },
  header: {
    gap: theme.space.s,
  },
  title: {
    color: darkColors.text,
    fontFamily: theme.fonts.heading,
    fontSize: theme.type.h1,
    lineHeight: 42,
  },
  subtitle: {
    color: darkColors.muted,
    fontFamily: theme.fonts.body,
    fontSize: theme.type.body,
    lineHeight: 22,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: theme.space.s,
  },
  value: {
    color: darkColors.text,
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 44,
  },
  unit: {
    color: darkColors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 16,
  },
  input: {
    backgroundColor: darkColors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: darkColors.border,
    paddingHorizontal: theme.space.l,
    paddingVertical: theme.space.m,
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 16,
    color: darkColors.text,
  },
  cta: {
    marginTop: theme.space.s,
  },
});
