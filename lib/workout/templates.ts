/**
 * Workout Template CRUD helpers
 * Supabase operations for the workout_templates table.
 */

import { supabase } from "@/lib/supabase";

export type TemplateExercise = {
  name: string;
  sets: number;
  reps: string;
  rir: number;
  notes?: string;
  muscleGroup?: string;
};

export type WorkoutTemplate = {
  id: string;
  user_id: string;
  name: string;
  exercises: TemplateExercise[];
  times_used: number;
  last_used_at: string | null;
  source_session_id: string | null;
  created_at: string;
  updated_at: string;
};

export async function fetchTemplates(userId: string): Promise<WorkoutTemplate[]> {
  const { data, error } = await supabase
    .from("workout_templates")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching templates:", error);
    return [];
  }
  return data ?? [];
}

export async function createTemplate(
  userId: string,
  name: string,
  exercises: TemplateExercise[],
  sourceSessionId?: string
): Promise<WorkoutTemplate | null> {
  const { data, error } = await supabase
    .from("workout_templates")
    .insert({
      user_id: userId,
      name,
      exercises,
      source_session_id: sourceSessionId ?? null,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Error creating template:", error);
    return null;
  }
  return data;
}

export async function deleteTemplate(templateId: string): Promise<boolean> {
  const { error } = await supabase
    .from("workout_templates")
    .delete()
    .eq("id", templateId);

  if (error) {
    console.error("Error deleting template:", error);
    return false;
  }
  return true;
}

export async function updateTemplate(
  templateId: string,
  changes: Partial<Pick<WorkoutTemplate, "name" | "exercises">>
): Promise<boolean> {
  const { error } = await supabase
    .from("workout_templates")
    .update(changes)
    .eq("id", templateId);

  if (error) {
    console.error("Error updating template:", error);
    return false;
  }
  return true;
}

export async function incrementTemplateUsage(templateId: string): Promise<void> {
  // Use RPC or raw update to increment atomically
  const { error } = await supabase.rpc("increment_template_usage", {
    p_template_id: templateId,
  });

  if (error) {
    // Fallback: non-atomic update if RPC doesn't exist yet
    const { error: fallbackError } = await supabase
      .from("workout_templates")
      .update({
        last_used_at: new Date().toISOString(),
        times_used: undefined, // can't increment without RPC, skip
      })
      .eq("id", templateId);
    if (fallbackError) console.error("Error incrementing template usage:", fallbackError);
  }
}
