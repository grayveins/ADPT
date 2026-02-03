/**
 * Onboarding
 * Industry-standard onboarding flow inspired by Duolingo, Noom, Calm, Fitbod
 * 
 * Flow Structure:
 * 1. WELCOME & VALUE - Build excitement, show social proof
 * 2. ABOUT YOU - Demographics, body stats, activity level
 * 3. GOALS & EXPERIENCE - What they want to achieve
 * 4. TRAINING - Preferences, schedule, equipment
 * 5. ACTIVATE & PRIME - Build plan, social proof, connect services, paywall
 * 
 * Updated flow (17 screens):
 * - Added: ActivityLevelScreen (extracted from BodyStatsScreen)
 * - Removed: ScheduleScreen (merged into WorkoutsPerWeekScreen with day picker)
 */

import { useCallback, useState, useMemo } from "react";
import { StyleSheet, View, Pressable, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { 
  SlideInRight, 
  SlideOutLeft,
  Layout,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/src/context/ThemeContext";
import { theme } from "@/src/theme";
import { hapticPress } from "@/src/animations/feedback/haptics";

// Phase 1: Welcome & Value
import WelcomeScreen from "./WelcomeScreen";
import ValuePropScreen from "./ValuePropScreen";

// Phase 2: About You
import BodyStatsScreen from "./BodyStatsScreen";
import ActivityLevelScreen from "./ActivityLevelScreen";
import ExperienceScreen from "./ExperienceScreen";
import GoalsScreen from "./GoalsScreen";

// Phase 3: Training Preferences
import WorkoutsPerWeekScreen from "./WorkoutsPerWeekScreen";
import TrainingPreferenceScreen from "./TrainingPreferenceScreen";
import BestLiftsScreen from "./BestLiftsScreen";
import GymTypeScreen from "./GymTypeScreen";
import EquipmentScreen from "./EquipmentScreen";

// Phase 4: Social & Attribution
import SocialProofScreen from "./SocialProofScreen";
import AttributionScreen from "./AttributionScreen";

// Phase 5: Activate & Prime
import NotificationsScreen from "./NotificationsScreen";
import BuildingPlanScreen from "./BuildingPlanScreen";
import SummaryScreen from "./SummaryScreen";
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
// Updated flow - 17 screens
const SCREENS: ScreenDef[] = [
  // Phase 1: Welcome & Value (no progress bar) - 2 screens
  { id: "welcome", section: null, component: WelcomeScreen, hideBack: true },
  { id: "value-prop", section: null, component: ValuePropScreen },
  
  // Phase 2: About You - 4 screens
  { id: "body-stats", section: "you", component: BodyStatsScreen },
  { id: "activity-level", section: "you", component: ActivityLevelScreen },
  { id: "experience", section: "you", component: ExperienceScreen },
  { id: "goals", section: "you", component: GoalsScreen },
  
  // Phase 3: Training Preferences - 5 screens
  { id: "workouts", section: "training", component: WorkoutsPerWeekScreen },
  { id: "training-split", section: "training", component: TrainingPreferenceScreen },
  { id: "best-lifts", section: "training", component: BestLiftsScreen },
  { id: "gym-type", section: "training", component: GymTypeScreen },
  { id: "equipment", section: "training", component: EquipmentScreen },
  
  // Phase 4: Social & Finish - 6 screens
  { id: "social-proof", section: null, component: SocialProofScreen, hideBack: true },
  { id: "attribution", section: "finish", component: AttributionScreen },
  { id: "notifications", section: "finish", component: NotificationsScreen },
  { id: "building-plan", section: null, component: BuildingPlanScreen, hideBack: true },
  { id: "summary", section: null, component: SummaryScreen, hideBack: true },
  { id: "paywall", section: "finish", component: PaywallScreen },
  { id: "get-started", section: null, component: GetStartedScreen, hideBack: true },
];

const SECTIONS = ["you", "training", "finish"] as const;
const SECTION_LABELS = {
  you: "About You",
  training: "Training",
  finish: "Finish",
};

// Progress bar component
function ProgressBar({ currentIndex, colors }: { currentIndex: number; colors: ReturnType<typeof useTheme>["colors"] }) {
  const progressStyles = useMemo(() => createProgressStyles(colors), [colors]);
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
          layout={Layout.duration(250)}
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        {/* Header with back button and progress */}
        <View style={styles.header}>
          {showBackButton ? (
            <Pressable 
              onPress={goBack} 
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </Pressable>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
          
          {showProgress && (
            <View style={styles.progressWrapper}>
              <ProgressBar currentIndex={currentIndex} colors={colors} />
            </View>
          )}
          
          <View style={styles.backPlaceholder} />
        </View>

        {/* Screen content with animation - clean linear transitions */}
        <Animated.View 
          key={currentScreen.id}
          entering={SlideInRight.duration(250)}
          exiting={SlideOutLeft.duration(200)}
          style={styles.screenContainer}
        >
          <ScreenComponent {...screenProps} />
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const createProgressStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    container: {
      width: "100%",
      gap: 8,
    },
    track: {
      height: 3,
      backgroundColor: colors.border,
      borderRadius: 2,
      overflow: "hidden",
    },
    fill: {
      height: "100%",
      backgroundColor: colors.primary,
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
      backgroundColor: colors.border,
    },
    dotActive: {
      backgroundColor: colors.primary,
    },
    dotCurrent: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    label: {
      color: colors.inputPlaceholder,
      fontSize: 10,
      fontFamily: theme.fonts.bodyMedium,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    labelActive: {
      color: colors.textMuted,
    },
  });

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
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
      backgroundColor: colors.card,
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
