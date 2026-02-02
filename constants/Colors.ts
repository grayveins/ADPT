import { Platform } from "react-native";

/**
 * ADPT Color System - Warm Coral Theme
 * 
 * Design Philosophy: "Premium but Approachable"
 * - Warm, welcoming colors (not cold/sporty)
 * - Light mode default (less intimidating for beginners)
 * - Coral primary (#FF7A5C) for energy without aggression
 * - Sage green (#6B8E6B) for success/completed states
 * 
 * This file provides the legacy Colors API for backward compatibility.
 * New code should import from src/theme.ts directly.
 */

export const Colors = {
  light: {
    // Text
    text: "#1C1917",           // Warm black - primary text
    // Backgrounds
    background: "#FDFCFB",     // Warm white - primary background
    // Primary accent - Warm Coral
    tint: "#FF7A5C",           // Primary actions, CTAs
    // Icons & muted elements
    icon: "#78716C",           // Warm gray icons
    // Cards & surfaces
    card: "#FFFFFF",           // Pure white cards
    surface: "#F8F6F3",        // Cream secondary background
    // Borders
    border: "#E8E4DF",         // Subtle warm border
    // Muted text
    muted: "#78716C",          // Secondary text
    // Accent variants
    accentMuted: "rgba(255, 122, 92, 0.10)", // Coral at 10%
    accentText: "#FFFFFF",     // Text on primary
    // Semantic colors
    error: "#EF4444",          // Red for errors
    success: "#6B8E6B",        // Sage green for success
    warning: "#EAB308",        // Yellow for warnings
  },
  dark: {
    // Text
    text: "#F5F4F2",           // Off-white - primary text
    // Backgrounds
    background: "#121110",     // Warm black
    // Primary accent - Lighter coral for contrast
    tint: "#FF8B70",           // Primary actions
    // Icons
    icon: "#A09A94",           // Warm gray icons
    // Cards & surfaces
    card: "#1E1C1A",           // Warm dark card
    surface: "#1C1A18",        // Secondary background
    // Borders
    border: "#2E2A26",         // Warm dark border
    // Muted text
    muted: "#A09A94",          // Secondary text
    // Accent variants
    accentMuted: "rgba(255, 139, 112, 0.12)", // Coral at 12%
    accentText: "#F5F4F2",     // Text on dark
    // Semantic colors
    error: "#F87171",          // Lighter red for dark mode
    success: "#7FA07F",        // Lighter sage for dark mode
    warning: "#FACC15",        // Brighter yellow for dark mode
  },
};

export type AppColors = {
  background: string;
  surface: string;
  card: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentMuted: string;
  buttonText: string;
  icon: string;
  success: string;
  warning: string;
  error: string;
  // New extended colors for Warm Coral theme
  primary: string;
  primaryMuted: string;
  bgSecondary: string;
  bgTertiary: string;
  selectedBg: string;
  pressedBg: string;
};

export const createAppColors = (scheme: "light" | "dark"): AppColors => {
  const palette = Colors[scheme];
  const isLight = scheme === "light";
  
  return {
    // Legacy mappings
    background: palette.background,
    surface: palette.surface,
    card: palette.card,
    border: palette.border,
    textPrimary: palette.text,
    textSecondary: palette.muted,
    accent: palette.tint,
    accentMuted: palette.accentMuted,
    buttonText: palette.accentText,
    icon: palette.icon,
    success: palette.success,
    warning: palette.warning,
    error: palette.error,
    // Extended colors
    primary: palette.tint,
    primaryMuted: isLight ? "#FFEBE5" : "rgba(255, 139, 112, 0.15)",
    bgSecondary: palette.surface,
    bgTertiary: isLight ? "#F0EDEA" : "#262320",
    selectedBg: isLight ? "rgba(255, 122, 92, 0.10)" : "rgba(255, 139, 112, 0.12)",
    pressedBg: isLight ? "rgba(255, 122, 92, 0.15)" : "rgba(255, 139, 112, 0.18)",
  };
};

// Default to light mode (approachable for beginners)
export const colors = createAppColors("light");

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const typography = {
  family: Platform.select({ ios: "System", android: "Roboto", default: "System" }),
  weight: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
};

export const opacity = {
  pressed: 0.85,
  disabled: 0.6,
};

export const shadows = {
  // Card shadow - warm tint
  card: {
    shadowColor: "#1C1917",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  // Neumorphic dark shadow
  neuDark: {
    shadowColor: "#1C1917",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  // Neumorphic light shadow
  neuLight: {
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  // FAB / floating button shadow
  fab: {
    shadowColor: "#1C1917",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  // Subtle shadow for small elements
  subtle: {
    shadowColor: "#1C1917",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
};

/**
 * Effort Scale - Emoji-based RIR input
 * Used in workout logging for user-friendly intensity tracking
 */
export const effortScale = {
  easy: { emoji: "😊", label: "Easy", rir: "4+", description: "Could do 4+ more" },
  good: { emoji: "😐", label: "Good", rir: "2-3", description: "Could do 2-3 more" },
  hard: { emoji: "😤", label: "Hard", rir: "1", description: "Could do 1 more" },
  max: { emoji: "🔥", label: "Max", rir: "0", description: "Couldn't do more" },
} as const;

/**
 * Feeling Scale - Daily readiness check
 * Used on Today's Workout screen to adjust weights
 */
export const feelingScale = {
  tired: { emoji: "😴", label: "Tired", adjustment: -0.10, description: "-10% weights" },
  normal: { emoji: "😊", label: "Normal", adjustment: 0, description: "As planned" },
  strong: { emoji: "💪", label: "Strong", adjustment: 0.10, description: "+10% weights" },
} as const;

export type EffortLevel = keyof typeof effortScale;
export type FeelingLevel = keyof typeof feelingScale;
