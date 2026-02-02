import { supabase } from './supabase';

export type WorkoutLog = {
  id: string;
  user_id: string;
  day: number;
  note: string;
  created_at: string;
};

export async function fetchLatestForWeek(userId: string) {
  // get latest note for each day 1..7
  const results: Record<number, WorkoutLog | null> = {1:null,2:null,3:null,4:null,5:null,6:null,7:null};
  for (let day = 1; day <= 7; day++) {
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('day', day)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    results[day] = (data as any) ?? null;
  }
  return results;
}

export async function saveWorkoutNote(userId: string, day: number, note: string) {
  const { data, error } = await supabase
    .from('workout_logs')
    .insert({ user_id: userId, day, note })
    .select()
    .single();
  if (error) throw error;
  return data as WorkoutLog;
}

export async function fetchHistory(userId: string, day: number, limit = 10) {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('day', day)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as WorkoutLog[];
}
