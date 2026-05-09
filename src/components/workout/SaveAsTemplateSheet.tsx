/**
 * SaveAsTemplateSheet
 * Bottom sheet shown after completing a workout.
 * "Save as Template?" with name input.
 */

import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Modal, StyleSheet } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useTheme } from "@/src/context/ThemeContext";
import { hapticPress } from "@/src/animations/feedback/haptics";

type Props = {
  visible: boolean;
  defaultName: string;
  onSave: (name: string) => void;
  onSkip: () => void;
};

export function SaveAsTemplateSheet({ visible, defaultName, onSave, onSkip }: Props) {
  const { colors } = useTheme();
  const [name, setName] = useState(defaultName);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onSkip}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onSkip} />
        <Animated.View
          entering={FadeInUp.duration(300)}
          style={[styles.sheet, { backgroundColor: colors.bg }]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text allowFontScaling={false} style={[styles.title, { color: colors.text }]}>
            Save as Template?
          </Text>
          <Text allowFontScaling={false} style={[styles.subtitle, { color: colors.textMuted }]}>
            Reuse this workout next time
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Template name"
            placeholderTextColor={colors.inputPlaceholder}
            style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
            autoFocus
            keyboardAppearance="dark"
            allowFontScaling={false}
          />

          <View style={styles.actions}>
            <Pressable
              onPress={() => {
                hapticPress();
                onSkip();
              }}
              style={[styles.skipButton, { backgroundColor: colors.card }]}
            >
              <Text allowFontScaling={false} style={[styles.skipText, { color: colors.textMuted }]}>
                Skip
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                hapticPress();
                onSave(name.trim() || defaultName);
              }}
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
            >
              <Text allowFontScaling={false} style={[styles.saveText, { color: colors.textOnPrimary }]}>
                Save Template
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 20,
  },
  input: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  skipText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  saveButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
