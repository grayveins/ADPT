/**
 * Tab Layout
 * 4-tab navigation: Home, Workout, Progress, Coach
 * Light mode, iOS-native styling
 */

import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform, StyleSheet } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";

type IconName = keyof typeof Ionicons.glyphMap;

export default function TabLayout() {
  const { colors, components, typography } = useTheme();
  
  // Tab bar configuration
  const tabBarHeight = Platform.OS === "ios" ? 49 + 34 : 60; // iOS: 49 content + 34 safe area
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
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
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
            <Ionicons
              name={focused ? "chatbubble" : "chatbubble-outline"}
              size={iconSize}
              color={color}
            />
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
