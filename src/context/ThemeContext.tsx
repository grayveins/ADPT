/**
 * Theme Context
 * Provides theme values throughout the app via useTheme() hook
 * Defaults to light mode for approachable, beginner-friendly feel
 */

import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";
import {
  lightColors,
  darkColors,
  space,
  radius,
  typography,
  components,
  shadows,
  animation,
} from "../theme";

// Colors type that works for both light and dark
type ThemeColors = typeof lightColors | typeof darkColors;

// =============================================================================
// TYPES
// =============================================================================
type ColorScheme = "light" | "dark";

interface ThemeContextValue {
  // Current color scheme
  colorScheme: ColorScheme;
  isDark: boolean;
  
  // Colors for current scheme
  colors: ThemeColors;
  
  // Design tokens (same for both schemes)
  space: typeof space;
  radius: typeof radius;
  typography: typeof typography;
  components: typeof components;
  shadows: typeof shadows;
  animation: typeof animation;
}

// =============================================================================
// CONTEXT
// =============================================================================
const ThemeContext = createContext<ThemeContextValue | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================
interface ThemeProviderProps {
  children: React.ReactNode;
  /** Force a specific color scheme (useful for testing) */
  forcedColorScheme?: ColorScheme;
}

export function ThemeProvider({ children, forcedColorScheme }: ThemeProviderProps) {
  // For now, we default to light mode regardless of system setting
  // This matches our "approachable for beginners" design decision
  // Later we can add a setting to respect system preference
  const systemScheme = useColorScheme();
  
  // Use forced scheme if provided, otherwise default to light
  // Change this to `systemScheme ?? "light"` to respect system preference
  const colorScheme: ColorScheme = forcedColorScheme ?? "light";
  
  const value = useMemo<ThemeContextValue>(() => ({
    colorScheme,
    isDark: colorScheme === "dark",
    colors: colorScheme === "dark" ? darkColors : lightColors,
    space,
    radius,
    typography,
    components,
    shadows,
    animation,
  }), [colorScheme]);
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  
  if (!context) {
    // Fallback for components used outside ThemeProvider
    // This allows gradual migration - components work even without provider
    return {
      colorScheme: "light",
      isDark: false,
      colors: lightColors,
      space,
      radius,
      typography,
      components,
      shadows,
      animation,
    };
  }
  
  return context;
}

// =============================================================================
// CONVENIENCE HOOKS
// =============================================================================

/** Get just the colors from theme */
export function useColors() {
  const { colors } = useTheme();
  return colors;
}

/** Check if dark mode is active */
export function useIsDark(): boolean {
  const { isDark } = useTheme();
  return isDark;
}
