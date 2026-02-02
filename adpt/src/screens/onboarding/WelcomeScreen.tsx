/**
 * WelcomeScreen
 * Premium intro screen inspired by Fitbod/MacroFactor
 * Sophisticated animations and clean typography
 */

import React, { useEffect } from "react";
import { StyleSheet, Text, View, Pressable, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { darkColors, theme } from "@/src/theme";
import { hapticPress } from "@/src/animations/feedback/haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type WelcomeScreenProps = {
  onNext: () => void;
};

// Floating particle component
function FloatingParticle({ delay, size, x, y }: { delay: number; size: number; x: number; y: number }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(0.6, { duration: 1000 }));
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-20, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: darkColors.primary,
        },
        style,
      ]}
    />
  );
}

// Animated ring component
function PulsingRing({ delay }: { delay: number }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(1.5, { duration: 2000, easing: Easing.out(Easing.ease) }),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) }),
        -1,
        false
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.pulsingRing, style]} />
  );
}

export default function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  // Animation values
  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);
  const logoRotation = useSharedValue(-10);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(30);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(20);
  const featuresOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.9);

  useEffect(() => {
    // Orchestrated animation sequence
    // 1. Logo animates in with bounce
    logoOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    logoScale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 100 }));
    logoRotation.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 80 }));
    
    // 2. Title slides up and fades in
    titleOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
    titleTranslateY.value = withDelay(600, withSpring(0, { damping: 20 }));
    
    // 3. Subtitle follows
    subtitleOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));
    subtitleTranslateY.value = withDelay(800, withSpring(0, { damping: 20 }));
    
    // 4. Features fade in
    featuresOpacity.value = withDelay(1000, withTiming(1, { duration: 600 }));
    
    // 5. Button appears last
    buttonOpacity.value = withDelay(1200, withTiming(1, { duration: 400 }));
    buttonScale.value = withDelay(1200, withSpring(1, { damping: 15 }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotation.value}deg` },
    ],
    opacity: logoOpacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  const featuresStyle = useAnimatedStyle(() => ({
    opacity: featuresOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value }],
  }));

  const handleNext = () => {
    hapticPress();
    onNext();
  };

  return (
    <View style={styles.container}>
      {/* Floating particles background */}
      <View style={styles.particlesContainer}>
        <FloatingParticle delay={0} size={4} x={SCREEN_WIDTH * 0.1} y={100} />
        <FloatingParticle delay={500} size={6} x={SCREEN_WIDTH * 0.85} y={150} />
        <FloatingParticle delay={1000} size={3} x={SCREEN_WIDTH * 0.2} y={250} />
        <FloatingParticle delay={1500} size={5} x={SCREEN_WIDTH * 0.75} y={300} />
        <FloatingParticle delay={800} size={4} x={SCREEN_WIDTH * 0.5} y={80} />
      </View>

      {/* Logo with pulsing rings */}
      <View style={styles.logoSection}>
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          {/* Pulsing rings */}
          <PulsingRing delay={0} />
          <PulsingRing delay={700} />
          
          {/* Logo circle */}
          <LinearGradient
            colors={[darkColors.primary, darkColors.primaryDark]}
            style={styles.logoGradient}
          >
            <Ionicons name="fitness" size={48} color="#000" />
          </LinearGradient>
        </Animated.View>
        
        {/* Brand name */}
        <Animated.Text allowFontScaling={false} style={[styles.brandName, logoStyle]}>
          ADPT
        </Animated.Text>
      </View>

      {/* Title and subtitle */}
      <View style={styles.textSection}>
        <Animated.Text allowFontScaling={false} style={[styles.title, titleStyle]}>
          Train Smarter
        </Animated.Text>
        <Animated.Text allowFontScaling={false} style={[styles.subtitle, subtitleStyle]}>
          AI-powered workouts that adapt to your body,{"\n"}goals, and progress in real-time.
        </Animated.Text>
      </View>

      {/* Feature highlights */}
      <Animated.View style={[styles.features, featuresStyle]}>
        <FeatureItem 
          icon="sparkles" 
          text="Personalized for you" 
          delay={0}
        />
        <FeatureItem 
          icon="analytics" 
          text="Tracks your progress" 
          delay={100}
        />
        <FeatureItem 
          icon="sync" 
          text="Adapts every workout" 
          delay={200}
        />
      </Animated.View>

      {/* CTA Button */}
      <Animated.View style={[styles.ctaContainer, buttonStyle]}>
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.ctaButton,
            pressed && styles.ctaButtonPressed,
          ]}
        >
          <LinearGradient
            colors={[darkColors.primary, darkColors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text allowFontScaling={false} style={styles.ctaText}>
              Get Started
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#000" />
          </LinearGradient>
        </Pressable>
        
        <Text allowFontScaling={false} style={styles.ctaHint}>
          Setup takes about 2 minutes
        </Text>
      </Animated.View>
    </View>
  );
}

// Feature item component
function FeatureItem({ icon, text, delay }: { icon: string; text: string; delay: number }) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-20);

  useEffect(() => {
    opacity.value = withDelay(1000 + delay, withTiming(1, { duration: 400 }));
    translateX.value = withDelay(1000 + delay, withSpring(0, { damping: 20 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[styles.featureItem, style]}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon as any} size={18} color={darkColors.primary} />
      </View>
      <Text allowFontScaling={false} style={styles.featureText}>
        {text}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
  },
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  pulsingRing: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: darkColors.primary,
  },
  logoGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    color: darkColors.text,
    fontSize: 32,
    fontFamily: theme.fonts.bodySemiBold,
    letterSpacing: 8,
  },
  textSection: {
    alignItems: "center",
    marginBottom: 40,
    gap: 12,
  },
  title: {
    color: darkColors.text,
    fontSize: 40,
    fontFamily: theme.fonts.heading,
    textAlign: "center",
    lineHeight: 48,
  },
  subtitle: {
    color: darkColors.muted,
    fontSize: 16,
    fontFamily: theme.fonts.body,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  features: {
    gap: 16,
    marginBottom: 48,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: darkColors.selectedBg,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    color: darkColors.text,
    fontSize: 15,
    fontFamily: theme.fonts.bodyMedium,
  },
  ctaContainer: {
    width: "100%",
    alignItems: "center",
    gap: 16,
  },
  ctaButton: {
    width: "100%",
    borderRadius: 28,
    overflow: "hidden",
  },
  ctaButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  ctaText: {
    color: "#000",
    fontSize: 18,
    fontFamily: theme.fonts.bodySemiBold,
  },
  ctaHint: {
    color: darkColors.muted2,
    fontSize: 13,
    fontFamily: theme.fonts.body,
  },
});
