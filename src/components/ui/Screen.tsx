/**
 * Screen Component
 * Consistent screen wrapper with SafeArea, background color, and optional scroll
 */

import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  type ViewStyle,
  type StyleProp,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";

interface ScreenProps {
  children: React.ReactNode;
  
  /** Enable scrolling (default: false) */
  scroll?: boolean;
  
  /** Add horizontal padding (default: true) */
  padded?: boolean;
  
  /** Custom padding value */
  padding?: number;
  
  /** Handle keyboard for forms (default: false) */
  keyboard?: boolean;
  
  /** SafeArea edges to respect (default: all) */
  edges?: ("top" | "bottom" | "left" | "right")[];
  
  /** Custom background color */
  backgroundColor?: string;
  
  /** Additional style */
  style?: StyleProp<ViewStyle>;
  
  /** Content container style (for ScrollView) */
  contentContainerStyle?: StyleProp<ViewStyle>;
  
  /** Status bar style */
  statusBarStyle?: "light-content" | "dark-content";
}

export function Screen({
  children,
  scroll = false,
  padded = true,
  padding,
  keyboard = false,
  edges = ["top", "bottom", "left", "right"],
  backgroundColor,
  style,
  contentContainerStyle,
  statusBarStyle,
}: ScreenProps) {
  const { colors, space } = useTheme();
  
  const bgColor = backgroundColor ?? colors.bg;
  const horizontalPadding = padding ?? (padded ? space.screenPadding : 0);
  
  // Determine status bar style based on background
  const barStyle = statusBarStyle ?? "dark-content";
  
  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: bgColor,
  };
  
  const contentStyle: ViewStyle = {
    flex: 1,
    paddingHorizontal: horizontalPadding,
  };
  
  const scrollContentStyle: ViewStyle = {
    flexGrow: 1,
    paddingHorizontal: horizontalPadding,
  };
  
  const content = scroll ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[scrollContentStyle, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[contentStyle, style]}>
      {children}
    </View>
  );
  
  const wrappedContent = keyboard ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      {content}
    </KeyboardAvoidingView>
  ) : content;
  
  return (
    <SafeAreaView style={containerStyle} edges={edges}>
      <StatusBar barStyle={barStyle} backgroundColor={bgColor} />
      {wrappedContent}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
});
