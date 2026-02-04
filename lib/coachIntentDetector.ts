/**
 * Coach Intent Detector
 * 
 * Determines whether a user message requires lite or full context.
 * This helps optimize costs by only sending full context when needed.
 * 
 * Lite context: greetings, motivation, general questions
 * Full context: workout recommendations, progress, program questions
 */

import type { ContextMode } from "@/src/types/coachContext";

// ============================================================================
// Pattern Definitions
// ============================================================================

/**
 * Patterns that indicate full context is needed
 * These are questions/requests that benefit from knowing the user's full history
 */
const FULL_CONTEXT_PATTERNS: RegExp[] = [
  // Workout planning
  /what.*(should|do|workout|train|exercise)/i,
  /today.*(workout|session|training)/i,
  /recommend.*(exercise|workout|routine)/i,
  /what.*(next|today)/i,
  
  // Progress and performance
  /how.*(am i|doing|progress|going)/i,
  /my progress/i,
  /my pr/i,
  /my stats/i,
  /my lifts/i,
  /my strength/i,
  /getting stronger/i,
  
  // Program and routine
  /program/i,
  /routine/i,
  /split/i,
  /schedule/i,
  /change.*(workout|program|routine)/i,
  
  // Rest and recovery
  /rest day/i,
  /should.*(rest|recover|skip)/i,
  /take.*(day off|break)/i,
  /overtraining/i,
  
  // Pain and injury (ALWAYS use full context for safety)
  /pain/i,
  /hurt/i,
  /injury/i,
  /sore/i,
  /uncomfortable/i,
  /strain/i,
  /ache/i,
  
  // Weight and numbers
  /weight.*(should|use|lift)/i,
  /how much.*(weight|should)/i,
  /how heavy/i,
  /increase.*(weight|load)/i,
  /sets.*(and|or).*reps/i,
  
  // Nutrition (might reference goals/weight)
  /what.*(eat|food|meal|protein|calories)/i,
  /nutrition/i,
  /macros/i,
  /diet/i,
  /bulk/i,
  /cut/i,
  
  // Goals
  /my goal/i,
  /reach.*(goal|target)/i,
  /build.*(muscle|strength)/i,
  /lose.*(fat|weight)/i,
  
  // Equipment specific
  /don't have/i,
  /no.*(equipment|gym|barbell|dumbbell)/i,
  /at home/i,
  /home gym/i,
  /alternative.*(for|to)/i,
  /substitute/i,
  
  // Specific exercises
  /bench press/i,
  /squat/i,
  /deadlift/i,
  /overhead press/i,
  
  // Time-based
  /this week/i,
  /last week/i,
  /recently/i,
  /lately/i,
];

/**
 * Patterns that clearly indicate lite context is sufficient
 * These take priority over full context patterns
 */
const LITE_CONTEXT_PATTERNS: RegExp[] = [
  // Greetings
  /^(hi|hey|hello|yo|sup|what's up|whats up)[\s!?.]*$/i,
  /^good (morning|afternoon|evening)/i,
  
  // Thanks
  /^(thanks|thank you|thx|ty)[\s!.]*$/i,
  
  // Affirmations
  /^(ok|okay|sure|got it|sounds good|perfect|great|awesome|nice)[\s!.]*$/i,
  /^(yes|yeah|yep|no|nope|nah)[\s!.]*$/i,
  
  // Simple questions
  /^(who are you|what are you|what can you do)/i,
  /^(help|menu|options)/i,
];

/**
 * Keywords that boost probability of needing full context
 * Even in shorter messages
 */
const FULL_CONTEXT_KEYWORDS: string[] = [
  "workout", "exercise", "train", "lift", "pr", "progress",
  "weight", "reps", "sets", "routine", "program", "split",
  "pain", "injury", "hurt", "sore",
  "rest", "recovery", "skip",
  "goal", "muscle", "strength",
  "eat", "protein", "calories",
];

// ============================================================================
// Main Detection Function
// ============================================================================

/**
 * Determine the appropriate context mode for a user message
 * 
 * @param message - The user's message
 * @returns "lite" or "full" context mode
 */
export function detectContextMode(message: string): ContextMode {
  const trimmed = message.trim();
  
  // Very short messages (< 10 chars) usually don't need full context
  if (trimmed.length < 10) {
    // Unless they contain a critical keyword
    const hasKeyword = FULL_CONTEXT_KEYWORDS.some(kw => 
      trimmed.toLowerCase().includes(kw)
    );
    if (!hasKeyword) {
      return "lite";
    }
  }
  
  // Check lite patterns first (they take priority)
  for (const pattern of LITE_CONTEXT_PATTERNS) {
    if (pattern.test(trimmed)) {
      return "lite";
    }
  }
  
  // Check full context patterns
  for (const pattern of FULL_CONTEXT_PATTERNS) {
    if (pattern.test(trimmed)) {
      return "full";
    }
  }
  
  // Check for any full context keywords
  const lowerMessage = trimmed.toLowerCase();
  for (const keyword of FULL_CONTEXT_KEYWORDS) {
    if (lowerMessage.includes(keyword)) {
      return "full";
    }
  }
  
  // Default to lite (cost-safe)
  return "lite";
}

/**
 * Get the reason for the context mode decision (for debugging)
 */
export function explainContextMode(message: string): {
  mode: ContextMode;
  reason: string;
  matchedPattern?: string;
} {
  const trimmed = message.trim();
  
  // Very short messages
  if (trimmed.length < 10) {
    const matchedKeyword = FULL_CONTEXT_KEYWORDS.find(kw => 
      trimmed.toLowerCase().includes(kw)
    );
    
    if (matchedKeyword) {
      return {
        mode: "full",
        reason: "Short message with critical keyword",
        matchedPattern: matchedKeyword,
      };
    }
    
    return {
      mode: "lite",
      reason: "Very short message",
    };
  }
  
  // Check lite patterns
  for (const pattern of LITE_CONTEXT_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        mode: "lite",
        reason: "Matched lite pattern (greeting/thanks/simple)",
        matchedPattern: pattern.toString(),
      };
    }
  }
  
  // Check full context patterns
  for (const pattern of FULL_CONTEXT_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        mode: "full",
        reason: "Matched full context pattern",
        matchedPattern: pattern.toString(),
      };
    }
  }
  
  // Check keywords
  const lowerMessage = trimmed.toLowerCase();
  for (const keyword of FULL_CONTEXT_KEYWORDS) {
    if (lowerMessage.includes(keyword)) {
      return {
        mode: "full",
        reason: "Contains full context keyword",
        matchedPattern: keyword,
      };
    }
  }
  
  return {
    mode: "lite",
    reason: "Default (no patterns matched)",
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Force full context for certain scenarios
 * Call this when context is especially important regardless of message content
 */
export function shouldForceFullContext(options: {
  isFirstMessage?: boolean;
  userReportedPain?: boolean;
  userMentionedInjury?: boolean;
  longTimeSinceLastChat?: boolean;
}): boolean {
  // Always use full context if user has pain/injury concerns
  if (options.userReportedPain || options.userMentionedInjury) {
    return true;
  }
  
  // First message of the session benefits from full context
  if (options.isFirstMessage) {
    return true;
  }
  
  // If it's been a while, refresh full context
  if (options.longTimeSinceLastChat) {
    return true;
  }
  
  return false;
}
