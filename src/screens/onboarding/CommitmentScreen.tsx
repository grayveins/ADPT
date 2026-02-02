/**
 * CommitmentScreen
 * How committed are you? (Primes for success)
 * Creates psychological investment before continuing
 */

import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, Pressable, ScrollView } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  FadeInDown,
  interpolateColor,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { darkColors, theme } from "@/src/theme";
import Button from "@/src/components/Button";
import { hapticPress, hapticCelebration } from "@/src/animations/feedback/haptics";

type CommitmentScreenProps = {
  onNext: () => void;
};

const commitmentLevels = [
  {
    value: 1,
    label: "I&apos;ll try",
    description: "Curious to see what happens",
    icon: "leaf-outline",
  },
  {
    value: 2,
    label: "Pretty committed",
    description: "Ready to put in the work",
    icon: "flame-outline",
  },
  {
    value: 3,
    label: "All in",
    description: "Nothing will stop me",
    icon: "rocket-outline",
  },
];

export default function CommitmentScreen({ onNext }: CommitmentScreenProps) {
  const [selected, setSelected] = useState<number | null>(null);
  
  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(20);
  const encourageOpacity = useSharedValue(0);
  const encourageScale = useSharedValue(0.9);

  useEffect(() => {
    headerOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));
    headerY.value = withDelay(100, withSpring(0, { damping: 20 }));
  }, []);

  useEffect(() => {
    if (selected !== null) {
      encourageOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
      encourageScale.value = withDelay(200, withSpring(1, { damping: 15 }));
    }
  }, [selected]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));

  const encourageStyle = useAnimatedStyle(() => ({
    opacity: encourageOpacity.value,
    transform: [{ scale: encourageScale.value }],
  }));

  const handleSelect = (value: number) => {
    hapticPress();
    setSelected(value);
    if (value === 3) {
      hapticCelebration();
    }
  };

  const getEncouragementMessage = () => {
    switch (selected) {
      case 1:
        return "Every journey starts with a single step. We&apos;ll make it easy to build momentum!";
      case 2:
        return "That&apos;s the spirit! Your dedication will pay off. Let&apos;s build something great together.";
      case 3:
        return "Love the energy! With that mindset, you&apos;re going to crush your goals. Let&apos;s go!";
      default:
        return "";
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <Text allowFontScaling={false} style={styles.eyebrow}>
          One more thing
        </Text>
        <Text allowFontScaling={false} style={styles.title}>
          How committed{"\n"}are you?
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          Be honest - there&apos;s no wrong answer. This helps us set the right pace for you.
        </Text>
      </Animated.View>

      {/* Options */}
      <View style={styles.options}>
        {commitmentLevels.map((level, index) => {
          const isSelected = selected === level.value;
          return (
            <Animated.View
              key={level.value}
              entering={FadeInDown.delay(200 + index * 100).duration(400)}
            >
              <Pressable
                onPress={() => handleSelect(level.value)}
                style={({ pressed }) => [
                  styles.option,
                  isSelected && styles.optionSelected,
                  pressed && styles.optionPressed,
                ]}
              >
                {/* Intensity indicator */}
                <View style={styles.intensityBar}>
                  {[1, 2, 3].map((bar) => (
                    <View 
                      key={bar}
                      style={[
                        styles.intensitySegment,
                        bar <= level.value && styles.intensitySegmentActive,
                        isSelected && bar <= level.value && styles.intensitySegmentSelected,
                      ]}
                    />
                  ))}
                </View>

                <View style={styles.optionContent}>
                  <View style={[
                    styles.iconContainer,
                    isSelected && styles.iconContainerSelected,
                  ]}>
                    <Ionicons 
                      name={level.icon as any} 
                      size={28} 
                      color={isSelected ? "#000" : darkColors.text} 
                    />
                  </View>
                  <Text allowFontScaling={false} style={[
                    styles.optionLabel,
                    isSelected && styles.optionLabelSelected,
                  ]}>
                    {level.label.replace("&apos;", "'")}
                  </Text>
                  <Text allowFontScaling={false} style={styles.optionDescription}>
                    {level.description}
                  </Text>
                </View>

                {isSelected && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={24} color={darkColors.primary} />
                  </View>
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {/* Encouragement message */}
      {selected !== null && (
        <Animated.View style={[styles.encourageCard, encourageStyle]}>
          <Ionicons 
            name={selected === 3 ? "trophy" : "thumbs-up"} 
            size={24} 
            color={darkColors.primary} 
          />
          <Text allowFontScaling={false} style={styles.encourageText}>
            {getEncouragementMessage().replace(/&apos;/g, "'")}
          </Text>
        </Animated.View>
      )}

      {/* CTA */}
      <Animated.View 
        entering={FadeInDown.delay(600).duration(400)} 
        style={styles.footer}
      >
        <Button 
          title="Continue" 
          onPress={onNext} 
          disabled={selected === null}
        />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingVertical: 16,
    paddingBottom: 24,
  },
  header: {
    gap: 8,
    marginBottom: 32,
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
    gap: 16,
  },
  option: {
    backgroundColor: darkColors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
    overflow: "hidden",
  },
  optionSelected: {
    borderColor: darkColors.primary,
    backgroundColor: darkColors.selectedBg,
  },
  optionPressed: {
    opacity: 0.9,
  },
  intensityBar: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 16,
  },
  intensitySegment: {
    height: 4,
    flex: 1,
    backgroundColor: darkColors.border,
    borderRadius: 2,
  },
  intensitySegmentActive: {
    backgroundColor: darkColors.muted,
  },
  intensitySegmentSelected: {
    backgroundColor: darkColors.primary,
  },
  optionContent: {
    alignItems: "center",
    gap: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: darkColors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  iconContainerSelected: {
    backgroundColor: darkColors.primary,
  },
  optionLabel: {
    color: darkColors.text,
    fontSize: 18,
    fontFamily: theme.fonts.bodySemiBold,
  },
  optionLabelSelected: {
    color: darkColors.primary,
  },
  optionDescription: {
    color: darkColors.muted,
    fontSize: 14,
    fontFamily: theme.fonts.body,
  },
  checkmark: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  encourageCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: darkColors.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: darkColors.primary,
  },
  encourageText: {
    color: darkColors.text,
    fontSize: 15,
    fontFamily: theme.fonts.body,
    lineHeight: 22,
    flex: 1,
  },
  footer: {
    marginTop: "auto",
    paddingTop: 24,
  },
});
