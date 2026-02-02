/**
 * Onboarding
 * Industry-standard onboarding flow inspired by Duolingo, Noom, Calm, Fitbod
 * 
 * Flow Structure:
 * 1. WELCOME & VALUE - Build excitement, show social proof
 * 2. QUALIFY - Goals, motivation, struggles, commitment
 * 3. PERSONALIZE - About you (demographics, body stats)
 * 4. CUSTOMIZE - Training preferences
 * 5. ACTIVATE & PRIME - Build plan, social proof, connect services, paywall
 */

import { useCallback, useState } from "react";
import { StyleSheet, View, Pressable, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { 
  FadeIn, 
  FadeOut, 
  SlideInRight, 
  SlideOutLeft,
  Layout,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import { darkColors, theme } from "@/src/theme";
import { hapticPress } from "@/src/animations/feedback/haptics";

// Phase 1: Welcome & Value
import WelcomeScreen from "./WelcomeScreen";
import ValuePropScreen from "./ValuePropScreen";
import HowItWorksScreen from "./HowItWorksScreen";

// Phase 2: Qualify (Goals & Motivation)
import MainGoalScreen from "./MainGoalScreen";
import MotivationScreen from "./MotivationScreen";
import StruggleScreen from "./StruggleScreen";
import CommitmentScreen from "./CommitmentScreen";

// Phase 3: Personalize (About You)
import SexScreen from "./SexScreen";
import AgeRangeScreen from "./AgeRangeScreen";
import BodyStatsScreen from "./BodyStatsScreen";
import ExperienceScreen from "./ExperienceScreen";

// Phase 4: Customize (Training)
import EquipmentScreen from "./EquipmentScreen";
import ActivityLevelScreen from "./ActivityLevelScreen";
import WorkoutsPerWeekScreen from "./WorkoutsPerWeekScreen";
import WorkoutDurationScreen from "./WorkoutDurationScreen";
import LimitationsScreen from "./LimitationsScreen";

// Phase 5: Activate & Prime
import SocialProofScreen from "./SocialProofScreen";
import BuildingPlanScreen from "./BuildingPlanScreen";
import PlanReadyScreen from "./PlanReadyScreen";
import HealthConnectScreen from "./HealthConnectScreen";
import NotificationsScreen from "./NotificationsScreen";
import PaywallScreen from "./PaywallScreen";
import GetStartedScreen from "./GetStartedScreen";

// Screen definition type
type ScreenDef = {
  id: string;
  section: string | null;
  component: React.ComponentType<any>;
  hideBack?: boolean;
};

// Screen definitions with sections for progress tracking
const SCREENS: ScreenDef[] = [
  // Phase 1: Welcome & Value (no progress bar)
  { id: "welcome", section: null, component: WelcomeScreen, hideBack: true },
  { id: "value-prop", section: null, component: ValuePropScreen, hideBack: false },
  { id: "how-it-works", section: null, component: HowItWorksScreen, hideBack: false },
  
  // Phase 2: Qualify - Goals & Motivation
  { id: "main-goal", section: "goals", component: MainGoalScreen },
  { id: "motivation", section: "goals", component: MotivationScreen },
  { id: "struggle", section: "goals", component: StruggleScreen },
  { id: "commitment", section: "goals", component: CommitmentScreen },
  
  // Phase 3: Personalize - About You
  { id: "sex", section: "you", component: SexScreen },
  { id: "age-range", section: "you", component: AgeRangeScreen },
  { id: "body-stats", section: "you", component: BodyStatsScreen },
  { id: "experience", section: "you", component: ExperienceScreen },
  
  // Phase 4: Customize - Training Preferences
  { id: "equipment", section: "training", component: EquipmentScreen },
  { id: "activity-level", section: "training", component: ActivityLevelScreen },
  { id: "workouts", section: "training", component: WorkoutsPerWeekScreen },
  { id: "duration", section: "training", component: WorkoutDurationScreen },
  { id: "limitations", section: "training", component: LimitationsScreen },
  
  // Phase 5: Activate & Prime (no progress bar for some)
  { id: "social-proof", section: null, component: SocialProofScreen, hideBack: true },
  { id: "building-plan", section: null, component: BuildingPlanScreen, hideBack: true },
  { id: "plan-ready", section: "finish", component: PlanReadyScreen, hideBack: true },
  { id: "health-connect", section: "finish", component: HealthConnectScreen },
  { id: "notifications", section: "finish", component: NotificationsScreen },
  { id: "paywall", section: "finish", component: PaywallScreen },
  { id: "get-started", section: null, component: GetStartedScreen, hideBack: true },
];

const SECTIONS = ["goals", "you", "training", "finish"] as const;
const SECTION_LABELS = {
  goals: "Goals",
  you: "About You",
  training: "Training",
  finish: "Finish",
};

// Progress bar component
function ProgressBar({ currentIndex }: { currentIndex: number }) {
  const currentScreen = SCREENS[currentIndex];
  if (!currentScreen?.section) return null;

  const sectionIndex = SECTIONS.indexOf(currentScreen.section as any);
  if (sectionIndex === -1) return null;

  const screensInSection = SCREENS.filter(s => s.section === currentScreen.section);
  const currentScreenInSection = screensInSection.findIndex(s => s.id === currentScreen.id);
  
  // Calculate overall progress (0-1)
  const sectionProgress = sectionIndex / SECTIONS.length;
  const withinSectionProgress = (currentScreenInSection + 1) / screensInSection.length / SECTIONS.length;
  const totalProgress = sectionProgress + withinSectionProgress;

  return (
    <View style={progressStyles.container}>
      <View style={progressStyles.track}>
        <Animated.View 
          style={[progressStyles.fill, { width: `${totalProgress * 100}%` }]}
          layout={Layout.springify()}
        />
      </View>
      <View style={progressStyles.labels}>
        {SECTIONS.map((section, idx) => {
          const isActive = idx <= sectionIndex;
          const isCurrent = idx === sectionIndex;
          return (
            <View key={section} style={progressStyles.labelContainer}>
              <View style={[
                progressStyles.dot,
                isActive && progressStyles.dotActive,
                isCurrent && progressStyles.dotCurrent,
              ]} />
              <Text allowFontScaling={false} style={[
                progressStyles.label,
                isActive && progressStyles.labelActive,
              ]}>
                {SECTION_LABELS[section]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goNext = useCallback(() => {
    hapticPress();
    if (currentIndex < SCREENS.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex]);

  const goBack = useCallback(() => {
    hapticPress();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const currentScreen = SCREENS[currentIndex];
  const ScreenComponent = currentScreen.component;
  
  // Determine what to show in header
  const showProgress = currentScreen.section !== null;
  const showBackButton = currentIndex > 0 && !currentScreen.hideBack;

  // Special props for certain screens
  const screenProps: any = { onNext: goNext };
  if (currentScreen.id === "paywall") {
    screenProps.onFree = goNext;
  }

  return (
    <LinearGradient
      colors={[darkColors.bgTop, darkColors.bg]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safe} edges={["top"]}>
        {/* Header with back button and progress */}
        <View style={styles.header}>
          {showBackButton ? (
            <Pressable 
              onPress={goBack} 
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={24} color={darkColors.text} />
            </Pressable>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
          
          {showProgress && (
            <View style={styles.progressWrapper}>
              <ProgressBar currentIndex={currentIndex} />
            </View>
          )}
          
          <View style={styles.backPlaceholder} />
        </View>

        {/* Screen content with animation */}
        <Animated.View 
          key={currentScreen.id}
          entering={SlideInRight.duration(300).springify()}
          exiting={SlideOutLeft.duration(200)}
          style={styles.screenContainer}
        >
          <ScreenComponent {...screenProps} />
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const progressStyles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 8,
  },
  track: {
    height: 3,
    backgroundColor: darkColors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: darkColors.primary,
    borderRadius: 2,
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  labelContainer: {
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: darkColors.border,
  },
  dotActive: {
    backgroundColor: darkColors.primary,
  },
  dotCurrent: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    color: darkColors.muted2,
    fontSize: 10,
    fontFamily: theme.fonts.bodyMedium,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  labelActive: {
    color: darkColors.muted,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: darkColors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  backPlaceholder: {
    width: 40,
  },
  progressWrapper: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
});
