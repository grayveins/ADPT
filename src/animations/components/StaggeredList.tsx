/**
 * StaggeredList
 * Container that animates children with staggered entrance
 */

import React, { ReactNode, Children, isValidElement } from "react";
import { View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  useSharedValue,
  FadeInDown,
  FadeInUp,
  FadeInLeft,
  FadeInRight,
  Layout,
} from "react-native-reanimated";
import { TIMING, SPRING_CONFIG } from "../constants";

type Direction = "up" | "down" | "left" | "right";

type StaggeredListProps = {
  children: ReactNode;
  staggerDelay?: number;
  direction?: Direction;
  style?: ViewStyle;
  enabled?: boolean;
};

const getEnteringAnimation = (direction: Direction, index: number, delay: number) => {
  const totalDelay = index * delay;
  
  switch (direction) {
    case "up":
      return FadeInUp.delay(totalDelay).springify().damping(15);
    case "down":
      return FadeInDown.delay(totalDelay).springify().damping(15);
    case "left":
      return FadeInLeft.delay(totalDelay).springify().damping(15);
    case "right":
      return FadeInRight.delay(totalDelay).springify().damping(15);
  }
};

export const StaggeredList: React.FC<StaggeredListProps> = ({
  children,
  staggerDelay = TIMING.staggerDelay,
  direction = "up",
  style,
  enabled = true,
}) => {
  if (!enabled) {
    return <View style={style}>{children}</View>;
  }

  return (
    <View style={style}>
      {Children.map(children, (child, index) => {
        if (!isValidElement(child)) return child;

        return (
          <Animated.View
            key={index}
            entering={getEnteringAnimation(direction, index, staggerDelay)}
            layout={Layout.springify()}
          >
            {child}
          </Animated.View>
        );
      })}
    </View>
  );
};

/**
 * StaggeredItem
 * Individual item with staggered animation (for manual control)
 */
type StaggeredItemProps = {
  children: ReactNode;
  index: number;
  staggerDelay?: number;
  direction?: Direction;
  style?: ViewStyle;
};

export const StaggeredItem: React.FC<StaggeredItemProps> = ({
  children,
  index,
  staggerDelay = TIMING.staggerDelay,
  direction = "up",
  style,
}) => {
  const delay = index * staggerDelay;
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(direction === "up" ? 20 : direction === "down" ? -20 : 0);
  const translateX = useSharedValue(direction === "left" ? 20 : direction === "right" ? -20 : 0);

  React.useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: TIMING.normal }));
    translateY.value = withDelay(delay, withSpring(0, SPRING_CONFIG.gentle));
    translateX.value = withDelay(delay, withSpring(0, SPRING_CONFIG.gentle));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

export default StaggeredList;
