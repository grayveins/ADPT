import { Platform } from "react-native";

/**
 * ADPT Color System v3 - Teal/Cyan Theme
 * 
 * Design Philosophy: "PT in Your Pocket"
 * - Dark mode default (gym-readable, professional)
 * - Teal/Cyan primary for trust + energy
 * - Sage green for success/completed states
 * - Gender-neutral, scientific, minimal
 * 
 * This file provides the legacy Colors API for backward compatibility.
 * New code should import from src/theme.ts directly.
 */

export const Colors = {
  light: {
    // Text
    text: "#171717",           // Primary text
    // Backgrounds
    background: "#FAFAFA",     // Clean white
    // Primary accent - Teal (darker for light mode)
    tint: "#00A89A",           // Primary actions, CTAs
    // Icons & muted elements
    icon: "#A3A3A3",           // Neutral gray icons
    // Cards & surfaces
    card: "#FFFFFF",           // Pure white cards
    surface: "#F5F5F5",        // Secondary background
    // Borders
    border: "#E5E5E5",         // Subtle border
    // Muted text
    muted: "#525252",          // Secondary text
    // Accent variants
    accentMuted: "rgba(0, 168, 154, 0.12)", // Teal at 12%
    accentText: "#FFFFFF",     // Text on primary
    // Semantic colors
    error: "#DC2626",          // Red for errors
    success: "#6B8E6B",        // Sage green for success
    warning: "#D97706",        // Orange for warnings
    // Additional semantic
    intensity: "#E85A2C",      // Rest timer, urgency
    gold: "#D4A800",           // PRs, achievements
  },
  dark: {
    // Text
    text: "#F5F5F5",           // Primary text
    // Backgrounds
    background: "#0A0A0A",     // Near-black
    // Primary accent - Teal (brighter for dark mode)
    tint: "#00C9B7",           // Primary actions
    // Icons
    icon: "#737373",           // Neutral gray icons
    // Cards & surfaces
    card: "#1C1C1C",           // Dark card
    surface: "#141414",        // Secondary background
    // Borders
    border: "#2A2A2A",         // Dark border
    // Muted text
    muted: "#A3A3A3",          // Secondary text
    // Accent variants
    accentMuted: "rgba(0, 201, 183, 0.15)", // Teal at 15%
    accentText: "#0A0A0A",     // Dark text on teal
    // Semantic colors
    error: "#F87171",          // Lighter red for dark mode
    success: "#7FA07F",        // Lighter sage for dark mode
    warning: "#FBBF24",        // Brighter yellow for dark mode
    // Additional semantic
    intensity: "#FF6B35",      // Rest timer, urgency
    gold: "#FFD700",           // PRs, achievements
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
  // Extended colors
  primary: string;
  primaryMuted: string;
  bgSecondary: string;
  bgTertiary: string;
  selectedBg: string;
  pressedBg: string;
  // Semantic accents
  intensity: string;
  gold: string;
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
    primaryMuted: isLight ? "rgba(0, 168, 154, 0.12)" : "rgba(0, 201, 183, 0.15)",
    bgSecondary: palette.surface,
    bgTertiary: isLight ? "#EFEFEF" : "#1C1C1C",
    selectedBg: isLight ? "rgba(0, 168, 154, 0.10)" : "rgba(0, 201, 183, 0.12)",
    pressedBg: isLight ? "rgba(0, 168, 154, 0.15)" : "rgba(0, 201, 183, 0.18)",
    // Semantic accents
    intensity: palette.intensity,
    gold: palette.gold,
  };
};

// Default to dark mode (gym-readable, professional)
export const colors = createAppColors("dark");

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
  // Card shadow
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  // Neumorphic dark shadow
  neuDark: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.20,
    shadowRadius: 20,
    elevation: 8,
  },
  // Subtle shadow for small elements
  subtle: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
};

/**
 * Effort Scale - 5 levels with filled circles (RIR-based)
 * Used in workout logging for intensity tracking
 */
export const effortScale = {
  easy: {
    indicator: "○○○○○",
    level: 1,
    label: "Easy",
    rir: "4+",
    description: "Could do 4+ more",
  },
  moderate: {
    indicator: "●○○○○",
    level: 2,
    label: "Moderate",
    rir: "3",
    description: "Could do 3 more",
  },
  hard: {
    indicator: "●●○○○",
    level: 3,
    label: "Hard",
    rir: "2",
    description: "Could do 2 more",
  },
  veryHard: {
    indicator: "●●●○○",
    level: 4,
    label: "Very Hard",
    rir: "1",
    description: "Could do 1 more",
  },
  failure: {
    indicator: "●●●●●",
    level: 5,
    label: "Failure",
    rir: "0",
    description: "Couldn't do another",
  },
} as const;

/**
 * Feeling Scale - Daily readiness check (keep emojis)
 * Used on Today's Workout screen to adjust weights
 */
export const feelingScale = {
  tired: { emoji: "😴", label: "Tired", adjustment: -0.10, description: "-10% weights" },
  normal: { emoji: "😊", label: "Normal", adjustment: 0, description: "As planned" },
  strong: { emoji: "💪", label: "Strong", adjustment: 0.10, description: "+10% weights" },
} as const;

export type EffortLevel = keyof typeof effortScale;
export type FeelingLevel = keyof typeof feelingScale;
