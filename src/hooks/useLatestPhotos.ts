import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type PhotoEntry = {
  id: string;
  photo_type: string;
  storage_path: string;
  created_at: string;
};

export function useLatestPhotos(userId: string | null) {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("check_in_photos")
      .select("id, photo_type, storage_path, created_at")
      .eq("client_id", userId)
      .order("created_at", { ascending: false })
      .limit(3);
    if (data) setPhotos(data as PhotoEntry[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { photos, loading, refresh: fetch };
}
