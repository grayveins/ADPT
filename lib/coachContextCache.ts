/**
 * Coach Context Cache
 * 
 * Caches user context in AsyncStorage to reduce database calls.
 * Context is refreshed when:
 * - Cache expires (TTL)
 * - User completes a workout
 * - User reports pain
 * - User hits a PR
 * - User updates their profile
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { FullCoachContext, CachedCoachContext } from "@/src/types/coachContext";

// ============================================================================
// Configuration
// ============================================================================

/** Cache time-to-live in milliseconds (5 minutes) */
const CACHE_TTL = 5 * 60 * 1000;

/** AsyncStorage key prefix */
const CACHE_KEY_PREFIX = "coach_context_";

// ============================================================================
// Cache Operations
// ============================================================================

/**
 * Get cached context for a user
 * Returns null if cache is expired or doesn't exist
 */
export async function getCachedContext(userId: string): Promise<FullCoachContext | null> {
  try {
    const key = `${CACHE_KEY_PREFIX}${userId}`;
    const cached = await AsyncStorage.getItem(key);
    
    if (!cached) {
      return null;
    }
    
    const parsed: CachedCoachContext = JSON.parse(cached);
    
    // Check if cache is still valid
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      // Cache expired, remove it
      await AsyncStorage.removeItem(key);
      return null;
    }
    
    return parsed.data;
  } catch (error) {
    console.error("[CoachContextCache] Error reading cache:", error);
    return null;
  }
}

/**
 * Store context in cache
 */
export async function setCachedContext(
  userId: string, 
  context: FullCoachContext
): Promise<void> {
  try {
    const key = `${CACHE_KEY_PREFIX}${userId}`;
    const cacheEntry: CachedCoachContext = {
      data: context,
      timestamp: Date.now(),
      userId,
    };
    
    await AsyncStorage.setItem(key, JSON.stringify(cacheEntry));
  } catch (error) {
    console.error("[CoachContextCache] Error writing cache:", error);
  }
}

/**
 * Invalidate (clear) cached context for a user
 * Should be called after events that change user state:
 * - Workout completion
 * - PR recorded
 * - Pain reported
 * - Profile update
 */
export async function invalidateCoachContext(userId: string): Promise<void> {
  try {
    const key = `${CACHE_KEY_PREFIX}${userId}`;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error("[CoachContextCache] Error invalidating cache:", error);
  }
}

/**
 * Clear all coach context caches
 * Useful for logout or debug
 */
export async function clearAllCoachContextCaches(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const contextKeys = allKeys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
    
    if (contextKeys.length > 0) {
      await AsyncStorage.multiRemove(contextKeys);
    }
  } catch (error) {
    console.error("[CoachContextCache] Error clearing all caches:", error);
  }
}

/**
 * Get cache status for debugging
 */
export async function getCacheStatus(userId: string): Promise<{
  exists: boolean;
  ageMs: number | null;
  isExpired: boolean;
}> {
  try {
    const key = `${CACHE_KEY_PREFIX}${userId}`;
    const cached = await AsyncStorage.getItem(key);
    
    if (!cached) {
      return { exists: false, ageMs: null, isExpired: false };
    }
    
    const parsed: CachedCoachContext = JSON.parse(cached);
    const ageMs = Date.now() - parsed.timestamp;
    
    return {
      exists: true,
      ageMs,
      isExpired: ageMs > CACHE_TTL,
    };
  } catch (error) {
    return { exists: false, ageMs: null, isExpired: false };
  }
}

// ============================================================================
// Event Emitter for Cache Invalidation
// ============================================================================

type CacheInvalidationListener = (userId: string, reason: string) => void;

const listeners: Set<CacheInvalidationListener> = new Set();

/**
 * Subscribe to cache invalidation events
 * Useful for components that need to know when context changes
 */
export function onCacheInvalidated(listener: CacheInvalidationListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Invalidate cache and notify listeners
 */
export async function invalidateAndNotify(
  userId: string, 
  reason: "workout_complete" | "pr_recorded" | "pain_reported" | "profile_update"
): Promise<void> {
  await invalidateCoachContext(userId);
  
  // Notify all listeners
  for (const listener of listeners) {
    try {
      listener(userId, reason);
    } catch (error) {
      console.error("[CoachContextCache] Listener error:", error);
    }
  }
}
