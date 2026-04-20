import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type DBExercise = {
  id: string;
  name: string;
  category: string | null;
  equipment: string | null;
  level: string | null;
  force: string | null;
  mechanic: string | null;
  primary_muscles: string[] | null;
  secondary_muscles: string[] | null;
  instructions: string[] | null;
  coaching_cues: string[] | null;
  common_mistakes: string[] | null;
};

export function useExercises() {
  const [exercises, setExercises] = useState<DBExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("exercises")
      .select("id, name, category, equipment, level, force, mechanic, primary_muscles, secondary_muscles, instructions, coaching_cues, common_mistakes")
      .eq("is_public", true)
      .order("name")
      .limit(100);

    if (search.trim()) {
      q = q.ilike("name", `%${search.trim()}%`);
    }

    if (muscleFilter) {
      q = q.contains("primary_muscles", [muscleFilter]);
    }

    const { data } = await q;
    if (data) setExercises(data as DBExercise[]);
    setLoading(false);
  }, [search, muscleFilter]);

  useEffect(() => {
    const timer = setTimeout(fetch, 200);
    return () => clearTimeout(timer);
  }, [fetch]);

  return { exercises, loading, search, setSearch, muscleFilter, setMuscleFilter, refresh: fetch };
}
