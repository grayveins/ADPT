/**
 * EquipmentScreen
 * Full equipment grid with multi-select and custom SVG icons
 * Pre-fills based on gym type from previous screen
 */

import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { theme } from "@/src/theme";
import { useOnboarding, type OnboardingForm } from "@/src/context/OnboardingContext";
import Button from "@/src/components/Button";
import { hapticPress } from "@/src/animations/feedback/haptics";
import { EquipmentIcons, type EquipmentIconKey } from "@/src/components/icons/equipment";

type EquipmentScreenProps = {
  onNext: () => void;
};

type EquipmentItem = {
  id: string;
  label: string;
  icon: EquipmentIconKey;
  category: "essential" | "machines" | "accessories" | "cardio";
};

// All available equipment items - organized by category
const allEquipment: EquipmentItem[] = [
  // Essential - most common
  { id: "barbell", label: "Barbell", icon: "barbell", category: "essential" },
  { id: "dumbbells", label: "Dumbbells", icon: "dumbbells", category: "essential" },
  { id: "bench", label: "Bench", icon: "bench", category: "essential" },
  { id: "squat_rack", label: "Squat Rack", icon: "squat_rack", category: "essential" },
  { id: "pullup_bar", label: "Pull-up Bar", icon: "pullup_bar", category: "essential" },
  { id: "cables", label: "Cable Machine", icon: "cables", category: "essential" },
  
  // Machines
  { id: "lat_pulldown", label: "Lat Pulldown", icon: "lat_pulldown", category: "machines" },
  { id: "leg_press", label: "Leg Press", icon: "leg_press", category: "machines" },
  { id: "smith_machine", label: "Smith Machine", icon: "smith_machine", category: "machines" },
  { id: "chest_fly", label: "Chest Fly", icon: "chest_fly", category: "machines" },
  { id: "leg_curl", label: "Leg Curl/Ext", icon: "leg_curl", category: "machines" },
  { id: "cable_crossover", label: "Cable Cross", icon: "cable_crossover", category: "machines" },
  
  // Specialty bars & equipment
  { id: "ez_curl_bar", label: "EZ Curl Bar", icon: "ez_curl_bar", category: "accessories" },
  { id: "trap_bar", label: "Trap/Hex Bar", icon: "trap_bar", category: "accessories" },
  { id: "dip_station", label: "Dip Station", icon: "dip_station", category: "accessories" },
  { id: "preacher_curl", label: "Preacher Bench", icon: "preacher_curl", category: "accessories" },
  { id: "kettlebells", label: "Kettlebells", icon: "kettlebells", category: "accessories" },
  { id: "resistance_bands", label: "Bands", icon: "resistance_bands", category: "accessories" },
  
  // Home/minimal
  { id: "adjustable_dumbbells", label: "Adj. Dumbbells", icon: "adjustable_dumbbells", category: "accessories" },
  { id: "olympic_plates", label: "Olympic Plates", icon: "olympic_plates", category: "accessories" },
  { id: "foam_roller", label: "Foam Roller", icon: "foam_roller", category: "accessories" },
  { id: "medicine_ball", label: "Medicine Ball", icon: "medicine_ball", category: "accessories" },
  
  // Cardio
  { id: "rowing_machine", label: "Rowing", icon: "rowing_machine", category: "cardio" },
  { id: "treadmill", label: "Treadmill", icon: "treadmill", category: "cardio" },
  
  // Always available
  { id: "bodyweight", label: "Bodyweight", icon: "bodyweight", category: "essential" },
];

// Pre-fill equipment based on gym type
const getDefaultEquipment = (gymType: OnboardingForm["gymType"]): string[] => {
  switch (gymType) {
    case "large_gym":
      return [
        "barbell", "dumbbells", "cables", "pullup_bar", "bench",
        "squat_rack", "leg_press", "lat_pulldown", "smith_machine",
        "chest_fly", "leg_curl", "cable_crossover", "ez_curl_bar",
        "dip_station", "kettlebells", "rowing_machine", "treadmill"
      ];
    case "small_gym":
      return [
        "barbell", "dumbbells", "cables", "pullup_bar", "bench", 
        "squat_rack", "lat_pulldown", "dip_station", "kettlebells"
      ];
    case "home_gym":
      return ["dumbbells", "pullup_bar", "resistance_bands", "bodyweight", "kettlebells"];
    default:
      return ["bodyweight"];
  }
};

// Category labels
const CATEGORY_LABELS: Record<string, string> = {
  essential: "Essentials",
  machines: "Machines",
  accessories: "Accessories",
  cardio: "Cardio",
};

export default function EquipmentScreen({ onNext }: EquipmentScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { form, updateForm } = useOnboarding();
  
  // Initialize from form or pre-fill based on gym type
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(() => {
    if (form.availableEquipment && form.availableEquipment.length > 0) {
      return form.availableEquipment;
    }
    return getDefaultEquipment(form.gymType);
  });

  const toggleEquipment = (id: string) => {
    hapticPress();
    setSelectedEquipment((prev) =>
      prev.includes(id)
        ? prev.filter((e) => e !== id)
        : [...prev, id]
    );
  };

  const handleContinue = () => {
    hapticPress();
    updateForm({ availableEquipment: selectedEquipment });
    onNext();
  };

  // Group equipment by category
  const equipmentByCategory = useMemo(() => {
    const categories = ["essential", "machines", "accessories", "cardio"];
    return categories.map(cat => ({
      category: cat,
      items: allEquipment.filter(item => item.category === cat),
    }));
  }, []);

  // Get gym type label for subtitle
  const gymTypeLabel = form.gymType === "large_gym" 
    ? "full gym" 
    : form.gymType === "small_gym" 
      ? "basic gym" 
      : "home setup";

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text allowFontScaling={false} style={styles.title}>
          Confirm your equipment
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          We've pre-selected based on your {gymTypeLabel}. Tap to adjust.
        </Text>
      </Animated.View>

      {/* Equipment by category */}
      {equipmentByCategory.map((group, groupIndex) => (
        <Animated.View 
          key={group.category}
          entering={FadeInDown.delay(100 + groupIndex * 50).duration(350)}
          style={styles.categorySection}
        >
          <Text allowFontScaling={false} style={styles.categoryLabel}>
            {CATEGORY_LABELS[group.category]}
          </Text>
          <View style={styles.grid}>
            {group.items.map((item) => {
              const isSelected = selectedEquipment.includes(item.id);
              const IconComponent = EquipmentIcons[item.icon];
              
              return (
                <Pressable
                  key={item.id}
                  onPress={() => toggleEquipment(item.id)}
                  style={({ pressed }) => [
                    styles.equipmentCard,
                    isSelected && styles.equipmentCardSelected,
                    pressed && styles.equipmentCardPressed,
                  ]}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      isSelected && styles.iconContainerSelected,
                    ]}
                  >
                    <IconComponent
                      size={20}
                      color={isSelected ? colors.textOnPrimary : colors.primary}
                    />
                  </View>
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.equipmentLabel,
                      isSelected && styles.equipmentLabelSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <Ionicons
                        name="checkmark"
                        size={10}
                        color={colors.textOnPrimary}
                      />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      ))}

      <Animated.View
        entering={FadeInDown.delay(400).duration(400)}
        style={styles.infoCard}
      >
        <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
        <Text allowFontScaling={false} style={styles.infoText}>
          {selectedEquipment.length === 0
            ? "Select at least one option to continue"
            : `${selectedEquipment.length} items selected. We'll design workouts around what you have.`}
        </Text>
      </Animated.View>

      <View style={styles.footer}>
        <Animated.View entering={FadeInDown.delay(450).duration(400)}>
          <Button
            title={`Continue (${selectedEquipment.length} selected)`}
            onPress={handleContinue}
            disabled={selectedEquipment.length === 0}
          />
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      paddingVertical: 16,
      gap: 16,
      paddingBottom: 24,
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
    categorySection: {
      gap: 10,
    },
    categoryLabel: {
      color: colors.textMuted,
      fontSize: 12,
      fontFamily: theme.fonts.bodyMedium,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    equipmentCard: {
      width: "31%",
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 10,
      alignItems: "center",
      gap: 6,
      borderWidth: 2,
      borderColor: "transparent",
      minHeight: 80,
      position: "relative",
    },
    equipmentCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.selected,
    },
    equipmentCardPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.97 }],
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.selected,
      alignItems: "center",
      justifyContent: "center",
    },
    iconContainerSelected: {
      backgroundColor: colors.primary,
    },
    equipmentLabel: {
      color: colors.text,
      fontSize: 10,
      fontFamily: theme.fonts.bodySemiBold,
      textAlign: "center",
    },
    equipmentLabelSelected: {
      color: colors.primary,
    },
    checkBadge: {
      position: "absolute",
      top: 4,
      right: 4,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    infoCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      backgroundColor: colors.selected,
      borderRadius: 10,
      padding: 12,
    },
    infoText: {
      flex: 1,
      color: colors.text,
      fontSize: 13,
      fontFamily: theme.fonts.body,
      lineHeight: 18,
    },
    footer: {
      marginTop: "auto",
      paddingTop: 8,
    },
  });
