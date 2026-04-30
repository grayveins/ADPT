/**
 * PaywallScreen — Hard Paywall (clean version)
 *
 * Minimal, premium, high-converting.
 * Aha moment → social proof → plans → CTA.
 */

import React, { useState, useMemo } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable, ActivityIndicator } from "react-native";
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { theme } from "@/src/theme";
import { useOnboarding } from "@/src/context/OnboardingContext";
import { useSubscription } from "@/src/hooks/useSubscription";
import { hapticPress, hapticSuccess } from "@/src/animations/feedback/haptics";
import StrengthScoreRing from "@/src/components/StrengthScoreRing";
import { getRankByLevel } from "@/lib/ranks";
import { calculateStrengthScore } from "@/src/utils/strengthScore";
import SecondChanceOffer from "@/src/components/SecondChanceOffer";

type PaywallScreenProps = {
  onNext: () => void;
  onFree: () => void;
};

type PlanType = "annual" | "monthly" | "free";

const goalCopy: Record<string, string> = {
  build_muscle: "build visible muscle",
  lose_fat: "drop body fat",
  get_stronger: "hit new PRs",
  general_fitness: "level up your fitness",
};

export default function PaywallScreen({ onNext, onFree }: PaywallScreenProps) {
  const { colors } = useTheme();
  const { form, updateForm } = useOnboarding();
  const {
    isLoading: subscriptionLoading,
    monthlyPackage,
    annualPackage,
    monthlyPrice,
    annualPrice,
    annualMonthlyEquivalent,
    purchasePlan,
    restorePurchases,
    isPro,
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<PlanType>("annual");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showSecondChance, setShowSecondChance] = useState(false);
  const s = useMemo(() => createStyles(colors), [colors]);

  const strengthScore = useMemo(() => calculateStrengthScore(form), [form]);
  // Starting rank — Bronze (level 1)
  const rank = getRankByLevel(1);
  // After 12 weeks of consistent training (~36 workouts), user would be ~level 8-10
  const projectedLevel = 10; // Gold rank after 12 weeks
  const projectedRank = getRankByLevel(projectedLevel);
  const projectedScore = useMemo(() => {
    // Realistic 12-week strength gain: 15-30% improvement
    const gainPercent = strengthScore < 200 ? 0.30 : strengthScore < 400 ? 0.20 : 0.15;
    return Math.round(strengthScore * (1 + gainPercent));
  }, [strengthScore]);

  const savingsAmount = useMemo(() => {
    if (!monthlyPackage?.product.price || !annualPackage?.product.price) return "$76";
    const diff = monthlyPackage.product.price * 12 - annualPackage.product.price;
    return `$${Math.round(diff)}`;
  }, [monthlyPackage, annualPackage]);

  const handleSelect = (plan: PlanType) => { hapticPress(); setSelectedPlan(plan); };

  const handleContinue = async () => {
    hapticPress();
    if (selectedPlan === "free") {
      // Show second-chance discount offer before letting them go free
      setShowSecondChance(true);
      return;
    }
    setIsPurchasing(true);
    try {
      const ok = await purchasePlan(selectedPlan as "annual" | "monthly");
      if (ok) { hapticSuccess(); updateForm({ planChoice: "pro" }); onNext(); }
    } finally { setIsPurchasing(false); }
  };

  const handleRestore = async () => {
    hapticPress(); setIsRestoring(true);
    try {
      const ok = await restorePurchases();
      if (ok) { hapticSuccess(); updateForm({ planChoice: "pro" }); onNext(); }
    } finally { setIsRestoring(false); }
  };

  // Animated projection track (must be before any early return)
  const projTrackWidth = useSharedValue(0);
  React.useEffect(() => {
    projTrackWidth.value = withDelay(600, withTiming(55, { duration: 1200, easing: Easing.out(Easing.cubic) }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const projTrackAnimStyle = useAnimatedStyle(() => ({
    width: `${projTrackWidth.value}%`,
  }));

  if (isPro) { updateForm({ planChoice: "pro" }); onNext(); return null; }

  const disabled = isPurchasing || isRestoring || subscriptionLoading;
  const projection = goalCopy[form.goal ?? ""] ?? "level up your fitness";
  const userName = form.firstName;

  return (
    <ScrollView contentContainerStyle={s.root} showsVerticalScrollIndicator={false}>

      {/* ── Personalized headline ─────────────────────────────────────── */}
      {userName && (
        <Animated.View entering={FadeIn.duration(300)} style={s.personalHeader}>
          <Text allowFontScaling={false} style={s.personalName}>
            {userName}, here&apos;s your path
          </Text>
        </Animated.View>
      )}

      {/* ── AHA: Score + Projection ──────────────────────────────────── */}
      <Animated.View entering={FadeInDown.duration(400)} style={s.aha}>
        <StrengthScoreRing score={strengthScore} size={116} animateDelay={200} hideNextRank />

        <View style={s.proj}>
          <View style={s.projEndpoint}>
            <Text allowFontScaling={false} style={[s.projLabel, { color: colors.textMuted }]}>Now</Text>
            <Text allowFontScaling={false} style={[s.projValue, { color: rank.color }]}>{strengthScore}</Text>
            <Text allowFontScaling={false} style={[s.projRank, { color: rank.color }]}>{rank.name}</Text>
          </View>
          <View style={s.projTrack}>
            <View style={s.projTrackBg} />
            <Animated.View style={[s.projTrackFill, projTrackAnimStyle]} />
            <Ionicons name="caret-forward" size={10} color={colors.primary} style={s.projCaret} />
          </View>
          <View style={s.projEndpoint}>
            <Text allowFontScaling={false} style={[s.projLabel, { color: colors.textMuted }]}>12 weeks</Text>
            <Text allowFontScaling={false} style={[s.projValue, { color: projectedRank.color }]}>{projectedScore}</Text>
            <Text allowFontScaling={false} style={[s.projRank, { color: projectedRank.color }]}>{projectedRank.name}</Text>
          </View>
        </View>

        <Text allowFontScaling={false} style={s.ahaCopy}>
          12 weeks is enough to {projection}
        </Text>
      </Animated.View>

      {/* ── Social proof ─────────────────────────────────────────────── */}
      <Animated.View entering={FadeIn.delay(150).duration(400)} style={s.social}>
        <SocialStat top="50K+" bottom="users" colors={colors} />
        <View style={s.socialDot} />
        <SocialStat
          top={
            <View style={s.stars}>
              {[1,2,3,4,5].map(i => <Ionicons key={i} name="star" size={11} color={colors.gold} />)}
            </View>
          }
          bottom="4.8 on App Store"
          colors={colors}
        />
        <View style={s.socialDot} />
        <SocialStat top="1M+" bottom="workouts logged" colors={colors} />
      </Animated.View>

      {/* ── Testimonial ──────────────────────────────────────────────── */}
      <Animated.View entering={FadeIn.delay(180).duration(400)} style={s.testimonial}>
        <Text allowFontScaling={false} style={s.testimonialQuote}>
          &ldquo;I stopped guessing and started seeing results. Hit a 225 bench in 8 weeks.&rdquo;
        </Text>
        <Text allowFontScaling={false} style={s.testimonialAuthor}>
          — Mike, 28
        </Text>
      </Animated.View>

      {/* ── Feature highlights (outcome-based JTBD copy) ─────────────── */}
      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={s.features}>
        <FeaturePill icon="infinite-outline" label="Unlimited personalized workouts" colors={colors} />
        <FeaturePill icon="trending-up-outline" label="Full history, PRs, and progress charts" colors={colors} />
        <FeaturePill icon="trophy-outline" label="Strength Score tracking and rank-ups" colors={colors} />
        <FeaturePill icon="swap-horizontal-outline" label="Programs that adjust to your performance" colors={colors} />
      </Animated.View>

      {/* ── Plans ────────────────────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(300).duration(400)} style={s.plans}>
        {/* Annual */}
        <Pressable
          onPress={() => handleSelect("annual")}
          disabled={disabled}
          style={[s.plan, selectedPlan === "annual" && s.planActive]}
        >
          <View style={s.planBadge}>
            <Text allowFontScaling={false} style={s.planBadgeText}>BEST VALUE</Text>
          </View>
          <View style={s.planRow}>
            <View style={s.planInfo}>
              <Text allowFontScaling={false} style={s.planName}>Annual</Text>
              <Text allowFontScaling={false} style={s.planSub}>{annualPrice}/yr &middot; 7-day free trial</Text>
            </View>
            <View style={s.planPricing}>
              <Text allowFontScaling={false} style={s.planPrice}>{annualMonthlyEquivalent}</Text>
              <Text allowFontScaling={false} style={s.planPer}>/mo</Text>
            </View>
          </View>
          <View style={s.savingTag}>
            <Text allowFontScaling={false} style={s.savingText}>Save {savingsAmount}/yr</Text>
          </View>
          {selectedPlan === "annual" && <CheckDot color={colors.primary} bgColor={colors.textOnPrimary} />}
        </Pressable>

        {/* Monthly */}
        <Pressable
          onPress={() => handleSelect("monthly")}
          disabled={disabled}
          style={[s.plan, s.planCompact, selectedPlan === "monthly" && s.planActive]}
        >
          <View style={s.planRow}>
            <View style={s.planInfo}>
              <Text allowFontScaling={false} style={s.planName}>Monthly</Text>
              <Text allowFontScaling={false} style={s.planSub}>Cancel anytime</Text>
            </View>
            <View style={s.planPricing}>
              <Text allowFontScaling={false} style={s.planPrice}>{monthlyPrice}</Text>
              <Text allowFontScaling={false} style={s.planPer}>/mo</Text>
            </View>
          </View>
          {selectedPlan === "monthly" && <CheckDot color={colors.primary} bgColor={colors.textOnPrimary} />}
        </Pressable>

        {/* Free */}
        <Pressable
          onPress={() => handleSelect("free")}
          disabled={disabled}
          style={[s.planFree, selectedPlan === "free" && s.planFreeActive]}
        >
          <View style={s.planRow}>
            <View style={s.planInfo}>
              <Text allowFontScaling={false} style={s.planFreeName}>Free</Text>
              <Text allowFontScaling={false} style={s.planFreeSub}>3 workouts/wk &middot; 7 days history</Text>
            </View>
            <View style={s.planPricing}>
              <Text allowFontScaling={false} style={s.planFreePrice}>$0</Text>
            </View>
          </View>
          {selectedPlan === "free" && <CheckDot color={colors.textMuted} bgColor={colors.bg} />}
        </Pressable>
      </Animated.View>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(380).duration(400)} style={s.cta}>
        <Pressable
          onPress={handleContinue}
          disabled={disabled}
          style={[
            s.ctaBtn,
            selectedPlan === "free" ? s.ctaBtnFree : s.ctaBtnPro,
            disabled && { opacity: 0.7 },
          ]}
        >
          {isPurchasing ? (
            <ActivityIndicator color={selectedPlan === "free" ? colors.text : colors.textOnPrimary} />
          ) : (
            <Text allowFontScaling={false} style={[
              s.ctaLabel,
              { color: selectedPlan === "free" ? colors.text : colors.textOnPrimary },
            ]}>
              {selectedPlan === "free" ? "Continue with Free" : "Start Free Trial"}
            </Text>
          )}
        </Pressable>

        {selectedPlan !== "free" && (
          <>
            <Text allowFontScaling={false} style={s.trust}>
              No payment today &middot; Cancel anytime
            </Text>
            <View style={s.trialTimeline}>
              <View style={s.trialStep}>
                <View style={[s.trialDot, { backgroundColor: colors.primary }]} />
                <Text allowFontScaling={false} style={s.trialStepText}>Today: Full access, free</Text>
              </View>
              <View style={[s.trialLine, { backgroundColor: colors.border }]} />
              <View style={s.trialStep}>
                <View style={[s.trialDot, { backgroundColor: colors.intensity }]} />
                <Text allowFontScaling={false} style={s.trialStepText}>Day 5: Reminder notification</Text>
              </View>
              <View style={[s.trialLine, { backgroundColor: colors.border }]} />
              <View style={s.trialStep}>
                <View style={[s.trialDot, { backgroundColor: colors.textMuted }]} />
                <Text allowFontScaling={false} style={s.trialStepText}>Day 7: Billing starts (skip anytime)</Text>
              </View>
            </View>
          </>
        )}
      </Animated.View>

      {/* ── Restore ──────────────────────────────────────────────────── */}
      <Pressable onPress={handleRestore} disabled={disabled} style={s.restore}>
        {isRestoring
          ? <ActivityIndicator size="small" color={colors.textMuted} />
          : <Text allowFontScaling={false} style={s.restoreText}>Restore Purchases</Text>
        }
      </Pressable>

      {/* ── Second-chance discount (shown when user taps Free) ────── */}
      <SecondChanceOffer
        visible={showSecondChance}
        onClose={() => {
          setShowSecondChance(false);
          // User declined the offer — proceed with free
          updateForm({ planChoice: "free" });
          onFree();
        }}
        onClaim={async () => {
          setShowSecondChance(false);
          // Switch to annual and start purchase
          setSelectedPlan("annual");
          setIsPurchasing(true);
          try {
            const ok = await purchasePlan("annual");
            if (ok) { hapticSuccess(); updateForm({ planChoice: "pro" }); onNext(); }
          } finally { setIsPurchasing(false); }
        }}
        originalPrice={annualPrice + "/yr"}
        discountedPrice={annualMonthlyEquivalent + "/mo"}
      />
    </ScrollView>
  );
}

/* ── Tiny sub-components ─────────────────────────────────────────────── */

function SocialStat({ top, bottom, colors }: {
  top: React.ReactNode;
  bottom: string;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <View style={{ alignItems: "center", gap: 1 }}>
      {typeof top === "string"
        ? <Text allowFontScaling={false} style={{ color: colors.text, fontFamily: theme.fonts.bodySemiBold, fontSize: 15 }}>{top}</Text>
        : top}
      <Text allowFontScaling={false} style={{ color: colors.textMuted, fontFamily: theme.fonts.body, fontSize: 10 }}>{bottom}</Text>
    </View>
  );
}

function FeaturePill({ icon, label, colors }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <View style={{
      flexDirection: "row", alignItems: "center", gap: 8,
      backgroundColor: colors.primaryFaint, borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 9,
    }}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text allowFontScaling={false} style={{ color: colors.text, fontFamily: theme.fonts.bodyMedium, fontSize: 13 }}>{label}</Text>
    </View>
  );
}

function CheckDot({ color, bgColor }: { color: string; bgColor: string }) {
  return (
    <View style={{
      position: "absolute", top: 12, right: 12,
      width: 20, height: 20, borderRadius: 10,
      backgroundColor: color, alignItems: "center", justifyContent: "center",
    }}>
      <Ionicons name="checkmark" size={13} color={bgColor} />
    </View>
  );
}

/* ── Styles ───────────────────────────────────────────────────────────── */

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    root: { flexGrow: 1, paddingVertical: 4, gap: 22 },

    // Personal header
    personalHeader: { alignItems: "center", marginBottom: -8 },
    personalName: { color: colors.text, fontFamily: theme.fonts.heading, fontSize: 20, textAlign: "center" },

    // Aha
    aha: { alignItems: "center", gap: 14 },
    proj: { flexDirection: "row", alignItems: "center", width: "100%", paddingHorizontal: 8 },
    projEndpoint: { alignItems: "center", width: 60 },
    projLabel: { fontFamily: theme.fonts.body, fontSize: 10, marginBottom: 2 },
    projValue: { fontFamily: theme.fonts.heading, fontSize: 20, fontWeight: "700" },
    projRank: { fontFamily: theme.fonts.bodySemiBold, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.4 },
    projTrack: { flex: 1, height: 3, marginHorizontal: 8, position: "relative", justifyContent: "center" },
    projTrackBg: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.border, borderRadius: 2 },
    projTrackFill: { position: "absolute", left: 0, height: "100%", backgroundColor: colors.primary, borderRadius: 2 },
    projCaret: { position: "absolute", right: -3 },
    ahaCopy: { color: colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 13, textAlign: "center" },

    // Social
    social: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14 },
    socialDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.border },
    stars: { flexDirection: "row", gap: 1 },

    // Testimonial
    testimonial: {
      backgroundColor: colors.card, borderRadius: 12, padding: 14,
      borderLeftWidth: 3, borderLeftColor: colors.primary,
    },
    testimonialQuote: {
      color: colors.text, fontFamily: theme.fonts.body, fontSize: 13,
      fontStyle: "italic", lineHeight: 19,
    },
    testimonialAuthor: {
      color: colors.textMuted, fontFamily: theme.fonts.bodyMedium, fontSize: 12,
      marginTop: 6,
    },

    // Features
    features: { gap: 6 },

    // Plans
    plans: { gap: 8 },
    plan: {
      backgroundColor: colors.card, borderRadius: 14, padding: 14,
      borderWidth: 2, borderColor: "transparent", position: "relative", overflow: "visible",
    },
    planCompact: { paddingVertical: 12 },
    planActive: { borderColor: colors.primary, backgroundColor: colors.selected },
    planRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    planInfo: { flex: 1, gap: 2 },
    planName: { color: colors.text, fontFamily: theme.fonts.bodySemiBold, fontSize: 16 },
    planSub: { color: colors.textMuted, fontFamily: theme.fonts.body, fontSize: 12 },
    planPricing: { flexDirection: "row", alignItems: "baseline", gap: 1 },
    planPrice: { color: colors.text, fontFamily: theme.fonts.heading, fontSize: 22, fontWeight: "700" },
    planPer: { color: colors.textMuted, fontFamily: theme.fonts.body, fontSize: 12 },
    planBadge: {
      position: "absolute", top: -9, alignSelf: "center",
      backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 5, zIndex: 1,
    },
    planBadgeText: { color: colors.textOnPrimary, fontFamily: theme.fonts.bodySemiBold, fontSize: 9, letterSpacing: 0.5 },
    savingTag: {
      alignSelf: "flex-start", backgroundColor: colors.primaryMuted,
      paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5, marginTop: 6,
    },
    savingText: { color: colors.primary, fontFamily: theme.fonts.bodySemiBold, fontSize: 11 },

    // Free plan
    planFree: {
      borderRadius: 14, padding: 12,
      borderWidth: 1, borderColor: colors.border, position: "relative",
    },
    planFreeActive: { borderColor: colors.textMuted },
    planFreeName: { color: colors.textMuted, fontFamily: theme.fonts.bodyMedium, fontSize: 15 },
    planFreeSub: { color: colors.disabledText, fontFamily: theme.fonts.body, fontSize: 11 },
    planFreePrice: { color: colors.textMuted, fontFamily: theme.fonts.heading, fontSize: 18, fontWeight: "700" },

    // CTA
    cta: { gap: 8 },
    ctaBtn: { height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
    ctaBtnPro: { backgroundColor: colors.primary },
    ctaBtnFree: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
    ctaLabel: { fontFamily: theme.fonts.bodySemiBold, fontSize: 17 },
    trust: { color: colors.textMuted, fontFamily: theme.fonts.body, fontSize: 12, textAlign: "center" },
    trialTimeline: { gap: 0, marginTop: 6 },
    trialStep: { flexDirection: "row", alignItems: "center", gap: 8 },
    trialDot: { width: 6, height: 6, borderRadius: 3 },
    trialLine: { width: 1, height: 10, marginLeft: 2.5 },
    trialStepText: { color: colors.textMuted, fontFamily: theme.fonts.body, fontSize: 11 },

    // Restore
    restore: { alignItems: "center", paddingVertical: 4 },
    restoreText: { color: colors.primary, fontFamily: theme.fonts.bodyMedium, fontSize: 13 },
  });
