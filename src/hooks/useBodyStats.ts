import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type BodyStatsData = {
  weight_kg: number | null;
  body_fat_pct: number | null;
  date: string;
};

export function useBodyStats(userId: string | null) {
  const [data, setData] = useState<BodyStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) return;
    const { data: row } = await supabase
      .from("body_stats")
      .select("weight_kg, body_fat_pct, date")
      .eq("client_id", userId)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (row) setData(row as BodyStatsData);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, refresh: fetch };
}
