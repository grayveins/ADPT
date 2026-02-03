/**
 * Hook for managing Coach unread badge state
 * 
 * Uses AsyncStorage to persist unread state across app sessions.
 * Uses a simple event emitter pattern to keep multiple hook instances in sync.
 */

import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";

const COACH_UNREAD_KEY = "@coach_has_unread";

// Simple event emitter for cross-component communication
type Listener = (hasUnread: boolean) => void;
const listeners: Set<Listener> = new Set();

function emit(hasUnread: boolean) {
  listeners.forEach((listener) => listener(hasUnread));
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Mark coach as read - can be called from anywhere
 */
export async function markCoachAsReadGlobal(): Promise<void> {
  try {
    await AsyncStorage.setItem(COACH_UNREAD_KEY, "false");
    emit(false);
  } catch (error) {
    console.error("Error marking coach as read:", error);
  }
}

/**
 * Mark coach as unread - can be called from anywhere
 */
export async function markCoachAsUnreadGlobal(): Promise<void> {
  try {
    await AsyncStorage.setItem(COACH_UNREAD_KEY, "true");
    emit(true);
  } catch (error) {
    console.error("Error marking coach as unread:", error);
  }
}

export function useCoachUnread() {
  const [hasUnread, setHasUnread] = useState(false);

  // Load initial state
  const loadUnreadState = useCallback(async () => {
    try {
      const value = await AsyncStorage.getItem(COACH_UNREAD_KEY);
      // Default to true for first-time users to draw attention
      const unread = value === null ? true : value === "true";
      setHasUnread(unread);
    } catch (error) {
      console.error("Error loading unread state:", error);
      setHasUnread(false);
    }
  }, []);

  // Subscribe to changes from other components
  useEffect(() => {
    loadUnreadState();
    
    const unsubscribe = subscribe((unread) => {
      setHasUnread(unread);
    });
    
    return unsubscribe;
  }, [loadUnreadState]);

  // Refresh on focus (for tab navigation)
  useFocusEffect(
    useCallback(() => {
      loadUnreadState();
    }, [loadUnreadState])
  );

  const markAsRead = useCallback(async () => {
    await markCoachAsReadGlobal();
  }, []);

  const markAsUnread = useCallback(async () => {
    await markCoachAsUnreadGlobal();
  }, []);

  return {
    hasUnread,
    markAsRead,
    markAsUnread,
    refresh: loadUnreadState,
  };
}

export default useCoachUnread;
