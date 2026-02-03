/**
 * Offline Storage Utilities
 * 
 * Queues actions when offline and syncs when back online.
 * Uses AsyncStorage for persistence across app sessions.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { checkOnline } from "./networkStatus";

// Storage keys
const OFFLINE_QUEUE_KEY = "@offline_queue";
const OFFLINE_CHAT_KEY = "@offline_chat_messages";

// Types
export type QueuedAction = {
  id: string;
  type: "workout_session" | "coach_event" | "chat_message";
  payload: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
};

export type OfflineChatMessage = {
  id: string;
  content: string;
  timestamp: string;
};

// ============================================================================
// Action Queue (for workout sessions, coach events, etc.)
// ============================================================================

/**
 * Add an action to the offline queue
 */
export async function queueOfflineAction(
  type: QueuedAction["type"],
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    
    const action: QueuedAction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };
    
    queue.push(action);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("Error queuing offline action:", error);
  }
}

/**
 * Get all queued offline actions
 */
export async function getOfflineQueue(): Promise<QueuedAction[]> {
  try {
    const data = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting offline queue:", error);
    return [];
  }
}

/**
 * Remove an action from the queue (after successful sync)
 */
export async function removeFromQueue(actionId: string): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    const filtered = queue.filter((a) => a.id !== actionId);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error removing from queue:", error);
  }
}

/**
 * Update retry count for a failed action
 */
export async function incrementRetryCount(actionId: string): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    const updated = queue.map((a) =>
      a.id === actionId ? { ...a, retryCount: a.retryCount + 1 } : a
    );
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Error incrementing retry count:", error);
  }
}

/**
 * Clear all queued actions (use with caution)
 */
export async function clearOfflineQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch (error) {
    console.error("Error clearing offline queue:", error);
  }
}

// ============================================================================
// Offline Chat Messages
// ============================================================================

/**
 * Store a chat message for when offline
 */
export async function storeOfflineChatMessage(content: string): Promise<OfflineChatMessage> {
  try {
    const messages = await getOfflineChatMessages();
    
    const message: OfflineChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      timestamp: new Date().toISOString(),
    };
    
    messages.push(message);
    await AsyncStorage.setItem(OFFLINE_CHAT_KEY, JSON.stringify(messages));
    
    return message;
  } catch (error) {
    console.error("Error storing offline chat message:", error);
    throw error;
  }
}

/**
 * Get all offline chat messages
 */
export async function getOfflineChatMessages(): Promise<OfflineChatMessage[]> {
  try {
    const data = await AsyncStorage.getItem(OFFLINE_CHAT_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting offline chat messages:", error);
    return [];
  }
}

/**
 * Clear offline chat messages (after sync)
 */
export async function clearOfflineChatMessages(): Promise<void> {
  try {
    await AsyncStorage.removeItem(OFFLINE_CHAT_KEY);
  } catch (error) {
    console.error("Error clearing offline chat messages:", error);
  }
}

// ============================================================================
// Sync Utilities
// ============================================================================

/**
 * Process a single queued action
 * Returns true if successful, false otherwise
 */
type ActionProcessor = (action: QueuedAction) => Promise<boolean>;

/**
 * Sync all queued actions
 * Processes each action and removes successful ones from queue
 */
export async function syncOfflineQueue(
  processor: ActionProcessor,
  maxRetries: number = 3
): Promise<{ synced: number; failed: number }> {
  const isOnline = await checkOnline();
  
  if (!isOnline) {
    return { synced: 0, failed: 0 };
  }

  const queue = await getOfflineQueue();
  let synced = 0;
  let failed = 0;

  for (const action of queue) {
    // Skip if max retries exceeded
    if (action.retryCount >= maxRetries) {
      failed++;
      continue;
    }

    try {
      const success = await processor(action);
      
      if (success) {
        await removeFromQueue(action.id);
        synced++;
      } else {
        await incrementRetryCount(action.id);
        failed++;
      }
    } catch (error) {
      console.error(`Error processing action ${action.id}:`, error);
      await incrementRetryCount(action.id);
      failed++;
    }
  }

  return { synced, failed };
}

/**
 * Get count of pending offline actions
 */
export async function getOfflineQueueCount(): Promise<number> {
  const queue = await getOfflineQueue();
  return queue.length;
}

/**
 * Check if there are pending offline actions
 */
export async function hasOfflineActions(): Promise<boolean> {
  const count = await getOfflineQueueCount();
  return count > 0;
}
