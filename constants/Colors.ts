import { Platform } from "react-native";

/**
 * ADPT Color System v4 — Minimal Black & White
 *
 * Both light and dark point to the same palette (no dark mode in v1).
 * New code should import from src/theme.ts directly.
 */

const palette = {
  text: "#000000",
  background: "#FFFFFF",
  tint: "#000000",
  icon: "#9CA3AF",
  card: "#FFFFFF",
  surface: "#F5F5F5",
  border: "#E5E7EB",
  muted: "#6B7280",
  accentMuted: "rgba(0, 0, 0, 0.06)",
  accentText: "#FFFFFF",
  error: "#EF4444",
  success: "#22C55E",
  warning: "#F59E0B",
  intensity: "#000000",
  gold: "#000000",
};

export const Colors = {
  light: palette,
  dark: palette,
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

export const createAppColors = (_scheme: "light" | "dark"): AppColors => ({
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
  primary: palette.tint,
  primaryMuted: "rgba(0, 0, 0, 0.06)",
  bgSecondary: palette.surface,
  bgTertiary: "#F0F0F0",
  selectedBg: "rgba(0, 0, 0, 0.05)",
  pressedBg: "rgba(0, 0, 0, 0.08)",
  intensity: palette.intensity,
  gold: palette.gold,
});

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
