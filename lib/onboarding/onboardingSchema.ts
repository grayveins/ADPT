export type StepType =
  | "headline"
  | "single_select"
  | "multi_select"
  | "slider"
  | "yes_no"
  | "connect"
  | "review"
  | "auth";

export type OnboardingOption = {
  label: string;
  value: string;
  icon?: string;
};

export type OnboardingStep = {
  id: string;
  type: StepType;
  title: string;
  subtitle?: string;
  key?: string;
  options?: OnboardingOption[];
  slider?: {
    min: number;
    max: number;
    step: number;
    unit?: string;
    defaultValue: number;
    marks?: { value: number; label: string }[];
    helperText?: (value: number) => string;
  };
  next?: (answers: Record<string, unknown>) => string | null;
};

export const onboardingSteps: OnboardingStep[] = [
  {
    id: "goal_headline",
    type: "headline",
    title: "Lets build your plan.",
    subtitle: "This takes about a minute. Answer honestly so it fits.",
  },
  {
    id: "primary_goal",
    type: "single_select",
    key: "primary_goal",
    title: "What are we optimizing for?",
    subtitle: "Pick the number one outcome.",
    options: [
      { label: "Lose fat (keep strength)", value: "fat_loss" },
      { label: "Build muscle (lean bulk)", value: "muscle_gain" },
      { label: "Recomp (leaner and stronger)", value: "recomp" },
      { label: "Performance or sport", value: "performance" },
    ],
  },
  {
    id: "training_experience",
    type: "single_select",
    key: "training_experience",
    title: "How experienced are you with lifting?",
    options: [
      { label: "New or inconsistent", value: "beginner" },
      { label: "Some experience", value: "intermediate" },
      { label: "Very consistent", value: "advanced" },
    ],
  },
  {
    id: "constraints",
    type: "multi_select",
    key: "constraints",
    title: "What usually blocks progress?",
    subtitle: "Choose all that apply.",
    options: [
      { label: "Busy schedule", value: "busy" },
      { label: "Low energy or sleep", value: "sleep" },
      { label: "Inconsistent meals", value: "meals" },
      { label: "Stress or cravings", value: "stress" },
      { label: "No plan in the gym", value: "program" },
    ],
  },
  {
    id: "rate",
    type: "slider",
    key: "weekly_rate",
    title: "How aggressive should the pace be?",
    subtitle: "You can change this anytime.",
    slider: {
      min: 0.25,
      max: 1.5,
      step: 0.25,
      unit: "lb/week",
      defaultValue: 1.0,
      marks: [
        { value: 0.5, label: "Easy" },
        { value: 1.0, label: "Balanced" },
        { value: 1.5, label: "Aggressive" },
      ],
      helperText: (value) => {
        if (value <= 0.5) return "More flexible and easier to stick to.";
        if (value <= 1.0) return "Best mix of results and sanity.";
        return "Fast results, but tighter execution needed.";
      },
    },
  },
  {
    id: "eat_back",
    type: "yes_no",
    key: "eat_back",
    title: "Add calories burned back into your goal?",
    subtitle: "If you do lots of cardio, this can help recovery.",
  },
  {
    id: "rollover",
    type: "yes_no",
    key: "rollover",
    title: "Roll over unused calories to the next day?",
    subtitle: "For example, up to 200 calories.",
  },
  {
    id: "connect_health",
    type: "connect",
    key: "apple_health",
    title: "Connect Apple Health",
    subtitle: "Sync steps, workouts, and sleep so recommendations adapt.",
    next: () => "review",
  },
  {
    id: "review",
    type: "review",
    title: "Your starter plan is ready.",
    subtitle: "You can edit training and macros anytime.",
  },
  {
    id: "auth",
    type: "auth",
    title: "Save your progress",
    subtitle: "Sign in so we can keep your plan and check-ins synced.",
  },
];

export const firstStepId = onboardingSteps[0].id;

export const getStepById = (id: string) => {
  const step = onboardingSteps.find((item) => item.id === id);
  if (!step) throw new Error(`Unknown step id: ${id}`);
  return step;
};
