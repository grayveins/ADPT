/**
 * Input Component
 * Text input with label, error state, and proper iOS sizing
 */

import React, { useState, useCallback } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  type TextInputProps,
  type ViewStyle,
  type TextStyle,
  type StyleProp,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

interface InputProps extends Omit<TextInputProps, "style"> {
  /** Input label */
  label?: string;
  
  /** Error message */
  error?: string;
  
  /** Helper text below input */
  hint?: string;
  
  /** Show password toggle for secure inputs */
  showPasswordToggle?: boolean;
  
  /** Left icon */
  icon?: React.ReactNode;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Container style */
  containerStyle?: StyleProp<ViewStyle>;
  
  /** Input style override */
  inputStyle?: StyleProp<TextStyle>;
}

export function Input({
  label,
  error,
  hint,
  showPasswordToggle = false,
  icon,
  disabled = false,
  containerStyle,
  inputStyle,
  secureTextEntry,
  ...textInputProps
}: InputProps) {
  const { colors, radius, typography, components } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  
  const handleFocus = useCallback((e: any) => {
    setIsFocused(true);
    textInputProps.onFocus?.(e);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textInputProps.onFocus]);

  const handleBlur = useCallback((e: any) => {
    setIsFocused(false);
    textInputProps.onBlur?.(e);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textInputProps.onBlur]);
  
  const toggleSecure = () => {
    setIsSecure(!isSecure);
  };
  
  const getBorderColor = () => {
    if (error) return colors.error;
    if (isFocused) return colors.inputBorderFocus;
    return colors.inputBorder;
  };
  
  const inputContainerStyle: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    height: components.input.height,
    backgroundColor: disabled ? colors.disabled : colors.inputBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: getBorderColor(),
    paddingHorizontal: components.input.paddingHorizontal,
  };
  
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.text, fontSize: typography.sizes.subhead }]}>
          {label}
        </Text>
      )}
      
      <View style={inputContainerStyle}>
        {icon && (
          <View style={styles.iconLeft}>
            {icon}
          </View>
        )}
        
        <TextInput
          {...textInputProps}
          style={[
            styles.input,
            {
              color: disabled ? colors.disabledText : colors.text,
              fontSize: typography.sizes.body,
            },
            inputStyle,
          ]}
          placeholderTextColor={colors.inputPlaceholder}
          editable={!disabled}
          secureTextEntry={isSecure}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        
        {showPasswordToggle && secureTextEntry && (
          <Pressable
            onPress={toggleSecure}
            style={styles.iconRight}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isSecure ? "eye-outline" : "eye-off-outline"}
              size={22}
              color={colors.textMuted}
            />
          </Pressable>
        )}
      </View>
      
      {error && (
        <Text style={[styles.error, { color: colors.error, fontSize: typography.sizes.footnote }]}>
          {error}
        </Text>
      )}
      
      {hint && !error && (
        <Text style={[styles.hint, { color: colors.textMuted, fontSize: typography.sizes.footnote }]}>
          {hint}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    flex: 1,
    height: "100%",
    padding: 0,
  },
  iconLeft: {
    marginRight: 12,
  },
  iconRight: {
    marginLeft: 12,
    padding: 4,
  },
  error: {
    marginTop: 6,
  },
  hint: {
    marginTop: 6,
  },
});
