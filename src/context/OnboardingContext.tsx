import React, { createContext, useContext, useState, ReactNode } from "react";

import type { UnitsPreference } from "@/lib/units";
import { defaultUnits } from "@/lib/units";

// Best lift entry with weight and reps
export type LiftEntry = {
  weight?: number;
  reps?: number;
};

// Best lifts for personalization (weight x reps format)
export type BestLifts = {
  bench?: LiftEntry;
  squat?: LiftEntry;
  deadlift?: LiftEntry;
  ohp?: LiftEntry;
};

// Health data from Apple Health / Google Fit
export type HealthData = {
  age?: number;
  heightCm?: number;
  weightKg?: number;
  biologicalSex?: "male" | "female";
  recentWorkouts?: number;
};

export type OnboardingForm = {
  // System
  units?: UnitsPreference;
  appleHealthConnected?: boolean;
  notificationsEnabled?: boolean;
  planChoice?: "free" | "pro";
  
  // Personal Info
  firstName?: string;
  sex?: "male" | "female" | "other";
  age?: number; // Direct age input (from Health or manual)
  ageRange?: "18-25" | "26-35" | "36-45" | "46-55" | "55+"; // Legacy
  birthYear?: number;
  
  // Body Stats
  heightCm?: number;
  weightKg?: number;
  goalWeightKg?: number;
  
  // Health Integration
  healthData?: HealthData;
  
  // Goals (simplified - 4 options)
  goal?: "build_muscle" | "general_fitness" | "get_stronger" | "lose_fat";
  goalTimeline?: "3_months" | "6_months" | "1_year" | "no_rush";
  goalWhy?: string; // Legacy - deeper motivation
  struggle?: string; // Legacy - what's held them back
  commitmentLevel?: 1 | 2 | 3; // Legacy
  
  // Experience (simplified - 4 options)
  experienceLevel?: "none" | "beginner" | "intermediate" | "advanced";
  activityLevel?: "sedentary" | "light" | "moderate" | "very_active";
  
  // Gym & Equipment
  gymType?: "large_gym" | "small_gym" | "home_gym";
  availableEquipment?: string[]; // Array of equipment IDs
  equipment?: "full_gym" | "home_gym" | "dumbbells" | "bodyweight"; // Legacy
  
  // Training Preferences
  workoutsPerWeek?: number;
  preferredDays?: string[]; // ["monday", "wednesday", "friday"] or ["flexible"]
  workoutDuration?: 30 | 45 | 60 | 75;
  splitPreference?: "auto" | "ppl" | "upper_lower" | "full_body";
  trainingStyle?: string; // Legacy
  
  // Best Lifts (optional, for personalization)
  bestLifts?: BestLifts;
  
  // Limitations
  limitations?: string[];
  limitationsOtherText?: string;
  
  // Attribution (how they found us)
  attribution?: "friend" | "social_media" | "app_store" | "other";
  
  // Other
  planSummary?: string;
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
