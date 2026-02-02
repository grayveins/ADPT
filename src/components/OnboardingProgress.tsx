/**
 * OnboardingProgress
 * Segmented progress bar showing onboarding sections
 */

import React from "react";
import { StyleSheet, View, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { darkColors, theme } from "@/src/theme";

type Section = {
  label: string;
  screens: number;
};

const SECTIONS: Section[] = [
  { label: "Goals", screens: 4 },
  { label: "You", screens: 4 },
  { label: "Training", screens: 5 },
  { label: "Plan", screens: 3 },
];

type OnboardingProgressProps = {
  currentScreen: number;
  totalScreens: number;
};

export const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
  currentScreen,
  totalScreens,
}) => {
  // Calculate which section we're in
  let screenCount = 0;
  let currentSection = 0;
  let screenInSection = 0;
  
  for (let i = 0; i < SECTIONS.length; i++) {
    if (currentScreen < screenCount + SECTIONS[i].screens) {
      currentSection = i;
      screenInSection = currentScreen - screenCount;
      break;
    }
    screenCount += SECTIONS[i].screens;
  }

  const overallProgress = currentScreen / totalScreens;

  return (
    <View style={styles.container}>
      {/* Section labels */}
      <View style={styles.labels}>
        {SECTIONS.map((section, index) => (
          <Text
            key={section.label}
            allowFontScaling={false}
            style={[
              styles.label,
              index === currentSection && styles.labelActive,
              index < currentSection && styles.labelCompleted,
            ]}
          >
            {section.label}
          </Text>
        ))}
      </View>
      
      {/* Progress bar segments */}
      <View style={styles.segments}>
        {SECTIONS.map((section, index) => {
          const isCompleted = index < currentSection;
          const isActive = index === currentSection;
          const sectionProgress = isCompleted 
            ? 1 
            : isActive 
              ? screenInSection / section.screens 
              : 0;

          return (
            <View key={section.label} style={styles.segment}>
              <View style={styles.segmentBg}>
                <Animated.View 
                  style={[
                    styles.segmentFill,
                    { width: `${sectionProgress * 100}%` },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 8,
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    color: darkColors.muted2,
    fontSize: 11,
    fontFamily: theme.fonts.bodyMedium,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  labelActive: {
    color: darkColors.primary,
  },
  labelCompleted: {
    color: darkColors.muted,
  },
  segments: {
    flexDirection: "row",
    gap: 4,
  },
  segment: {
    flex: 1,
  },
  segmentBg: {
    height: 4,
    backgroundColor: darkColors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  segmentFill: {
    height: "100%",
    backgroundColor: darkColors.primary,
    borderRadius: 2,
  },
});

export default OnboardingProgress;
