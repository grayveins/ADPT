/**
 * Network Status Utilities
 * 
 * Provides hooks and utilities for monitoring network connectivity.
 * Uses a lightweight approach without external dependencies.
 * 
 * Note: For more robust network detection, consider installing
 * @react-native-community/netinfo or expo-network
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";

export type NetworkStatus = {
  isConnected: boolean;
  lastChecked: Date | null;
};

// Simple connectivity check by fetching a small resource
async function checkConnectivity(): Promise<boolean> {
  try {
    // Use a lightweight endpoint - Google's generate_204 is designed for this
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch("https://www.google.com/generate_204", {
      method: "HEAD",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok || response.status === 204;
  } catch {
    return false;
  }
}

/**
 * Hook to monitor network connectivity
 * Checks on mount, app foreground, and optionally at intervals
 */
export function useNetworkStatus(pollInterval?: number) {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true, // Assume connected initially
    lastChecked: null,
  });
  const checkInProgressRef = useRef(false);

  const checkNetwork = useCallback(async () => {
    if (checkInProgressRef.current) return;
    
    checkInProgressRef.current = true;
    try {
      const isConnected = await checkConnectivity();
      setStatus({
        isConnected,
        lastChecked: new Date(),
      });
    } finally {
      checkInProgressRef.current = false;
    }
  }, []);

  // Check on mount
  useEffect(() => {
    checkNetwork();
  }, [checkNetwork]);

  // Check when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        checkNetwork();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, [checkNetwork]);

  // Optional polling
  useEffect(() => {
    if (!pollInterval) return;

    const interval = setInterval(checkNetwork, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval, checkNetwork]);

  return {
    ...status,
    isOffline: !status.isConnected,
    isOnline: status.isConnected,
    refresh: checkNetwork,
  };
}

/**
 * Check if currently online (one-time check)
 */
export async function checkOnline(): Promise<boolean> {
  return checkConnectivity();
}

export default useNetworkStatus;
