import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type MacroData = {
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
};

export function useClientMacros(userId: string | null) {
  const [data, setData] = useState<MacroData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) return;
    const { data: row } = await supabase
      .from("client_macros")
      .select("calories, protein_g, carbs_g, fat_g")
      .eq("client_id", userId)
      .order("effective_from", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (row) setData(row as MacroData);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, refresh: fetch };
}
