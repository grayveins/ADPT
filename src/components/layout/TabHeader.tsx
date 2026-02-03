/**
 * TabHeader - Standard header for tab screens
 * 
 * Features:
 * - Safe area handling (top inset)
 * - Title on left (e.g., "Good morning, Troy")
 * - Optional streak badge
 * - Avatar on right (opens right-side drawer)
 * 
 * Usage:
 * ```tsx
 * <TabHeader 
 *   title="Good morning, Troy"
 *   streakCount={5}
 *   userName="Troy"
 * />
 * ```
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, DrawerActions } from "@react-navigation/native";

import { useTheme } from "@/src/context/ThemeContext";
import { layout, spacing } from "@/src/theme";
import { Avatar } from "@/src/components/Avatar";
import { StreakBadge } from "@/src/components/dashboard";

type TabHeaderProps = {
  /** Main title text (e.g., "Good morning, Troy") */
  title: string;
  /** Current streak count - shows badge if > 0 */
  streakCount?: number;
  /** User's name for avatar initial */
  userName?: string;
  /** Whether to show the avatar (default: true) */
  showAvatar?: boolean;
};

export function TabHeader({ 
  title, 
  streakCount = 0, 
  userName = "?",
  showAvatar = true,
}: TabHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: colors.bg,
          paddingTop: insets.top + spacing.sm,
        }
      ]}
    >
      <View style={styles.content}>
        {/* Title */}
        <Text 
          allowFontScaling={false} 
          style={[styles.title, { color: colors.text }]}
          numberOfLines={1}
        >
          {title}
        </Text>

        {/* Right side: Streak + Avatar */}
        <View style={styles.rightSection}>
          {streakCount > 0 && (
            <StreakBadge count={streakCount} />
          )}
          
          {showAvatar && (
            <Avatar 
              name={userName} 
              size={40}
              onPress={openDrawer}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: spacing.sm,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: layout.headerHeight,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
    marginRight: spacing.md,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
});

export default TabHeader;
