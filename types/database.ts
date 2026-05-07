
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      body_stats: {
        Row: {
          body_fat_pct: number | null
          chest_cm: number | null
          client_id: string
          coach_id: string | null
          created_at: string
          date: string
          hips_cm: number | null
          id: string
          left_arm_cm: number | null
          left_thigh_cm: number | null
          neck_cm: number | null
          notes: string | null
          right_arm_cm: number | null
          right_thigh_cm: number | null
          shoulders_cm: number | null
          source: string
          waist_cm: number | null
          weight_kg: number | null
        }
        Insert: {
          body_fat_pct?: number | null
          chest_cm?: number | null
          client_id: string
          coach_id?: string | null
          created_at?: string
          date: string
          hips_cm?: number | null
          id?: string
          left_arm_cm?: number | null
          left_thigh_cm?: number | null
          neck_cm?: number | null
          notes?: string | null
          right_arm_cm?: number | null
          right_thigh_cm?: number | null
          shoulders_cm?: number | null
          source?: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Update: {
          body_fat_pct?: number | null
          chest_cm?: number | null
          client_id?: string
          coach_id?: string | null
          created_at?: string
          date?: string
          hips_cm?: number | null
          id?: string
          left_arm_cm?: number | null
          left_thigh_cm?: number | null
          neck_cm?: number | null
          notes?: string | null
          right_arm_cm?: number | null
          right_thigh_cm?: number | null
          shoulders_cm?: number | null
          source?: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "body_stats_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      check_in_photos: {
        Row: {
          check_in_id: string
          client_id: string
          created_at: string
          id: string
          photo_type: string
          storage_path: string
          thumbnail_path: string | null
        }
        Insert: {
          check_in_id: string
          client_id: string
          created_at?: string
          id?: string
          photo_type: string
          storage_path: string
          thumbnail_path?: string | null
        }
        Update: {
          check_in_id?: string
          client_id?: string
          created_at?: string
          id?: string
          photo_type?: string
          storage_path?: string
          thumbnail_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "check_in_photos_check_in_id_fkey"
            columns: ["check_in_id"]
            isOneToOne: false
            referencedRelation: "check_ins"
            referencedColumns: ["id"]
          },
        ]
      }
      check_in_templates: {
        Row: {
          coach_id: string
          created_at: string
          frequency: string
          id: string
          is_default: boolean
          name: string
          questions: Json
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          frequency?: string
          id?: string
          is_default?: boolean
          name: string
          questions?: Json
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          frequency?: string
          id?: string
          is_default?: boolean
          name?: string
          questions?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_in_templates_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          client_id: string
          coach_feedback: string | null
          coach_id: string
          coach_notes: string | null
          created_at: string
          flag_reasons: string[] | null
          id: string
          phase_id: string | null
          program_id: string | null
          responses: Json | null
          reviewed_at: string | null
          status: string
          submitted_at: string | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          coach_feedback?: string | null
          coach_id: string
          coach_notes?: string | null
          created_at?: string
          flag_reasons?: string[] | null
          id?: string
          phase_id?: string | null
          program_id?: string | null
          responses?: Json | null
          reviewed_at?: string | null
          status?: string
          submitted_at?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          coach_feedback?: string | null
          coach_id?: string
          coach_notes?: string | null
          created_at?: string
          flag_reasons?: string[] | null
          id?: string
          phase_id?: string | null
          program_id?: string | null
          responses?: Json | null
          reviewed_at?: string | null
          status?: string
          submitted_at?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "program_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "coaching_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "check_in_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      client_intakes: {
        Row: {
          client_id: string
          completed_at: string
          created_at: string
          date_of_birth: string | null
          dietary_notes: string | null
          equipment_access: string | null
          experience_level: string | null
          height_cm: number | null
          injuries: string | null
          primary_goal: string | null
          training_days_per_week: number | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          client_id: string
          completed_at?: string
          created_at?: string
          date_of_birth?: string | null
          dietary_notes?: string | null
          equipment_access?: string | null
          experience_level?: string | null
          height_cm?: number | null
          injuries?: string | null
          primary_goal?: string | null
          training_days_per_week?: number | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          client_id?: string
          completed_at?: string
          created_at?: string
          date_of_birth?: string | null
          dietary_notes?: string | null
          equipment_access?: string | null
          experience_level?: string | null
          height_cm?: number | null
          injuries?: string | null
          primary_goal?: string | null
          training_days_per_week?: number | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      client_invitations: {
        Row: {
          coach_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          status: string
          token: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          status?: string
          token?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          status?: string
          token?: string
        }
        Relationships: []
      }
      client_macros: {
        Row: {
          calories: number | null
          carbs_g: number | null
          client_id: string
          coach_id: string
          created_at: string
          effective_from: string
          fat_g: number | null
          id: string
          notes: string | null
          protein_g: number | null
          updated_at: string
        }
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          client_id: string
          coach_id: string
          created_at?: string
          effective_from?: string
          fat_g?: number | null
          id?: string
          notes?: string | null
          protein_g?: number | null
          updated_at?: string
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          client_id?: string
          coach_id?: string
          created_at?: string
          effective_from?: string
          fat_g?: number | null
          id?: string
          notes?: string | null
          protein_g?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_macros_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      client_subscriptions: {
        Row: {
          amount_cents: number
          client_id: string
          coach_id: string
          created_at: string
          currency: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          interval: string
          plan_name: string | null
          status: string
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          client_id: string
          coach_id: string
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          interval?: string
          plan_name?: string | null
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          client_id?: string
          coach_id?: string
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          interval?: string
          plan_name?: string | null
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_subscriptions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_clients: {
        Row: {
          billing_status: string | null
          client_id: string
          coach_id: string
          created_at: string
          ended_at: string | null
          id: string
          monthly_rate_cents: number | null
          notes: string | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          billing_status?: string | null
          client_id: string
          coach_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          monthly_rate_cents?: number | null
          notes?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          billing_status?: string | null
          client_id?: string
          coach_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          monthly_rate_cents?: number | null
          notes?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_clients_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_notes: {
        Row: {
          body: string
          client_id: string
          coach_id: string
          created_at: string
          id: string
        }
        Insert: {
          body: string
          client_id: string
          coach_id: string
          created_at?: string
          id?: string
        }
        Update: {
          body?: string
          client_id?: string
          coach_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_notes_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_tasks: {
        Row: {
          client_id: string
          coach_id: string
          created_at: string
          description: string | null
          id: string
          manually_completed_at: string | null
          scheduled_for: string
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          coach_id: string
          created_at?: string
          description?: string | null
          id?: string
          manually_completed_at?: string | null
          scheduled_for: string
          task_type: string
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          coach_id?: string
          created_at?: string
          description?: string | null
          id?: string
          manually_completed_at?: string | null
          scheduled_for?: string
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      coaches: {
        Row: {
          avatar_url: string | null
          bio: string | null
          branding: Json | null
          business_name: string | null
          certifications: string[] | null
          created_at: string
          display_name: string
          id: string
          is_accepting_clients: boolean
          max_clients: number
          specialties: string[] | null
          stripe_account_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          branding?: Json | null
          business_name?: string | null
          certifications?: string[] | null
          created_at?: string
          display_name: string
          id: string
          is_accepting_clients?: boolean
          max_clients?: number
          specialties?: string[] | null
          stripe_account_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          branding?: Json | null
          business_name?: string | null
          certifications?: string[] | null
          created_at?: string
          display_name?: string
          id?: string
          is_accepting_clients?: boolean
          max_clients?: number
          specialties?: string[] | null
          stripe_account_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      coaching_programs: {
        Row: {
          client_id: string
          coach_id: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          coach_id: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          coach_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_programs_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          client_id: string
          coach_id: string
          created_at: string
          id: string
          last_message_at: string | null
        }
        Insert: {
          client_id: string
          coach_id: string
          created_at?: string
          id?: string
          last_message_at?: string | null
        }
        Update: {
          client_id?: string
          coach_id?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
        }
        Relationships: []
      }
      exercise_overrides: {
        Row: {
          coach_id: string
          created_at: string
          custom_cues: string[] | null
          custom_notes: string | null
          custom_video_url: string | null
          exercise_id: string
          id: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          custom_cues?: string[] | null
          custom_notes?: string | null
          custom_video_url?: string | null
          exercise_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          custom_cues?: string[] | null
          custom_notes?: string | null
          custom_video_url?: string | null
          exercise_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_overrides_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_overrides_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          category: string | null
          coaching_cues: string[] | null
          common_mistakes: string[] | null
          created_at: string
          created_by: string | null
          description: string | null
          equipment: string | null
          force: string | null
          id: string
          image_url: string | null
          instructions: string[] | null
          is_public: boolean
          level: string | null
          mechanic: string | null
          name: string
          primary_muscles: string[] | null
          secondary_muscles: string[] | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          category?: string | null
          coaching_cues?: string[] | null
          common_mistakes?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          equipment?: string | null
          force?: string | null
          id?: string
          image_url?: string | null
          instructions?: string[] | null
          is_public?: boolean
          level?: string | null
          mechanic?: string | null
          name: string
          primary_muscles?: string[] | null
          secondary_muscles?: string[] | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          category?: string | null
          coaching_cues?: string[] | null
          common_mistakes?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          equipment?: string | null
          force?: string | null
          id?: string
          image_url?: string | null
          instructions?: string[] | null
          is_public?: boolean
          level?: string | null
          mechanic?: string | null
          name?: string
          primary_muscles?: string[] | null
          secondary_muscles?: string[] | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      habit_assignments: {
        Row: {
          active: boolean
          client_id: string
          coach_id: string
          created_at: string
          description: string | null
          frequency: string
          id: string
          name: string
          target_value: number | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          client_id: string
          coach_id: string
          created_at?: string
          description?: string | null
          frequency?: string
          id?: string
          name: string
          target_value?: number | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          client_id?: string
          coach_id?: string
          created_at?: string
          description?: string | null
          frequency?: string
          id?: string
          name?: string
          target_value?: number | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_assignments_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_logs: {
        Row: {
          assignment_id: string
          client_id: string
          completed: boolean
          created_at: string
          date: string
          id: string
          value: number | null
        }
        Insert: {
          assignment_id: string
          client_id: string
          completed?: boolean
          created_at?: string
          date: string
          id?: string
          value?: number | null
        }
        Update: {
          assignment_id?: string
          client_id?: string
          completed?: boolean
          created_at?: string
          date?: string
          id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "habit_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          client_id: string
          coach_id: string
          file_size_bytes: number | null
          id: string
          storage_path: string
          title: string
          uploaded_at: string
        }
        Insert: {
          client_id: string
          coach_id: string
          file_size_bytes?: number | null
          id?: string
          storage_path: string
          title: string
          uploaded_at?: string
        }
        Update: {
          client_id?: string
          coach_id?: string
          file_size_bytes?: number | null
          id?: string
          storage_path?: string
          title?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_url: string | null
          content: string | null
          conversation_id: string
          created_at: string
          id: string
          message_type: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          attachment_url?: string | null
          content?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          message_type?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          attachment_url?: string | null
          content?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          message_type?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      phase_workouts: {
        Row: {
          created_at: string
          day_number: number
          duration_minutes: number | null
          exercises: Json
          id: string
          name: string
          notes: string | null
          phase_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_number: number
          duration_minutes?: number | null
          exercises?: Json
          id?: string
          name: string
          notes?: string | null
          phase_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_number?: number
          duration_minutes?: number | null
          exercises?: Json
          id?: string
          name?: string
          notes?: string | null
          phase_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phase_workouts_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "program_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activity_level: string | null
          birth_year: number | null
          created_at: string | null
          email: string | null
          first_name: string | null
          goal: string | null
          height_cm: number | null
          id: string
          onboarding_complete: boolean
          onboarding_data: Json
          push_token: string | null
          role: string
          sex: string | null
          training_style: string | null
          units: Json
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          activity_level?: string | null
          birth_year?: number | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          goal?: string | null
          height_cm?: number | null
          id: string
          onboarding_complete?: boolean
          onboarding_data?: Json
          push_token?: string | null
          role?: string
          sex?: string | null
          training_style?: string | null
          units?: Json
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          activity_level?: string | null
          birth_year?: number | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          goal?: string | null
          height_cm?: number | null
          id?: string
          onboarding_complete?: boolean
          onboarding_data?: Json
          push_token?: string | null
          role?: string
          sex?: string | null
          training_style?: string | null
          units?: Json
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      program_phases: {
        Row: {
          created_at: string
          description: string | null
          duration_weeks: number
          end_date: string | null
          goal: string | null
          id: string
          name: string
          phase_number: number
          program_id: string
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_weeks?: number
          end_date?: string | null
          goal?: string | null
          id?: string
          name: string
          phase_number?: number
          program_id: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_weeks?: number
          end_date?: string | null
          goal?: string | null
          id?: string
          name?: string
          phase_number?: number
          program_id?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_phases_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "coaching_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_photos: {
        Row: {
          client_id: string
          created_at: string
          id: string
          notes: string | null
          pose: string | null
          storage_path: string
          taken_at: string
          thumbnail_url: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          notes?: string | null
          pose?: string | null
          storage_path: string
          taken_at?: string
          thumbnail_url?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          pose?: string | null
          storage_path?: string
          taken_at?: string
          thumbnail_url?: string | null
        }
        Relationships: []
      }
      sessions: {
        Row: {
          client_id: string
          coach_id: string
          created_at: string
          duration_minutes: number
          id: string
          location: string | null
          notes: string | null
          scheduled_at: string
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          coach_id: string
          created_at?: string
          duration_minutes?: number
          id?: string
          location?: string | null
          notes?: string | null
          scheduled_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          coach_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          location?: string | null
          notes?: string | null
          scheduled_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          current_streak: number
          last_workout_date: string | null
          longest_streak: number
          streak_freeze_available: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          last_workout_date?: string | null
          longest_streak?: number
          streak_freeze_available?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          last_workout_date?: string | null
          longest_streak?: number
          streak_freeze_available?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_exercises: {
        Row: {
          created_at: string
          exercise_id: string | null
          exercise_name: string
          id: string
          muscle_group: string | null
          notes: string | null
          order_index: number
          session_id: string
        }
        Insert: {
          created_at?: string
          exercise_id?: string | null
          exercise_name: string
          id?: string
          muscle_group?: string | null
          notes?: string | null
          order_index?: number
          session_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string | null
          exercise_name?: string
          id?: string
          muscle_group?: string | null
          notes?: string | null
          order_index?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          notes: string | null
          pain_location: string | null
          phase_id: string | null
          phase_workout_id: string | null
          post_workout_feeling: string | null
          program_id: string | null
          started_at: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          pain_location?: string | null
          phase_id?: string | null
          phase_workout_id?: string | null
          post_workout_feeling?: string | null
          program_id?: string | null
          started_at?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          pain_location?: string | null
          phase_id?: string | null
          phase_workout_id?: string | null
          post_workout_feeling?: string | null
          program_id?: string | null
          started_at?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "program_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_phase_workout_id_fkey"
            columns: ["phase_workout_id"]
            isOneToOne: false
            referencedRelation: "phase_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "coaching_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sets: {
        Row: {
          completed_at: string
          id: string
          is_pr: boolean
          is_warmup: boolean
          reps: number | null
          rir: number | null
          set_number: number
          weight_lbs: number | null
          workout_exercise_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          is_pr?: boolean
          is_warmup?: boolean
          reps?: number | null
          rir?: number | null
          set_number: number
          weight_lbs?: number | null
          workout_exercise_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          is_pr?: boolean
          is_warmup?: boolean
          reps?: number | null
          rir?: number | null
          set_number?: number
          weight_lbs?: number | null
          workout_exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sets_workout_exercise_id_fkey"
            columns: ["workout_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      user_personal_records: {
        Row: {
          exercise_id: string | null
          exercise_name: string | null
          last_pr_date: string | null
          max_volume_single_set: number | null
          max_weight_lbs: number | null
          reps_at_max_weight: number | null
          total_prs: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_invitation: { Args: { invitation_token: string }; Returns: Json }
      activate_program: { Args: { p_program_id: string }; Returns: undefined }
      find_or_create_conversation: {
        Args: { p_coach_id: string }
        Returns: string
      }
      get_client_compliance: {
        Args: { p_client_id: string; p_coach_id: string }
        Returns: Json
      }
      get_coach_context: { Args: { p_user_id: string }; Returns: Json }
      get_coach_context_fast: { Args: { p_user_id: string }; Returns: Json }
      get_coach_dashboard: { Args: { p_coach_id: string }; Returns: Json }
      get_conversation_id: {
        Args: { user_a: string; user_b: string }
        Returns: string
      }
      get_user_id_by_email: { Args: { p_email: string }; Returns: string }
      get_workout_counts: {
        Args: { p_user_id: string }
        Returns: {
          last_week: number
          this_week: number
          total: number
        }[]
      }
      is_rest_day: {
        Args: { p_date?: string; p_user_id: string }
        Returns: boolean
      }
      set_active_program: { Args: { p_program_id: string }; Returns: undefined }
      update_user_streak:
        | {
            Args: { p_user_id: string }
            Returns: {
              current_streak: number
              is_new_record: boolean
              longest_streak: number
            }[]
          }
        | {
            Args: { p_user_id: string; p_workout_date?: string }
            Returns: {
              current_streak: number
              is_new_record: boolean
              longest_streak: number
            }[]
          }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
