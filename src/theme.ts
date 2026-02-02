/**
 * ADPT Design System v2
 * 
 * Design Philosophy: "Premium but Approachable"
 * - Light mode first (welcoming for beginners)
 * - iOS Human Interface Guidelines aligned
 * - Dusty Rose accent (muted, sophisticated)
 * - System font for native feel
 * 
 * Typography: iOS standard sizes
 * Spacing: 4px base grid
 * Touch targets: 44pt minimum
 */

import { Platform } from "react-native";

// =============================================================================
// COLORS - Light Mode (Default)
// =============================================================================
export const lightColors = {
  // Backgrounds
  bg: "#FAFAF8",              // Primary - warm off-white
  bgSecondary: "#F5F4F2",     // Cards, elevated surfaces
  bgTertiary: "#EFEDEB",      // Subtle sections, dividers
  
  // Primary - Dusty Rose (muted, premium)
  primary: "#8B7E7E",         // Primary actions, active states
  primaryDark: "#7A6E6E",     // Pressed states
  primaryLight: "#A89999",    // Lighter variant
  primaryMuted: "#F0EBEB",    // Subtle backgrounds
  primaryFaint: "#F7F4F4",    // Very subtle tint
  
  // Success - Sage Green
  success: "#6B8E6B",
  successDark: "#5A7D5A",
  successMuted: "#E8F0E8",
  
  // Semantic
  error: "#DC2626",
  errorMuted: "#FEE2E2",
  warning: "#D97706",
  warningMuted: "#FEF3C7",
  info: "#2563EB",
  infoMuted: "#DBEAFE",
  
  // Text
  text: "#1C1917",            // Primary text - warm black
  textSecondary: "#57534E",   // Secondary text
  textMuted: "#A8A29E",       // Placeholders, hints
  textOnPrimary: "#FFFFFF",   // Text on primary buttons
  
  // UI Elements
  border: "#E7E5E4",          // Subtle borders
  borderStrong: "#D6D3D1",    // Emphasized borders
  card: "#FFFFFF",            // Card backgrounds
  cardAlt: "#FAFAF9",         // Alternative card
  overlay: "rgba(0,0,0,0.4)", // Modal overlays
  
  // Interactive
  pressed: "rgba(139, 126, 126, 0.12)",  // Button pressed
  selected: "rgba(139, 126, 126, 0.08)", // Selected item
  disabled: "#E7E5E4",        // Disabled backgrounds
  disabledText: "#A8A29E",    // Disabled text
  
  // Input
  inputBg: "#FFFFFF",
  inputBorder: "#E7E5E4",
  inputBorderFocus: "#8B7E7E",
  inputPlaceholder: "#A8A29E",
  
  // Tab Bar
  tabBarBg: "#FAFAF8",
  tabBarBorder: "#E7E5E4",
  tabBarActive: "#8B7E7E",
  tabBarInactive: "#A8A29E",
  
  // Progress
  progressBg: "#E7E5E4",
  progressFill: "#8B7E7E",
  
  // Legacy compatibility aliases
  bgTop: "#FAFAF8",
  muted: "#57534E",
  muted2: "#A8A29E",
  chip: "#8B7E7E",
  ringBg: "#E7E5E4",
  accent: "#8B7E7E",
  accentMuted: "#F0EBEB",
  selectedBg: "rgba(139, 126, 126, 0.08)",
  pressedBg: "rgba(139, 126, 126, 0.12)",
  hoverBg: "rgba(139, 126, 126, 0.05)",
  shadow: "rgba(28, 25, 23, 0.06)",
  shadowStrong: "rgba(28, 25, 23, 0.10)",
} as const;

// =============================================================================
// COLORS - Dark Mode
// =============================================================================
export const darkColors = {
  // Backgrounds
  bg: "#121110",
  bgSecondary: "#1C1A18",
  bgTertiary: "#262320",
  
  // Primary - Lighter for contrast
  primary: "#A89999",
  primaryDark: "#8B7E7E",
  primaryLight: "#C4B8B8",
  primaryMuted: "rgba(168, 153, 153, 0.15)",
  primaryFaint: "rgba(168, 153, 153, 0.08)",
  
  // Success
  success: "#7FA07F",
  successDark: "#6B8E6B",
  successMuted: "rgba(127, 160, 127, 0.15)",
  
  // Semantic
  error: "#F87171",
  errorMuted: "rgba(248, 113, 113, 0.15)",
  warning: "#FBBF24",
  warningMuted: "rgba(251, 191, 36, 0.15)",
  info: "#60A5FA",
  infoMuted: "rgba(96, 165, 250, 0.15)",
  
  // Text
  text: "#F5F4F2",
  textSecondary: "#A8A29E",
  textMuted: "#78716C",
  textOnPrimary: "#121110",
  
  // UI Elements
  border: "#2E2A26",
  borderStrong: "#3D3835",
  card: "#1E1C1A",
  cardAlt: "#252220",
  overlay: "rgba(0,0,0,0.6)",
  
  // Interactive
  pressed: "rgba(168, 153, 153, 0.18)",
  selected: "rgba(168, 153, 153, 0.12)",
  disabled: "#2E2A26",
  disabledText: "#78716C",
  
  // Input
  inputBg: "#1E1C1A",
  inputBorder: "#2E2A26",
  inputBorderFocus: "#A89999",
  inputPlaceholder: "#78716C",
  
  // Tab Bar
  tabBarBg: "#121110",
  tabBarBorder: "#2E2A26",
  tabBarActive: "#A89999",
  tabBarInactive: "#78716C",
  
  // Progress
  progressBg: "#2E2A26",
  progressFill: "#A89999",
  
  // Legacy compatibility
  bgTop: "#1C1A18",
  muted: "#A8A29E",
  muted2: "#78716C",
  chip: "#A89999",
  ringBg: "#2E2A26",
  accent: "#A89999",
  accentMuted: "rgba(168, 153, 153, 0.15)",
  selectedBg: "rgba(168, 153, 153, 0.12)",
  pressedBg: "rgba(168, 153, 153, 0.18)",
  hoverBg: "rgba(168, 153, 153, 0.08)",
  shadow: "rgba(0, 0, 0, 0.30)",
  shadowStrong: "rgba(0, 0, 0, 0.40)",
} as const;

// =============================================================================
// SPACING - iOS standard (4px base)
// =============================================================================
export const space = {
  xs: 4,       // Tight inline
  sm: 8,       // Compact
  md: 12,      // Between related items
  base: 16,    // Standard padding
  lg: 20,      // Generous padding
  xl: 24,      // Section spacing
  xxl: 32,     // Large gaps
  xxxl: 48,    // Screen-level
  
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
// TYPOGRAPHY - iOS Human Interface Guidelines
// =============================================================================
export const typography = {
  // System font for native feel
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
  
  // iOS-aligned sizes
  sizes: {
    // Display
    largeTitle: 34,  // Screen titles (iOS Large Title)
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
  
  // Legacy font family aliases (for backward compat)
  fonts: {
    heading: Platform.select({ ios: "System", android: "Roboto", default: "System" }),
    subheading: Platform.select({ ios: "System", android: "Roboto", default: "System" }),
    body: Platform.select({ ios: "System", android: "Roboto", default: "System" }),
    bodyMedium: Platform.select({ ios: "System", android: "Roboto", default: "System" }),
    bodySemiBold: Platform.select({ ios: "System", android: "Roboto", default: "System" }),
  },
} as const;

// =============================================================================
// COMPONENTS - Consistent sizing
// =============================================================================
export const components = {
  // Buttons
  button: {
    height: 50,            // Standard button
    heightSmall: 44,       // Compact (minimum touch)
    heightLarge: 56,       // Large CTA
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
    height: Platform.select({ ios: 49 + 34, android: 56 }) as number, // + safe area on iOS
    iconSize: 24,
    labelSize: 10,
  },
  
  // Navigation
  nav: {
    headerHeight: 44,
    backButtonSize: 44,    // Minimum touch target
  },
  
  // Touch targets
  touchTarget: {
    minimum: 44,
    comfortable: 48,
  },
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
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 6,
  },
  // Card shadow
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  // Floating elements
  float: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
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
// EFFORT & FEELING SCALES (Workout logging)
// =============================================================================
export const effortScale = {
  easy: { emoji: "😊", label: "Easy", rir: "4+", description: "Could do 4+ more" },
  good: { emoji: "😐", label: "Good", rir: "2-3", description: "Could do 2-3 more" },
  hard: { emoji: "😤", label: "Hard", rir: "1", description: "Could do 1 more" },
  max: { emoji: "🔥", label: "Max", rir: "0", description: "Couldn't do more" },
} as const;

export const feelingScale = {
  tired: { emoji: "😴", label: "Tired", adjustment: -0.10, description: "-10% weights" },
  normal: { emoji: "😊", label: "Normal", adjustment: 0, description: "As planned" },
  strong: { emoji: "💪", label: "Strong", adjustment: 0.10, description: "+10% weights" },
} as const;

// =============================================================================
// THEME OBJECT
// =============================================================================
export const theme = {
  colors: lightColors,
  space,
  radius,
  typography,
  components,
  shadows,
  animation,
  effortScale,
  feelingScale,
  
  // Shortcuts for common access patterns
  fonts: typography.fonts,
  type: typography.sizes,
} as const;

export const darkTheme = {
  ...theme,
  colors: darkColors,
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================
export type Theme = typeof theme;
export type ThemeColors = typeof lightColors;
export type EffortLevel = keyof typeof effortScale;
export type FeelingLevel = keyof typeof feelingScale;
