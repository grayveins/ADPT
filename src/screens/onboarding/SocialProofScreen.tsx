/**
 * SocialProofScreen
 * Testimonials and success stories
 * Builds trust before the paywall
 */

import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, Pressable, ScrollView } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  FadeInDown,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { darkColors, theme } from "@/src/theme";
import { hapticPress } from "@/src/animations/feedback/haptics";

type SocialProofScreenProps = {
  onNext: () => void;
};

const testimonials = [
  {
    name: "Sarah M.",
    role: "Lost 30 lbs",
    quote: "ADPT understood my busy schedule and created workouts I could actually stick to. Best fitness app I&apos;ve ever used.",
    rating: 5,
    avatar: "SM",
    color: "#FF6B6B",
  },
  {
    name: "James K.",
    role: "Gained 15 lbs muscle",
    quote: "The AI coach answered all my questions and the workouts adapted perfectly as I got stronger. Game changer!",
    rating: 5,
    avatar: "JK",
    color: "#4ECDC4",
  },
  {
    name: "Maria L.",
    role: "First pull-up ever",
    quote: "Never thought I could do a pull-up. ADPT built up my strength progressively and I finally did it at 42!",
    rating: 5,
    avatar: "ML",
    color: "#45B7D1",
  },
];

const stats = [
  { value: "50K+", label: "Active Members" },
  { value: "4.9", label: "App Store Rating", icon: "star" },
  { value: "2M+", label: "Workouts Completed" },
];

// Testimonial card component
function TestimonialCard({ 
  testimonial, 
  isActive,
  index,
}: { 
  testimonial: typeof testimonials[0]; 
  isActive: boolean;
  index: number;
}) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withSpring(isActive ? 1 : 0.9, { damping: 15 });
    opacity.value = withTiming(isActive ? 1 : 0.5, { duration: 300 });
  }, [isActive]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.testimonialCard, cardStyle]}>
      {/* Quote */}
      <Text allowFontScaling={false} style={styles.quote}>
        &quot;{testimonial.quote.replace(/&apos;/g, "'")}&quot;
      </Text>

      {/* Rating */}
      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= testimonial.rating ? "star" : "star-outline"}
            size={18}
            color="#FFD700"
          />
        ))}
      </View>

      {/* Author */}
      <View style={styles.author}>
        <View style={[styles.avatar, { backgroundColor: testimonial.color }]}>
          <Text allowFontScaling={false} style={styles.avatarText}>
            {testimonial.avatar}
          </Text>
        </View>
        <View>
          <Text allowFontScaling={false} style={styles.authorName}>
            {testimonial.name}
          </Text>
          <Text allowFontScaling={false} style={styles.authorRole}>
            {testimonial.role}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function SocialProofScreen({ onNext }: SocialProofScreenProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(20);
  const ctaOpacity = useSharedValue(0);
  const ctaScale = useSharedValue(0.9);

  useEffect(() => {
    headerOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));
    headerY.value = withDelay(100, withSpring(0, { damping: 20 }));
    
    ctaOpacity.value = withDelay(800, withTiming(1, { duration: 400 }));
    ctaScale.value = withDelay(800, withSpring(1, { damping: 15 }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ scale: ctaScale.value }],
  }));

  const handleNext = () => {
    hapticPress();
    onNext();
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <Text allowFontScaling={false} style={styles.title}>
          Real people,{"\n"}real results
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          Join thousands who have transformed their fitness with ADPT
        </Text>
      </Animated.View>

      {/* Testimonial carousel */}
      <Animated.View 
        entering={FadeInDown.delay(300).duration(400)}
        style={styles.carouselContainer}
      >
        {testimonials.map((testimonial, index) => (
          <TestimonialCard
            key={testimonial.name}
            testimonial={testimonial}
            isActive={index === activeIndex}
            index={index}
          />
        ))}
        
        {/* Dots indicator */}
        <View style={styles.dotsContainer}>
          {testimonials.map((_, index) => (
            <Pressable
              key={index}
              onPress={() => setActiveIndex(index)}
              style={[
                styles.dot,
                index === activeIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>
      </Animated.View>

      {/* Stats */}
      <Animated.View 
        entering={FadeInDown.delay(500).duration(400)}
        style={styles.statsContainer}
      >
        {stats.map((stat, index) => (
          <View key={stat.label} style={styles.stat}>
            <View style={styles.statValueRow}>
              <Text allowFontScaling={false} style={styles.statValue}>{stat.value}</Text>
              {stat.icon && (
                <Ionicons name={stat.icon as any} size={16} color="#FFD700" />
              )}
            </View>
            <Text allowFontScaling={false} style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Featured in (optional social proof) */}
      <Animated.View 
        entering={FadeInDown.delay(600).duration(400)}
        style={styles.featuredContainer}
      >
        <Text allowFontScaling={false} style={styles.featuredTitle}>
          Featured in
        </Text>
        <View style={styles.featuredLogos}>
          <Text allowFontScaling={false} style={styles.featuredLogo}>Men&apos;s Health</Text>
          <View style={styles.featuredDot} />
          <Text allowFontScaling={false} style={styles.featuredLogo}>Shape</Text>
          <View style={styles.featuredDot} />
          <Text allowFontScaling={false} style={styles.featuredLogo}>Forbes</Text>
        </View>
      </Animated.View>

      {/* CTA */}
      <Animated.View style={[styles.ctaContainer, ctaStyle]}>
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
              See My Plan
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#000" />
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingVertical: 16,
    paddingBottom: 24,
  },
  header: {
    gap: 8,
    marginBottom: 24,
  },
  title: {
    color: darkColors.text,
    fontSize: 32,
    fontFamily: theme.fonts.heading,
    lineHeight: 40,
  },
  subtitle: {
    color: darkColors.muted,
    fontSize: 16,
    fontFamily: theme.fonts.body,
    lineHeight: 24,
  },
  carouselContainer: {
    marginBottom: 24,
  },
  testimonialCard: {
    backgroundColor: darkColors.card,
    borderRadius: 20,
    padding: 24,
    gap: 16,
    marginBottom: 16,
  },
  quote: {
    color: darkColors.text,
    fontSize: 16,
    fontFamily: theme.fonts.body,
    lineHeight: 24,
    fontStyle: "italic",
  },
  ratingRow: {
    flexDirection: "row",
    gap: 4,
  },
  author: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: theme.fonts.bodySemiBold,
  },
  authorName: {
    color: darkColors.text,
    fontSize: 15,
    fontFamily: theme.fonts.bodySemiBold,
  },
  authorRole: {
    color: darkColors.primary,
    fontSize: 13,
    fontFamily: theme.fonts.body,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: darkColors.border,
  },
  dotActive: {
    backgroundColor: darkColors.primary,
    width: 24,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: darkColors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  stat: {
    alignItems: "center",
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    color: darkColors.text,
    fontSize: 22,
    fontFamily: theme.fonts.bodySemiBold,
  },
  statLabel: {
    color: darkColors.muted,
    fontSize: 12,
    fontFamily: theme.fonts.body,
    marginTop: 4,
  },
  featuredContainer: {
    alignItems: "center",
    gap: 8,
  },
  featuredTitle: {
    color: darkColors.muted2,
    fontSize: 12,
    fontFamily: theme.fonts.body,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  featuredLogos: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featuredLogo: {
    color: darkColors.muted,
    fontSize: 14,
    fontFamily: theme.fonts.bodyMedium,
  },
  featuredDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: darkColors.muted2,
  },
  ctaContainer: {
    marginTop: "auto",
    paddingTop: 24,
  },
  ctaButton: {
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
    fontSize: 17,
    fontFamily: theme.fonts.bodySemiBold,
  },
});
