/**
 * Haptic Feedback System
 * Provides tactile feedback for interactions
 */

import * as Haptics from "expo-haptics";

export type HapticType = 
  | "light" 
  | "medium" 
  | "heavy" 
  | "success" 
  | "warning" 
  | "error"
  | "selection";

/**
 * Trigger haptic feedback
 */
export const haptic = (type: HapticType = "light") => {
  switch (type) {
    case "light":
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case "medium":
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case "heavy":
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      break;
    case "success":
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case "warning":
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      break;
    case "error":
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;
    case "selection":
      Haptics.selectionAsync();
      break;
  }
};

/**
 * Double-tap haptic pattern for set completion
 */
export const hapticSuccess = async () => {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  setTimeout(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, 100);
};

/**
 * Triple-tap haptic pattern for workout completion
 */
export const hapticCelebration = async () => {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  setTimeout(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, 200);
};

/**
 * Soft tap for button press
 */
export const hapticPress = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

/**
 * Selection change haptic
 */
export const hapticSelect = () => {
  Haptics.selectionAsync();
};
