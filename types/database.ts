/**
 * Supabase Database Types
 * Generated from live schema dump 2026-04-17.
 * Re-generate with: supabase gen types typescript --linked > types/database.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string | null;
          sex: string | null;
          goal: string | null;
          onboarding_complete: boolean;
          created_at: string | null;
          birth_year: number | null;
          height_cm: number | null;
          weight_kg: number | null;
          activity_level: string | null;
          training_style: string | null;
          units: Json;
          onboarding_data: Json;
          updated_at: string;
          push_token: string | null;
          role: "client" | "coach" | "admin";
        };
        Insert: {
          id: string;
          first_name?: string | null;
          sex?: string | null;
          goal?: string | null;
          onboarding_complete?: boolean;
          created_at?: string | null;
          birth_year?: number | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          activity_level?: string | null;
          training_style?: string | null;
          units?: Json;
          onboarding_data?: Json;
          updated_at?: string;
          push_token?: string | null;
          role?: "client" | "coach" | "admin";
        };
        Update: {
          id?: string;
          first_name?: string | null;
          sex?: string | null;
          goal?: string | null;
          onboarding_complete?: boolean;
          birth_year?: number | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          activity_level?: string | null;
          training_style?: string | null;
          units?: Json;
          onboarding_data?: Json;
          push_token?: string | null;
          role?: "client" | "coach" | "admin";
        };
      };
      exercises: {
        Row: {
          id: string;
          name: string;
          category: string | null;
          is_public: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string | null;
          is_public?: boolean;
          created_by?: string | null;
        };
        Update: {
          name?: string;
          category?: string | null;
          is_public?: boolean;
          created_by?: string | null;
        };
      };
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          started_at: string;
          ended_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          post_workout_feeling: "easy" | "good" | "hard" | "pain" | null;
          pain_location: "shoulder" | "back" | "knee" | "elbow" | "other" | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          started_at?: string;
          ended_at?: string | null;
          notes?: string | null;
          post_workout_feeling?: "easy" | "good" | "hard" | "pain" | null;
          pain_location?: "shoulder" | "back" | "knee" | "elbow" | "other" | null;
        };
        Update: {
          title?: string | null;
          ended_at?: string | null;
          notes?: string | null;
          post_workout_feeling?: "easy" | "good" | "hard" | "pain" | null;
          pain_location?: "shoulder" | "back" | "knee" | "elbow" | "other" | null;
        };
      };
      workout_exercises: {
        Row: {
          id: string;
          session_id: string;
          exercise_id: string | null;
          exercise_name: string;
          muscle_group: string | null;
          order_index: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          exercise_id?: string | null;
          exercise_name: string;
          muscle_group?: string | null;
          order_index?: number;
          notes?: string | null;
        };
        Update: {
          exercise_name?: string;
          muscle_group?: string | null;
          order_index?: number;
          notes?: string | null;
        };
      };
      workout_sets: {
        Row: {
          id: string;
          workout_exercise_id: string;
          set_number: number;
          weight_lbs: number | null;
          reps: number | null;
          rir: number | null;
          is_warmup: boolean;
          is_pr: boolean;
          completed_at: string;
        };
        Insert: {
          id?: string;
          workout_exercise_id: string;
          set_number: number;
          weight_lbs?: number | null;
          reps?: number | null;
          rir?: number | null;
          is_warmup?: boolean;
          is_pr?: boolean;
          completed_at?: string;
        };
        Update: {
          set_number?: number;
          weight_lbs?: number | null;
          reps?: number | null;
          rir?: number | null;
          is_warmup?: boolean;
          is_pr?: boolean;
        };
      };
      user_streaks: {
        Row: {
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_workout_date: string | null;
          streak_freeze_available: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          current_streak?: number;
          longest_streak?: number;
          last_workout_date?: string | null;
          streak_freeze_available?: boolean;
        };
        Update: {
          current_streak?: number;
          longest_streak?: number;
          last_workout_date?: string | null;
          streak_freeze_available?: boolean;
        };
      };
      coaches: {
        Row: {
          id: string;
          business_name: string | null;
          display_name: string;
          bio: string | null;
          avatar_url: string | null;
          specialties: string[] | null;
          certifications: string[] | null;
          stripe_account_id: string | null;
          max_clients: number;
          branding: Json | null;
          is_accepting_clients: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          business_name?: string | null;
          display_name: string;
          bio?: string | null;
          avatar_url?: string | null;
          specialties?: string[] | null;
          certifications?: string[] | null;
          stripe_account_id?: string | null;
          max_clients?: number;
          branding?: Json | null;
          is_accepting_clients?: boolean;
        };
        Update: {
          business_name?: string | null;
          display_name?: string;
          bio?: string | null;
          avatar_url?: string | null;
          specialties?: string[] | null;
          certifications?: string[] | null;
          stripe_account_id?: string | null;
          max_clients?: number;
          branding?: Json | null;
          is_accepting_clients?: boolean;
        };
      };
      coach_clients: {
        Row: {
          id: string;
          coach_id: string;
          client_id: string;
          status: "active" | "paused" | "archived" | "pending";
          started_at: string | null;
          ended_at: string | null;
          notes: string | null;
          monthly_rate_cents: number | null;
          billing_status: "active" | "past_due" | "cancelled" | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          coach_id: string;
          client_id: string;
          status?: "active" | "paused" | "archived" | "pending";
          started_at?: string | null;
          notes?: string | null;
          monthly_rate_cents?: number | null;
          billing_status?: "active" | "past_due" | "cancelled" | null;
        };
        Update: {
          status?: "active" | "paused" | "archived" | "pending";
          started_at?: string | null;
          ended_at?: string | null;
          notes?: string | null;
          monthly_rate_cents?: number | null;
          billing_status?: "active" | "past_due" | "cancelled" | null;
        };
      };
      coaching_programs: {
        Row: {
          id: string;
          coach_id: string;
          client_id: string;
          name: string;
          description: string | null;
          status: "active" | "completed" | "draft" | "paused";
          start_date: string | null;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          coach_id: string;
          client_id: string;
          name: string;
          description?: string | null;
          status?: "active" | "completed" | "draft" | "paused";
          start_date?: string | null;
          end_date?: string | null;
        };
        Update: {
          name?: string;
          description?: string | null;
          status?: "active" | "completed" | "draft" | "paused";
          start_date?: string | null;
          end_date?: string | null;
        };
      };
      program_phases: {
        Row: {
          id: string;
          program_id: string;
          name: string;
          description: string | null;
          phase_number: number;
          duration_weeks: number;
          goal: string | null;
          start_date: string | null;
          end_date: string | null;
          status: "active" | "completed" | "upcoming";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          program_id: string;
          name: string;
          description?: string | null;
          phase_number?: number;
          duration_weeks?: number;
          goal?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          status?: "active" | "completed" | "upcoming";
        };
        Update: {
          name?: string;
          description?: string | null;
          phase_number?: number;
          duration_weeks?: number;
          goal?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          status?: "active" | "completed" | "upcoming";
        };
      };
      phase_workouts: {
        Row: {
          id: string;
          phase_id: string;
          day_number: number;
          name: string;
          exercises: Json;
          duration_minutes: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          phase_id: string;
          day_number: number;
          name: string;
          exercises?: Json;
          duration_minutes?: number | null;
          notes?: string | null;
        };
        Update: {
          day_number?: number;
          name?: string;
          exercises?: Json;
          duration_minutes?: number | null;
          notes?: string | null;
        };
      };
      check_in_templates: {
        Row: {
          id: string;
          coach_id: string;
          name: string;
          frequency: "weekly" | "biweekly" | "monthly";
          questions: Json;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          coach_id: string;
          name: string;
          frequency?: "weekly" | "biweekly" | "monthly";
          questions?: Json;
          is_default?: boolean;
        };
        Update: {
          name?: string;
          frequency?: "weekly" | "biweekly" | "monthly";
          questions?: Json;
          is_default?: boolean;
        };
      };
      check_ins: {
        Row: {
          id: string;
          client_id: string;
          coach_id: string;
          template_id: string | null;
          program_id: string | null;
          phase_id: string | null;
          status: "pending" | "submitted" | "reviewed" | "flagged";
          submitted_at: string | null;
          reviewed_at: string | null;
          responses: Json | null;
          coach_feedback: string | null;
          coach_notes: string | null;
          flag_reasons: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          coach_id: string;
          template_id?: string | null;
          program_id?: string | null;
          phase_id?: string | null;
          status?: "pending" | "submitted" | "reviewed" | "flagged";
          submitted_at?: string | null;
          responses?: Json | null;
          coach_feedback?: string | null;
          coach_notes?: string | null;
          flag_reasons?: string[] | null;
        };
        Update: {
          status?: "pending" | "submitted" | "reviewed" | "flagged";
          submitted_at?: string | null;
          reviewed_at?: string | null;
          responses?: Json | null;
          coach_feedback?: string | null;
          coach_notes?: string | null;
          flag_reasons?: string[] | null;
        };
      };
      check_in_photos: {
        Row: {
          id: string;
          check_in_id: string;
          client_id: string;
          photo_type: "front" | "side" | "back" | "other";
          storage_path: string;
          thumbnail_path: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          check_in_id: string;
          client_id: string;
          photo_type: "front" | "side" | "back" | "other";
          storage_path: string;
          thumbnail_path?: string | null;
        };
        Update: {
          photo_type?: "front" | "side" | "back" | "other";
          storage_path?: string;
          thumbnail_path?: string | null;
        };
      };
      body_stats: {
        Row: {
          id: string;
          client_id: string;
          coach_id: string | null;
          date: string;
          weight_kg: number | null;
          body_fat_pct: number | null;
          waist_cm: number | null;
          chest_cm: number | null;
          hips_cm: number | null;
          left_arm_cm: number | null;
          right_arm_cm: number | null;
          left_thigh_cm: number | null;
          right_thigh_cm: number | null;
          neck_cm: number | null;
          shoulders_cm: number | null;
          notes: string | null;
          source: "manual" | "check_in" | "wearable";
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          coach_id?: string | null;
          date: string;
          weight_kg?: number | null;
          body_fat_pct?: number | null;
          waist_cm?: number | null;
          chest_cm?: number | null;
          hips_cm?: number | null;
          left_arm_cm?: number | null;
          right_arm_cm?: number | null;
          left_thigh_cm?: number | null;
          right_thigh_cm?: number | null;
          neck_cm?: number | null;
          shoulders_cm?: number | null;
          notes?: string | null;
          source?: "manual" | "check_in" | "wearable";
        };
        Update: {
          date?: string;
          weight_kg?: number | null;
          body_fat_pct?: number | null;
          waist_cm?: number | null;
          chest_cm?: number | null;
          hips_cm?: number | null;
          left_arm_cm?: number | null;
          right_arm_cm?: number | null;
          left_thigh_cm?: number | null;
          right_thigh_cm?: number | null;
          neck_cm?: number | null;
          shoulders_cm?: number | null;
          notes?: string | null;
          source?: "manual" | "check_in" | "wearable";
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          recipient_id: string;
          content: string | null;
          message_type: "text" | "voice" | "image" | "video" | "check_in_response" | "program_update";
          attachment_url: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          recipient_id: string;
          content?: string | null;
          message_type?: "text" | "voice" | "image" | "video" | "check_in_response" | "program_update";
          attachment_url?: string | null;
        };
        Update: {
          content?: string | null;
          message_type?: "text" | "voice" | "image" | "video" | "check_in_response" | "program_update";
          attachment_url?: string | null;
          read_at?: string | null;
        };
      };
      habit_assignments: {
        Row: {
          id: string;
          coach_id: string;
          client_id: string;
          name: string;
          description: string | null;
          frequency: "daily" | "weekly";
          target_value: number | null;
          unit: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          coach_id: string;
          client_id: string;
          name: string;
          description?: string | null;
          frequency?: "daily" | "weekly";
          target_value?: number | null;
          unit?: string | null;
          active?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          frequency?: "daily" | "weekly";
          target_value?: number | null;
          unit?: string | null;
          active?: boolean;
        };
      };
      habit_logs: {
        Row: {
          id: string;
          assignment_id: string;
          client_id: string;
          date: string;
          completed: boolean;
          value: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          client_id: string;
          date: string;
          completed?: boolean;
          value?: number | null;
        };
        Update: {
          date?: string;
          completed?: boolean;
          value?: number | null;
        };
      };
      client_subscriptions: {
        Row: {
          id: string;
          coach_id: string;
          client_id: string;
          stripe_subscription_id: string | null;
          plan_name: string | null;
          amount_cents: number;
          currency: string;
          interval: "monthly" | "quarterly" | "yearly";
          status: "active" | "past_due" | "cancelled" | "trialing";
          current_period_start: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          coach_id: string;
          client_id: string;
          stripe_subscription_id?: string | null;
          plan_name?: string | null;
          amount_cents: number;
          currency?: string;
          interval?: "monthly" | "quarterly" | "yearly";
          status?: "active" | "past_due" | "cancelled" | "trialing";
          current_period_start?: string | null;
          current_period_end?: string | null;
        };
        Update: {
          stripe_subscription_id?: string | null;
          plan_name?: string | null;
          amount_cents?: number;
          currency?: string;
          interval?: "monthly" | "quarterly" | "yearly";
          status?: "active" | "past_due" | "cancelled" | "trialing";
          current_period_start?: string | null;
          current_period_end?: string | null;
        };
      };
    };
    Views: {
      user_personal_records: {
        Row: {
          user_id: string;
          exercise_id: string;
          exercise_name: string;
          max_weight_lbs: number | null;
          reps_at_max_weight: number | null;
          max_volume_single_set: number | null;
          total_prs: number | null;
          last_pr_date: string | null;
        };
      };
    };
    Functions: {
      update_user_streak: {
        Args: { p_user_id: string };
        Returns: void;
      };
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Insertable<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updatable<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
