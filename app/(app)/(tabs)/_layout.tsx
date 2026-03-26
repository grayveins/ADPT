/**
 * Tab Layout
 * 4-tab navigation: Home, Workout, Progress, Coach
 * 
 * Header strategy:
 * - Home: Custom TabHeader with greeting + streak + avatar (manages own)
 * - Workout/Progress: Simple centered title headers
 * - Chat: Custom minimal header (manages own)
 */

import React, { useEffect } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform, StyleSheet, View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/context/ThemeContext";
import { layout, spacing } from "@/src/theme";
// Coach chat removed — no top fitness app uses AI chat (Fitbod, Gravl, MacroFactor all skip it)

/** Tab icon with spring scale on focus change */
function AnimatedTabIcon({
  name,
  outlineName,
  size,
  color,
  focused,
  children,
}: {
  name: keyof typeof Ionicons.glyphMap;
  outlineName: keyof typeof Ionicons.glyphMap;
  size: number;
  color: string;
  focused: boolean;
  children?: React.ReactNode;
}) {
  const scale = useSharedValue(focused ? 1.15 : 1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.15 : 1, {
      damping: 12,
      stiffness: 200,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name={focused ? name : outlineName} size={size} color={color} />
      {children}
    </Animated.View>
  );
}

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
            <AnimatedTabIcon
              name="home"
              outlineName="home-outline"
              size={iconSize}
              color={color}
              focused={focused}
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
            <AnimatedTabIcon
              name="barbell"
              outlineName="barbell-outline"
              size={iconSize}
              color={color}
              focused={focused}
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
            <AnimatedTabIcon
              name="stats-chart"
              outlineName="stats-chart-outline"
              size={iconSize}
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      {/* Chat tab hidden — replaced by Programs. File kept for backwards compat. */}
      <Tabs.Screen
        name="chat"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="social"
        options={{ href: null }}
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
