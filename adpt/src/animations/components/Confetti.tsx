/**
 * Confetti
 * Particle burst effect for celebrations
 */

import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, Dimensions, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { CONFETTI, PARTICLE_COLORS, Z_INDEX, TIMING } from "../constants";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type Particle = {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
};

type ConfettiProps = {
  active: boolean;
  onComplete?: () => void;
  count?: number;
  spread?: number;
  duration?: number;
  colors?: string[];
  origin?: { x: number; y: number };
};

const ConfettiParticle: React.FC<{
  particle: Particle;
  duration: number;
  spread: number;
}> = ({ particle, duration, spread }) => {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    // Random horizontal movement
    const randomX = (Math.random() - 0.5) * spread * 2;
    const randomY = 100 + Math.random() * 200; // Fall distance

    scale.value = withDelay(
      particle.delay,
      withTiming(1, { duration: 100 })
    );

    translateY.value = withDelay(
      particle.delay,
      withTiming(randomY, {
        duration,
        easing: Easing.out(Easing.quad),
      })
    );

    translateX.value = withDelay(
      particle.delay,
      withTiming(randomX, {
        duration,
        easing: Easing.out(Easing.quad),
      })
    );

    rotate.value = withDelay(
      particle.delay,
      withTiming(360 * (Math.random() > 0.5 ? 1 : -1) * 2, {
        duration,
        easing: Easing.linear,
      })
    );

    opacity.value = withDelay(
      particle.delay + duration * 0.6,
      withTiming(0, { duration: duration * 0.4 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: particle.x,
          top: particle.y,
          width: particle.size,
          height: particle.size,
          backgroundColor: particle.color,
          borderRadius: particle.size / 4,
        },
        animatedStyle,
      ]}
    />
  );
};

export const Confetti: React.FC<ConfettiProps> = ({
  active,
  onComplete,
  count = CONFETTI.medium.count,
  spread = CONFETTI.medium.spread,
  duration = CONFETTI.medium.duration,
  colors = PARTICLE_COLORS.default,
  origin = { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 3 },
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  const generateParticles = useCallback(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        x: origin.x + (Math.random() - 0.5) * 20,
        y: origin.y + (Math.random() - 0.5) * 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 6,
        rotation: Math.random() * 360,
        delay: Math.random() * 100,
      });
    }
    setParticles(newParticles);

    // Clear particles after animation
    setTimeout(() => {
      setParticles([]);
      if (onComplete) {
        onComplete();
      }
    }, duration + 200);
  }, [count, origin, colors, duration, onComplete]);

  useEffect(() => {
    if (active) {
      generateParticles();
    }
  }, [active, generateParticles]);

  if (particles.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle) => (
        <ConfettiParticle
          key={particle.id}
          particle={particle}
          duration={duration}
          spread={spread}
        />
      ))}
    </View>
  );
};

/**
 * MicroConfetti
 * Smaller confetti burst for set completion
 */
export const MicroConfetti: React.FC<{
  active: boolean;
  origin?: { x: number; y: number };
  onComplete?: () => void;
}> = ({ active, origin, onComplete }) => (
  <Confetti
    active={active}
    count={CONFETTI.micro.count}
    spread={CONFETTI.micro.spread}
    duration={CONFETTI.micro.duration}
    origin={origin}
    onComplete={onComplete}
  />
);

/**
 * CelebrationConfetti
 * Large confetti burst for workout completion
 */
export const CelebrationConfetti: React.FC<{
  active: boolean;
  onComplete?: () => void;
}> = ({ active, onComplete }) => (
  <Confetti
    active={active}
    count={CONFETTI.celebration.count}
    spread={CONFETTI.celebration.spread}
    duration={CONFETTI.celebration.duration}
    origin={{ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 4 }}
    onComplete={onComplete}
  />
);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: Z_INDEX.confetti,
  },
  particle: {
    position: "absolute",
  },
});

export default Confetti;
