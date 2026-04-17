/**
 * SelectionPop
 * Micro-interaction wrapper for onboarding option cards.
 * Provides a crisp scale tap, expanding teal ripple, and checkmark on selection.
 */

import React, { useEffect, useRef } from "react";
import { StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  interpolate,
  Easing,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "../../context/ThemeContext";
import { haptic } from "../feedback/haptics";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type SelectionPopProps = {
  selected: boolean;
  children: React.ReactNode;
  onPress: () => void;
  style?: any;
};

// ---------------------------------------------------------------------------
// Small teal checkmark icon
// ---------------------------------------------------------------------------
const CheckIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width={16} height={16} viewBox="0 0 16 16">
    <Path
      d="M3.5 8.5 L6.5 11.5 L12.5 4.5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const SelectionPop: React.FC<SelectionPopProps> = ({
  selected,
  children,
  onPress,
  style,
}) => {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);
  const checkOpacity = useSharedValue(0);
  const borderOpacity = useSharedValue(0);
  const prevSelected = useRef(selected);

  // Handle selection changes (animate checkmark & border)
  useEffect(() => {
    if (selected) {
      checkOpacity.value = withTiming(1, { duration: 150 });
      borderOpacity.value = withTiming(1, { duration: 150 });
    } else {
      checkOpacity.value = withTiming(0, { duration: 100 });
      borderOpacity.value = withTiming(0, { duration: 100 });
    }
    prevSelected.current = selected;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const handlePress = () => {
    // Scale pop: 0.97 -> 1.0 (crisp, 80ms each)
    scale.value = withSequence(
      withTiming(0.97, { duration: 80, easing: Easing.out(Easing.ease) }),
      withTiming(1, { duration: 80, easing: Easing.out(Easing.ease) })
    );

    // Ripple: expand and fade (only on selection, not deselection)
    if (!selected) {
      rippleScale.value = 0;
      rippleOpacity.value = 0.4;
      rippleScale.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
      rippleOpacity.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
    }

    // Haptic feedback
    haptic("medium");

    onPress();
  };

  // Card scale
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Ripple effect
  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value * 2 }],
    opacity: rippleOpacity.value,
  }));

  // Checkmark
  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [
      { scale: interpolate(checkOpacity.value, [0, 1], [0.5, 1]) },
    ],
  }));

  // Selection border
  const borderStyle = useAnimatedStyle(() => ({
    borderColor: colors.primary,
    borderWidth: interpolate(borderOpacity.value, [0, 1], [0, 2]),
  }));

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.container, style, cardStyle, borderStyle]}>
        {/* Ripple layer */}
        <Animated.View
          style={[
            styles.ripple,
            { backgroundColor: colors.primary },
            rippleStyle,
          ]}
          pointerEvents="none"
        />

        {/* Content */}
        {children}

        {/* Selection checkmark */}
        <Animated.View
          style={[
            styles.checkBadge,
            { backgroundColor: colors.primary },
            checkStyle,
          ]}
        >
          <CheckIcon color={colors.textOnPrimary} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    borderRadius: 16,
    borderWidth: 0,
    borderColor: "transparent",
  },
  ripple: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 60,
    height: 60,
    borderRadius: 30,
    marginTop: -30,
    marginLeft: -30,
  },
  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default SelectionPop;
