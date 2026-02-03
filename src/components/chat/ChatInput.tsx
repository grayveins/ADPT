/**
 * ChatInput - Expanding chat input component
 * 
 * Features:
 * - Auto-grows from 1 line (48pt) to 4 lines (~120pt)
 * - Internal scroll for overflow beyond 4 lines
 * - Integrated send button
 * - Reports height changes to parent for layout adjustments
 * - Matches ChatGPT/iMessage UX expectations
 * 
 * Usage:
 * ```tsx
 * <ChatInput
 *   value={text}
 *   onChangeText={setText}
 *   onSend={handleSend}
 *   onHeightChange={setInputHeight}
 *   placeholder="Ask your coach..."
 * />
 * ```
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputContentSizeChangeEventData,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/src/context/ThemeContext";
import { layout, spacing } from "@/src/theme";

type ChatInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  onHeightChange?: (height: number) => void;
};

// Constants
const MIN_HEIGHT = layout.inputMinHeight;      // 48pt - 1 line
const MAX_HEIGHT = layout.inputMaxHeight;      // 120pt - ~4 lines
const SEND_BUTTON_SIZE = 36;
const HORIZONTAL_PADDING = 16;
const VERTICAL_PADDING = 8;

export function ChatInput({
  value,
  onChangeText,
  onSend,
  disabled = false,
  placeholder = "Message...",
  onHeightChange,
}: ChatInputProps) {
  const { colors } = useTheme();
  const [inputHeight, setInputHeight] = useState<number>(MIN_HEIGHT);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Track content height for auto-grow
  const handleContentSizeChange = useCallback(
    (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      const contentHeight = e.nativeEvent.contentSize.height;
      // Add padding to content height
      const newHeight = Math.min(
        MAX_HEIGHT,
        Math.max(MIN_HEIGHT, contentHeight + VERTICAL_PADDING * 2)
      );
      
      if (newHeight !== inputHeight) {
        setInputHeight(newHeight);
        onHeightChange?.(newHeight);
      }
    },
    [inputHeight, onHeightChange]
  );

  // Reset height when text is cleared
  useEffect(() => {
    if (!value) {
      setInputHeight(MIN_HEIGHT);
      onHeightChange?.(MIN_HEIGHT);
    }
  }, [value, onHeightChange]);

  // Handle send
  const handleSend = useCallback(() => {
    if (value.trim() && !disabled) {
      onSend();
    }
  }, [value, disabled, onSend]);

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.card,
            borderColor: isFocused ? colors.primary : colors.border,
            minHeight: MIN_HEIGHT,
            maxHeight: MAX_HEIGHT,
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            {
              color: colors.text,
              height: inputHeight - VERTICAL_PADDING * 2,
            },
          ]}
          multiline
          scrollEnabled={inputHeight >= MAX_HEIGHT}
          onContentSizeChange={handleContentSizeChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardAppearance="dark"
          returnKeyType="default"
          blurOnSubmit={false}
          textAlignVertical="center"
        />

        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          style={[
            styles.sendButton,
            {
              backgroundColor: canSend ? colors.primary : colors.border,
            },
          ]}
        >
          <Ionicons
            name="arrow-up"
            size={20}
            color={canSend ? colors.textOnPrimary : colors.textMuted}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 24,
    borderWidth: 1,
    paddingLeft: HORIZONTAL_PADDING,
    paddingRight: spacing.xs,
    paddingVertical: VERTICAL_PADDING,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    paddingTop: 0,
    paddingBottom: 0,
    marginRight: spacing.sm,
  },
  sendButton: {
    width: SEND_BUTTON_SIZE,
    height: SEND_BUTTON_SIZE,
    borderRadius: SEND_BUTTON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ChatInput;
