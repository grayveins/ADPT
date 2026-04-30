import { useEffect, useMemo, useState } from "react";
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
  const [allExercises, setAllExercises] = useState<DBExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("exercises")
        .select("id, name, category, equipment, level, force, mechanic, primary_muscles, secondary_muscles, instructions, coaching_cues, common_mistakes")
        .eq("is_public", true)
        .order("name")
        .limit(500);
      if (!cancelled) {
        if (data) setAllExercises(data as DBExercise[]);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const exercises = useMemo(() => {
    let result = allExercises;
    if (muscleFilter && muscleFilter.length > 0) {
      const allowed = new Set(muscleFilter);
      result = result.filter((e) => e.primary_muscles?.some((m) => allowed.has(m)));
    }
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((e) => e.name.toLowerCase().includes(q));
    }
    return result;
  }, [allExercises, search, muscleFilter]);

  return { exercises, loading, search, setSearch, muscleFilter, setMuscleFilter };
}
