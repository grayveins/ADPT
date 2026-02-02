/**
 * ADPT Design System
 * 
 * Design Philosophy: "Premium but Approachable"
 * - Warm, welcoming colors (not cold/sporty)
 * - Light mode default (less intimidating for beginners)
 * - Generous spacing and rounded corners
 * - Clear visual hierarchy with subtle shadows
 * 
 * Color Inspiration: Cal AI, Headspace, Apple Fitness+
 * Target Audience: Beginner to intermediate lifters (0-4 years), 
 *                  ages 25-45, balanced gender appeal
 * 
 * Key Principles:
 * 1. Trust through transparency (explain "why this workout")
 * 2. Simplicity over complexity (one task per screen)
 * 3. Celebrate progress (PRs, streaks, milestones)
 * 4. Forgiving UX (easy to undo, no guilt)
 */

// =============================================================================
// LIGHT MODE - Default for new users (approachable, warm)
// =============================================================================
export const lightColors = {
  // Backgrounds - Warm whites, not stark/cold
  bg: "#FDFCFB",           // Primary background - warm white
  bgTop: "#FDFCFB",        // Top of gradient (same as bg for light mode)
  bgSecondary: "#F8F6F3",  // Secondary background - cream
  bgTertiary: "#F0EDEA",   // Tertiary - warm gray for sections
  
  // Cards & Surfaces
  card: "#FFFFFF",         // Card background - pure white
  cardAlt: "#FAF9F7",      // Alternative card - slightly warm
  border: "#E8E4DF",       // Card borders - subtle warm
  
  // Primary Accent - Warm Coral (energetic but not aggressive)
  primary: "#FF7A5C",      // Primary actions, progress rings, CTAs
  primaryDark: "#FF6B4A",  // Hover/pressed states
  primaryMuted: "#FFEBE5", // Backgrounds, highlights
  primaryLight: "#FFF5F2", // Very subtle tint
  
  // Secondary Accent - Sage Green (success, PRs, completed)
  success: "#6B8E6B",      // Success states, completed items
  successDark: "#5A7D5A",  // Hover/pressed
  successMuted: "#E8F0E8", // Success backgrounds
  
  // Tertiary Accent - Soft Purple (optional, for variety)
  accent: "#8B7CF6",       // Badges, special highlights
  accentMuted: "#EDE9FE",  // Accent backgrounds
  
  // Semantic Colors
  warning: "#EAB308",      // Warnings, caution
  warningMuted: "#FEF9C3",
  error: "#EF4444",        // Errors, destructive
  errorMuted: "#FEE2E2",
  
  // Text - Warm blacks and grays (not pure black)
  text: "#1C1917",         // Primary text - warm black
  textSecondary: "#78716C", // Secondary text - warm gray
  textMuted: "#A8A29E",    // Muted text, placeholders
  muted: "#78716C",        // Alias for textSecondary (legacy compat)
  muted2: "#A8A29E",       // Alias for textMuted (legacy compat)
  textOnPrimary: "#FFFFFF", // Text on primary color
  
  // Interactive States
  selectedBg: "rgba(255, 122, 92, 0.10)", // Selected item background
  pressedBg: "rgba(255, 122, 92, 0.15)",  // Pressed state
  hoverBg: "rgba(255, 122, 92, 0.05)",    // Hover state
  
  // Specific UI Elements
  chip: "#FF7A5C",         // Chip/tag accent
  ringBg: "#F0EDEA",       // Progress ring background
  inputBg: "#FFFFFF",      // Input field background
  inputBorder: "#E8E4DF",  // Input border
  inputFocus: "#FF7A5C",   // Input focus border
  
  // Shadows - Warm tones
  shadow: "rgba(28, 25, 23, 0.08)",
  shadowStrong: "rgba(28, 25, 23, 0.12)",
};

// =============================================================================
// DARK MODE - Available in settings (warm dark, not cold)
// =============================================================================
export const darkColors = {
  // Backgrounds - Warm blacks, not pure black
  bg: "#121110",           // Primary background - warm black
  bgTop: "#1C1A18",        // Top of gradient - slightly lighter for depth
  bgSecondary: "#1C1A18",  // Secondary - warm dark
  bgTertiary: "#262320",   // Tertiary - warm charcoal
  
  // Cards & Surfaces
  card: "#1E1C1A",         // Card background
  cardAlt: "#252220",      // Alternative card
  border: "#2E2A26",       // Card borders
  
  // Primary Accent - Slightly lighter coral for dark mode contrast
  primary: "#FF8B70",      // Primary actions
  primaryDark: "#FF7A5C",  // Hover/pressed
  primaryMuted: "rgba(255, 139, 112, 0.15)", // Backgrounds
  primaryLight: "rgba(255, 139, 112, 0.08)", // Very subtle
  
  // Secondary Accent - Lighter sage for dark mode
  success: "#7FA07F",      // Success states
  successDark: "#6B8E6B",  // Hover/pressed
  successMuted: "rgba(127, 160, 127, 0.15)", // Success backgrounds
  
  // Tertiary Accent - Lighter purple
  accent: "#A78BFA",       // Badges, special highlights
  accentMuted: "rgba(167, 139, 250, 0.15)", // Accent backgrounds
  
  // Semantic Colors
  warning: "#FACC15",
  warningMuted: "rgba(250, 204, 21, 0.15)",
  error: "#F87171",
  errorMuted: "rgba(248, 113, 113, 0.15)",
  
  // Text - Off-whites for reduced eye strain
  text: "#F5F4F2",         // Primary text
  textSecondary: "#A09A94", // Secondary text
  textMuted: "#6B6560",    // Muted text
  muted: "#A09A94",        // Alias for textSecondary (legacy compat)
  muted2: "#6B6560",       // Alias for textMuted (legacy compat)
  textOnPrimary: "#121110", // Text on primary (dark for contrast)
  
  // Interactive States
  selectedBg: "rgba(255, 139, 112, 0.12)",
  pressedBg: "rgba(255, 139, 112, 0.18)",
  hoverBg: "rgba(255, 139, 112, 0.08)",
  
  // Specific UI Elements
  chip: "#FF8B70",
  ringBg: "#2E2A26",
  inputBg: "#1E1C1A",
  inputBorder: "#2E2A26",
  inputFocus: "#FF8B70",
  
  // Shadows
  shadow: "rgba(0, 0, 0, 0.30)",
  shadowStrong: "rgba(0, 0, 0, 0.40)",
};

// =============================================================================
// SPACING - Consistent spacing scale (base 4px)
// =============================================================================
export const space = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// =============================================================================
// BORDER RADIUS - Rounded corners for friendliness
// =============================================================================
export const radius = {
  xs: 8,    // Small elements (chips, badges)
  sm: 12,   // Buttons, inputs
  md: 16,   // Cards, modals
  lg: 20,   // Large cards
  xl: 24,   // Hero elements
  pill: 999, // Fully rounded (pills, avatars)
} as const;

// =============================================================================
// TYPOGRAPHY - Clean, readable, warm
// =============================================================================
export const typography = {
  // Font Families (using Inter for clean, modern look)
  fonts: {
    heading: "Inter_700Bold",
    subheading: "Inter_600SemiBold",
    body: "Inter_400Regular",
    bodyMedium: "Inter_500Medium",
    bodySemiBold: "Inter_600SemiBold",
  },
  
  // Font Sizes
  sizes: {
    hero: 48,      // Big numbers (Strength Score)
    h1: 32,        // Page titles
    h2: 24,        // Section headers
    h3: 20,        // Card titles
    body: 16,      // Body text
    bodySmall: 14, // Secondary text
    caption: 12,   // Captions, labels
    tiny: 10,      // Badges, tags
  },
  
  // Line Heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// =============================================================================
// SHADOWS - Warm, soft shadows (not harsh)
// =============================================================================
export const shadows = {
  sm: {
    shadowColor: "#1C1917",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: "#1C1917",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: "#1C1917",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 5,
  },
  // For floating elements (FAB, modals)
  float: {
    shadowColor: "#1C1917",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

// =============================================================================
// ANIMATION - Smooth, premium feel
// =============================================================================
export const animation = {
  // Spring configurations for React Native Reanimated
  spring: {
    gentle: { damping: 20, stiffness: 150, mass: 1 },    // Default, subtle
    snappy: { damping: 18, stiffness: 300, mass: 0.8 }, // Buttons, toggles
    bouncy: { damping: 12, stiffness: 200, mass: 1 },   // Celebrations
    wobbly: { damping: 8, stiffness: 150, mass: 1 },    // Playful elements
  },
  
  // Duration presets (ms)
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
    slower: 700,
  },
  
  // Easing curves
  easing: {
    easeOut: "cubic-bezier(0.0, 0.0, 0.2, 1)",
    easeIn: "cubic-bezier(0.4, 0.0, 1, 1)",
    easeInOut: "cubic-bezier(0.4, 0.0, 0.2, 1)",
    bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
} as const;

// =============================================================================
// EFFORT SCALE - Emoji-based RIR input (user-friendly)
// =============================================================================
export const effortScale = {
  easy: { emoji: "😊", label: "Easy", rir: "4+", description: "Could do 4+ more" },
  good: { emoji: "😐", label: "Good", rir: "2-3", description: "Could do 2-3 more" },
  hard: { emoji: "😤", label: "Hard", rir: "1", description: "Could do 1 more" },
  max: { emoji: "🔥", label: "Max", rir: "0", description: "Couldn't do more" },
} as const;

// =============================================================================
// FEELING SCALE - Daily readiness check
// =============================================================================
export const feelingScale = {
  tired: { emoji: "😴", label: "Tired", adjustment: -0.10, description: "-10% weights" },
  normal: { emoji: "😊", label: "Normal", adjustment: 0, description: "As planned" },
  strong: { emoji: "💪", label: "Strong", adjustment: 0.10, description: "+10% weights" },
} as const;

// =============================================================================
// THEME OBJECT - Combined for easy access
// =============================================================================
export const theme = {
  colors: lightColors, // Default to light mode
  space,
  radius,
  typography,
  fonts: typography.fonts, // Shortcut for theme.fonts.* usage
  type: typography.sizes,  // Shortcut for theme.type.* usage
  shadows,
  animation,
  effortScale,
  feelingScale,
} as const;

// Dark theme variant
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


