/**
 * Coach-scheduled tasks shown on the client's home tab.
 * Read-only from the client side except for toggling completion on
 * 'custom'-type tasks.
 */

import { supabase } from "@/lib/supabase";

export type CoachTaskType = "photos" | "body_stats" | "macros" | "custom";

export type CoachTask = {
  id: string;
  coach_id: string;
  client_id: string;
  scheduled_for: string;
  task_type: CoachTaskType;
  title: string;
  description: string | null;
  manually_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function fetchTasksForDate(args: {
  clientId: string;
  date: string; // YYYY-MM-DD
}): Promise<CoachTask[]> {
  const { data, error } = await supabase
    .from("coach_tasks")
    .select("*")
    .eq("client_id", args.clientId)
    .eq("scheduled_for", args.date)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CoachTask[];
}

export async function setCustomTaskCompleted(
  taskId: string,
  completed: boolean
): Promise<void> {
  const { error } = await supabase
    .from("coach_tasks")
    .update({
      manually_completed_at: completed ? new Date().toISOString() : null,
    } as never)
    .eq("id", taskId);
  if (error) throw error;
}
