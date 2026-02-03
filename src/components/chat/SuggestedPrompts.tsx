/**
 * SuggestedPrompts - Quick prompt chips below chat input
 * 
 * Always visible when input is empty.
 * Horizontal scroll with fade edges.
 */

import React from "react";
import {
  View,
  ScrollView,
  Pressable,
  Text,
  StyleSheet,
} from "react-native";

import { useTheme } from "@/src/context/ThemeContext";
import { spacing, radius } from "@/src/theme";

type SuggestedPromptsProps = {
  prompts: string[];
  onSelectPrompt: (prompt: string) => void;
  visible?: boolean;
};

export function SuggestedPrompts({
  prompts,
  onSelectPrompt,
  visible = true,
}: SuggestedPromptsProps) {
  const { colors } = useTheme();

  if (!visible || prompts.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {prompts.map((prompt, index) => (
          <Pressable
            key={`${prompt}-${index}`}
            onPress={() => onSelectPrompt(prompt)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: pressed ? colors.pressed : colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              allowFontScaling={false}
              style={[styles.chipText, { color: colors.text }]}
              numberOfLines={1}
            >
              {prompt}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});

export default SuggestedPrompts;
