/**
 * Push Notification Utilities
 * 
 * Handles push notification token registration and management.
 * Tokens are stored in the user's profile for server-side notifications.
 */

import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { supabase } from "./supabase";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Check if running on a physical device
 * expo-device may not be installed, so use a fallback
 */
function isPhysicalDevice(): boolean {
  // Check if we're in Expo Go on a simulator
  const isExpoGo = Constants.appOwnership === "expo";
  
  // On iOS, check for simulator
  if (Platform.OS === "ios") {
    // In production builds or on physical devices, this will work
    return !__DEV__ || !isExpoGo;
  }
  
  // On Android, assume physical device in production
  return !__DEV__ || true;
}

/**
 * Register for push notifications and save token to profile
 * Should be called after user grants notification permission
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Check existing permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not granted
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Push notification permission not granted");
      return null;
    }

    // Get push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    const token = tokenData.data;

    // Configure Android channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#00C9B7", // Primary teal color
      });
    }

    // Save token to user profile
    await savePushToken(token);

    return token;
  } catch (error) {
    console.error("Error registering for push notifications:", error);
    return null;
  }
}

/**
 * Save push token to user's profile in Supabase
 */
export async function savePushToken(token: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log("No user logged in, cannot save push token");
      return false;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ push_token: token })
      .eq("id", user.id);

    if (error) {
      console.error("Error saving push token:", error);
      return false;
    }

    console.log("Push token saved successfully");
    return true;
  } catch (error) {
    console.error("Error saving push token:", error);
    return false;
  }
}

/**
 * Remove push token from user's profile (e.g., on logout)
 */
export async function removePushToken(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return true; // No user, nothing to remove
    }

    const { error } = await supabase
      .from("profiles")
      .update({ push_token: null })
      .eq("id", user.id);

    if (error) {
      console.error("Error removing push token:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error removing push token:", error);
    return false;
  }
}

/**
 * Check if push notifications are enabled
 */
export async function isPushEnabled(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}

/**
 * Get current push token if available
 */
export async function getCurrentPushToken(): Promise<string | null> {
  try {
    const hasPermission = await isPushEnabled();
    if (!hasPermission) {
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return tokenData.data;
  } catch (error) {
    console.error("Error getting push token:", error);
    return null;
  }
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  trigger: Notifications.NotificationTriggerInput
): Promise<string> {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger,
  });
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

// Notification listener types
type NotificationListener = (notification: Notifications.Notification) => void;
type NotificationResponseListener = (response: Notifications.NotificationResponse) => void;

/**
 * Add listener for incoming notifications (when app is foregrounded)
 */
export function addNotificationReceivedListener(
  listener: NotificationListener
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(listener);
}

/**
 * Add listener for notification responses (when user taps notification)
 */
export function addNotificationResponseListener(
  listener: NotificationResponseListener
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(listener);
}
