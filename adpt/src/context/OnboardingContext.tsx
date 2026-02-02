import React, { createContext, useContext, useState, ReactNode } from "react";

import type { UnitsPreference } from "@/lib/units";
import { defaultUnits } from "@/lib/units";

export type OnboardingForm = {
  // System
  units?: UnitsPreference;
  appleHealthConnected?: boolean;
  notificationsEnabled?: boolean;
  planChoice?: "free" | "pro";
  
  // Personal Info
  firstName?: string;
  sex?: "male" | "female" | "other";
  ageRange?: "18-25" | "26-35" | "36-45" | "46-55" | "55+";
  birthYear?: number;
  
  // Body Stats
  heightCm?: number;
  weightKg?: number;
  goalWeightKg?: number;
  
  // Goals & Motivation (CLOSER framework)
  goal?: string;
  goalTimeline?: "3_months" | "6_months" | "1_year" | "no_rush";
  goalWhy?: string; // Deeper motivation (confidence, health, energy, etc.)
  struggle?: string; // What's held them back (time, motivation, knowledge, etc.)
  commitmentLevel?: 1 | 2 | 3; // 1=trying, 2=committed, 3=all-in
  
  // Experience & Equipment
  experienceLevel?: "beginner" | "novice" | "intermediate" | "advanced";
  equipment?: "full_gym" | "home_gym" | "dumbbells" | "bodyweight";
  activityLevel?: "sedentary" | "light" | "moderate" | "very_active";
  
  // Training Preferences
  workoutsPerWeek?: number;
  workoutDuration?: 30 | 45 | 60 | 75;
  splitPreference?: string;
  trainingStyle?: string;
  
  // Limitations
  limitations?: string[];
  limitationsOtherText?: string;
  
  // Other
  planSummary?: string;
  attribution?: string; // Used for struggle selection in StruggleScreen
};

interface OnboardingContextType {
  form: OnboardingForm;
  updateForm: (data: Partial<OnboardingForm>) => void;
  resetForm: () => void;
}

const OnboardingContext = createContext<OnboardingContextType>({
  form: {},
  updateForm: () => {},
  resetForm: () => {},
});

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [form, setForm] = useState<OnboardingForm>({ units: defaultUnits });

  const updateForm = (data: Partial<OnboardingForm>) => {
    setForm((prev) => ({ ...prev, ...data }));
  };

  const resetForm = () => setForm({ units: defaultUnits });

  return (
    <OnboardingContext.Provider value={{ form, updateForm, resetForm }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => useContext(OnboardingContext);
