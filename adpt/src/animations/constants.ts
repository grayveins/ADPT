/**
 * Animation Constants
 * Centralized timing, easing, and configuration for all animations
 */

// Spring configurations for different use cases
export const SPRING_CONFIG = {
  // Snappy interactions (buttons, selections)
  snappy: {
    damping: 15,
    stiffness: 400,
    mass: 0.5,
  },
  // Bouncy celebrations (checkmarks, badges)
  bouncy: {
    damping: 10,
    stiffness: 300,
    mass: 0.8,
  },
  // Gentle transitions (content entrance)
  gentle: {
    damping: 20,
    stiffness: 200,
    mass: 1,
  },
  // Wobbly for playful moments
  wobbly: {
    damping: 8,
    stiffness: 180,
    mass: 1,
  },
} as const;

// Timing configurations
export const TIMING = {
  // Micro interactions
  instant: 100,
  fast: 150,
  normal: 250,
  slow: 400,
  
  // Stagger delays
  staggerDelay: 50,
  staggerDelayLong: 100,
  
  // Celebration sequences
  celebrationDelay: 200,
  celebrationDuration: 3000,
  
  // Ambient animations
  breatheDuration: 4000,
  shimmerDuration: 2000,
  pulseDuration: 2000,
  flickerDuration: 150,
} as const;

// Scale values
export const SCALE = {
  pressed: 0.96,
  hover: 1.02,
  bounce: 1.05,
  breatheMin: 1.0,
  breatheMax: 1.02,
} as const;

// Opacity values
export const OPACITY = {
  pressed: 0.9,
  disabled: 0.5,
  muted: 0.6,
  glowMin: 0.3,
  glowMax: 0.8,
} as const;

// Glow colors (with alpha) - Warm Coral theme
export const GLOW_COLORS = {
  primary: "rgba(255, 122, 92, 0.4)",      // Coral glow
  primarySubtle: "rgba(255, 122, 92, 0.2)", // Subtle coral
  success: "rgba(107, 142, 107, 0.5)",     // Sage green glow
  gold: "rgba(255, 215, 0, 0.5)",          // Gold (unchanged)
  white: "rgba(255, 255, 255, 0.3)",       // White (unchanged)
} as const;

// Confetti configuration
export const CONFETTI = {
  micro: {
    count: 6,
    spread: 40,
    duration: 800,
  },
  medium: {
    count: 15,
    spread: 60,
    duration: 1200,
  },
  celebration: {
    count: 30,
    spread: 80,
    duration: 2000,
  },
} as const;

// Particle colors - Warm Coral theme
export const PARTICLE_COLORS = {
  default: ["#FF7A5C", "#FFFFFF", "#FF6B4A"],    // Coral confetti
  gold: ["#FFD700", "#FFA500", "#FFFFFF"],       // Gold (unchanged)
  rainbow: ["#FF7A5C", "#6B8E6B", "#FF8B70", "#EAB308", "#7FA07F"], // Warm theme rainbow
  success: ["#6B8E6B", "#7FA07F", "#FFFFFF"],    // Sage green celebration
} as const;

// Z-index layers
export const Z_INDEX = {
  base: 0,
  card: 10,
  overlay: 100,
  modal: 200,
  toast: 300,
  celebration: 400,
  confetti: 500,
} as const;
