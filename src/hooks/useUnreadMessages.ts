/**
 * Live unread-message counter for the current user.
 * Counts rows in `messages` where recipient_id = me AND read_at IS NULL,
 * and stays in sync via realtime INSERT/UPDATE subscriptions.
 */

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useUnreadMessages() {
  const [userId, setUserId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCount = useCallback(async (id: string) => {
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", id)
      .is("read_at", null);
    setUnreadCount(count ?? 0);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      setUserId(user.id);
      await fetchCount(user.id);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchCount]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`unread:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${userId}`,
        },
        () => setUnreadCount((c) => c + 1)
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          void fetchCount(userId);
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, fetchCount]);

  const refresh = useCallback(() => {
    if (userId) void fetchCount(userId);
  }, [userId, fetchCount]);

  return { unreadCount, refresh };
}
