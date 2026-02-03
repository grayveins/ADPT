/**
 * Tab Layout
 * 4-tab navigation: Home, Workout, Progress, Coach
 * 
 * Header strategy:
 * - Home: Custom TabHeader with greeting + streak + avatar (manages own)
 * - Workout/Progress: Simple centered title headers
 * - Chat: Custom minimal header (manages own)
 */

import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform, StyleSheet, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/context/ThemeContext";
import { layout, spacing } from "@/src/theme";
import { useCoachUnread } from "@/src/hooks/useCoachUnread";

type IconName = keyof typeof Ionicons.glyphMap;

// Simple centered header for Workout/Progress screens
function SimpleHeader({ title }: { title: string }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View 
      style={[
        styles.simpleHeader, 
        { 
          backgroundColor: colors.bg,
          paddingTop: insets.top + spacing.sm,
        }
      ]}
    >
      <Text 
        allowFontScaling={false} 
        style={[styles.simpleHeaderTitle, { color: colors.text }]}
      >
        {title}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const { colors, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const { hasUnread } = useCoachUnread();
  
  // Tab bar configuration - use dynamic safe area
  const tabBarHeight = Platform.OS === "ios" ? 49 + insets.bottom : 60;
  const iconSize = 24;
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: tabBarHeight,
          paddingBottom: Platform.OS === "ios" ? insets.bottom - 6 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: typography.sizes.caption2,
          fontWeight: typography.weights.medium,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={iconSize}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="workout"
        options={{
          title: "Workout",
          headerShown: true,
          header: () => <SimpleHeader title="Workout" />,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "barbell" : "barbell-outline"}
              size={iconSize}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          headerShown: true,
          header: () => <SimpleHeader title="Progress" />,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "stats-chart" : "stats-chart-outline"}
              size={iconSize}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: "Coach",
          tabBarIcon: ({ color, focused }) => (
            <View>
              <Ionicons
                name={focused ? "chatbubble" : "chatbubble-outline"}
                size={iconSize}
                color={color}
              />
              {hasUnread && (
                <View style={[styles.unreadBadge, { backgroundColor: colors.error }]} />
              )}
            </View>
          ),
        }}
      />

      {/* Hide social tab from navigation but keep file for now */}
      <Tabs.Screen
        name="social"
        options={{
          href: null, // This hides it from the tab bar
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  simpleHeader: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: spacing.sm,
  },
  simpleHeaderTitle: {
    fontSize: 28,
    fontFamily: "Inter_600SemiBold",
  },
  unreadBadge: {
    position: "absolute",
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
