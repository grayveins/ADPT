/**
 * ADPT Design System v3 - Teal/Cyan Theme
 * 
 * Design Philosophy: "PT in Your Pocket"
 * - Dark mode default (gym-readable, professional)
 * - Teal/Cyan primary (trust + energy, gender-neutral)
 * - Sage green for success/completion states
 * - Scientific, minimal, approachable
 * 
 * HCI Standards:
 * - Touch targets: 56pt primary CTAs, 48pt secondary (gym-friendly)
 * - WCAG AA contrast: 4.5:1 text, 3:1 UI components
 * - Spacing: 4px base grid
 */

import { Platform } from "react-native";

// =============================================================================
// COLORS - Dark Mode (DEFAULT)
// =============================================================================
export const darkColors = {
  // Backgrounds
  bg: "#0A0A0A",              // Near-black
  bgSecondary: "#141414",     // Elevated surfaces
  bgTertiary: "#1C1C1C",      // Cards, inputs
  
  // Primary - Teal/Cyan (trust + energy)
  primary: "#00C9B7",         // Primary actions, progress rings
  primaryDark: "#00A89A",     // Pressed states
  primaryLight: "#33D4C5",    // Lighter variant
  primaryMuted: "rgba(0, 201, 183, 0.15)",  // Subtle backgrounds
  primaryFaint: "rgba(0, 201, 183, 0.08)",  // Very subtle tint
  
  // Success - Sage Green (completed states, PRs)
  success: "#7FA07F",
  successDark: "#6B8E6B",
  successMuted: "rgba(127, 160, 127, 0.15)",
  
  // Accent Colors (semantic, use sparingly)
  intensity: "#FF6B35",       // Urgency - rest timer, warnings
  gold: "#FFD700",            // Achievement - PRs, trophies, streaks
  
  // Semantic
  error: "#F87171",
  errorMuted: "rgba(248, 113, 113, 0.15)",
  warning: "#FBBF24",
  warningMuted: "rgba(251, 191, 36, 0.15)",
  info: "#60A5FA",
  infoMuted: "rgba(96, 165, 250, 0.15)",
  
  // Text
  text: "#F5F5F5",            // Primary text
  textSecondary: "#A3A3A3",   // Secondary text
  textMuted: "#737373",       // Placeholders, hints
  textOnPrimary: "#0A0A0A",   // Dark text on teal buttons
  
  // UI Elements
  border: "#2A2A2A",          // Subtle borders
  borderStrong: "#3D3D3D",    // Emphasized borders
  card: "#1C1C1C",            // Card backgrounds
  cardAlt: "#242424",         // Alternative card
  overlay: "rgba(0, 0, 0, 0.7)", // Modal overlays
  
  // Interactive
  pressed: "rgba(0, 201, 183, 0.18)",   // Button pressed
  selected: "rgba(0, 201, 183, 0.12)",  // Selected item
  disabled: "#2A2A2A",        // Disabled backgrounds
  disabledText: "#525252",    // Disabled text
  
  // Input
  inputBg: "#141414",
  inputBorder: "#2A2A2A",
  inputBorderFocus: "#00C9B7",
  inputPlaceholder: "#737373",
  
  // Tab Bar
  tabBarBg: "#0A0A0A",
  tabBarBorder: "#2A2A2A",
  tabBarActive: "#00C9B7",
  tabBarInactive: "#737373",
  
  // Progress
  progressBg: "#2A2A2A",
  progressFill: "#00C9B7",
  
  // Legacy compatibility aliases
  bgTop: "#141414",
  muted: "#A3A3A3",
  muted2: "#737373",
  chip: "#00C9B7",
  ringBg: "#2A2A2A",
  accent: "#00C9B7",
  accentMuted: "rgba(0, 201, 183, 0.15)",
  selectedBg: "rgba(0, 201, 183, 0.12)",
  pressedBg: "rgba(0, 201, 183, 0.18)",
  hoverBg: "rgba(0, 201, 183, 0.08)",
  shadow: "rgba(0, 0, 0, 0.40)",
  shadowStrong: "rgba(0, 0, 0, 0.50)",
} as const;

// =============================================================================
// COLORS - Light Mode (toggle in settings)
// =============================================================================
export const lightColors = {
  // Backgrounds
  bg: "#FAFAFA",              // Clean white
  bgSecondary: "#F5F5F5",     // Elevated surfaces
  bgTertiary: "#EFEFEF",      // Cards, inputs
  
  // Primary - Slightly darker teal for light backgrounds
  primary: "#00A89A",         // Primary actions
  primaryDark: "#008F82",     // Pressed states
  primaryLight: "#00C9B7",    // Lighter variant
  primaryMuted: "rgba(0, 168, 154, 0.12)",
  primaryFaint: "rgba(0, 168, 154, 0.06)",
  
  // Success - Sage Green
  success: "#6B8E6B",
  successDark: "#5A7D5A",
  successMuted: "rgba(107, 142, 107, 0.12)",
  
  // Accent Colors
  intensity: "#E85A2C",       // Slightly darker for light mode
  gold: "#D4A800",            // Slightly darker gold
  
  // Semantic
  error: "#DC2626",
  errorMuted: "#FEE2E2",
  warning: "#D97706",
  warningMuted: "#FEF3C7",
  info: "#2563EB",
  infoMuted: "#DBEAFE",
  
  // Text
  text: "#171717",            // Primary text
  textSecondary: "#525252",   // Secondary text
  textMuted: "#A3A3A3",       // Placeholders, hints
  textOnPrimary: "#FFFFFF",   // White text on teal buttons
  
  // UI Elements
  border: "#E5E5E5",          // Subtle borders
  borderStrong: "#D4D4D4",    // Emphasized borders
  card: "#FFFFFF",            // Card backgrounds
  cardAlt: "#FAFAFA",         // Alternative card
  overlay: "rgba(0, 0, 0, 0.5)", // Modal overlays
  
  // Interactive
  pressed: "rgba(0, 168, 154, 0.15)",
  selected: "rgba(0, 168, 154, 0.10)",
  disabled: "#E5E5E5",
  disabledText: "#A3A3A3",
  
  // Input
  inputBg: "#FFFFFF",
  inputBorder: "#E5E5E5",
  inputBorderFocus: "#00A89A",
  inputPlaceholder: "#A3A3A3",
  
  // Tab Bar
  tabBarBg: "#FFFFFF",
  tabBarBorder: "#E5E5E5",
  tabBarActive: "#00A89A",
  tabBarInactive: "#A3A3A3",
  
  // Progress
  progressBg: "#E5E5E5",
  progressFill: "#00A89A",
  
  // Legacy compatibility aliases
  bgTop: "#FFFFFF",
  muted: "#525252",
  muted2: "#A3A3A3",
  chip: "#00A89A",
  ringBg: "#E5E5E5",
  accent: "#00A89A",
  accentMuted: "rgba(0, 168, 154, 0.12)",
  selectedBg: "rgba(0, 168, 154, 0.10)",
  pressedBg: "rgba(0, 168, 154, 0.15)",
  hoverBg: "rgba(0, 168, 154, 0.06)",
  shadow: "rgba(0, 0, 0, 0.08)",
  shadowStrong: "rgba(0, 0, 0, 0.12)",
} as const;

// =============================================================================
// SPACING - 4px base grid
// =============================================================================
export const spacing = {
  xs: 4,       // Tight inline, icon padding
  sm: 8,       // Between related items
  md: 12,      // Default component internal padding
  base: 16,    // Standard gap
  lg: 20,      // Section padding (matches screenPadding)
  xl: 24,      // Between major sections
  xxl: 32,     // Large separations
  xxxl: 48,    // Screen-level
} as const;

// Alias for backward compatibility
export const space = {
  ...spacing,
  
  // Semantic aliases
  screenPadding: 20,   // Horizontal screen padding
  cardPadding: 16,     // Inside cards
  sectionGap: 24,      // Between sections
  itemGap: 12,         // Between list items
  
  // Legacy aliases
  s: 8,
  m: 12,
  l: 16,
} as const;

// =============================================================================
// LAYOUT - Screen-level constants for consistent structure
// =============================================================================
export const layout = {
  // Screen
  screenPaddingHorizontal: 20,
  screenPaddingVertical: 16,
  
  // Header
  headerHeight: 52,
  headerPaddingHorizontal: 16,
  
  // Content
  sectionGap: 24,      // Gap between major sections
  cardGap: 12,         // Gap between cards in a list
  
  // Input
  inputMinHeight: 48,  // Minimum input height (touch target)
  inputMaxHeight: 120, // Maximum expandable input height (~4 lines)
  
  // Tab bar (iOS includes safe area)
  tabBarHeight: 83,    // iOS: 49 content + 34 safe area
  
  // Touch targets (HCI standards)
  touchTargetMin: 44,
  touchTargetComfortable: 48,
  touchTargetPrimary: 56,
} as const;

// =============================================================================
// BORDER RADIUS
// =============================================================================
export const radius = {
  xs: 6,       // Small chips, badges
  sm: 8,       // Buttons (small)
  md: 12,      // Buttons, inputs
  lg: 16,      // Cards
  xl: 20,      // Large cards
  xxl: 24,     // Modals, sheets
  pill: 999,   // Fully rounded
} as const;

// =============================================================================
// TYPOGRAPHY - System fonts for native feel
// =============================================================================
export const typography = {
  // System font
  fontFamily: Platform.select({
    ios: "System",
    android: "Roboto",
    default: "System",
  }),
  
  // Font weights
  weights: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
  
  // Size scale
  sizes: {
    // Display
    largeTitle: 34,  // Screen titles
    title1: 28,      // Section headers
    title2: 22,      // Card titles
    title3: 20,      // Subsection headers
    
    // Body
    headline: 17,    // Emphasized body (semibold)
    body: 17,        // Standard body
    callout: 16,     // Secondary body
    subhead: 15,     // Supporting text
    
    // Small
    footnote: 13,    // Captions, hints
    caption1: 12,    // Small labels
    caption2: 11,    // Smallest text
    
    // Legacy aliases
    hero: 48,
    h1: 34,
    h2: 22,
    h3: 20,
    bodySmall: 15,
    caption: 13,
    tiny: 11,
  },
  
  // Line heights
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
  
  // Legacy font family aliases
  fonts: {
    heading: Platform.select({ ios: "System", android: "Roboto", default: "System" }),
    subheading: Platform.select({ ios: "System", android: "Roboto", default: "System" }),
    body: Platform.select({ ios: "System", android: "Roboto", default: "System" }),
    bodyMedium: Platform.select({ ios: "System", android: "Roboto", default: "System" }),
    bodySemiBold: Platform.select({ ios: "System", android: "Roboto", default: "System" }),
  },
} as const;

// =============================================================================
// COMPONENTS - HCI-compliant sizing
// =============================================================================
export const components = {
  // Buttons - gym-friendly touch targets
  button: {
    height: 56,            // Primary CTA (gym-friendly)
    heightLarge: 56,       // Alias for height (backward compat)
    heightSmall: 48,       // Secondary actions
    heightCompact: 44,     // Minimum touch target
    borderRadius: 12,
    paddingHorizontal: 24,
  },
  
  // Inputs
  input: {
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  
  // Cards
  card: {
    borderRadius: 16,
    padding: 16,
  },
  
  // Tab Bar
  tabBar: {
    height: Platform.select({ ios: 49 + 34, android: 56 }) as number,
    iconSize: 24,
    labelSize: 10,
  },
  
  // Navigation
  nav: {
    headerHeight: 44,
    backButtonSize: 48,    // Comfortable touch target
  },
  
  // Touch targets (HCI standards)
  touchTarget: {
    minimum: 44,           // Absolute minimum
    comfortable: 48,       // Standard interactive
    primary: 56,           // Primary CTAs (gym-friendly)
  },
} as const;

// =============================================================================
// GRADIENTS - For cards, muscle groups, etc.
// =============================================================================
export const gradients = {
  // Primary gradients
  primary: ["#00C9B7", "#00A89A"] as const,
  primarySubtle: ["rgba(0, 201, 183, 0.15)", "rgba(0, 168, 154, 0.08)"] as const,
  
  // Card gradients (subtle elevation effect)
  card: ["#1C1C1C", "#242424"] as const,
  cardHover: ["#242424", "#2A2A2A"] as const,
  
  // Muscle group gradients (for exercise card top bars)
  chest: ["#00C9B7", "#00A89A"] as const,
  back: ["#33D4C5", "#00C9B7"] as const,
  shoulders: ["#00A89A", "#008F82"] as const,
  arms: ["#7FA07F", "#6B8E6B"] as const,
  legs: ["#6B8E6B", "#5A7D5A"] as const,
  core: ["#60A5FA", "#3B82F6"] as const,
  fullBody: ["#FFD700", "#E5C100"] as const,
  
  // Special
  success: ["#7FA07F", "#6B8E6B"] as const,
  gold: ["#FFD700", "#E5C100"] as const,
} as const;

// =============================================================================
// SHADOWS
// =============================================================================
export const shadows = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 4,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 24,
    elevation: 6,
  },
  // Card shadow (warm, subtle)
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
  },
  // Floating elements
  float: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

// =============================================================================
// ANIMATION
// =============================================================================
export const animation = {
  // Spring configs for Reanimated
  spring: {
    gentle: { damping: 20, stiffness: 150 },
    snappy: { damping: 15, stiffness: 400 },
    bouncy: { damping: 10, stiffness: 300 },
    stiff: { damping: 20, stiffness: 300 },
  },
  
  // Timing durations (ms)
  duration: {
    instant: 100,
    fast: 150,
    normal: 250,
    slow: 400,
    slower: 600,
  },
  
  // Scale for press animations
  pressScale: 0.97,
} as const;

// =============================================================================
// EFFORT SCALE - 5 levels with filled circles (RIR-based)
// =============================================================================
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

// =============================================================================
// READINESS SCALE - Pre-workout energy assessment (professional, no emojis)
// Uses battery/gauge metaphor - intuitive and gender-neutral
// =============================================================================
export const readinessScale = {
  low: {
    level: 1,
    label: "Low Energy",
    shortLabel: "Low",
    adjustment: -0.10,
    description: "Reduce intensity 10%",
    icon: "battery-charging-outline" as const, // Ionicons
    barCount: 1,
  },
  moderate: {
    level: 2,
    label: "Ready",
    shortLabel: "Ready",
    adjustment: 0,
    description: "As planned",
    icon: "battery-half-outline" as const,
    barCount: 2,
  },
  high: {
    level: 3,
    label: "High Energy",
    shortLabel: "High",
    adjustment: 0.10,
    description: "Push harder +10%",
    icon: "battery-full-outline" as const,
    barCount: 3,
  },
} as const;

// Legacy alias for backward compatibility
export const feelingScale = {
  tired: { ...readinessScale.low, emoji: "" },
  normal: { ...readinessScale.moderate, emoji: "" },
  strong: { ...readinessScale.high, emoji: "" },
} as const;

// =============================================================================
// THEME OBJECTS
// =============================================================================
export const theme = {
  colors: darkColors,  // Dark mode is default
  spacing,
  space,
  layout,
  radius,
  typography,
  components,
  shadows,
  gradients,
  animation,
  effortScale,
  feelingScale,
  
  // Shortcuts for common access patterns
  fonts: typography.fonts,
  type: typography.sizes,
} as const;

export const lightTheme = {
  ...theme,
  colors: lightColors,
} as const;

// Alias for backward compatibility
export const darkTheme = theme;

// =============================================================================
// BODY REGIONS - For pain/discomfort check
// =============================================================================
export const bodyRegions = {
  shoulders: { label: "Shoulders", icon: "body-outline" as const },
  back: { label: "Back", icon: "body-outline" as const },
  chest: { label: "Chest", icon: "body-outline" as const },
  arms: { label: "Arms", icon: "fitness-outline" as const },
  core: { label: "Core", icon: "body-outline" as const },
  hips: { label: "Hips", icon: "body-outline" as const },
  knees: { label: "Knees", icon: "walk-outline" as const },
  ankles: { label: "Ankles", icon: "footsteps-outline" as const },
} as const;

// =============================================================================
// MUSCLE GROUPS - For progress visualization
// =============================================================================
export const muscleGroupColors = {
  chest: "#00C9B7",      // Primary teal
  back: "#00A89A",       // Darker teal
  shoulders: "#33D4C5",  // Light teal
  arms: "#7FA07F",       // Sage green
  legs: "#6B8E6B",       // Darker sage
  core: "#60A5FA",       // Info blue
  fullBody: "#FFD700",   // Gold
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================
export type Theme = typeof theme;
export type ThemeColors = typeof darkColors;
export type EffortLevel = keyof typeof effortScale;
export type ReadinessLevel = keyof typeof readinessScale;
export type FeelingLevel = keyof typeof feelingScale;
export type BodyRegion = keyof typeof bodyRegions;
