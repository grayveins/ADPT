/**
 * CoachMessage - Message bubble with optional action buttons
 * 
 * Displays coach messages with support for up to 3 action buttons.
 * Actions are rendered below the message text.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";

import { useTheme } from "@/src/context/ThemeContext";
import { spacing, radius } from "@/src/theme";
import { ActionButton } from "./ActionButton";
import type { Action } from "@/lib/coachContext";

type CoachMessageProps = {
  content: string;
  actions?: Action[];
  onActionPress?: (action: Action) => void;
  isError?: boolean;
};

export function CoachMessage({
  content,
  actions = [],
  onActionPress,
  isError = false,
}: CoachMessageProps) {
  const { colors } = useTheme();

  // Limit to max 3 actions
  const displayActions = actions.slice(0, 3);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isError ? colors.errorMuted : colors.card,
          },
        ]}
      >
        <Text
          allowFontScaling={false}
          style={[
            styles.text,
            { color: isError ? colors.error : colors.text },
          ]}
        >
          {content}
        </Text>
      </View>

      {displayActions.length > 0 && (
        <View style={styles.actionsContainer}>
          {displayActions.map((action, index) => (
            <ActionButton
              key={`${action.type}-${index}`}
              action={action}
              onPress={onActionPress}
              style={styles.actionButton}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  bubble: {
    maxWidth: "85%",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: "Inter_400Regular",
  },
  actionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingLeft: spacing.xs,
  },
  actionButton: {
    // Individual button styling handled by ActionButton
  },
});

export default CoachMessage;
