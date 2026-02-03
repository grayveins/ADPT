/**
 * ScreenLayout - Universal screen wrapper for consistent layout
 * 
 * Handles:
 * - Safe area insets (top edge only, tabs handle bottom)
 * - Optional header zone with title, left/right actions
 * - Scrollable or static content area
 * - Consistent horizontal padding
 * 
 * Usage:
 * ```tsx
 * // Simple screen with title
 * <ScreenLayout title="Progress" scrollable>
 *   {content}
 * </ScreenLayout>
 * 
 * // Custom header (like Home screen)
 * <ScreenLayout hideHeader scrollable>
 *   <MyCustomHeader />
 *   {content}
 * </ScreenLayout>
 * 
 * // With header actions
 * <ScreenLayout 
 *   title="Workout" 
 *   headerRight={<Avatar onPress={openDrawer} />}
 *   scrollable
 * >
 *   {content}
 * </ScreenLayout>
 * ```
 */

import React from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  ViewStyle,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useTheme } from "@/src/context/ThemeContext";
import { layout, spacing } from "@/src/theme";

type ScreenLayoutProps = {
  children: React.ReactNode;
  
  // Header options
  title?: string;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  hideHeader?: boolean;
  showBackButton?: boolean;
  onBackPress?: () => void;
  
  // Content options
  scrollable?: boolean;
  noPadding?: boolean;
  
  // Style overrides (escape hatch)
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  headerStyle?: ViewStyle;
};

export function ScreenLayout({
  children,
  title,
  headerLeft,
  headerRight,
  hideHeader = false,
  showBackButton = false,
  onBackPress,
  scrollable = true,
  noPadding = false,
  style,
  contentStyle,
  headerStyle,
}: ScreenLayoutProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Handle back press
  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  // Render header left content
  const renderHeaderLeft = () => {
    if (headerLeft) return headerLeft;
    
    if (showBackButton) {
      return (
        <Pressable onPress={handleBack} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
      );
    }
    
    // Empty spacer for alignment when there's a title but no left content
    if (title && headerRight) {
      return <View style={styles.headerButton} />;
    }
    
    return null;
  };

  // Render header right content
  const renderHeaderRight = () => {
    if (headerRight) return headerRight;
    
    // Empty spacer for alignment when there's a left button but no right content
    if (headerLeft || showBackButton) {
      return <View style={styles.headerButton} />;
    }
    
    return null;
  };

  // Content padding
  const contentPadding = noPadding ? {} : {
    paddingHorizontal: layout.screenPaddingHorizontal,
  };

  // Render content
  const renderContent = () => {
    if (scrollable) {
      return (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            contentPadding,
            contentStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      );
    }

    return (
      <View style={[styles.content, contentPadding, contentStyle]}>
        {children}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }, style]}>
      {/* Safe area spacer for status bar */}
      <View style={{ height: insets.top, backgroundColor: colors.bg }} />

      {/* Header zone */}
      {!hideHeader && (
        <View
          style={[
            styles.header,
            { borderBottomColor: colors.border },
            headerStyle,
          ]}
        >
          {renderHeaderLeft()}
          
          {title && (
            <Text
              allowFontScaling={false}
              style={[styles.headerTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              {title}
            </Text>
          )}
          
          {renderHeaderRight()}
        </View>
      )}

      {/* Main content */}
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: layout.headerHeight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: layout.headerPaddingHorizontal,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.base,
    paddingBottom: 100, // Account for tab bar + some breathing room
  },
  content: {
    flex: 1,
    paddingTop: spacing.base,
  },
});

export default ScreenLayout;
