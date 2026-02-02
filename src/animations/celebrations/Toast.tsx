/**
 * Toast
 * Slide-in micro-feedback for quick celebrations
 */

import React, { useEffect, useState } from "react";
import { StyleSheet, Text, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { darkColors, theme } from "@/src/theme";
import { SPRING_CONFIG, Z_INDEX, TIMING } from "../constants";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Encouraging messages for different contexts
const MESSAGES = {
  setComplete: ["Nice!", "Crushed it!", "Strong!", "Keep going!", "Solid!"],
  exerciseComplete: ["Exercise done!", "Moving on!", "Great form!", "Nailed it!"],
  pr: ["NEW PR!", "Personal Best!", "You're getting stronger!"],
  streak: ["Streak extended!", "Consistency!", "On fire!"],
  motivation: ["Let's go!", "Next set!", "Keep the momentum!", "You got this!"],
};

type ToastProps = {
  visible: boolean;
  message?: string;
  type?: keyof typeof MESSAGES;
  duration?: number;
  onHide?: () => void;
};

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = "setComplete",
  duration = 1500,
  onHide,
}) => {
  const [displayMessage, setDisplayMessage] = useState("");
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Pick random message if not provided
      const msg = message || MESSAGES[type][Math.floor(Math.random() * MESSAGES[type].length)];
      setDisplayMessage(msg);

      // Animate in
      translateY.value = withSpring(0, SPRING_CONFIG.snappy);
      opacity.value = withTiming(1, { duration: TIMING.fast });

      // Animate out after duration
      translateY.value = withDelay(
        duration,
        withSpring(100, SPRING_CONFIG.snappy, () => {
          if (onHide) {
            runOnJS(onHide)();
          }
        })
      );
      opacity.value = withDelay(
        duration,
        withTiming(0, { duration: TIMING.fast })
      );
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible && opacity.value === 0) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text allowFontScaling={false} style={styles.text}>
        {displayMessage}
      </Text>
    </Animated.View>
  );
};

/**
 * ToastManager
 * Global toast management with queue support
 */
type ToastItem = {
  id: string;
  message?: string;
  type?: keyof typeof MESSAGES;
};

let toastQueue: ToastItem[] = [];
let showToastCallback: ((toast: ToastItem) => void) | null = null;

export const showToast = (options: Omit<ToastItem, "id">) => {
  const toast: ToastItem = {
    id: Date.now().toString(),
    ...options,
  };
  
  if (showToastCallback) {
    showToastCallback(toast);
  } else {
    toastQueue.push(toast);
  }
};

export const ToastContainer: React.FC = () => {
  const [currentToast, setCurrentToast] = useState<ToastItem | null>(null);

  useEffect(() => {
    showToastCallback = (toast) => {
      setCurrentToast(toast);
    };

    // Process any queued toasts
    if (toastQueue.length > 0) {
      const next = toastQueue.shift();
      if (next) setCurrentToast(next);
    }

    return () => {
      showToastCallback = null;
    };
  }, []);

  const handleHide = () => {
    setCurrentToast(null);
    // Show next toast in queue
    if (toastQueue.length > 0) {
      setTimeout(() => {
        const next = toastQueue.shift();
        if (next) setCurrentToast(next);
      }, 200);
    }
  };

  return (
    <Toast
      visible={!!currentToast}
      message={currentToast?.message}
      type={currentToast?.type}
      onHide={handleHide}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: Z_INDEX.toast,
  },
  text: {
    backgroundColor: darkColors.card,
    color: darkColors.primary,
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: darkColors.primary,
    overflow: "hidden",
  },
});

export default Toast;
